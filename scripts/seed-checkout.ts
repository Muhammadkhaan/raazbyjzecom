import dotenv from 'dotenv';
dotenv.config();

import { db } from '../src/lib/db';

async function seedCheckout() {
  console.log('Seeding shipping methods, store settings, and coupons...');

  // 1. Shipping Methods
  const shippingMethods = [
    {
      name: 'Standard Nationwide Delivery',
      code: 'STANDARD',
      rate: 250,
      estimatedDays: '3-5 business days',
      isActive: true,
    },
    {
      name: 'Express Priority Courier',
      code: 'EXPRESS',
      rate: 650,
      estimatedDays: '1-2 business days',
      isActive: true,
    },
  ];

  for (const sm of shippingMethods) {
    await db.shippingMethod.upsert({
      where: { code: sm.code },
      update: { name: sm.name, rate: sm.rate, estimatedDays: sm.estimatedDays, isActive: sm.isActive },
      create: sm,
    });
  }

  // 2. Store Settings
  const settings = [
    { key: 'ENABLE_CASH_ON_DELIVERY', value: 'true', description: 'Enable Cash on Delivery payment option at checkout' },
    { key: 'FREE_SHIPPING_THRESHOLD', value: '10000', description: 'Subtotal in PKR to qualify for free standard shipping' },
    { key: 'ENABLE_STRIPE', value: 'false', description: 'Stripe gateway enabled status (requires STRIPE_SECRET_KEY in .env)' },
  ];

  for (const s of settings) {
    await db.storeSetting.upsert({
      where: { key: s.key },
      update: { value: s.value, description: s.description },
      create: s,
    });
  }

  // 3. Coupons
  const coupons = [
    {
      code: 'WELCOME10',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minOrderValue: 5000,
      maxUses: 500,
      isActive: true,
    },
    {
      code: 'LAAMFESTIVE',
      discountType: 'FIXED_AMOUNT',
      discountValue: 2000,
      minOrderValue: 15000,
      maxUses: 200,
      isActive: true,
    },
  ];

  for (const c of coupons) {
    await db.coupon.upsert({
      where: { code: c.code },
      update: {
        discountType: c.discountType,
        discountValue: c.discountValue,
        minOrderValue: c.minOrderValue,
        maxUses: c.maxUses,
        isActive: c.isActive,
      },
      create: c,
    });
  }

  console.log('Checkout seeding complete!');
}

seedCheckout()
  .catch((e) => {
    console.error('Seed checkout error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
