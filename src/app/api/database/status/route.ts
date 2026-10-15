import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const [userCount, productCount, categoryCount, orderCount] = await Promise.all([
      db.user.count().catch(() => 0),
      db.product.count().catch(() => 0),
      db.category.count().catch(() => 0),
      db.order.count().catch(() => 0),
    ]);

    return NextResponse.json({
      status: 'ONLINE',
      database: {
        provider: 'MySQL / MariaDB (Hostinger Web App)',
        connected: true,
        counts: {
          users: userCount,
          products: productCount,
          categories: categoryCount,
          orders: orderCount,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Database connection test failed:', error);
    return NextResponse.json(
      {
        status: 'DEGRADED',
        error: error.message || 'Database connection test failed',
      },
      { status: 500 }
    );
  }
}
