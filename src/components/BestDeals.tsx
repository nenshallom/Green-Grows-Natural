'use client';
import { useState, useMemo, useRef, useEffect } from 'react';
import { Product } from '@/types';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import QuickAddModal from '@/components/QuickAddModal';
import ProductCard from '@/components/ProductCard';

interface BestDealsProps {
  products: Product[];
}

const BATCH_SIZE = 12;

export default function BestDeals({ products }: BestDealsProps) {
  const [activeTab, setActiveTab] = useState<string>('Best Deals');
  const [visibleCount, setVisibleCount] = useState<number>(BATCH_SIZE);

  // Quick Add Modal State
  const [modalProduct, setModalProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // 1. UNIFIED CATEGORIES: "Best Deals" always first, followed by all unique categories
  const categories = useMemo(() => {
    const uniqueCats = Array.from(
      new Set(
        products
          .map((p) => p.category?.trim())
          .filter((cat): cat is string => Boolean(cat))
      )
    );
    return ['Best Deals', ...uniqueCats];
  }, [products]);

  // 2. DISCOUNT CHECKER HELPER
  const isDiscounted = (p: Product) =>
    Boolean(p.original_price && p.original_price > p.price_per_unit);

  // 3. FILTER & RESHUFFLE LOGIC:
  // - "Best Deals": includes all products, with discounted items sorted first
  // - Category pill: includes that category's products, with discounted items within it sorted first
  const sortedAndFilteredProducts = useMemo(() => {
    let items = products;
    if (activeTab !== 'Best Deals') {
      items = products.filter(
        (p) => p.category?.trim().toLowerCase() === activeTab.trim().toLowerCase()
      );
    }

    return [...items].sort((a, b) => {
      const aDisc = isDiscounted(a);
      const bDisc = isDiscounted(b);
      if (aDisc && !bDisc) return -1;
      if (!aDisc && bDisc) return 1;
      return 0;
    });
  }, [products, activeTab]);

  // 4. UNENDING SCROLL SLICE
  const visibleProducts = useMemo(() => {
    return sortedAndFilteredProducts.slice(0, visibleCount);
  }, [sortedAndFilteredProducts, visibleCount]);

  // 5. OBSERVER FOR INFINITE STREAMING
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + BATCH_SIZE, sortedAndFilteredProducts.length));
        }
      },
      { rootMargin: '300px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [sortedAndFilteredProducts.length]);

  // 6. PILL CHANGE: Instant in-page reshuffle & reset visible count
  const handleTabChange = (category: string) => {
    setActiveTab(category);
    setVisibleCount(BATCH_SIZE);
  };

  // 7. HORIZONTAL SCROLL CONTROLS
  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 260;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  // 8. OPEN MODAL FOR PRODUCT
  const handleOpenQuickAdd = (product: Product) => {
    setModalProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseQuickAdd = () => {
    setIsModalOpen(false);
    setModalProduct(null);
  };

  return (
    <section className="w-full mb-12">
      {/* =========================================================
          UNIFIED CATEGORY PILLS BAR (No duplicate headers)
      ========================================================= */}
      <div className="flex items-center justify-between gap-4 mb-6">
        {/* HORIZONTALLY SCROLLABLE PILL ROW */}
        <div
          ref={scrollContainerRef}
          className="flex items-center gap-2.5 overflow-x-auto pb-2 scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden w-full"
        >
          {categories.map((cat) => {
            const isSelected = activeTab === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => handleTabChange(cat)}
                className={`flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-xs active:scale-95 whitespace-nowrap border ${
                  isSelected
                    ? 'bg-[#1A4331] text-white border-[#1A4331] shadow-sm'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-[#1A4331] hover:text-[#1A4331] hover:bg-[#1A4331]/5'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* DESKTOP ARROW BUTTONS */}
        <div className="hidden md:flex items-center gap-1.5 flex-shrink-0">
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

      {/* =========================================================
          PRODUCT GRID (DYNAMIC RESHUFFLE & UNENDING SCROLL)
      ========================================================= */}
      {visibleProducts.length === 0 ? (
        <div className="py-16 text-center text-gray-500 font-medium bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          No products found in this category.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {visibleProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onQuickAdd={handleOpenQuickAdd}
            />
          ))}
        </div>
      )}

      {/* =========================================================
          UNENDING SCROLL SENTINEL & PROGRESSIVE LOADER
      ========================================================= */}
      {visibleCount < sortedAndFilteredProducts.length && (
        <div ref={sentinelRef} className="py-8 flex justify-center items-center w-full">
          <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#1A4331] border-t-transparent" />
            <span>Loading more fresh products...</span>
          </div>
        </div>
      )}

      {/* END OF CATALOG INDICATOR */}
      {visibleCount >= sortedAndFilteredProducts.length && sortedAndFilteredProducts.length > 0 && (
        <div className="mt-8 text-center text-xs text-gray-400 font-medium">
          Showing all {sortedAndFilteredProducts.length} items
        </div>
      )}

      {/* =========================================================
          TEMU-STYLE QUICK ADD MODAL (POPUP ON CART CLICK)
      ========================================================= */}
      <QuickAddModal
        product={modalProduct}
        isOpen={isModalOpen}
        onClose={handleCloseQuickAdd}
      />
    </section>
  );
}
