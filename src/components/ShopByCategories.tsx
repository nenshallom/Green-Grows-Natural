'use client';
import Link from 'next/link';
import { useRef } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

interface ShopByCategoriesProps {
  activeCategories: string[];
}

export default function ShopByCategories({ activeCategories }: ShopByCategoriesProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  if (!activeCategories || activeCategories.length === 0) return null;

  // Smooth scroll left/right for desktop users
  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollOffset = direction === 'left' ? -260 : 260;
      scrollContainerRef.current.scrollBy({ left: scrollOffset, behavior: 'smooth' });
    }
  };

  return (
    <section className="w-full my-12 md:my-16 font-sans">
      {/* SECTION HEADER WITH OPTIONAL ARROW CONTROLS */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl md:text-3xl font-medium text-[#0F3024] font-display tracking-[-0.5px]">
          Shop by Categories
        </h2>

        {/* Desktop Arrow Controls */}
        <div className="hidden md:flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleScroll('left')}
            aria-label="Scroll categories left"
            className="w-9 h-9 rounded-full border border-[#E2E8F0] flex items-center justify-center text-[#718096] hover:border-[#0F3024] hover:text-[#0F3024] hover:bg-white transition-colors shadow-2xs"
          >
            <FiChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleScroll('right')}
            aria-label="Scroll categories right"
            className="w-9 h-9 rounded-full border border-[#E2E8F0] flex items-center justify-center text-[#718096] hover:border-[#0F3024] hover:text-[#0F3024] hover:bg-white transition-colors shadow-2xs"
          >
            <FiChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* HORIZONTAL SCROLLABLE ROW OF STRICT APOTHECARY PILLS */}
      <div
        ref={scrollContainerRef}
        className="flex items-center gap-3 overflow-x-auto pb-2 scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {/* "All Categories" Default Pill */}
        <Link
          href="/products"
          className="flex-shrink-0 py-2 px-5 rounded-full border border-[#E2E8F0] bg-white text-xs font-bold font-display uppercase tracking-[1.5px] text-[#2D3748] hover:border-[#0F3024] hover:text-[#0F3024] transition-all shadow-2xs active:scale-95 whitespace-nowrap"
        >
          All Categories
        </Link>

        {/* All Active Categories */}
        {activeCategories.map((categoryName, index) => (
          <Link
            key={index}
            href={`/products?category=${encodeURIComponent(categoryName)}`}
            className="flex-shrink-0 py-2 px-5 rounded-full border border-[#E2E8F0] bg-white text-xs font-bold font-display uppercase tracking-[1.5px] text-[#2D3748] hover:border-[#0F3024] hover:text-[#0F3024] transition-all shadow-2xs active:scale-95 whitespace-nowrap"
          >
            {categoryName}
          </Link>
        ))}
      </div>
    </section>
  );
}
