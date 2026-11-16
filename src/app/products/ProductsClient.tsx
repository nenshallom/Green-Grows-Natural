'use client';
import { useEffect, useState, useMemo, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import Link from 'next/link';
import Image from 'next/image'; 
import { Product } from '@/types';
import { formatNaira } from '@/utils/format';
import { FEATURES } from '@/config/features';
import QuickAddModal from '@/components/QuickAddModal';
import ProductCard from '@/components/ProductCard';
import BulkProductCard from '@/components/BulkProductCard';
import { 
  FiChevronRight, 
  FiChevronDown, 
  FiChevronLeft,
  FiSliders, 
  FiX, 
  FiCheck, 
  FiRotateCcw, 
  FiTruck, 
  FiShield, 
  FiTag, 
  FiPackage,
  FiSearch
} from 'react-icons/fi';

interface ProductsClientProps {
  initialProducts: Product[];
}

type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'discount' | 'name-asc';
type PriceRange = 'all' | 'under-5000' | '5000-15000' | '15000-30000' | 'above-30000';

interface CategoryMeta {
  title: string;
  subtitle: string;
  badge: string;
}

const CATEGORY_META: Record<string, CategoryMeta> = {
  'Vegetables': {
    title: 'Fresh Vegetables & Greens',
    subtitle: 'Directly harvested farm vegetables, sweet peppers, tomatoes, and organic greens from certified local growers.',
    badge: 'Harvested Daily',
  },
  'Tubers': {
    title: 'Tubers & Root Harvest',
    subtitle: 'Farm-fresh yams, cassava roots, sweet potatoes, and organic tubers selected for supreme meal quality.',
    badge: 'Direct Farm Harvest',
  },
  'Grains': {
    title: 'Nuts, Grains & Legumes',
    subtitle: 'High-grade farm grains, stone-free local rice, nutritious beans, maize, and healthy protein staples.',
    badge: 'Purity Inspected',
  },
  'Fruits': {
    title: 'Fresh Farm Fruits & Citrus',
    subtitle: 'Naturally tree-ripened seasonal fruits, sweet citrus, and fresh vitamins picked at peak sweetness.',
    badge: 'Sun-Ripened Fresh',
  },
  'Livestock': {
    title: 'Farm Livestock & Poultry',
    subtitle: 'Healthy, naturally raised livestock, fresh eggs, and farm-reared poultry handled with veterinary care.',
    badge: 'Farm Inspected',
  },
  'Bulk Buy': {
    title: 'Bulk Wholesale Farm Harvest',
    subtitle: 'Direct wholesale batches at discounted unit rates for households, food businesses, and event caterers.',
    badge: 'Wholesale Savings',
  },
  'Group Buy': {
    title: 'Community Group Purchase',
    subtitle: 'Join neighboring buyers in pooling bulk orders to unlock direct farm-gate pricing with collective savings.',
    badge: 'Group Deals',
  },
  'Discount Offers': {
    title: 'Special Harvest Discount Offers',
    subtitle: 'Limited-time markdowns, flash seasonal surplus specials, and maximum value deals across fresh produce.',
    badge: 'Marked Down',
  },
  'All Products': {
    title: 'Farm-Fresh Produce Catalog',
    subtitle: 'Browse our complete catalog of freshly harvested crops, wholesome grains, seasonal fruits, and farm staples.',
    badge: 'Farm Direct',
  },
};

const PRICE_RANGE_OPTIONS: { id: PriceRange; label: string }[] = [
  { id: 'all', label: 'All Prices' },
  { id: 'under-5000', label: 'Under ₦5,000' },
  { id: '5000-15000', label: '₦5,000 – ₦15,000' },
  { id: '15000-30000', label: '₦15,000 – ₦30,000' },
  { id: 'above-30000', label: 'Above ₦30,000' },
];

export default function ProductsClient({ initialProducts }: ProductsClientProps) {
  const { addToCart } = useCart();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const gridTopRef = useRef<HTMLDivElement>(null);

  // 1. EXTRACT ALL UNIQUE CATEGORIES FROM DATA
  const uniqueCategories = useMemo(() => {
    return Array.from(
      new Set(
        initialProducts
          .map((p) => p.category?.trim())
          .filter((cat): cat is string => Boolean(cat))
      )
    );
  }, [initialProducts]);

  const categories = useMemo(() => {
    return ['All Products', ...uniqueCategories];
  }, [uniqueCategories]);

  // 2. PARSE SEARCH & URL PARAMS
  const queryParam = searchParams.get('search') || '';
  const categoryParam = searchParams.get('category');
  const filterParam = searchParams.get('filter');

  const resolvedUrlFilter = useMemo(() => {
    if (categoryParam) {
      const matchedCat = categories.find((c) => c.toLowerCase() === categoryParam.toLowerCase());
      return matchedCat || categoryParam;
    }
    if (filterParam) {
      const lower = filterParam.toLowerCase().replace(/[\s+-]+/g, '');
      if (lower.includes('group') && FEATURES.ENABLE_GROUP_BUY) return 'Group Buy';
      if (lower.includes('bulk')) return 'Bulk Buy';
      if (lower.includes('discount')) return 'Discount Offers';
      return filterParam;
    }
    return null;
  }, [categoryParam, filterParam, categories]);

  // 3. UNIFIED FILTER & SORT STATE
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const activeFilter = selectedFilter ?? resolvedUrlFilter ?? 'All Products';

  const [priceRange, setPriceRange] = useState<PriceRange>('all');
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [customSearch, setCustomSearch] = useState<string | null>(null);
  const searchQuery = customSearch ?? queryParam;
  const [searchInput, setSearchInput] = useState(queryParam);

  // Mobile Filter Drawer
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Quick Add Modal State
  const [modalProduct, setModalProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [quickAddMode, setQuickAddMode] = useState<'standard' | 'bulk'>('standard');

  // Sync with search param updates
  useEffect(() => {
    if (queryParam !== searchInput) {
      setSearchInput(queryParam);
    }
  }, [queryParam]);

  // 4. CATEGORY ITEM COUNTERS
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      'All Products': initialProducts.length,
      'Bulk Buy': initialProducts.filter((p) => p.is_bulk_buy_enabled).length,
      'Discount Offers': initialProducts.filter((p) => Boolean(p.original_price && p.original_price > p.price_per_unit)).length,
    };
    if (FEATURES.ENABLE_GROUP_BUY) {
      counts['Group Buy'] = initialProducts.filter((p) => p.is_group_buy_enabled).length;
    }
    for (const p of initialProducts) {
      const cat = p.category?.trim();
      if (cat) {
        counts[cat] = (counts[cat] || 0) + 1;
      }
    }
    return counts;
  }, [initialProducts]);

  // 5. FILTER & SEARCH ENGINE
  const filteredProducts = useMemo(() => {
    const list = initialProducts.filter((product) => {
      // Search Check
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = product.name?.toLowerCase().includes(q);
        const matchesCat = product.category?.toLowerCase().includes(q);
        const matchesDesc = product.description?.toLowerCase().includes(q);
        if (!matchesName && !matchesCat && !matchesDesc) return false;
      }

      // Category / Format Filter Check
      if (activeFilter === 'Bulk Buy') {
        if (!product.is_bulk_buy_enabled) return false;
      } else if (activeFilter === 'Group Buy') {
        if (!FEATURES.ENABLE_GROUP_BUY || !product.is_group_buy_enabled) return false;
      } else if (activeFilter === 'Discount Offers') {
        if (!product.original_price || product.original_price <= product.price_per_unit) return false;
      } else if (activeFilter !== 'All Products') {
        if (product.category?.trim().toLowerCase() !== activeFilter.trim().toLowerCase()) return false;
      }

      // Price Range Filter Check
      const price = product.price_per_unit;
      if (priceRange === 'under-5000' && price >= 5000) return false;
      if (priceRange === '5000-15000' && (price < 5000 || price > 15000)) return false;
      if (priceRange === '15000-30000' && (price < 15000 || price > 30000)) return false;
      if (priceRange === 'above-30000' && price <= 30000) return false;

      return true;
    });

    // 6. SORT ENGINE
    return [...list].sort((a, b) => {
      if (sortBy === 'price-asc') {
        return a.price_per_unit - b.price_per_unit;
      }
      if (sortBy === 'price-desc') {
        return b.price_per_unit - a.price_per_unit;
      }
      if (sortBy === 'name-asc') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'discount') {
        const discA = a.original_price ? a.original_price - a.price_per_unit : 0;
        const discB = b.original_price ? b.original_price - b.price_per_unit : 0;
        return discB - discA;
      }
      // 'featured': Discounted items first, then default
      const aDisc = Boolean(a.original_price && a.original_price > a.price_per_unit);
      const bDisc = Boolean(b.original_price && b.original_price > b.price_per_unit);
      if (aDisc && !bDisc) return -1;
      if (!aDisc && bDisc) return 1;
      return 0;
    });
  }, [initialProducts, activeFilter, searchQuery, priceRange, sortBy]);

  // Pagination Slice
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const currentProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    if (gridTopRef.current) {
      gridTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleFilterSelect = (filterName: string) => {
    setSelectedFilter(filterName);
    setCurrentPage(1);
    setIsMobileDrawerOpen(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomSearch(searchInput.trim());
    setCurrentPage(1);
  };

  const resetAllFilters = () => {
    setSelectedFilter('All Products');
    setPriceRange('all');
    setSortBy('featured');
    setCustomSearch('');
    setSearchInput('');
    setCurrentPage(1);
    setIsMobileDrawerOpen(false);
  };

  const handleOpenQuickAdd = (product: Product, mode: 'standard' | 'bulk' = 'standard') => {
    setModalProduct(product);
    setQuickAddMode(mode);
    setIsModalOpen(true);
  };

  // Determine metadata for current view
  const activeMeta = CATEGORY_META[activeFilter] || {
    title: `${activeFilter} Produce`,
    subtitle: `Explore premium quality farm produce harvested directly from local verified growers.`,
    badge: 'Farm Quality',
  };

  // Check if any filters are active (aside from default All Products)
  const hasActiveFilters = 
    activeFilter !== 'All Products' || 
    priceRange !== 'all' || 
    Boolean(searchQuery.trim()) || 
    sortBy !== 'featured';

  // Quick horizontal pills configuration
  const quickPills = useMemo(() => {
    const list = [
      { key: 'All Products', label: 'All Produce', count: categoryCounts['All Products'] },
      ...uniqueCategories.map((c) => ({
        key: c,
        label: c,
        count: categoryCounts[c] || 0,
      })),
      { key: 'Bulk Buy', label: 'Bulk Wholesale', count: categoryCounts['Bulk Buy'] },
      { key: 'Discount Offers', label: 'Discount Specials', count: categoryCounts['Discount Offers'] },
    ];
    if (FEATURES.ENABLE_GROUP_BUY) {
      list.push({ key: 'Group Buy', label: 'Group Purchase', count: categoryCounts['Group Buy'] });
    }
    return list;
  }, [uniqueCategories, categoryCounts]);

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#2D3748] font-sans pb-24">
      
      {/* =========================================================
          1. ELEGANT CATEGORY HERO & BREADCRUMB HEADER
      ========================================================= */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0b241b] via-[#0F3024] to-[#1c4737] text-white pt-8 pb-12 md:pb-16 px-4 sm:px-6 lg:px-8 border-b border-[#E2E8F0]/20">
        {/* Subtle decorative glowing backdrops */}
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 -mb-16 w-80 h-80 rounded-full bg-teal-400/10 blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto">
          {/* BREADCRUMB NAVIGATION */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs md:text-sm text-emerald-200/80 mb-5 font-sans">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <FiChevronRight className="w-3.5 h-3.5 text-emerald-300/50" />
            <Link 
              href="/products" 
              onClick={() => setSelectedFilter('All Products')}
              className="hover:text-white transition-colors"
            >
              Catalog
            </Link>
            {activeFilter !== 'All Products' && (
              <>
                <FiChevronRight className="w-3.5 h-3.5 text-emerald-300/50" />
                <span className="text-white font-medium truncate max-w-[180px] sm:max-w-none">
                  {activeFilter}
                </span>
              </>
            )}
          </nav>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-emerald-200 mb-3.5 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{activeMeta.badge}</span>
                <span className="text-white/40">•</span>
                <span>{filteredProducts.length} items</span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-white leading-tight font-display">
                {activeMeta.title}
              </h1>
              <p className="mt-2.5 text-xs sm:text-sm md:text-base text-emerald-100/90 leading-relaxed max-w-xl font-normal font-sans">
                {activeMeta.subtitle}
              </p>
            </div>

            {/* VALUE PROPOSITION BADGES */}
            <div className="hidden lg:flex items-center gap-3">
              <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-sm border border-white/10 px-4 py-2.5 rounded-2xl text-xs">
                <FiTruck className="w-4 h-4 text-emerald-300 flex-shrink-0" />
                <div>
                  <div className="font-medium text-white font-display">Same-Day Dispatch</div>
                  <div className="text-[10px] text-emerald-200/80">Batch packed & cooled</div>
                </div>
              </div>
              <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-sm border border-white/10 px-4 py-2.5 rounded-2xl text-xs">
                <FiShield className="w-4 h-4 text-emerald-300 flex-shrink-0" />
                <div>
                  <div className="font-medium text-white font-display">100% Quality Inspected</div>
                  <div className="text-[10px] text-emerald-200/80">Farm-to-door assurance</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          2. HORIZONTAL QUICK CATEGORY PILLS BAR
      ========================================================= */}
      <section className="bg-[#FAFAFA]/95 border-b border-[#E2E8F0] shadow-xs py-3 px-4 sm:px-6 lg:px-8 sticky top-0 md:top-[85px] z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden w-full">
            {quickPills.map((opt) => {
              const isSelected = activeFilter === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => handleFilterSelect(opt.key)}
                  className={`flex-shrink-0 flex items-center gap-2 py-2 px-5 rounded-full text-xs font-bold font-display uppercase tracking-[1.5px] transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#0F3024] text-white shadow-xs'
                      : 'bg-white text-[#2D3748] hover:bg-[#FAFAFA] hover:text-[#0F3024] border border-[#E2E8F0]'
                  }`}
                >
                  <span>{opt.label}</span>
                  {typeof opt.count === 'number' && (
                    <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-sans font-semibold ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-[#FAFAFA] text-[#718096]'
                    }`}>
                      {opt.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================
          3. MAIN LAYOUT: TOOLBAR, SIDEBAR & PRODUCT GRID
      ========================================================= */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12" ref={gridTopRef}>
        
        {/* TOOLBAR: COUNT, ACTIVE CHIPS, MOBILE FILTER BUTTON & SORT */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-3">
            <h2 className="text-sm md:text-base font-medium font-display text-[#2D3748]">
              {filteredProducts.length === 0 ? (
                '0 produce found'
              ) : (
                <>
                  Showing{' '}
                  <span className="text-[#0F3024] font-semibold">
                    {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredProducts.length)}
                  </span>{' '}
                  of <span className="text-[#2D3748] font-semibold">{filteredProducts.length}</span> items
                </>
              )}
            </h2>

            {/* Mobile Filter Trigger Button */}
            <button
              type="button"
              onClick={() => setIsMobileDrawerOpen(true)}
              className="md:hidden flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-[#E2E8F0] hover:bg-[#FAFAFA] text-[#2D3748] rounded-full text-xs font-medium cursor-pointer transition-colors"
            >
              <FiSliders className="w-3.5 h-3.5 text-[#0F3024]" />
              <span>Filters</span>
              {(priceRange !== 'all' || activeFilter !== 'All Products') && (
                <span className="w-2 h-2 rounded-full bg-[#0F3024]" />
              )}
            </button>
          </div>

          {/* RIGHT SIDE: SORT DROPDOWN */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-[#718096] hidden sm:inline">Sort:</span>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as SortOption);
                  setCurrentPage(1);
                }}
                aria-label="Sort products by"
                className="appearance-none bg-white border border-[#E2E8F0] rounded-full px-4 py-2 pr-9 text-xs sm:text-sm font-medium text-[#2D3748] hover:border-[#0F3024] focus:outline-none focus:ring-1 focus:ring-[#0F3024] cursor-pointer shadow-xs transition-colors"
              >
                <option value="featured">Featured / Best Deals</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="discount">Biggest Discounts</option>
                <option value="name-asc">Name: A to Z</option>
              </select>
              <FiChevronDown className="w-4 h-4 text-[#718096] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* ACTIVE FILTER CHIPS ROW */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 mb-8 animate-fade-in">
            <span className="text-xs font-medium text-[#718096] mr-1">Active filters:</span>

            {activeFilter !== 'All Products' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-[#2D3748] text-xs font-medium border border-[#E2E8F0]">
                <span>Category: <strong className="font-semibold text-[#0F3024]">{activeFilter}</strong></span>
                <button 
                  type="button" 
                  onClick={() => handleFilterSelect('All Products')}
                  aria-label="Remove category filter"
                  className="hover:text-[#C05E44] transition-colors cursor-pointer"
                >
                  <FiX className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            {priceRange !== 'all' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-[#2D3748] text-xs font-medium border border-[#E2E8F0]">
                <span>Price: <strong className="font-semibold text-[#0F3024]">{PRICE_RANGE_OPTIONS.find((p) => p.id === priceRange)?.label}</strong></span>
                <button 
                  type="button" 
                  onClick={() => setPriceRange('all')}
                  aria-label="Remove price filter"
                  className="hover:text-[#C05E44] transition-colors cursor-pointer"
                >
                  <FiX className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            {searchQuery.trim() && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-[#2D3748] text-xs font-medium border border-[#E2E8F0]">
                <span>Search: &quot;<strong className="font-semibold text-[#0F3024]">{searchQuery}</strong>&quot;</span>
                <button 
                  type="button" 
                  onClick={() => { setCustomSearch(''); setSearchInput(''); }}
                  aria-label="Clear search"
                  className="hover:text-[#C05E44] transition-colors cursor-pointer"
                >
                  <FiX className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            <button
              type="button"
              onClick={resetAllFilters}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#FAFAFA] hover:bg-gray-100 text-[#718096] hover:text-[#2D3748] border border-[#E2E8F0] text-xs font-medium transition-colors cursor-pointer ml-1"
            >
              <FiRotateCcw className="w-3 h-3" />
              <span>Reset All</span>
            </button>
          </div>
        )}

        {/* =========================================================
            SIDEBAR & PRODUCT GRID CONTAINER
        ========================================================= */}
        <div className="flex flex-col md:flex-row gap-8 lg:gap-10 items-start">
          
          {/* DESKTOP SIDEBAR */}
          <aside className="w-64 flex-shrink-0 hidden md:block space-y-6 sticky top-36">
            
            {/* CARD 1: PRODUCE CATEGORIES */}
            <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-xs">
              <h3 className="font-display font-medium text-[#0F3024] text-xs uppercase tracking-[1.5px] mb-3">
                Categories
              </h3>
              <ul className="space-y-1">
                {categories.map((cat) => {
                  const isSelected = activeFilter === cat;
                  const count = categoryCounts[cat] || 0;
                  return (
                    <li key={cat}>
                      <button
                        type="button"
                        onClick={() => handleFilterSelect(cat)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#0F3024] text-white shadow-xs font-semibold'
                            : 'text-[#2D3748] hover:bg-[#FAFAFA] hover:text-[#0F3024]'
                        }`}
                      >
                        <span className="truncate">{cat}</span>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-[#FAFAFA] text-[#718096]'
                        }`}>
                          {count}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* CARD 2: SPECIAL DEALS & FORMATS */}
            <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-xs">
              <h3 className="font-display font-medium text-[#0F3024] text-xs uppercase tracking-[1.5px] mb-3">
                Deals & Formats
              </h3>
              <ul className="space-y-1">
                <li>
                  <button
                    type="button"
                    onClick={() => handleFilterSelect('Bulk Buy')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                      activeFilter === 'Bulk Buy'
                        ? 'bg-[#0F3024] text-white shadow-xs font-semibold'
                        : 'text-[#2D3748] hover:bg-[#FAFAFA] hover:text-[#0F3024]'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <FiPackage className="w-3.5 h-3.5 text-[#C05E44]" />
                      <span>Bulk Wholesale</span>
                    </span>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                      activeFilter === 'Bulk Buy' ? 'bg-white/20 text-white' : 'bg-[#FAFAFA] text-[#718096]'
                    }`}>
                      {categoryCounts['Bulk Buy'] || 0}
                    </span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleFilterSelect('Discount Offers')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                      activeFilter === 'Discount Offers'
                        ? 'bg-[#0F3024] text-white shadow-xs font-semibold'
                        : 'text-[#2D3748] hover:bg-[#FAFAFA] hover:text-[#0F3024]'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <FiTag className="w-3.5 h-3.5 text-[#C05E44]" />
                      <span>Discount Specials</span>
                    </span>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                      activeFilter === 'Discount Offers' ? 'bg-white/20 text-white' : 'bg-[#FAFAFA] text-[#718096]'
                    }`}>
                      {categoryCounts['Discount Offers'] || 0}
                    </span>
                  </button>
                </li>
                {FEATURES.ENABLE_GROUP_BUY && (
                  <li>
                    <button
                      type="button"
                      onClick={() => handleFilterSelect('Group Buy')}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                        activeFilter === 'Group Buy'
                          ? 'bg-[#0F3024] text-white shadow-xs font-semibold'
                          : 'text-[#2D3748] hover:bg-[#FAFAFA] hover:text-[#0F3024]'
                      }`}
                    >
                      <span>Group Purchase</span>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                        activeFilter === 'Group Buy' ? 'bg-white/20 text-white' : 'bg-[#FAFAFA] text-[#718096]'
                      }`}>
                        {categoryCounts['Group Buy'] || 0}
                      </span>
                    </button>
                  </li>
                )}
              </ul>
            </div>

            {/* CARD 3: PRICE BRACKETS */}
            <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-xs">
              <h3 className="font-display font-medium text-[#0F3024] text-xs uppercase tracking-[1.5px] mb-3">
                Price Range
              </h3>
              <div className="space-y-1.5">
                {PRICE_RANGE_OPTIONS.map((range) => {
                  const isChecked = priceRange === range.id;
                  return (
                    <button
                      key={range.id}
                      type="button"
                      onClick={() => {
                        setPriceRange(range.id);
                        setCurrentPage(1);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-left transition-colors cursor-pointer ${
                        isChecked
                          ? 'bg-[#FAFAFA] text-[#0F3024] font-semibold border border-[#E2E8F0]'
                          : 'text-[#2D3748] hover:bg-[#FAFAFA]'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isChecked ? 'border-[#0F3024] bg-[#0F3024]' : 'border-[#E2E8F0]'
                      }`}>
                        {isChecked && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <span>{range.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CARD 4: QUALITY GUARANTEE MINI-WIDGET */}
            <div className="rounded-2xl p-5 bg-white border border-[#E2E8F0] text-[#0F3024] shadow-xs">
              <div className="flex items-center gap-2 mb-2">
                <FiShield className="w-4 h-4 text-[#0F3024]" />
                <span className="font-display font-medium text-[#0F3024] text-xs uppercase tracking-[1.5px]">GGN Promise</span>
              </div>
              <p className="text-[12px] leading-relaxed text-[#718096]">
                Direct farm harvests are inspected prior to delivery. If you are not satisfied with quality, our team guarantees a prompt refund or replacement.
              </p>
            </div>
          </aside>

          {/* =========================================================
              PRODUCT GRID AREA
          ========================================================= */}
          <div className="flex-1 w-full">
            {filteredProducts.length === 0 ? (
              <div className="py-20 px-6 text-center bg-white rounded-3xl border border-[#E2E8F0] shadow-xs flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-[#FAFAFA] text-[#0F3024] flex items-center justify-center mb-4 text-2xl border border-[#E2E8F0]">
                  🌱
                </div>
                <h3 className="text-lg font-medium font-display text-[#2D3748] mb-1">
                  No Produce Found
                </h3>
                <p className="text-xs sm:text-sm text-[#718096] max-w-md mb-6 leading-relaxed">
                  We could not find any produce matching your current filter selections. Try clearing some filters or searching for different keywords.
                </p>
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="px-6 py-2.5 rounded-full bg-[#0F3024] text-white text-xs font-semibold hover:bg-[#153426] transition-colors shadow-xs cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-16">
                  {currentProducts.map((product) =>
                    activeFilter === 'Bulk Buy' ? (
                      <BulkProductCard
                        key={product.id}
                        product={product}
                        onQuickAdd={(p) => handleOpenQuickAdd(p, 'bulk')}
                      />
                    ) : (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onQuickAdd={(p) => handleOpenQuickAdd(p, 'standard')}
                      />
                    )
                  )}
                </div>

                {/* =========================================================
                    PREMIUM PAGINATION
                ========================================================= */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-1.5 sm:gap-2 font-medium text-xs sm:text-sm pt-4">
                    <button
                      type="button"
                      onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 rounded-xl border border-[#E2E8F0] text-[#2D3748] hover:border-[#0F3024] hover:text-[#0F3024] hover:bg-[#FAFAFA] disabled:opacity-30 disabled:pointer-events-none transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <FiChevronLeft className="w-4 h-4" />
                      <span className="hidden sm:inline">Previous</span>
                    </button>

                    {[...Array(totalPages)].map((_, i) => {
                      const page = i + 1;
                      if (
                        page === 1 || 
                        page === totalPages || 
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        const isCurrent = currentPage === page;
                        return (
                          <button
                            key={page}
                            type="button"
                            onClick={() => handlePageChange(page)}
                            className={`w-9 h-9 flex items-center justify-center rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                              isCurrent
                                ? 'bg-[#0F3024] text-white shadow-xs'
                                : 'border border-[#E2E8F0] text-[#2D3748] hover:border-[#0F3024] hover:bg-[#FAFAFA]'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      }
                      if (page === 2 && currentPage > 3) {
                        return <span key={page} className="text-[#718096] px-1">…</span>;
                      }
                      if (page === totalPages - 1 && currentPage < totalPages - 2) {
                        return <span key={page} className="text-[#718096] px-1">…</span>;
                      }
                      return null;
                    })}

                    <button
                      type="button"
                      onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 rounded-xl border border-[#E2E8F0] text-[#2D3748] hover:border-[#0F3024] hover:text-[#0F3024] hover:bg-[#FAFAFA] disabled:opacity-30 disabled:pointer-events-none transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <FiChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* =========================================================
            NEWSLETTER / WAITLIST BANNER
        ========================================================= */}
        <div 
          className="w-full rounded-3xl mt-20 md:mt-24 p-8 md:p-14 flex flex-col md:flex-row items-center justify-between relative overflow-hidden shadow-sm bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/images/waitlist.webp')" }}
        >
          <div className="absolute inset-0 bg-[#0F3024]/80 pointer-events-none" />
          
          <div className="md:w-1/2 relative z-10 mb-8 md:mb-0">
            <span className="text-emerald-200 uppercase tracking-widest text-xs font-semibold mb-2 block font-display">
              Farm Harvest Alerts
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-white leading-tight mb-4 font-display">
              Be the first to know when seasonal crops get restocked.
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 mb-6 font-sans">
              Get notified immediately when fresh batches of yams, grains, and peppers arrive directly from verified farms.
            </p>
            <form className="flex w-full max-w-md shadow-sm rounded-full overflow-hidden bg-white p-1 border border-white/20" onSubmit={(e) => e.preventDefault()}>
              <input 
                type="email" 
                placeholder="Enter your email address" 
                required
                className="w-full px-4 py-2.5 outline-none text-[#2D3748] text-xs sm:text-sm font-medium" 
              />
              <button 
                type="submit" 
                className="bg-[#C05E44] hover:bg-[#a84f37] text-white px-6 py-2.5 rounded-full font-medium text-xs transition-colors flex-shrink-0 cursor-pointer font-sans"
              >
                Notify Me
              </button>
            </form>
          </div>
        </div>

      </main>

      {/* =========================================================
          4. MOBILE SLIDE-OVER FILTER DRAWER
      ========================================================= */}
      {isMobileDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={() => setIsMobileDrawerOpen(false)}
          />

          {/* Drawer content */}
          <div className="relative ml-auto w-[85%] max-w-[340px] bg-white h-full flex flex-col shadow-2xl z-10 animate-slide-in-right overflow-y-auto">
            {/* Drawer Header */}
            <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#FAFAFA]">
              <div className="flex items-center gap-2">
                <FiSliders className="w-4 h-4 text-[#0F3024]" />
                <h3 className="font-medium font-display text-[#2D3748] text-sm">Filter & Sort</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-1 rounded-full text-[#718096] hover:text-[#2D3748]"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-5 space-y-6 flex-1">
              
              {/* SORT OPTIONS */}
              <div>
                <h4 className="font-display font-medium text-[#0F3024] text-xs uppercase tracking-[1.5px] mb-2.5">
                  Sort Produce
                </h4>
                <div className="space-y-1">
                  {[
                    { id: 'featured', label: 'Featured / Best Deals' },
                    { id: 'price-asc', label: 'Price: Low to High' },
                    { id: 'price-desc', label: 'Price: High to Low' },
                    { id: 'discount', label: 'Biggest Discounts' },
                    { id: 'name-asc', label: 'Name: A to Z' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSortBy(s.id as SortOption)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium ${
                        sortBy === s.id ? 'bg-[#FAFAFA] text-[#0F3024] font-semibold border border-[#E2E8F0]' : 'text-[#2D3748] hover:bg-[#FAFAFA]'
                      }`}
                    >
                      <span>{s.label}</span>
                      {sortBy === s.id && <FiCheck className="w-3.5 h-3.5 text-[#0F3024]" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* CATEGORIES */}
              <div>
                <h4 className="font-display font-medium text-[#0F3024] text-xs uppercase tracking-[1.5px] mb-2.5">
                  Categories
                </h4>
                <div className="space-y-1">
                  {categories.map((cat) => {
                    const isSelected = activeFilter === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => handleFilterSelect(cat)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium ${
                          isSelected ? 'bg-[#0F3024] text-white font-semibold' : 'text-[#2D3748] hover:bg-[#FAFAFA]'
                        }`}
                      >
                        <span>{cat}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-[#FAFAFA] text-[#718096]'
                        }`}>
                          {categoryCounts[cat] || 0}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* PRICE RANGES */}
              <div>
                <h4 className="font-display font-medium text-[#0F3024] text-xs uppercase tracking-[1.5px] mb-2.5">
                  Price Range
                </h4>
                <div className="space-y-1">
                  {PRICE_RANGE_OPTIONS.map((range) => {
                    const isChecked = priceRange === range.id;
                    return (
                      <button
                        key={range.id}
                        type="button"
                        onClick={() => setPriceRange(range.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium ${
                          isChecked ? 'bg-[#FAFAFA] text-[#0F3024] font-semibold border border-[#E2E8F0]' : 'text-[#2D3748] hover:bg-[#FAFAFA]'
                        }`}
                      >
                        <span>{range.label}</span>
                        {isChecked && <FiCheck className="w-3.5 h-3.5 text-[#0F3024]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-[#E2E8F0] bg-[#FAFAFA] flex items-center gap-2">
              <button
                type="button"
                onClick={resetAllFilters}
                className="flex-1 py-2.5 border border-[#E2E8F0] bg-white rounded-xl text-xs font-medium text-[#2D3748] hover:bg-[#FAFAFA] transition-colors"
              >
                Reset All
              </button>
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="flex-1 py-2.5 bg-[#0F3024] text-white rounded-xl text-xs font-semibold hover:bg-[#153426] transition-colors"
              >
                Show {filteredProducts.length} Results
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK ADD MODAL */}
      <QuickAddModal
        product={modalProduct}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setModalProduct(null);
        }}
        initialMode={quickAddMode}
      />
    </div>
  );
}
