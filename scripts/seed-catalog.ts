import dotenv from 'dotenv';
dotenv.config();

import { db } from '../src/lib/db';

async function seed() {
  console.log('Seeding comprehensive fashion catalog for Laam Storefront...');

  // 1. Categories
  const categoriesData = [
    {
      name: 'Pret Ready-to-Wear',
      slug: 'pret',
      description: 'Stitched contemporary kurtas, coordinates, and 2-piece ensembles tailored for every occasion.',
      imageUrl: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=800&auto=format&fit=crop',
      sortOrder: 1,
    },
    {
      name: 'Unstitched Luxury',
      slug: 'unstitched',
      description: 'Finest 3-piece embroidered lawn, organza, and jacquard fabrics for custom tailoring.',
      imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=800&auto=format&fit=crop',
      sortOrder: 2,
    },
    {
      name: 'Luxury Festive',
      slug: 'festive',
      description: 'Opulent wedding and evening wear embellished with dabka, gota patti, and zari work.',
      imageUrl: 'https://images.unsplash.com/photo-1596783074918-c84cb06531ca?q=80&w=800&auto=format&fit=crop',
      sortOrder: 3,
    },
    {
      name: 'Formal Couture',
      slug: 'formal',
      description: 'Handcrafted bridal and formal heirlooms made with pure silk and artisanal hand-embroidery.',
      imageUrl: 'https://images.unsplash.com/photo-1518049362265-d5b2a6467637?q=80&w=800&auto=format&fit=crop',
      sortOrder: 4,
    },
    {
      name: 'Accessories & Shawls',
      slug: 'accessories',
      description: 'Pure pashmina shawls, embroidered clutches, and traditional footwear.',
      imageUrl: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?q=80&w=800&auto=format&fit=crop',
      sortOrder: 5,
    },
  ];

  const categoryMap = new Map<string, string>();

  for (const cat of categoriesData) {
    const created = await db.category.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        description: cat.description,
        imageUrl: cat.imageUrl,
        sortOrder: cat.sortOrder,
        isActive: true,
      },
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        imageUrl: cat.imageUrl,
        sortOrder: cat.sortOrder,
        isActive: true,
      },
    });
    categoryMap.set(cat.slug, created.id);
  }

  // 2. Products with Images, Variants, and Reviews
  const productsData = [
    {
      title: 'Zari Embroidered Raw Silk Ensemble',
      slug: 'zari-embroidered-raw-silk-ensemble',
      description: 'A regal silhouette crafted in pure raw silk featuring fine tilla and antique gold zari hand-embroidery along the neckline, sleeves, and hemline. Paired with tonal cigarette trousers and a lightweight crushed organza dupatta with scalloped borders.',
      details: 'Fabric: 100% Pure Raw Silk\nDupatta: Crushed Silk Organza\nTrousers: Silk Blend\nCare: Professional Dry Clean Only\nIncludes: Stitched Shirt, Trousers, Dupatta',
      categorySlug: 'pret',
      regularPrice: 22000,
      salePrice: 16500,
      status: 'PUBLISHED',
      isFeatured: true,
      images: [
        { url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=800&auto=format&fit=crop', altText: 'Zari Embroidered Raw Silk Ensemble front view', displayOrder: 0 },
        { url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=800&auto=format&fit=crop', altText: 'Embroidery close-up detail', displayOrder: 1 },
      ],
      variants: [
        { sku: 'ZSE-CRIMSON-S', title: 'Crimson / Small', size: 'Small', color: 'Crimson', inventoryCount: 12, isAvailable: true },
        { sku: 'ZSE-CRIMSON-M', title: 'Crimson / Medium', size: 'Medium', color: 'Crimson', inventoryCount: 18, isAvailable: true },
        { sku: 'ZSE-CRIMSON-L', title: 'Crimson / Large', size: 'Large', color: 'Crimson', inventoryCount: 6, isAvailable: true },
        { sku: 'ZSE-CRIMSON-XL', title: 'Crimson / XL', size: 'XL', color: 'Crimson', inventoryCount: 0, isAvailable: false },
        { sku: 'ZSE-EMERALD-M', title: 'Emerald / Medium', size: 'Medium', color: 'Emerald Green', inventoryCount: 10, isAvailable: true },
      ],
      reviews: [
        { rating: 5, reviewText: 'The zari stitching is remarkably precise and the fabric has a rich, soft drape. Arrived neatly packaged.', isVerifiedPurchase: true, isApproved: true },
        { rating: 5, reviewText: 'True to size and color is exactly as pictured. Beautiful festive attire.', isVerifiedPurchase: true, isApproved: true },
      ],
    },
    {
      title: 'Pastel Organza Festive Kurta Set',
      slug: 'pastel-organza-festive-kurta-set',
      description: 'Luminous powder-blue Korean organza layered over tonal butter-crepe lining, accented with delicate gota patti rosettes and pearl tassels. Finished with matching culottes and an embroidered net dupatta.',
      details: 'Fabric: Korean Organza\nInner: Butter Crepe\nBottoms: Raw Silk Culottes\nCare: Dry clean recommended',
      categorySlug: 'festive',
      regularPrice: 28500,
      salePrice: 22800,
      status: 'PUBLISHED',
      isFeatured: true,
      images: [
        { url: 'https://images.unsplash.com/photo-1596783074918-c84cb06531ca?q=80&w=800&auto=format&fit=crop', altText: 'Pastel Organza Festive Kurta Set model photo', displayOrder: 0 },
        { url: 'https://images.unsplash.com/photo-1518049362265-d5b2a6467637?q=80&w=800&auto=format&fit=crop', altText: 'Back embroidery and border detail', displayOrder: 1 },
      ],
      variants: [
        { sku: 'POF-BLUE-XS', title: 'Powder Blue / XS', size: 'XS', color: 'Powder Blue', inventoryCount: 5, isAvailable: true },
        { sku: 'POF-BLUE-S', title: 'Powder Blue / Small', size: 'Small', color: 'Powder Blue', inventoryCount: 14, isAvailable: true },
        { sku: 'POF-BLUE-M', title: 'Powder Blue / Medium', size: 'Medium', color: 'Powder Blue', inventoryCount: 11, isAvailable: true },
        { sku: 'POF-BLUE-L', title: 'Powder Blue / Large', size: 'Large', color: 'Powder Blue', inventoryCount: 4, isAvailable: true },
      ],
      reviews: [
        { rating: 4, reviewText: 'Loved the pastel hue and shimmer. The culottes fit comfortably.', isVerifiedPurchase: true, isApproved: true },
      ],
    },
    {
      title: 'Embroidered Floral Swiss Lawn 3-Piece',
      slug: 'embroidered-floral-swiss-lawn-3-piece',
      description: 'Premium 80s combed Swiss lawn unstitched 3-piece featuring computerized cross-stitch neckline applique, printed chiffon dupatta, and dyed mercerized cotton cambric trousers.',
      details: 'Shirt: 3.0 Meters Swiss Lawn\nDupatta: 2.5 Meters Pure Chiffon\nTrousers: 2.5 Meters Dyed Cambric\nIncludes Embroidered Neckline & Organza Border Applique',
      categorySlug: 'unstitched',
      regularPrice: 11500,
      salePrice: 8900,
      status: 'PUBLISHED',
      isFeatured: false,
      images: [
        { url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=800&auto=format&fit=crop', altText: 'Embroidered Floral Swiss Lawn fabric flat-lay', displayOrder: 0 },
      ],
      variants: [
        { sku: 'EFL-MINT-UNSTITCHED', title: 'Sage Mint / Unstitched', size: 'Unstitched', color: 'Sage Mint', inventoryCount: 30, isAvailable: true },
        { sku: 'EFL-BLUSH-UNSTITCHED', title: 'Soft Blush / Unstitched', size: 'Unstitched', color: 'Soft Blush', inventoryCount: 22, isAvailable: true },
      ],
      reviews: [
        { rating: 5, reviewText: 'Very soft lawn fabric with vibrant floral motifs. Chiffon dupatta is feather-light.', isVerifiedPurchase: true, isApproved: true },
      ],
    },
    {
      title: 'Heavy Hand-Embellished Velvet Peshwas',
      slug: 'heavy-hand-embellished-velvet-peshwas',
      description: 'An architectural 16-kali peshwas cut from micro-velvet, lavished with silver kora dabka, nakshi, and micro-sequins. Complimented by a brocade farshi sharara and heavily scalloped tulle veil.',
      details: 'Fabric: Pure Micro-Velvet 9000\nSharara: Jamawar Brocade\nVeil: French Tulle with 4-sided borders\nTechnique: Adda Handwork (Dabka, Zardozi, Pearls)\nProduction: Handcrafted in Lahore',
      categorySlug: 'formal',
      regularPrice: 85000,
      salePrice: null, // Full price luxury item
      status: 'PUBLISHED',
      isFeatured: true,
      images: [
        { url: 'https://images.unsplash.com/photo-1518049362265-d5b2a6467637?q=80&w=800&auto=format&fit=crop', altText: 'Heavy Velvet Peshwas bridal collection photo', displayOrder: 0 },
        { url: 'https://images.unsplash.com/photo-1596783074918-c84cb06531ca?q=80&w=800&auto=format&fit=crop', altText: 'Artisanal adda handwork detail', displayOrder: 1 },
      ],
      variants: [
        { sku: 'HVP-MAROON-S', title: 'Deep Maroon / Small', size: 'Small', color: 'Deep Maroon', inventoryCount: 2, isAvailable: true },
        { sku: 'HVP-MAROON-M', title: 'Deep Maroon / Medium', size: 'Medium', color: 'Deep Maroon', inventoryCount: 3, isAvailable: true },
        { sku: 'HVP-MAROON-L', title: 'Deep Maroon / Large', size: 'Large', color: 'Deep Maroon', inventoryCount: 1, isAvailable: true },
      ],
      reviews: [],
    },
    {
      title: 'Kashmiri Handwoven Pashmina Shawl',
      slug: 'kashmiri-handwoven-pashmina-shawl',
      description: 'Authentic 100% pure Himalayan Cashmere pashmina with intricate Sozni needlepoint embroidery adorning the borders. Ultra-soft, warm, and heirloom grade.',
      details: 'Composition: 100% Pure Cashmere Pashmina\nCraft: Hand-spun on Charkha, Handwoven on traditional loom\nDimensions: 100 cm x 200 cm\nOrigin: Kashmir Valley',
      categorySlug: 'accessories',
      regularPrice: 35000,
      salePrice: 29500,
      status: 'PUBLISHED',
      isFeatured: false,
      images: [
        { url: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?q=80&w=800&auto=format&fit=crop', altText: 'Kashmiri Handwoven Pashmina Shawl folded display', displayOrder: 0 },
      ],
      variants: [
        { sku: 'KPS-IVORY-STD', title: 'Ivory / One Size', size: 'One Size', color: 'Ivory', inventoryCount: 7, isAvailable: true },
        { sku: 'KPS-BLACK-STD', title: 'Onyx Black / One Size', size: 'One Size', color: 'Onyx Black', inventoryCount: 4, isAvailable: true },
      ],
      reviews: [
        { rating: 5, reviewText: 'Exquisite weave, unimaginably light yet deeply warm. Worth every rupee.', isVerifiedPurchase: true, isApproved: true },
      ],
    },
    {
      title: 'Chanderi Silk Block-Printed Co-ord Set',
      slug: 'chanderi-silk-block-printed-co-ord-set',
      description: 'Breezy straight-cut tunic and tapered pants featuring artisanal mud-resist block prints on pure Chanderi silk. Features mother-of-pearl buttons and discreet side pockets.',
      details: 'Fabric: Handwoven Chanderi Silk\nPants: Chanderi with cotton lining\nButtons: Natural Mother of Pearl\nCare: Gentle hand wash or dry clean',
      categorySlug: 'pret',
      regularPrice: 14500,
      salePrice: 12000,
      status: 'PUBLISHED',
      isFeatured: false,
      images: [
        { url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=800&auto=format&fit=crop', altText: 'Chanderi Silk Block-Printed Co-ord Set', displayOrder: 0 },
      ],
      variants: [
        { sku: 'CSB-TEAL-S', title: 'Teal / Small', size: 'Small', color: 'Teal', inventoryCount: 9, isAvailable: true },
        { sku: 'CSB-TEAL-M', title: 'Teal / Medium', size: 'Medium', color: 'Teal', inventoryCount: 15, isAvailable: true },
        { sku: 'CSB-TEAL-L', title: 'Teal / Large', size: 'Large', color: 'Teal', inventoryCount: 0, isAvailable: false },
      ],
      reviews: [],
    },
    {
      title: 'Archived Studio Prototype (Unpublished)',
      slug: 'archived-studio-prototype',
      description: 'Experimental sample piece not approved for retail catalog.',
      details: 'Prototype only.',
      categorySlug: 'pret',
      regularPrice: 99999,
      salePrice: null,
      status: 'DRAFT', // MUST NOT APPEAR IN PUBLIC STOREFRONT
      isFeatured: false,
      images: [],
      variants: [
        { sku: 'PROTO-DRAFT-01', title: 'Sample', size: 'M', color: 'Grey', inventoryCount: 1, isAvailable: false },
      ],
      reviews: [],
    },
  ];

  // Get a customer user for reviews
  let reviewerUser = await db.user.findFirst({ where: { role: 'CUSTOMER' } });
  if (!reviewerUser) {
    reviewerUser = await db.user.findFirst();
  }

  for (const prod of productsData) {
    const categoryId = categoryMap.get(prod.categorySlug);
    if (!categoryId) continue;

    const product = await db.product.upsert({
      where: { slug: prod.slug },
      update: {
        title: prod.title,
        description: prod.description,
        details: prod.details,
        categoryId,
        regularPrice: prod.regularPrice,
        salePrice: prod.salePrice,
        status: prod.status,
        isFeatured: prod.isFeatured,
      },
      create: {
        title: prod.title,
        slug: prod.slug,
        description: prod.description,
        details: prod.details,
        categoryId,
        regularPrice: prod.regularPrice,
        salePrice: prod.salePrice,
        status: prod.status,
        isFeatured: prod.isFeatured,
      },
    });

    // Delete existing images & variants for clean seed sync
    await db.productImage.deleteMany({ where: { productId: product.id } });
    await db.productVariant.deleteMany({ where: { productId: product.id } });

    // Seed images
    for (const img of prod.images) {
      await db.productImage.create({
        data: {
          productId: product.id,
          url: img.url,
          altText: img.altText,
          displayOrder: img.displayOrder,
        },
      });
    }

    // Seed variants
    for (const v of prod.variants) {
      await db.productVariant.create({
        data: {
          productId: product.id,
          sku: v.sku,
          title: v.title,
          size: v.size,
          color: v.color,
          inventoryCount: v.inventoryCount,
          isAvailable: v.isAvailable,
        },
      });
    }

    // Seed reviews
    if (reviewerUser && prod.reviews.length > 0) {
      await db.review.deleteMany({ where: { productId: product.id } });
      for (const r of prod.reviews) {
        await db.review.create({
          data: {
            productId: product.id,
            userId: reviewerUser.id,
            rating: r.rating,
            reviewText: r.reviewText,
            isVerifiedPurchase: r.isVerifiedPurchase,
            isApproved: r.isApproved,
          },
        });
      }
    }
  }

  console.log('Seeding completed successfully with real categories, products, images, variants, and reviews.');
}

seed()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
