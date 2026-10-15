/**
 * Unified In-Memory / Persistent Data Store for Laam Storefront & Super-Admin Portal.
 * Implements a Prisma-like ORM interface for all store models.
 */

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: 'SUPER_ADMIN' | 'STAFF' | 'CUSTOMER';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  id: string;
  userId: string;
  phone?: string | null;
  marketingOptIn?: boolean;
  notes?: string | null;
}

export interface Address {
  id: string;
  userId: string;
  recipientName: string;
  street: string;
  city: string;
  state?: string | null;
  postalCode: string;
  country: string;
  type?: 'SHIPPING' | 'BILLING';
  isDefault: boolean;
  createdAt: Date;
}

export interface Session {
  id: string;
  token: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface PasswordResetToken {
  id: string;
  token: string;
  userId: string;
  expiresAt: Date;
  usedAt?: Date | null;
  createdAt: Date;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  details?: string | null;
  categoryId: string;
  regularPrice: number;
  salePrice?: number | null;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  title: string;
  size?: string | null;
  color?: string | null;
  priceOverride?: number | null;
  inventoryCount: number;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  altText?: string | null;
  displayOrder: number;
  createdAt: Date;
}

export interface InventoryLog {
  id: string;
  variantId: string;
  changeAmount: number;
  newBalance: number;
  reason: string;
  actorId?: string | null;
  createdAt: Date;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string | null;
  customerEmail: string;
  customerPhone?: string | null;
  shippingAddressJson: string;
  billingAddressJson?: string | null;
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  grandTotal: number;
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  fulfillmentStatus: 'UNFULFILLED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  paymentMethod: string;
  shippingMethodId?: string | null;
  couponId?: string | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  orderId: string;
  variantId: string;
  productTitle: string;
  variantTitle: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  total: number;
}

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  provider: string;
  status: string;
  rawResponseJson?: string | null;
  createdAt: Date;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  minOrderValue?: number | null;
  maxUses?: number | null;
  usedCount: number;
  startsAt: Date;
  expiresAt?: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoreSetting {
  id: string;
  key: string;
  value: string;
  description?: string | null;
  updatedAt: Date;
}

export interface ShippingMethod {
  id: string;
  name: string;
  code: string;
  rate: number;
  estimatedDays: string;
  isActive: boolean;
  createdAt: Date;
}

export interface AuditLog {
  id: string;
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  payloadJson?: string | null;
  ipAddress?: string | null;
  createdAt: Date;
}

export interface Cart {
  id: string;
  userId?: string | null;
  sessionToken?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItem {
  id: string;
  cartId: string;
  variantId: string;
  quantity: number;
  unitPrice?: number;
  createdAt: Date;
}

export interface Wishlist {
  id: string;
  userId: string;
  createdAt: Date;
}

export interface WishlistItem {
  id: string;
  wishlistId: string;
  userId?: string | null;
  productId: string;
  createdAt: Date;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  reviewText?: string | null;
  isVerifiedPurchase: boolean;
  isApproved: boolean;
  createdAt: Date;
}

class MemoryDB {
  users: User[] = [];
  userProfiles: UserProfile[] = [];
  addresses: Address[] = [];
  sessions: Session[] = [];
  passwordResetTokens: PasswordResetToken[] = [];
  categories: Category[] = [];
  products: Product[] = [];
  productVariants: ProductVariant[] = [];
  productImages: ProductImage[] = [];
  inventoryLogs: InventoryLog[] = [];
  orders: Order[] = [];
  orderItems: OrderItem[] = [];
  payments: Payment[] = [];
  coupons: Coupon[] = [];
  storeSettings: StoreSetting[] = [];
  shippingMethods: ShippingMethod[] = [];
  auditLogs: AuditLog[] = [];
  carts: Cart[] = [];
  cartItems: CartItem[] = [];
  wishlists: Wishlist[] = [];
  wishlistItems: WishlistItem[] = [];
  reviews: Review[] = [];

  constructor() {
    this.seedDefaults();
  }

  seedDefaults() {
    if (this.categories.length > 0) return;

    const catPret: Category = {
      id: 'cat_pret_1',
      name: 'Pret Ready-to-Wear',
      slug: 'pret',
      description: 'Stitched contemporary kurtas, coordinates, and 2-piece ensembles.',
      imageUrl: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=800&auto=format&fit=crop',
      sortOrder: 1,
      isActive: true,
      createdAt: new Date(),
    };

    const catFestive: Category = {
      id: 'cat_festive_2',
      name: 'Luxury Festive',
      slug: 'festive',
      description: 'Opulent wedding and evening wear embellished with dabka and zari work.',
      imageUrl: 'https://images.unsplash.com/photo-1596783074918-c84cb06531ca?q=80&w=800&auto=format&fit=crop',
      sortOrder: 2,
      isActive: true,
      createdAt: new Date(),
    };

    this.categories.push(catPret, catFestive);

    const prod1: Product = {
      id: 'prod_1',
      title: 'Zari Embroidered Raw Silk Ensemble',
      slug: 'zari-embroidered-raw-silk-ensemble',
      description: 'A regal silhouette crafted in pure raw silk featuring fine tilla and antique gold zari hand-embroidery.',
      details: 'Fabric: 100% Pure Raw Silk\nCare: Professional Dry Clean Only',
      categoryId: catPret.id,
      regularPrice: 22000,
      salePrice: 16500,
      status: 'PUBLISHED',
      isFeatured: true,
      createdAt: new Date(Date.now() - 100000),
      updatedAt: new Date(),
    };

    const prod2: Product = {
      id: 'prod_2',
      title: 'Pastel Organza Festive Kurta Set',
      slug: 'pastel-organza-festive-kurta-set',
      description: 'Luminous powder-blue Korean organza layered over tonal butter-crepe lining with gota patti.',
      details: 'Fabric: Korean Organza\nCare: Dry clean recommended',
      categoryId: catFestive.id,
      regularPrice: 28500,
      salePrice: 22800,
      status: 'PUBLISHED',
      isFeatured: true,
      createdAt: new Date(Date.now() - 50000),
      updatedAt: new Date(),
    };

    const prod3: Product = {
      id: 'prod_3',
      title: 'Heavy Hand-Embellished Velvet Peshwas',
      slug: 'heavy-hand-embellished-velvet-peshwas',
      description: 'An architectural 16-kali peshwas cut from micro-velvet, lavished with silver kora dabka.',
      details: 'Fabric: Pure Micro-Velvet 9000',
      categoryId: catFestive.id,
      regularPrice: 85000,
      salePrice: null,
      status: 'PUBLISHED',
      isFeatured: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.products.push(prod1, prod2, prod3);

    const var1: ProductVariant = {
      id: 'var_1',
      productId: prod1.id,
      sku: 'ZSE-CRIMSON-S',
      title: 'Crimson / Small',
      size: 'Small',
      color: 'Crimson',
      priceOverride: null,
      inventoryCount: 15,
      isAvailable: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const var2: ProductVariant = {
      id: 'var_2',
      productId: prod1.id,
      sku: 'ZSE-CRIMSON-M',
      title: 'Crimson / Medium',
      size: 'Medium',
      color: 'Crimson',
      priceOverride: null,
      inventoryCount: 20,
      isAvailable: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const var3: ProductVariant = {
      id: 'var_3',
      productId: prod2.id,
      sku: 'POF-BLUE-S',
      title: 'Powder Blue / Small',
      size: 'Small',
      color: 'Powder Blue',
      priceOverride: null,
      inventoryCount: 10,
      isAvailable: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const var4: ProductVariant = {
      id: 'var_4',
      productId: prod3.id,
      sku: 'HVP-MAROON-S',
      title: 'Deep Maroon / Small',
      size: 'Small',
      color: 'Deep Maroon',
      priceOverride: null,
      inventoryCount: 5,
      isAvailable: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.productVariants.push(var1, var2, var3, var4);

    this.productImages.push(
      {
        id: 'img_1',
        productId: prod1.id,
        url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=800&auto=format&fit=crop',
        altText: 'Zari Embroidered Raw Silk Ensemble',
        displayOrder: 0,
        createdAt: new Date(),
      },
      {
        id: 'img_2',
        productId: prod2.id,
        url: 'https://images.unsplash.com/photo-1596783074918-c84cb06531ca?q=80&w=800&auto=format&fit=crop',
        altText: 'Pastel Organza Festive Kurta Set',
        displayOrder: 0,
        createdAt: new Date(),
      },
      {
        id: 'img_3',
        productId: prod3.id,
        url: 'https://images.unsplash.com/photo-1518049362265-d5b2a6467637?q=80&w=800&auto=format&fit=crop',
        altText: 'Heavy Velvet Peshwas',
        displayOrder: 0,
        createdAt: new Date(),
      }
    );

    this.shippingMethods.push(
      {
        id: 'ship_1',
        name: 'Standard Nationwide Delivery',
        code: 'STANDARD',
        rate: 250,
        estimatedDays: '3-5 business days',
        isActive: true,
        createdAt: new Date(),
      },
      {
        id: 'ship_2',
        name: 'Express Priority Courier',
        code: 'EXPRESS',
        rate: 650,
        estimatedDays: '1-2 business days',
        isActive: true,
        createdAt: new Date(),
      }
    );

    this.storeSettings.push(
      { id: 'set_1', key: 'store_name', value: 'Laam Luxury Atelier', updatedAt: new Date() },
      { id: 'set_2', key: 'store_email', value: 'support@laamstore.com', updatedAt: new Date() },
      { id: 'set_3', key: 'store_currency', value: 'PKR', updatedAt: new Date() },
      { id: 'set_4', key: 'low_stock_threshold', value: '5', updatedAt: new Date() },
      { id: 'set_5', key: 'payment_cod_enabled', value: 'true', updatedAt: new Date() }
    );

    this.coupons.push({
      id: 'coup_1',
      code: 'WELCOME10',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minOrderValue: 5000,
      maxUses: 500,
      usedCount: 0,
      startsAt: new Date(),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}

const mem = new MemoryDB();

function matchCondition(item: any, cond: any): boolean {
  if (!cond || typeof cond !== 'object') return true;

  for (const key of Object.keys(cond)) {
    const val = cond[key];
    let itemVal = item ? item[key] : undefined;

    if (itemVal === undefined && item && item.id) {
      if (key === 'variants') {
        itemVal = mem.productVariants.filter((v) => v.productId === item.id);
      } else if (key === 'category') {
        itemVal = mem.categories.find((c) => c.id === item.categoryId);
      } else if (key === 'product') {
        itemVal = mem.products.find((p) => p.id === item.productId);
      }
    }

    if (key === 'OR' && Array.isArray(val)) {
      const match = val.some((subCond) => matchCondition(item, subCond));
      if (!match) return false;
      continue;
    }

    if (key === 'AND' && Array.isArray(val)) {
      const match = val.every((subCond) => matchCondition(item, subCond));
      if (!match) return false;
      continue;
    }

    if (key === 'NOT') {
      if (matchCondition(item, val)) return false;
      continue;
    }

    if (key === 'wishlistId_productId' && val && typeof val === 'object') {
      if (item.wishlistId !== val.wishlistId || item.productId !== val.productId) return false;
      continue;
    }

    if (key === 'cartId_variantId' && val && typeof val === 'object') {
      if (item.cartId !== val.cartId || item.variantId !== val.variantId) return false;
      continue;
    }

    if (val && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
      if ('equals' in val) {
        if (typeof itemVal === 'string' && typeof val.equals === 'string') {
          if (itemVal.toLowerCase() !== val.equals.toLowerCase()) return false;
        } else if (itemVal !== val.equals) {
          return false;
        }
      }
      if ('not' in val && itemVal === val.not) return false;
      if ('in' in val && Array.isArray(val.in) && !val.in.includes(itemVal)) return false;
      if ('notIn' in val && Array.isArray(val.notIn) && val.notIn.includes(itemVal)) return false;
      if ('gt' in val && !(itemVal > val.gt)) return false;
      if ('gte' in val && !(itemVal >= val.gte)) return false;
      if ('lt' in val && !(itemVal < val.lt)) return false;
      if ('lte' in val && !(itemVal <= val.lte)) return false;
      if ('contains' in val && typeof itemVal === 'string' && !itemVal.toLowerCase().includes(String(val.contains).toLowerCase())) return false;
      if ('startsWith' in val && typeof itemVal === 'string' && !itemVal.startsWith(val.startsWith)) return false;
      if ('endsWith' in val && typeof itemVal === 'string' && !itemVal.endsWith(val.endsWith)) return false;
      if ('some' in val) {
        if (!Array.isArray(itemVal) || !itemVal.some((sub) => matchCondition(sub, val.some))) return false;
      }
    } else if (itemVal !== val) {
      return false;
    }
  }

  return true;
}

function sortResults(results: any[], orderBy: any): any[] {
  const orders = Array.isArray(orderBy) ? orderBy : [orderBy];
  return [...results].sort((a, b) => {
    for (const ord of orders) {
      for (const key of Object.keys(ord)) {
        const dir = ord[key];
        const valA = a[key];
        const valB = b[key];
        if (valA < valB) return dir === 'asc' ? -1 : 1;
        if (valA > valB) return dir === 'asc' ? 1 : -1;
      }
    }
    return 0;
  });
}

function applySelect(obj: any, select?: any) {
  if (!select) return obj;
  const res: any = {};
  for (const key of Object.keys(select)) {
    if (select[key]) {
      res[key] = obj[key];
    }
  }
  return res;
}

function attachProduct(p: Product, include?: any, select?: any) {
  if (!p) return null;
  const res: any = {
    ...p,
    salePrice: p.salePrice ?? null,
    details: p.details ?? null,
    images: mem.productImages.filter((i) => i.productId === p.id),
  };
  if (include?.category) {
    res.category = mem.categories.find((c) => c.id === p.categoryId) || null;
  }
  if (include?.images) {
    let imgs = mem.productImages.filter((i) => i.productId === p.id);
    if (include.images.orderBy) imgs = sortResults(imgs, include.images.orderBy);
    if (include.images.take) imgs = imgs.slice(0, include.images.take);
    res.images = imgs;
  }
  if (include?.variants) {
    let vars = mem.productVariants.filter((v) => v.productId === p.id);
    if (include.variants.orderBy) vars = sortResults(vars, include.variants.orderBy);
    res.variants = vars.map((v) => attachVariant(v, include.variants.include, include.variants.select));
  }
  if (include?.reviews) {
    let revs = mem.reviews.filter((r) => r.productId === p.id && matchCondition(r, include.reviews.where || {}));
    if (include.reviews.orderBy) revs = sortResults(revs, include.reviews.orderBy);
    res.reviews = revs.map((r) => {
      const itemRes: any = { ...r };
      if (include.reviews.include?.user) {
        itemRes.user = mem.users.find((u) => u.id === r.userId) || null;
      }
      return applySelect(itemRes, include.reviews.select);
    });
  }
  return applySelect(res, select);
}

function attachVariant(v: ProductVariant, include?: any, select?: any) {
  if (!v) return null;
  const res: any = { ...v };
  if (include?.product) {
    const prod = mem.products.find((p) => p.id === v.productId);
    res.product = prod ? attachProduct(prod, include.product.include, include.product.select) : null;
  }
  if (include?._count) {
    res._count = {
      inventoryLogs: mem.inventoryLogs.filter((l) => l.variantId === v.id).length,
      orderItems: mem.orderItems.filter((o) => o.variantId === v.id).length,
      cartItems: mem.cartItems.filter((c) => c.variantId === v.id).length,
    };
  }
  if (include?.inventoryLogs) {
    let logs = mem.inventoryLogs.filter((l) => l.variantId === v.id);
    if (include.inventoryLogs.orderBy) logs = sortResults(logs, include.inventoryLogs.orderBy);
    if (include.inventoryLogs.take) logs = logs.slice(0, include.inventoryLogs.take);
    res.inventoryLogs = logs;
  }
  return applySelect(res, select);
}

function attachOrder(o: Order, include?: any, select?: any) {
  if (!o) return null;
  const res: any = { ...o };
  if (include?.items) {
    let items = mem.orderItems.filter((i) => i.orderId === o.id);
    res.items = items.map((i) => {
      const itemRes: any = { ...i };
      if (include.items.include?.variant) {
        itemRes.variant = mem.productVariants.find((v) => v.id === i.variantId) || null;
      }
      return itemRes;
    });
  }
  if (include?.user) {
    res.user = mem.users.find((u) => u.id === o.userId) || null;
  }
  if (include?.payments) {
    let payments = mem.payments.filter((p) => p.orderId === o.id);
    if (include.payments.orderBy) payments = sortResults(payments, include.payments.orderBy);
    res.payments = payments;
  }
  if (include?.shippingMethod) {
    res.shippingMethod = mem.shippingMethods.find((s) => s.id === o.shippingMethodId) || null;
  }
  if (include?.coupon) {
    res.coupon = mem.coupons.find((c) => c.id === o.couponId) || null;
  }
  return applySelect(res, select);
}

function attachUser(user: User, include?: any, select?: any) {
  if (!user) return null;
  const res: any = {
    ...user,
    profile: mem.userProfiles.find((p) => p.userId === user.id) || null,
    addresses: mem.addresses.filter((a) => a.userId === user.id),
    orders: mem.orders.filter((o) => o.userId === user.id).map((o) => attachOrder(o)),
  };
  if (include?.profile) {
    res.profile = mem.userProfiles.find((p) => p.userId === user.id) || null;
  }
  if (include?.addresses) {
    res.addresses = mem.addresses.filter((a) => a.userId === user.id);
  }
  if (include?.orders) {
    res.orders = mem.orders
      .filter((o) => o.userId === user.id)
      .map((o) => attachOrder(o, include?.orders?.include));
  }
  return applySelect(res, select);
}

function createModelHandler<T extends { id: string }>(
  getTable: () => T[],
  setTable: (rows: T[]) => void,
  attachRelations: (item: T, include?: any, select?: any) => any
) {
  return {
    async findUnique(args: { where: any; include?: any; select?: any }) {
      const table = getTable();
      const item = table.find((row) => matchCondition(row, args.where));
      if (!item) return null;
      return attachRelations(item, args.include, args.select);
    },

    async findFirst(args: { where?: any; include?: any; select?: any; orderBy?: any }) {
      const table = getTable();
      let results = table.filter((row) => matchCondition(row, args?.where || {}));
      if (args?.orderBy) {
        results = sortResults(results, args.orderBy);
      }
      const item = results[0];
      if (!item) return null;
      return attachRelations(item, args?.include, args?.select);
    },

    async findMany(args?: {
      where?: any;
      include?: any;
      select?: any;
      orderBy?: any;
      skip?: number;
      take?: number;
      distinct?: string[];
    }) {
      const table = getTable();
      let results = table.filter((row) => matchCondition(row, args?.where || {}));

      if (args?.distinct && args.distinct.length > 0) {
        const seen = new Set();
        results = results.filter((row: any) => {
          const key = args.distinct!.map((field) => row[field]).join('|');
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      }

      if (args?.orderBy) {
        results = sortResults(results, args.orderBy);
      }

      const skip = args?.skip || 0;
      const take = args?.take;
      const paginated = take !== undefined ? results.slice(skip, skip + take) : results.slice(skip);

      return paginated.map((item) => attachRelations(item, args?.include, args?.select));
    },

    async create(args: { data: any; include?: any; select?: any }) {
      const table = getTable();
      const newId = args.data.id || `${Math.random().toString(36).slice(2)}_${Date.now()}`;
      const now = new Date();

      const newItem = {
        isActive: args.data.isActive ?? true,
        ...args.data,
        id: newId,
        createdAt: args.data.createdAt || now,
        updatedAt: args.data.updatedAt || now,
      };

      if (args.data.images?.create) {
        for (const img of args.data.images.create) {
          mem.productImages.push({
            id: `img_${Math.random().toString(36).slice(2)}`,
            productId: newId,
            url: img.url,
            altText: img.altText || null,
            displayOrder: img.displayOrder || 0,
            createdAt: now,
          });
        }
        delete newItem.images;
      }

      if (args.data.variants?.create) {
        for (const v of args.data.variants.create) {
          mem.productVariants.push({
            id: `var_${Math.random().toString(36).slice(2)}`,
            productId: newId,
            sku: v.sku,
            title: v.title,
            size: v.size || null,
            color: v.color || null,
            priceOverride: v.priceOverride || null,
            inventoryCount: v.inventoryCount || 0,
            isAvailable: v.isAvailable ?? (v.inventoryCount > 0),
            createdAt: now,
            updatedAt: now,
          });
        }
        delete newItem.variants;
      }

      table.push(newItem);
      return attachRelations(newItem, args.include, args.select);
    },

    async createMany(args: { data: any[] }) {
      const table = getTable();
      const now = new Date();
      for (const d of args.data) {
        table.push({
          ...d,
          id: d.id || `${Math.random().toString(36).slice(2)}_${Date.now()}`,
          createdAt: d.createdAt || now,
          updatedAt: d.updatedAt || now,
        });
      }
      return { count: args.data.length };
    },

    async update(args: { where: any; data: any; include?: any; select?: any }) {
      const table = getTable();
      const idx = table.findIndex((row) => matchCondition(row, args.where));
      if (idx === -1) throw new Error('Record not found for update.');

      const current = table[idx];
      const updated = {
        ...current,
        ...args.data,
        updatedAt: new Date(),
      };
      table[idx] = updated;
      return attachRelations(updated, args.include, args.select);
    },

    async updateMany(args: { where: any; data: any }) {
      const table = getTable();
      let count = 0;
      for (let i = 0; i < table.length; i++) {
        if (matchCondition(table[i], args.where)) {
          table[i] = { ...table[i], ...args.data, updatedAt: new Date() };
          count++;
        }
      }
      return { count };
    },

    async upsert(args: { where: any; update: any; create: any; include?: any }) {
      const table = getTable();
      const existing = table.find((row) => matchCondition(row, args.where));
      if (existing) {
        return this.update({ where: args.where, data: args.update, include: args.include });
      }
      return this.create({ data: args.create, include: args.include });
    },

    async delete(args: { where: any }) {
      const table = getTable();
      const idx = table.findIndex((row) => matchCondition(row, args.where));
      if (idx === -1) throw new Error('Record not found for delete.');
      const deleted = table[idx];
      table.splice(idx, 1);
      return deleted;
    },

    async deleteMany(args?: { where?: any }) {
      const table = getTable();
      const initialLen = table.length;
      const remaining = table.filter((row) => !matchCondition(row, args?.where || {}));
      setTable(remaining);
      return { count: initialLen - remaining.length };
    },

    async count(args?: { where?: any }) {
      const table = getTable();
      return table.filter((row) => matchCondition(row, args?.where || {})).length;
    },
  };
}

const userHandler = createModelHandler(
  () => mem.users,
  (rows) => (mem.users = rows),
  attachUser
);

const userProfileHandler = createModelHandler(
  () => mem.userProfiles,
  (rows) => (mem.userProfiles = rows),
  (p) => p
);

const categoryHandler = createModelHandler(
  () => mem.categories,
  (rows) => (mem.categories = rows),
  (cat, include, select) => {
    const res: any = { ...cat };
    if (include?._count?.select?.products) {
      const where = include._count.select.products.where || {};
      const prods = mem.products.filter((p) => p.categoryId === cat.id && matchCondition(p, where));
      res._count = { products: prods.length };
    }
    return applySelect(res, select);
  }
);

const productHandler = createModelHandler(
  () => mem.products,
  (rows) => (mem.products = rows),
  attachProduct
);

const variantHandler = {
  ...createModelHandler(
    () => mem.productVariants,
    (rows) => (mem.productVariants = rows),
    attachVariant
  ),
  attach: attachVariant,
};

const orderHandler = {
  ...createModelHandler(
    () => mem.orders,
    (rows) => (mem.orders = rows),
    attachOrder
  ),
  attach: attachOrder,
};

const couponHandler = createModelHandler(
  () => mem.coupons,
  (rows) => (mem.coupons = rows),
  (c, include, select) => {
    const res: any = { ...c };
    if (include?._count?.select?.orders) {
      res._count = { orders: mem.orders.filter((o) => o.couponId === c.id).length };
    }
    return applySelect(res, select);
  }
);

const cartHandler = createModelHandler(
  () => mem.carts,
  (rows) => (mem.carts = rows),
  (c, include, select) => {
    const res: any = { ...c };
    if (include?.items) {
      const items = mem.cartItems.filter((i) => i.cartId === c.id);
      res.items = items.map((i) => {
        const itemRes: any = { ...i };
        if (include.items.include?.variant) {
          const varObj = mem.productVariants.find((v) => v.id === i.variantId);
          itemRes.variant = varObj
            ? attachVariant(varObj, include.items.include.variant.include, include.items.include.variant.select)
            : null;
        }
        return itemRes;
      });
    }
    return applySelect(res, select);
  }
);

const cartItemHandler = createModelHandler(
  () => mem.cartItems,
  (rows) => (mem.cartItems = rows),
  (i, include, select) => {
    const res: any = { ...i };
    if (include?.variant) {
      const varObj = mem.productVariants.find((v) => v.id === i.variantId);
      res.variant = varObj
        ? attachVariant(varObj, include.variant.include, include.variant.select)
        : null;
    }
    return applySelect(res, select);
  }
);

const wishlistHandler = createModelHandler(
  () => mem.wishlists,
  (rows) => (mem.wishlists = rows),
  (w, include, select) => {
    const res: any = { ...w };
    let items = mem.wishlistItems.filter((i) => i.wishlistId === w.id);
    if (include?.items) {
      res.items = items.map((i) => {
        const itemRes: any = { ...i };
        if (include.items.include?.product) {
          const prod = mem.products.find((p) => p.id === i.productId);
          itemRes.product = prod ? attachProduct(prod, include.items.include.product.include, include.items.include.product.select) : null;
        }
        return itemRes;
      });
    } else {
      res.items = items;
    }
    return applySelect(res, select);
  }
);

export const db = {
  user: userHandler,
  userProfile: userProfileHandler,
  customerProfile: userProfileHandler,
  address: createModelHandler(() => mem.addresses, (rows) => (mem.addresses = rows), (a) => a),
  session: createModelHandler(() => mem.sessions, (rows) => (mem.sessions = rows), (s) => s),
  passwordResetToken: createModelHandler(() => mem.passwordResetTokens, (rows) => (mem.passwordResetTokens = rows), (t) => t),
  category: categoryHandler,
  product: productHandler,
  productVariant: variantHandler,
  productImage: createModelHandler(() => mem.productImages, (rows) => (mem.productImages = rows), (i) => i),
  inventoryLog: createModelHandler(
    () => mem.inventoryLogs,
    (rows) => (mem.inventoryLogs = rows),
    (l, include) => {
      const res: any = { ...l };
      if (include?.variant) {
        const varObj = mem.productVariants.find((v) => v.id === l.variantId);
        res.variant = varObj ? attachVariant(varObj) : null;
      }
      return res;
    }
  ),
  order: orderHandler,
  orderItem: createModelHandler(() => mem.orderItems, (rows) => (mem.orderItems = rows), (i) => i),
  payment: createModelHandler(() => mem.payments, (rows) => (mem.payments = rows), (p) => p),
  coupon: couponHandler,
  storeSetting: createModelHandler(() => mem.storeSettings, (rows) => (mem.storeSettings = rows), (s) => s),
  shippingMethod: createModelHandler(() => mem.shippingMethods, (rows) => (mem.shippingMethods = rows), (s) => s),
  auditLog: createModelHandler(
    () => mem.auditLogs,
    (rows) => (mem.auditLogs = rows),
    (l, include) => {
      const res: any = { ...l };
      if (include?.actor) {
        res.actor = mem.users.find((u) => u.id === l.actorId) || null;
      }
      return res;
    }
  ),
  cart: cartHandler,
  cartItem: cartItemHandler,
  wishlist: wishlistHandler,
  wishlistItem: createModelHandler(
    () => mem.wishlistItems,
    (rows) => (mem.wishlistItems = rows),
    (w, include) => {
      const res: any = { ...w };
      if (include?.product) {
        const prod = mem.products.find((p) => p.id === w.productId);
        res.product = prod ? attachProduct(prod) : null;
      }
      return res;
    }
  ),
  review: createModelHandler(() => mem.reviews, (rows) => (mem.reviews = rows), (r) => r),

  async $transaction<T>(fn: (tx: typeof db) => Promise<T>): Promise<T> {
    return fn(db);
  },

  async $disconnect() {
    return Promise.resolve();
  },
};
