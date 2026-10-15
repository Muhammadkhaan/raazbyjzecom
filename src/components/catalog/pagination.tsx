'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
}

export function Pagination({ currentPage, totalPages }: PaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  const createPageUrl = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (pageNumber === 1) {
      params.delete('page');
    } else {
      params.set('page', pageNumber.toString());
    }
    return `${pathname}?${params.toString()}`;
  };

  // Generate pages to display
  const pages: (number | string)[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }

  return (
    <nav role="navigation" aria-label="Pagination Navigation" className="flex items-center justify-center gap-1.5 py-8">
      {/* Previous Page */}
      {currentPage > 1 ? (
        <Link
          href={createPageUrl(currentPage - 1)}
          aria-label="Go to previous page"
          className="inline-flex items-center justify-center h-9 px-3 rounded-lg border border-[#D6D6D6] text-xs font-medium text-[#141414] hover:bg-neutral-100 transition-colors focus-visible:outline-2 focus-visible:outline-[#087443]"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          <span>Previous</span>
        </Link>
      ) : (
        <span
          aria-disabled="true"
          className="inline-flex items-center justify-center h-9 px-3 rounded-lg border border-[#E5E5E5] text-xs font-medium text-[#737373] opacity-40 cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          <span>Previous</span>
        </span>
      )}

      {/* Numbered Pages */}
      <div className="flex items-center gap-1">
        {pages.map((p, idx) => {
          if (p === '...') {
            return (
              <span key={`ellipsis-${idx}`} className="px-2 text-xs text-[#737373]">
                …
              </span>
            );
          }

          const pageNum = Number(p);
          const isCurrent = pageNum === currentPage;

          return (
            <Link
              key={pageNum}
              href={createPageUrl(pageNum)}
              aria-label={`Page ${pageNum}`}
              aria-current={isCurrent ? 'page' : undefined}
              className={cn(
                'inline-flex items-center justify-center h-9 w-9 rounded-lg text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-[#087443]',
                isCurrent
                  ? 'bg-[#141414] text-white'
                  : 'bg-white border border-[#D6D6D6] text-[#141414] hover:bg-neutral-100'
              )}
            >
              {pageNum}
            </Link>
          );
        })}
      </div>

      {/* Next Page */}
      {currentPage < totalPages ? (
        <Link
          href={createPageUrl(currentPage + 1)}
          aria-label="Go to next page"
          className="inline-flex items-center justify-center h-9 px-3 rounded-lg border border-[#D6D6D6] text-xs font-medium text-[#141414] hover:bg-neutral-100 transition-colors focus-visible:outline-2 focus-visible:outline-[#087443]"
        >
          <span>Next</span>
          <ChevronRight className="w-4 h-4 ml-1" />
        </Link>
      ) : (
        <span
          aria-disabled="true"
          className="inline-flex items-center justify-center h-9 px-3 rounded-lg border border-[#E5E5E5] text-xs font-medium text-[#737373] opacity-40 cursor-not-allowed"
        >
          <span>Next</span>
          <ChevronRight className="w-4 h-4 ml-1" />
        </span>
      )}
    </nav>
  );
}
