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
    <section className="w-full mb-6">
      {/* SECTION HEADER WITH OPTIONAL ARROW CONTROLS */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl md:text-2xl font-black text-[#1A4331] tracking-tight">
          Shop by Categories
        </h2>

        {/* Desktop Arrow Controls */}
        <div className="hidden md:flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleScroll('left')}
            aria-label="Scroll categories left"
            className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:border-[#1A4331] hover:text-[#1A4331] hover:bg-gray-50 transition-colors shadow-xs"
          >
            <FiChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleScroll('right')}
            aria-label="Scroll categories right"
            className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:border-[#1A4331] hover:text-[#1A4331] hover:bg-gray-50 transition-colors shadow-xs"
          >
            <FiChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* HORIZONTAL SCROLLABLE ROW OF BORDERED PILLS */}
      <div
        ref={scrollContainerRef}
        className="flex items-center gap-2.5 overflow-x-auto pb-2 scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {/* "All Categories" Default Pill */}
        <Link
          href="/products"
          className="flex-shrink-0 px-5 py-2.5 rounded-full border border-gray-300 bg-white text-sm font-bold text-gray-700 hover:border-[#1A4331] hover:text-[#1A4331] hover:bg-[#1A4331]/5 transition-all shadow-sm active:scale-95 whitespace-nowrap"
        >
          All Categories
        </Link>

        {/* All Active Categories */}
        {activeCategories.map((categoryName, index) => (
          <Link
            key={index}
            href={`/products?category=${encodeURIComponent(categoryName)}`}
            className="flex-shrink-0 px-5 py-2.5 rounded-full border border-gray-200 bg-white text-sm font-bold text-gray-700 hover:border-[#1A4331] hover:text-[#1A4331] hover:bg-[#1A4331]/5 transition-all shadow-sm active:scale-95 whitespace-nowrap"
          >
            {categoryName}
          </Link>
        ))}
      </div>
    </section>
  );
}
