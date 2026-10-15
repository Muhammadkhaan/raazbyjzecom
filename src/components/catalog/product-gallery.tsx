'use client';

import * as React from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ProductGalleryProps {
  title: string;
  images: { id: string; url: string; altText: string }[];
}

export function ProductGallery({ title, images }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="aspect-[3/4] w-full rounded-2xl bg-neutral-100 flex items-center justify-center border border-[#E5E5E5] text-[#737373] text-sm">
        No Images Available
      </div>
    );
  }

  const currentImage = images[selectedIndex] || images[0];

  const handlePrev = () => {
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="flex flex-col-reverse lg:flex-row gap-4 w-full">
      {/* Thumbnails Rail */}
      {images.length > 1 && (
        <div className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-y-auto pb-2 lg:pb-0 shrink-0">
          {images.map((img, idx) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setSelectedIndex(idx)}
              aria-label={`View image ${idx + 1} of ${images.length}`}
              className={cn(
                'relative w-16 h-20 sm:w-20 sm:h-24 rounded-lg overflow-hidden border-2 shrink-0 transition-all focus-visible:outline-2 focus-visible:outline-[#087443]',
                selectedIndex === idx ? 'border-[#087443] ring-1 ring-[#087443]' : 'border-[#E5E5E5] hover:border-[#141414]'
              )}
            >
              <Image
                src={img.url}
                alt={img.altText || `${title} thumbnail ${idx + 1}`}
                fill
                sizes="80px"
                className="object-cover object-center"
                referrerPolicy="no-referrer"
              />
            </button>
          ))}
        </div>
      )}

      {/* Main Large Image Display */}
      <div className="relative flex-1 aspect-[3/4] w-full rounded-2xl bg-neutral-100 overflow-hidden border border-[#E5E5E5] shadow-xs">
        <Image
          src={currentImage.url}
          alt={currentImage.altText || title}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover object-center transition-all duration-300"
          referrerPolicy="no-referrer"
        />

        {/* Carousel Prev/Next Buttons (for multi-image products) */}
        {images.length > 1 && (
          <div className="absolute inset-x-3 top-1/2 -translate-y-1/2 flex items-center justify-between pointer-events-none">
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous image"
              className="pointer-events-auto p-2 rounded-full bg-white/80 hover:bg-white text-[#141414] shadow-md backdrop-blur-xs transition-colors focus-visible:outline-2 focus-visible:outline-[#087443]"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next image"
              className="pointer-events-auto p-2 rounded-full bg-white/80 hover:bg-white text-[#141414] shadow-md backdrop-blur-xs transition-colors focus-visible:outline-2 focus-visible:outline-[#087443]"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
