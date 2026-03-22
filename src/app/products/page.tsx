'use client';
import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/context/CartContext';
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  category: string;
  price_per_unit: number;
  original_price?: number;
  unit: string;
  image_url: string;
  is_bulk_buy_enabled: boolean;
  is_group_buy_enabled: boolean;
}

export default function ProductsCatalogPage() {
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // --- UNIFIED FILTER STATE ---
  const [activeFilter, setActiveFilter] = useState<string>('All Products');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // --- NEW: MEMORY RESTORATION STATE ---
  const [isStateRestored, setIsStateRestored] = useState(false);

  // 1. FETCH PRODUCTS
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        setProducts(data || []);
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // 2. NEW: RESTORE MEMORY ON PAGE LOAD
  useEffect(() => {
    // Check the browser's temporary memory for saved filters/pages
    const savedFilter = sessionStorage.getItem('ggn_catalog_filter');
    const savedPage = sessionStorage.getItem('ggn_catalog_page');
    
    if (savedFilter) setActiveFilter(savedFilter);
    if (savedPage) setCurrentPage(Number(savedPage));
    
    // Unlock the save mechanism now that we have restored the previous state
    setIsStateRestored(true); 
  }, []);

  // 3. NEW: SAVE TO MEMORY ON CHANGE
  useEffect(() => {
    // Every time the user clicks a filter or changes a page, silently save it to the browser
    if (isStateRestored) {
      sessionStorage.setItem('ggn_catalog_filter', activeFilter);
      sessionStorage.setItem('ggn_catalog_page', currentPage.toString());
    }
  }, [activeFilter, currentPage, isStateRestored]);

  const categories = useMemo(() => {
    const uniqueCats = Array.from(new Set(products.map(p => p.category)));
    return ['All Products', ...uniqueCats];
  }, [products]);

  // --- UPGRADED FILTER & SEARCH ENGINE ---
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Search Check
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            product.category.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      // Sidebar Filter Check
      if (activeFilter === 'All Products') return true;
      
      // Special Offers Logic
      if (activeFilter === 'Group Buy') return product.is_group_buy_enabled;
      if (activeFilter === 'Bulk Buy') return product.is_bulk_buy_enabled;
      if (activeFilter === 'Discount Offers') return product.original_price && product.original_price > product.price_per_unit;
      
      // Standard Category Logic
      return product.category === activeFilter;
    });
  }, [products, activeFilter, searchQuery]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const currentProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    setCurrentPage(1); 
  };

  const handleQuickAdd = (product: Product) => {
    addToCart({
      productId: product.id,
      name: product.name,
      priceAtAddition: product.price_per_unit,
      quantity: 1,
      purchaseType: 'standard',
      image: product.image_url,
    });
    alert(`Added ${product.name} to your cart!`);
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] pb-20">
      
      {/* HERO VIDEO SECTION */}
      <div className="relative w-full h-[300px] md:h-[400px] overflow-hidden">
        <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
          <source src="/videos/hero-vid.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-12 max-w-7xl mx-auto w-full">
          <h1 className="text-white text-6xl md:text-8xl font-black drop-shadow-lg">Shop</h1>
          <p className="text-white text-xl md:text-3xl font-bold mt-2 drop-shadow-md">Your Hard to find Products</p>
        </div>
      </div>

      <main className="max-w-[95%] lg:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-[-30px] relative z-10">
        
        {/* SEARCH BAR SECTION */}
        <div className="bg-white p-4 md:p-6 shadow-md border border-gray-100 rounded-xl flex flex-col md:flex-row justify-between items-center gap-4 mb-10">
          <h2 className="text-[#872022] font-black text-xl md:text-2xl whitespace-nowrap">Get All, You Need</h2>
          <form onSubmit={handleSearch} className="flex w-full md:w-1/2 shadow-sm rounded-md overflow-hidden border border-gray-300 focus-within:border-[#872022] transition-colors">
            <input 
              type="text" 
              placeholder="Search products..." 
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full px-4 py-2.5 outline-none text-gray-700" 
            />
            <button type="submit" className="bg-[#872022] hover:bg-red-900 text-white px-8 py-2.5 font-bold transition-colors">
              search
            </button>
          </form>
        </div>

        <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
          
          {/* SIDEBAR NAVIGATION */}
          <aside className="w-full md:w-56 flex-shrink-0">
            <h3 className="font-black text-gray-900 text-lg mb-4">Categories</h3>
            <ul className="space-y-3 mb-8">
              {categories.map((cat) => (
                <li key={cat}>
                  <button 
                    onClick={() => { setActiveFilter(cat); setCurrentPage(1); }}
                    className={`flex items-center gap-2 text-sm font-bold w-full text-left transition-colors ${activeFilter === cat ? 'text-black' : 'text-gray-500 hover:text-black'}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${activeFilter === cat ? 'bg-black' : 'bg-transparent'}`}></span>
                    {cat}
                  </button>
                </li>
              ))}
            </ul>

            <h3 className="font-black text-gray-900 text-lg mb-4">Special Offers</h3>
            <ul className="space-y-3">
              {['Group Buy', 'Bulk Buy', 'Discount Offers'].map((offer) => (
                <li key={offer}>
                  <button 
                    onClick={() => { setActiveFilter(offer); setCurrentPage(1); }}
                    className={`flex items-center gap-2 text-sm font-bold w-full text-left transition-colors ${activeFilter === offer ? 'text-black' : 'text-gray-500 hover:text-black'}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${activeFilter === offer ? 'bg-black' : 'bg-transparent'}`}></span>
                    {offer}
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          {/* PRODUCT GRID */}
          <div className="flex-1">
            {loading ? (
              <div className="py-20 flex justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#286266]"></div></div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-20 text-center text-gray-500 font-medium bg-gray-50 rounded-xl border border-dashed border-gray-200">
                No products found matching your search.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-12">
                  {currentProducts.map((product) => {
                    const discountPercent = product.original_price && product.original_price > product.price_per_unit 
                      ? Math.round(((product.original_price - product.price_per_unit) / product.original_price) * 100) 
                      : 0;

                    return (
                      <Link href={`/product/${product.id}`} key={product.id} className="relative rounded-2xl overflow-hidden group h-[260px] md:h-[300px] shadow-sm hover:shadow-lg transition-shadow bg-gray-100 block">
                        
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />

                        {discountPercent > 0 && (
                          <div className="absolute top-3 left-3 bg-[#D93F3F] text-white text-[10px] md:text-xs font-black px-2 py-1 rounded shadow-sm z-10">
                            -{discountPercent}%
                          </div>
                        )}

                        <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex justify-between items-end">
                          <div className="text-white">
                            <h3 className="font-bold text-sm md:text-base leading-tight mb-0.5 drop-shadow-md truncate max-w-[120px]">
                              {product.name}
                            </h3>
                            <p className="text-gray-300 text-[10px] uppercase tracking-wider font-semibold mb-1">
                              Farm Fresh
                            </p>
                            <span className="font-black text-sm md:text-base text-white drop-shadow-md">
                              ₦{product.price_per_unit.toLocaleString()}<span className="text-[10px] font-medium text-gray-300">/{product.unit || 'kg'}</span>
                            </span>
                          </div>

                          <button 
                            onClick={(e) => { e.preventDefault(); handleQuickAdd(product); }}
                            className="bg-[#286266] hover:bg-[#1A4331] text-white text-xs font-bold px-4 py-2 rounded shadow-md transition-colors"
                          >
                            Add to Cart
                          </button>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {/* PAGINATION */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 font-bold text-sm">
                    <button 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-gray-500 hover:text-black disabled:opacity-30 transition-colors"
                    >
                      previous
                    </button>
                    
                    {[...Array(totalPages)].map((_, i) => {
                      const page = i + 1;
                      if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                        return (
                          <button 
                            key={page} 
                            onClick={() => setCurrentPage(page)}
                            className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${currentPage === page ? 'bg-[#286266] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                          >
                            {page}
                          </button>
                        );
                      }
                      if (page === 2 && currentPage > 3) return <span key={page} className="text-gray-400">...</span>;
                      if (page === totalPages - 1 && currentPage < totalPages - 2) return <span key={page} className="text-gray-400">...</span>;
                      return null;
                    })}

                    <button 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 text-gray-500 hover:text-black disabled:opacity-30 transition-colors"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* NEWSLETTER BANNER */}
        <div 
          className="w-full rounded-3xl mt-20 p-8 md:p-16 flex flex-col md:flex-row items-center justify-between relative overflow-hidden shadow-lg bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/images/waitlist.png')" }}
        >
          <div className="absolute inset-0 bg-black/50 pointer-events-none"></div>
          
          <div className="md:w-1/2 relative z-10 mb-8 md:mb-0">
            <h2 className="text-3xl md:text-5xl font-black text-white leading-tight mb-6 drop-shadow-sm">
              Be the First to know<br/>when products get<br/>restocked
            </h2>
            <form className="flex w-full max-w-md shadow-sm rounded-md overflow-hidden bg-white" onSubmit={e => e.preventDefault()}>
              <input 
                type="email" 
                placeholder="Email Address" 
                required
                className="w-full px-4 py-3 outline-none text-gray-700 text-sm" 
              />
              <button type="submit" className="bg-[#286266] hover:bg-[#1A4331] text-white px-8 py-3 font-bold text-sm transition-colors">
                Join
              </button>
            </form>
          </div>

        </div>

      </main>
    </div>
  );
}