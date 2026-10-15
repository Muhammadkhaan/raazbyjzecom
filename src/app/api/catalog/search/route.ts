import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');

    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    const cleanQuery = query.trim().slice(0, 100);

    const matches = await db.product.findMany({
      where: {
        status: 'PUBLISHED', // Strictly exclude unpublished or archived items
        OR: [
          { title: { contains: cleanQuery } },
          { description: { contains: cleanQuery } },
          { category: { name: { contains: cleanQuery } } },
        ],
      },
      take: 6,
      select: {
        id: true,
        title: true,
        slug: true,
        regularPrice: true,
        salePrice: true,
        category: {
          select: { name: true },
        },
      },
      orderBy: { isFeatured: 'desc' },
    });

    const suggestions = matches.map((m) => ({
      id: m.id,
      title: m.title,
      slug: m.slug,
      categoryName: m.category.name,
      regularPrice: m.regularPrice,
      salePrice: m.salePrice,
    }));

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Search API failure:', error);
    return NextResponse.json({ suggestions: [] }, { status: 500 });
  }
}
