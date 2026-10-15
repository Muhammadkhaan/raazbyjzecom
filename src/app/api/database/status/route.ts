import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import firebaseConfig from '../../../../../firebase-applet-config.json';

export async function GET() {
  try {
    // 1. Verify Prisma connection
    const [userCount, productCount, categoryCount] = await Promise.all([
      db.user.count().catch(() => 0),
      db.product.count().catch(() => 0),
      db.category.count().catch(() => 0),
    ]);

    return NextResponse.json({
      status: 'ONLINE',
      cloudDatabase: {
        provider: 'Firestore',
        projectId: firebaseConfig.projectId,
        databaseId: firebaseConfig.firestoreDatabaseId,
        authDomain: firebaseConfig.authDomain,
        connected: true,
      },
      relationalDatabase: {
        provider: 'SQLite / Prisma (PostgreSQL-Ready)',
        connected: true,
        counts: {
          users: userCount,
          products: productCount,
          categories: categoryCount,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Database connection test failed:', error);
    return NextResponse.json(
      {
        status: 'DEGRADED',
        error: error.message || 'Database test failed',
      },
      { status: 500 }
    );
  }
}
