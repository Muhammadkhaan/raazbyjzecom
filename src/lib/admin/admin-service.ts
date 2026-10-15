import { db } from '@/lib/db';
export namespace Prisma {
  export type ProductWhereInput = any;
  export type ProductVariantWhereInput = any;
  export type ProductOrderByWithRelationInput = any;
  export type OrderWhereInput = any;
  export type OrderOrderByWithRelationInput = any;
  export type UserWhereInput = any;
  export type UserOrderByWithRelationInput = any;
  export type InventoryLogWhereInput = any;
  export type AuditLogWhereInput = any;
  export type CouponWhereInput = any;
  export type CouponUpdateInput = any;
}

export interface AdminDateFilter {
  startDate?: Date;
  endDate?: Date;
  preset?: 'all' | 'today' | '7days' | '30days';
}

export async function logAdminAction({
  actorId,
  action,
  entityType,
  entityId,
  payload,
  ipAddress,
}: {
  actorId?: string;
  action: string;
  entityType: string;
  entityId: string;
  payload?: any;
  ipAddress?: string;
}) {
  try {
    return await db.auditLog.create({
      data: {
        actorId: actorId || null,
        action,
        entityType,
        entityId,
        payloadJson: payload ? JSON.stringify(payload) : null,
        ipAddress: ipAddress || null,
      },
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
    return null;
  }
}

export async function getAdminDashboardMetrics(preset: 'all' | 'today' | '7days' | '30days' = 'all') {
  const now = new Date();
  let startDate: Date | undefined;

  if (preset === 'today') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (preset === '7days') {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (preset === '30days') {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  const orderDateFilter: Prisma.OrderWhereInput = startDate
    ? { createdAt: { gte: startDate } }
    : {};

  const [
    allOrders,
    paidOrders,
    refundedOrders,
    cancelledOrders,
    pendingOrders,
    totalProducts,
    totalCustomers,
    lowStockVariants,
    recentOrders,
  ] = await Promise.all([
    db.order.findMany({
      where: orderDateFilter,
      select: { id: true, grandTotal: true, paymentStatus: true, fulfillmentStatus: true },
    }),
    db.order.findMany({
      where: { ...orderDateFilter, paymentStatus: 'PAID' },
      select: { grandTotal: true },
    }),
    db.order.findMany({
      where: { ...orderDateFilter, paymentStatus: 'REFUNDED' },
      select: { grandTotal: true },
    }),
    db.order.count({
      where: { ...orderDateFilter, fulfillmentStatus: 'CANCELLED' },
    }),
    db.order.count({
      where: { ...orderDateFilter, fulfillmentStatus: 'UNFULFILLED' },
    }),
    db.product.count(),
    db.user.count({ where: { role: 'CUSTOMER' } }),
    db.productVariant.findMany({
      where: { inventoryCount: { lte: 5 } },
      include: {
        product: {
          select: { id: true, title: true, slug: true, status: true },
        },
      },
      orderBy: { inventoryCount: 'asc' },
      take: 10,
    }),
    db.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 6,
      include: {
        items: true,
      },
    }),
  ]);

  const totalGrossSales = paidOrders.reduce((sum, o) => sum + o.grandTotal, 0);
  const totalRefundAmount = refundedOrders.reduce((sum, o) => sum + o.grandTotal, 0);
  const paidOrdersCount = paidOrders.length;
  const averageOrderValue = paidOrdersCount > 0 ? totalGrossSales / paidOrdersCount : 0;

  return {
    preset,
    metrics: {
      totalGrossSales: Math.round(totalGrossSales * 100) / 100,
      totalOrdersCount: allOrders.length,
      paidOrdersCount,
      pendingOrdersCount: pendingOrders,
      refundedOrdersCount: refundedOrders.length,
      totalRefundAmount: Math.round(totalRefundAmount * 100) / 100,
      cancelledOrdersCount: cancelledOrders,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      totalProducts,
      totalCustomers,
      lowStockCount: lowStockVariants.length,
    },
    lowStockAlerts: lowStockVariants.map((v) => ({
      id: v.id,
      sku: v.sku,
      title: v.title,
      inventoryCount: v.inventoryCount,
      productTitle: v.product.title,
      productId: v.product.id,
      productStatus: v.product.status,
    })),
    recentOrders: recentOrders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerEmail: o.customerEmail,
      customerPhone: o.customerPhone,
      createdAt: o.createdAt,
      grandTotal: o.grandTotal,
      paymentStatus: o.paymentStatus,
      fulfillmentStatus: o.fulfillmentStatus,
      itemCount: o.items.reduce((sum, i) => sum + i.quantity, 0),
    })),
  };
}

export async function getAdminProducts({
  search,
  categoryId,
  status,
  page = 1,
  pageSize = 10,
}: {
  search?: string;
  categoryId?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}) {
  const safePage = Math.max(1, page);
  const skip = (safePage - 1) * pageSize;

  const where: Prisma.ProductWhereInput = {};

  if (status && status !== 'ALL') {
    where.status = status;
  }

  if (categoryId && categoryId !== 'ALL') {
    where.categoryId = categoryId;
  }

  if (search && search.trim()) {
    const term = search.trim();
    where.OR = [
      { title: { contains: term } },
      { slug: { contains: term } },
      { description: { contains: term } },
      {
        variants: {
          some: {
            sku: { contains: term },
          },
        },
      },
    ];
  }

  const [totalCount, products] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        images: { orderBy: { displayOrder: 'asc' } },
        variants: {
          select: {
            id: true,
            sku: true,
            title: true,
            inventoryCount: true,
            isAvailable: true,
            priceOverride: true,
          },
        },
      },
    }),
  ]);

  return {
    products: products.map((p) => {
      const totalInventory = p.variants.reduce((acc, v) => acc + v.inventoryCount, 0);
      return {
        id: p.id,
        title: p.title,
        slug: p.slug,
        description: p.description,
        details: p.details,
        categoryId: p.categoryId,
        categoryName: p.category.name,
        categorySlug: p.category.slug,
        regularPrice: p.regularPrice,
        salePrice: p.salePrice,
        status: p.status,
        isFeatured: p.isFeatured,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        primaryImage: p.images[0] || null,
        images: p.images,
        variantsCount: p.variants.length,
        totalInventory,
        variants: p.variants,
      };
    }),
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
    currentPage: safePage,
  };
}

export async function getAdminProductById(id: string) {
  const product = await db.product.findUnique({
    where: { id },
    include: {
      category: true,
      images: { orderBy: { displayOrder: 'asc' } },
      variants: {
        include: {
          _count: {
            select: {
              orderItems: true,
              cartItems: true,
            },
          },
          inventoryLogs: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      },
    },
  });

  if (!product) return null;

  const totalOrderedItems = product.variants.reduce(
    (acc, v) => acc + (v._count?.orderItems || 0),
    0
  );

  return {
    ...product,
    hasHistoricalOrders: totalOrderedItems > 0,
    totalOrderedItems,
  };
}

export interface CreateProductInput {
  title: string;
  slug?: string;
  description: string;
  details?: string;
  categoryId: string;
  regularPrice: number;
  salePrice?: number | null;
  status?: string;
  isFeatured?: boolean;
  images?: { url: string; altText: string; displayOrder?: number }[];
  variants: {
    sku: string;
    title: string;
    size?: string;
    color?: string;
    priceOverride?: number | null;
    inventoryCount: number;
  }[];
}

export async function createProduct(
  actorId: string,
  input: CreateProductInput,
  ipAddress?: string
) {
  if (!input.title || !input.title.trim()) {
    throw new Error('Product title is required.');
  }

  if (!input.categoryId) {
    throw new Error('Category selection is required.');
  }

  if (typeof input.regularPrice !== 'number' || input.regularPrice <= 0) {
    throw new Error('Regular price must be greater than zero.');
  }

  if (input.salePrice !== undefined && input.salePrice !== null && input.salePrice >= input.regularPrice) {
    throw new Error('Sale price must be strictly lower than regular price.');
  }

  if (!input.variants || input.variants.length === 0) {
    throw new Error('At least one product variant (with SKU and stock) is required.');
  }

  const baseSlug = (input.slug || input.title)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

  let slug = baseSlug || `product-${Date.now()}`;
  const existingSlug = await db.product.findUnique({ where: { slug } });
  if (existingSlug) {
    slug = `${slug}-${Date.now().toString().slice(-4)}`;
  }

  const category = await db.category.findUnique({ where: { id: input.categoryId } });
  if (!category) {
    throw new Error('Selected category does not exist.');
  }

  const skus = input.variants.map((v) => v.sku.trim());
  const duplicateSkuInInput = skus.find((sku, idx) => skus.indexOf(sku) !== idx);
  if (duplicateSkuInInput) {
    throw new Error(`Duplicate SKU "${duplicateSkuInInput}" within variant payload.`);
  }

  const existingSkus = await db.productVariant.findMany({
    where: { sku: { in: skus } },
    select: { sku: true },
  });
  if (existingSkus.length > 0) {
    throw new Error(`SKU "${existingSkus[0].sku}" already belongs to an existing product.`);
  }

  const result = await db.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: {
        title: input.title.trim(),
        slug,
        description: input.description.trim(),
        details: input.details?.trim() || null,
        categoryId: input.categoryId,
        regularPrice: input.regularPrice,
        salePrice: input.salePrice ?? null,
        status: input.status || 'DRAFT',
        isFeatured: Boolean(input.isFeatured),
        images: {
          create: (input.images || []).map((img, idx) => ({
            url: img.url.trim(),
            altText: img.altText?.trim() || input.title.trim(),
            displayOrder: img.displayOrder ?? idx,
          })),
        },
        variants: {
          create: input.variants.map((v) => ({
            sku: v.sku.trim(),
            title: v.title.trim(),
            size: v.size?.trim() || null,
            color: v.color?.trim() || null,
            priceOverride: v.priceOverride ?? null,
            inventoryCount: Math.max(0, v.inventoryCount || 0),
            isAvailable: (v.inventoryCount || 0) > 0,
          })),
        },
      },
      include: {
        images: true,
        variants: true,
      },
    });

    for (const v of product.variants) {
      if (v.inventoryCount > 0) {
        await tx.inventoryLog.create({
          data: {
            variantId: v.id,
            changeAmount: v.inventoryCount,
            newBalance: v.inventoryCount,
            reason: 'INITIAL_STOCK',
            actorId,
          },
        });
      }
    }

    return product;
  });

  await logAdminAction({
    actorId,
    action: 'CREATE_PRODUCT',
    entityType: 'PRODUCT',
    entityId: result.id,
    payload: { title: result.title, slug: result.slug, variantsCount: result.variants.length },
    ipAddress,
  });

  return result;
}

export interface UpdateProductInput {
  title?: string;
  slug?: string;
  description?: string;
  details?: string;
  categoryId?: string;
  regularPrice?: number;
  salePrice?: number | null;
  status?: string;
  isFeatured?: boolean;
  images?: { id?: string; url: string; altText: string; displayOrder?: number }[];
  variants?: {
    id?: string;
    sku: string;
    title: string;
    size?: string;
    color?: string;
    priceOverride?: number | null;
    inventoryCount: number;
    isAvailable?: boolean;
  }[];
}

export async function updateProduct(
  actorId: string,
  productId: string,
  input: UpdateProductInput,
  ipAddress?: string
) {
  const existing = await db.product.findUnique({
    where: { id: productId },
    include: { variants: true, images: true },
  });

  if (!existing) {
    throw new Error('Product not found.');
  }

  const regularPrice = input.regularPrice !== undefined ? input.regularPrice : existing.regularPrice;
  const salePrice = input.salePrice !== undefined ? input.salePrice : existing.salePrice;

  if (regularPrice <= 0) {
    throw new Error('Regular price must be greater than zero.');
  }

  if (salePrice !== null && salePrice !== undefined && salePrice >= regularPrice) {
    throw new Error('Sale price must be strictly lower than regular price.');
  }

  let slug = existing.slug;
  if (input.slug && input.slug.trim() !== existing.slug) {
    const sanitized = input.slug.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const conflict = await db.product.findUnique({ where: { slug: sanitized } });
    if (conflict && conflict.id !== productId) {
      throw new Error(`Slug "${sanitized}" is already taken by another product.`);
    }
    slug = sanitized;
  }

  const updated = await db.$transaction(async (tx) => {
    const product = await tx.product.update({
      where: { id: productId },
      data: {
        title: input.title !== undefined ? input.title.trim() : existing.title,
        slug,
        description: input.description !== undefined ? input.description.trim() : existing.description,
        details: input.details !== undefined ? input.details.trim() : existing.details,
        categoryId: input.categoryId || existing.categoryId,
        regularPrice,
        salePrice,
        status: input.status || existing.status,
        isFeatured: input.isFeatured !== undefined ? Boolean(input.isFeatured) : existing.isFeatured,
      },
    });

    if (input.images) {
      await tx.productImage.deleteMany({ where: { productId } });
      if (input.images.length > 0) {
        await tx.productImage.createMany({
          data: input.images.map((img, idx) => ({
            productId,
            url: img.url.trim(),
            altText: img.altText?.trim() || product.title,
            displayOrder: img.displayOrder ?? idx,
          })),
        });
      }
    }

    if (input.variants && input.variants.length > 0) {
      for (const v of input.variants) {
        if (v.id) {
          const existingVariant = existing.variants.find((ev) => ev.id === v.id);
          const stockDiff = existingVariant ? v.inventoryCount - existingVariant.inventoryCount : 0;

          await tx.productVariant.update({
            where: { id: v.id },
            data: {
              sku: v.sku.trim(),
              title: v.title.trim(),
              size: v.size?.trim() || null,
              color: v.color?.trim() || null,
              priceOverride: v.priceOverride ?? null,
              inventoryCount: Math.max(0, v.inventoryCount),
              isAvailable: v.isAvailable !== undefined ? v.isAvailable : v.inventoryCount > 0,
            },
          });

          if (stockDiff !== 0) {
            await tx.inventoryLog.create({
              data: {
                variantId: v.id,
                changeAmount: stockDiff,
                newBalance: Math.max(0, v.inventoryCount),
                reason: stockDiff > 0 ? 'RESTOCK' : 'MANUAL_ADJUSTMENT',
                actorId,
              },
            });
          }
        } else {
          const newVar = await tx.productVariant.create({
            data: {
              productId,
              sku: v.sku.trim(),
              title: v.title.trim(),
              size: v.size?.trim() || null,
              color: v.color?.trim() || null,
              priceOverride: v.priceOverride ?? null,
              inventoryCount: Math.max(0, v.inventoryCount),
              isAvailable: v.inventoryCount > 0,
            },
          });

          if (newVar.inventoryCount > 0) {
            await tx.inventoryLog.create({
              data: {
                variantId: newVar.id,
                changeAmount: newVar.inventoryCount,
                newBalance: newVar.inventoryCount,
                reason: 'INITIAL_STOCK',
                actorId,
              },
            });
          }
        }
      }
    }

    return product;
  });

  await logAdminAction({
    actorId,
    action: 'UPDATE_PRODUCT',
    entityType: 'PRODUCT',
    entityId: productId,
    payload: { title: updated.title, status: updated.status },
    ipAddress,
  });

  return updated;
}

export async function deleteOrArchiveProduct(
  actorId: string,
  productId: string,
  forceArchive = false,
  ipAddress?: string
): Promise<{ action: 'ARCHIVED' | 'DELETED'; message: string }> {
  const product = await db.product.findUnique({
    where: { id: productId },
    include: {
      variants: {
        include: {
          _count: {
            select: { orderItems: true },
          },
        },
      },
    },
  });

  if (!product) {
    throw new Error('Product not found.');
  }

  const hasOrders = product.variants.some((v) => (v._count?.orderItems || 0) > 0);

  if (hasOrders || forceArchive) {
    await db.product.update({
      where: { id: productId },
      data: { status: 'ARCHIVED' },
    });

    await logAdminAction({
      actorId,
      action: 'ARCHIVE_PRODUCT',
      entityType: 'PRODUCT',
      entityId: productId,
      payload: { reason: hasOrders ? 'HISTORICAL_ORDERS_PRESENT' : 'MANUAL_ARCHIVE' },
      ipAddress,
    });

    return {
      action: 'ARCHIVED',
      message: hasOrders
        ? 'Product is associated with historical customer orders and has been safely ARCHIVED instead of hard-deleted to preserve order history.'
        : 'Product has been moved to ARCHIVED status.',
    };
  }

  await db.$transaction(async (tx) => {
    await tx.wishlistItem.deleteMany({ where: { productId } });

    const variantIds = product.variants.map((v) => v.id);
    if (variantIds.length > 0) {
      await tx.cartItem.deleteMany({ where: { variantId: { in: variantIds } } });
      await tx.inventoryLog.deleteMany({ where: { variantId: { in: variantIds } } });
      await tx.productVariant.deleteMany({ where: { productId } });
    }

    await tx.productImage.deleteMany({ where: { productId } });
    await tx.product.delete({ where: { id: productId } });
  });

  await logAdminAction({
    actorId,
    action: 'DELETE_PRODUCT',
    entityType: 'PRODUCT',
    entityId: productId,
    payload: { title: product.title },
    ipAddress,
  });

  return {
    action: 'DELETED',
    message: 'Product and associated variants were permanently deleted.',
  };
}

export async function getAdminInventory({
  search,
  lowStockOnly = false,
  threshold = 5,
  page = 1,
  pageSize = 15,
}: {
  search?: string;
  lowStockOnly?: boolean;
  threshold?: number;
  page?: number;
  pageSize?: number;
}) {
  const safePage = Math.max(1, page);
  const skip = (safePage - 1) * pageSize;

  const where: Prisma.ProductVariantWhereInput = {};

  if (lowStockOnly) {
    where.inventoryCount = { lte: threshold };
  }

  if (search && search.trim()) {
    const term = search.trim();
    where.OR = [
      { sku: { contains: term } },
      { title: { contains: term } },
      { product: { title: { contains: term } } },
    ];
  }

  const [totalCount, variants] = await Promise.all([
    db.productVariant.count({ where }),
    db.productVariant.findMany({
      where,
      orderBy: [{ inventoryCount: 'asc' }, { updatedAt: 'desc' }],
      skip,
      take: pageSize,
      include: {
        product: {
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
            regularPrice: true,
            images: { take: 1, orderBy: { displayOrder: 'asc' } },
          },
        },
        _count: {
          select: {
            inventoryLogs: true,
            orderItems: true,
          },
        },
      },
    }),
  ]);

  return {
    variants: variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      title: v.title,
      size: v.size,
      color: v.color,
      inventoryCount: v.inventoryCount,
      isAvailable: v.isAvailable,
      price: v.priceOverride || v.product.regularPrice,
      productId: v.product.id,
      productTitle: v.product.title,
      productSlug: v.product.slug,
      productStatus: v.product.status,
      imageUrl: v.product.images[0]?.url || null,
      logsCount: v._count.inventoryLogs,
      ordersCount: v._count.orderItems,
    })),
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
    currentPage: safePage,
  };
}

export async function adjustInventory(
  actorId: string,
  variantId: string,
  changeAmount: number,
  reason: string,
  ipAddress?: string
) {
  if (changeAmount === 0) {
    throw new Error('Stock change amount cannot be zero.');
  }

  const variant = await db.productVariant.findUnique({
    where: { id: variantId },
    include: { product: true },
  });

  if (!variant) {
    throw new Error('Product variant not found.');
  }

  const newBalance = variant.inventoryCount + changeAmount;
  if (newBalance < 0) {
    throw new Error(
      `Cannot reduce stock by ${Math.abs(changeAmount)}. Current stock is ${variant.inventoryCount}.`
    );
  }

  const updated = await db.$transaction(async (tx) => {
    const v = await tx.productVariant.update({
      where: { id: variantId },
      data: {
        inventoryCount: newBalance,
        isAvailable: newBalance > 0,
      },
    });

    const log = await tx.inventoryLog.create({
      data: {
        variantId,
        changeAmount,
        newBalance,
        reason: reason.trim() || 'MANUAL_ADJUSTMENT',
        actorId,
      },
    });

    return { variant: v, log };
  });

  await logAdminAction({
    actorId,
    action: 'ADJUST_STOCK',
    entityType: 'INVENTORY',
    entityId: variantId,
    payload: {
      sku: variant.sku,
      productTitle: variant.product.title,
      changeAmount,
      newBalance,
      reason,
    },
    ipAddress,
  });

  return updated;
}

export async function getVariantInventoryHistory(variantId: string) {
  return db.inventoryLog.findMany({
    where: { variantId },
    orderBy: { createdAt: 'desc' },
    include: {
      variant: {
        select: { sku: true, title: true, product: { select: { title: true } } },
      },
    },
  });
}

export async function getAdminOrders({
  search,
  fulfillmentStatus,
  paymentStatus,
  page = 1,
  pageSize = 10,
}: {
  search?: string;
  fulfillmentStatus?: string;
  paymentStatus?: string;
  page?: number;
  pageSize?: number;
}) {
  const safePage = Math.max(1, page);
  const skip = (safePage - 1) * pageSize;

  const where: Prisma.OrderWhereInput = {};

  if (fulfillmentStatus && fulfillmentStatus !== 'ALL') {
    where.fulfillmentStatus = fulfillmentStatus;
  }

  if (paymentStatus && paymentStatus !== 'ALL') {
    where.paymentStatus = paymentStatus;
  }

  if (search && search.trim()) {
    const term = search.trim();
    where.OR = [
      { orderNumber: { contains: term } },
      { customerEmail: { contains: term } },
      { customerPhone: { contains: term } },
    ];
  }

  const [totalCount, orders] = await Promise.all([
    db.order.count({ where }),
    db.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
      include: {
        items: true,
        user: { select: { id: true, name: true, email: true } },
      },
    }),
  ]);

  return {
    orders: orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerEmail: o.customerEmail,
      customerPhone: o.customerPhone,
      customerName: o.user?.name || o.customerEmail.split('@')[0],
      createdAt: o.createdAt,
      subtotal: o.subtotal,
      discountTotal: o.discountTotal,
      shippingTotal: o.shippingTotal,
      grandTotal: o.grandTotal,
      paymentStatus: o.paymentStatus,
      fulfillmentStatus: o.fulfillmentStatus,
      paymentMethod: o.paymentMethod,
      itemCount: o.items.reduce((acc, i) => acc + i.quantity, 0),
      itemsSummary: o.items.map((i) => `${i.productTitle} (${i.variantTitle}) × ${i.quantity}`).join(', '),
    })),
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
    currentPage: safePage,
  };
}

export async function getAdminOrderById(orderIdOrNumber: string) {
  const order = await db.order.findFirst({
    where: {
      OR: [{ id: orderIdOrNumber }, { orderNumber: orderIdOrNumber }],
    },
    include: {
      items: {
        include: {
          variant: {
            select: { id: true, sku: true, inventoryCount: true },
          },
        },
      },
      shippingMethod: true,
      coupon: true,
      payments: {
        orderBy: { createdAt: 'desc' },
      },
      user: {
        select: { id: true, name: true, email: true, createdAt: true },
      },
    },
  });

  if (!order) return null;

  let trackingNumber: string | null = null;
  let courierName: string | null = null;
  if (order.notes && order.notes.includes('TRACKING:')) {
    const match = order.notes.match(/TRACKING:([A-Za-z0-9-_]+)/);
    if (match) trackingNumber = match[1];
    const carrierMatch = order.notes.match(/COURIER:([A-Za-z0-9-_\s]+)/);
    courierName = carrierMatch ? carrierMatch[1] : (order.shippingMethod?.name || 'TCS Express');
  }

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    shippingAddress: JSON.parse(order.shippingAddressJson),
    billingAddress: order.billingAddressJson ? JSON.parse(order.billingAddressJson) : null,
    subtotal: order.subtotal,
    discountTotal: order.discountTotal,
    shippingTotal: order.shippingTotal,
    grandTotal: order.grandTotal,
    paymentStatus: order.paymentStatus,
    fulfillmentStatus: order.fulfillmentStatus,
    paymentMethod: order.paymentMethod,
    shippingMethod: order.shippingMethod,
    coupon: order.coupon,
    notes: order.notes,
    trackingNumber,
    courierName,
    items: order.items,
    payments: order.payments,
    user: order.user,
  };
}

export async function updateOrderFulfillment(
  actorId: string,
  orderId: string,
  newStatus: string,
  tracking?: { courier?: string; trackingNumber?: string },
  ipAddress?: string
) {
  const VALID_FULFILLMENT = ['UNFULFILLED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
  if (!VALID_FULFILLMENT.includes(newStatus)) {
    throw new Error(`Invalid fulfillment status: "${newStatus}".`);
  }

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) {
    throw new Error('Order not found.');
  }

  let updatedNotes = order.notes || '';
  if (tracking?.trackingNumber) {
    const cleanNum = tracking.trackingNumber.trim();
    const cleanCarrier = tracking.courier?.trim() || 'TCS Express';
    updatedNotes = updatedNotes.replace(/TRACKING:[^\s]+\s*/g, '').replace(/COURIER:[^\n]+\n?/g, '').trim();
    updatedNotes = `${updatedNotes ? updatedNotes + '\n' : ''}TRACKING:${cleanNum} COURIER:${cleanCarrier}`;
  }

  const updated = await db.$transaction(async (tx) => {
    if (newStatus === 'CANCELLED' && order.fulfillmentStatus !== 'CANCELLED') {
      for (const item of order.items) {
        const variant = await tx.productVariant.findUnique({ where: { id: item.variantId } });
        if (variant) {
          const newBal = variant.inventoryCount + item.quantity;
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { inventoryCount: newBal, isAvailable: newBal > 0 },
          });
          await tx.inventoryLog.create({
            data: {
              variantId: item.variantId,
              changeAmount: item.quantity,
              newBalance: newBal,
              reason: 'ORDER_CANCELLED_RESTOCK',
              actorId,
            },
          });
        }
      }
    }

    return tx.order.update({
      where: { id: orderId },
      data: {
        fulfillmentStatus: newStatus,
        notes: updatedNotes,
      },
    });
  });

  await logAdminAction({
    actorId,
    action: 'UPDATE_ORDER_FULFILLMENT',
    entityType: 'ORDER',
    entityId: orderId,
    payload: {
      orderNumber: order.orderNumber,
      from: order.fulfillmentStatus,
      to: newStatus,
      tracking,
    },
    ipAddress,
  });

  return updated;
}

export async function updateOrderPaymentStatus(
  actorId: string,
  orderId: string,
  newPaymentStatus: string,
  refundReason?: string,
  ipAddress?: string
) {
  const VALID_PAYMENT = ['PENDING', 'PAID', 'FAILED', 'REFUNDED'];
  if (!VALID_PAYMENT.includes(newPaymentStatus)) {
    throw new Error(`Invalid payment status: "${newPaymentStatus}".`);
  }

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { payments: true, items: true },
  });

  if (!order) {
    throw new Error('Order not found.');
  }

  const updated = await db.$transaction(async (tx) => {
    if (newPaymentStatus === 'REFUNDED') {
      await tx.payment.create({
        data: {
          orderId,
          amount: order.grandTotal,
          currency: 'PKR',
          provider: order.paymentMethod,
          status: 'REFUNDED',
          rawResponseJson: JSON.stringify({ reason: refundReason || 'Customer refund granted by administrator' }),
        },
      });
    } else if (newPaymentStatus === 'PAID') {
      await tx.payment.create({
        data: {
          orderId,
          amount: order.grandTotal,
          currency: 'PKR',
          provider: order.paymentMethod,
          status: 'COMPLETED',
          rawResponseJson: JSON.stringify({ note: 'Payment verified by administrator' }),
        },
      });
    }

    return tx.order.update({
      where: { id: orderId },
      data: { paymentStatus: newPaymentStatus },
    });
  });

  await logAdminAction({
    actorId,
    action: 'UPDATE_ORDER_PAYMENT',
    entityType: 'ORDER',
    entityId: orderId,
    payload: {
      orderNumber: order.orderNumber,
      from: order.paymentStatus,
      to: newPaymentStatus,
      reason: refundReason,
    },
    ipAddress,
  });

  return updated;
}

export async function getAdminCustomers({
  search,
  page = 1,
  pageSize = 10,
}: {
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const safePage = Math.max(1, page);
  const skip = (safePage - 1) * pageSize;

  const where: Prisma.UserWhereInput = {
    role: 'CUSTOMER',
  };

  if (search && search.trim()) {
    const term = search.trim();
    where.OR = [
      { name: { contains: term } },
      { email: { contains: term } },
    ];
  }

  const [totalCount, users] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        createdAt: true,
        profile: {
          select: { phone: true, marketingOptIn: true, notes: true },
        },
        orders: {
          select: { grandTotal: true, paymentStatus: true },
        },
      },
    }),
  ]);

  return {
    customers: users.map((u) => {
      const ordersCount = u.orders.length;
      const totalSpend = u.orders
        .filter((o) => o.paymentStatus === 'PAID')
        .reduce((sum, o) => sum + o.grandTotal, 0);

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.profile?.phone || null,
        isActive: u.isActive,
        createdAt: u.createdAt,
        marketingOptIn: u.profile?.marketingOptIn || false,
        ordersCount,
        totalSpend: Math.round(totalSpend * 100) / 100,
      };
    }),
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
    currentPage: safePage,
  };
}

export async function getAdminCustomerById(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true,
      createdAt: true,
      profile: true,
      addresses: {
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
      },
      orders: {
        orderBy: { createdAt: 'desc' },
        include: { items: true },
      },
    },
  });

  if (!user) return null;

  const totalSpent = user.orders
    .filter((o) => o.paymentStatus === 'PAID')
    .reduce((sum, o) => sum + o.grandTotal, 0);

  return {
    ...user,
    totalSpent: Math.round(totalSpent * 100) / 100,
  };
}

export async function getAdminCoupons() {
  const coupons = await db.coupon.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { orders: true },
      },
    },
  });

  return coupons.map((c) => ({
    id: c.id,
    code: c.code,
    discountType: c.discountType,
    discountValue: c.discountValue,
    minOrderValue: c.minOrderValue,
    maxUses: c.maxUses,
    usedCount: c.usedCount,
    ordersCount: c._count.orders,
    startsAt: c.startsAt,
    expiresAt: c.expiresAt,
    isActive: c.isActive,
    createdAt: c.createdAt,
  }));
}

export interface CouponInput {
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  minOrderValue?: number | null;
  maxUses?: number | null;
  startsAt?: string | Date;
  expiresAt?: string | Date | null;
  isActive?: boolean;
}

export async function createCoupon(actorId: string, input: CouponInput, ipAddress?: string) {
  const code = input.code.toUpperCase().trim().replace(/[^A-Z0-9_-]/g, '');
  if (!code) {
    throw new Error('Valid coupon code is required.');
  }

  if (input.discountType !== 'PERCENTAGE' && input.discountType !== 'FIXED_AMOUNT') {
    throw new Error('Discount type must be PERCENTAGE or FIXED_AMOUNT.');
  }

  if (typeof input.discountValue !== 'number' || input.discountValue <= 0) {
    throw new Error('Discount value must be greater than zero.');
  }

  if (input.discountType === 'PERCENTAGE' && input.discountValue > 100) {
    throw new Error('Percentage discount cannot exceed 100%.');
  }

  const existing = await db.coupon.findUnique({ where: { code } });
  if (existing) {
    throw new Error(`Coupon code "${code}" already exists.`);
  }

  const coupon = await db.coupon.create({
    data: {
      code,
      discountType: input.discountType,
      discountValue: input.discountValue,
      minOrderValue: input.minOrderValue ?? null,
      maxUses: input.maxUses ?? null,
      startsAt: input.startsAt ? new Date(input.startsAt) : new Date(),
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      isActive: input.isActive !== undefined ? Boolean(input.isActive) : true,
    },
  });

  await logAdminAction({
    actorId,
    action: 'CREATE_COUPON',
    entityType: 'COUPON',
    entityId: coupon.id,
    payload: { code: coupon.code, discountValue: coupon.discountValue, discountType: coupon.discountType },
    ipAddress,
  });

  return coupon;
}

export async function updateCoupon(actorId: string, id: string, input: Partial<CouponInput>, ipAddress?: string) {
  const existing = await db.coupon.findUnique({ where: { id } });
  if (!existing) {
    throw new Error('Coupon not found.');
  }

  const data: Prisma.CouponUpdateInput = {};
  if (input.code) {
    data.code = input.code.toUpperCase().trim().replace(/[^A-Z0-9_-]/g, '');
  }
  if (input.discountType) data.discountType = input.discountType;
  if (input.discountValue !== undefined) data.discountValue = input.discountValue;
  if (input.minOrderValue !== undefined) data.minOrderValue = input.minOrderValue;
  if (input.maxUses !== undefined) data.maxUses = input.maxUses;
  if (input.startsAt) data.startsAt = new Date(input.startsAt);
  if (input.expiresAt !== undefined) data.expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;
  if (input.isActive !== undefined) data.isActive = Boolean(input.isActive);

  const updated = await db.coupon.update({
    where: { id },
    data,
  });

  await logAdminAction({
    actorId,
    action: 'UPDATE_COUPON',
    entityType: 'COUPON',
    entityId: id,
    payload: { code: updated.code, isActive: updated.isActive },
    ipAddress,
  });

  return updated;
}

export async function deleteCoupon(actorId: string, id: string, ipAddress?: string) {
  const existing = await db.coupon.findUnique({
    where: { id },
    include: { _count: { select: { orders: true } } },
  });

  if (!existing) {
    throw new Error('Coupon not found.');
  }

  if (existing._count.orders > 0) {
    await db.coupon.update({
      where: { id },
      data: { isActive: false },
    });
    return { action: 'DEACTIVATED', message: 'Coupon is tied to previous orders and has been set to INACTIVE.' };
  }

  await db.coupon.delete({ where: { id } });

  await logAdminAction({
    actorId,
    action: 'DELETE_COUPON',
    entityType: 'COUPON',
    entityId: id,
    payload: { code: existing.code },
    ipAddress,
  });

  return { action: 'DELETED', message: 'Coupon permanently deleted.' };
}

export async function getStoreSettings() {
  const [settingsList, shippingMethods] = await Promise.all([
    db.storeSetting.findMany(),
    db.shippingMethod.findMany({ orderBy: { rate: 'asc' } }),
  ]);

  const map: Record<string, string> = {};
  for (const item of settingsList) {
    map[item.key] = item.value;
  }

  return {
    storeName: map['store_name'] || 'Laam Studio',
    storeEmail: map['store_email'] || 'support@laamstore.com',
    storePhone: map['store_phone'] || '+92 42 111 522 678',
    storeAddress: map['store_address'] || 'Gulberg III, MM Alam Road, Lahore, Pakistan',
    currency: map['store_currency'] || 'PKR',
    taxRate: parseFloat(map['tax_rate'] || '0'),
    lowStockThreshold: parseInt(map['low_stock_threshold'] || '5', 10),
    paymentCodEnabled: map['payment_cod_enabled'] !== 'false',
    paymentStripeEnabled: map['payment_stripe_enabled'] === 'true',
    paymentBankEnabled: map['payment_bank_enabled'] === 'true',
    shippingMethods: shippingMethods.map((s) => ({
      id: s.id,
      name: s.name,
      code: s.code,
      rate: s.rate,
      estimatedDays: s.estimatedDays,
      isActive: s.isActive,
    })),
  };
}

export async function updateStoreSettings(
  actorId: string,
  settings: Record<string, any>,
  shippingMethods?: { id?: string; name: string; code: string; rate: number; estimatedDays: string; isActive?: boolean }[],
  ipAddress?: string
) {
  await db.$transaction(async (tx) => {
    for (const [key, val] of Object.entries(settings)) {
      if (val !== undefined && val !== null) {
        await tx.storeSetting.upsert({
          where: { key },
          update: { value: String(val) },
          create: { key, value: String(val) },
        });
      }
    }

    if (shippingMethods && shippingMethods.length > 0) {
      for (const sm of shippingMethods) {
        if (sm.id) {
          await tx.shippingMethod.update({
            where: { id: sm.id },
            data: {
              name: sm.name.trim(),
              rate: Number(sm.rate),
              estimatedDays: sm.estimatedDays.trim(),
              isActive: sm.isActive !== undefined ? Boolean(sm.isActive) : true,
            },
          });
        } else {
          await tx.shippingMethod.create({
            data: {
              name: sm.name.trim(),
              code: sm.code.trim().toUpperCase(),
              rate: Number(sm.rate),
              estimatedDays: sm.estimatedDays.trim(),
              isActive: sm.isActive !== undefined ? Boolean(sm.isActive) : true,
            },
          });
        }
      }
    }
  });

  await logAdminAction({
    actorId,
    action: 'UPDATE_STORE_SETTINGS',
    entityType: 'STORE_SETTINGS',
    entityId: 'global',
    payload: { keysUpdated: Object.keys(settings) },
    ipAddress,
  });

  return getStoreSettings();
}

export async function getAdminAuditLogs(page = 1, pageSize = 20) {
  const safePage = Math.max(1, page);
  const skip = (safePage - 1) * pageSize;

  const [totalCount, logs] = await Promise.all([
    db.auditLog.count(),
    db.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
      include: {
        actor: {
          select: { email: true, name: true, role: true },
        },
      },
    }),
  ]);

  return {
    logs: logs.map((l) => ({
      id: l.id,
      action: l.action,
      entityType: l.entityType,
      entityId: l.entityId,
      payload: l.payloadJson ? JSON.parse(l.payloadJson) : null,
      ipAddress: l.ipAddress,
      createdAt: l.createdAt,
      actorEmail: l.actor?.email || 'System / Initializer',
      actorRole: l.actor?.role || 'SYSTEM',
    })),
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
    currentPage: safePage,
  };
}
