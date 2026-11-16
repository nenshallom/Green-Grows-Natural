'use client';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase'; // <-- NEW: Import Supabase
import { FEATURES } from '@/config/features';
import MarketingNavbarBanner from '@/components/MarketingNavbarBanner';

// --- ICONS IMPORT ---
import { CiBellOn, CiSearch } from "react-icons/ci";
import { RiCustomerService2Fill } from "react-icons/ri";
import { FiMenu, FiX, FiHome, FiShoppingCart, FiMail, FiPhone, FiChevronDown, FiList } from "react-icons/fi";
import { VscAccount } from "react-icons/vsc";

const DEFAULT_CATEGORIES = ['Vegetables', 'Tubers', 'Grains', 'Fruits', 'Livestock'];

export default function Navbar() {
  const { itemCount, openCartModal, isCartModalOpen } = useCart();
  const pathname = usePathname();
  const router = useRouter();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  
  // --- CATEGORIES DROPDOWN STATE ---
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const categoryMenuRef = useRef<HTMLDivElement>(null);

  // Fetch actual distinct categories from database
  useEffect(() => {
    async function loadCategories() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('category');
        if (!error && data && data.length > 0) {
          const unique = Array.from(
            new Set(
              data
                .map((p) => p.category?.trim())
                .filter((cat): cat is string => Boolean(cat))
            )
          );
          if (unique.length > 0) {
            setCategories(unique);
          }
        }
      } catch {
        // Fallback to DEFAULT_CATEGORIES
      }
    }
    loadCategories();
  }, []);

  // Close category dropdown on route navigation
  useEffect(() => {
    setIsCategoryMenuOpen(false);
  }, [pathname]);

  // Close category dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(event.target as Node)) {
        setIsCategoryMenuOpen(false);
      }
    };
    if (isCategoryMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCategoryMenuOpen]);

  // --- MOBILE SEARCH STATE ---
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  
  // --- AUTH STATE ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsMobileMenuOpen(false);
      setIsMobileSearchOpen(false);
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Focus mobile input when opened
  useEffect(() => {
    if (isMobileSearchOpen && mobileSearchInputRef.current) {
      mobileSearchInputRef.current.focus();
    }
  }, [isMobileSearchOpen]);

  // --- NEW: AUTH LISTENER ---
  useEffect(() => {
    // 1. Check the immediate status when the Navbar loads
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });

    // 2. Set up a real-time listener for when they log in or log out
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- SCROLL SPY LISTENER ---
  useEffect(() => {
    const handleScroll = () => {
      const categoriesSection = document.getElementById('categories');
      const dealsSection = document.getElementById('deals');
      const faqSection = document.getElementById('faq');
      const footerSection = document.getElementById('footer');

      const scrollPosition = window.scrollY + 150; 
      
      const isBottom = (window.innerHeight + window.scrollY) >= document.body.offsetHeight - 50;

      if (isBottom || (footerSection && scrollPosition >= footerSection.offsetTop)) {
        setActiveSection('footer');
      } else if (faqSection && scrollPosition >= faqSection.offsetTop) {
        setActiveSection('faq');
      } else if (dealsSection && scrollPosition >= dealsSection.offsetTop) {
        setActiveSection('deals');
      } else if (categoriesSection && scrollPosition >= categoriesSection.offsetTop) {
        setActiveSection('categories');
      } else {
        setActiveSection('home');
      }
    };

    if (pathname === '/') {
      window.addEventListener('scroll', handleScroll);
      handleScroll(); 
    }

    return () => window.removeEventListener('scroll', handleScroll);
  }, [pathname]);

  // --- PREVENT SCROLL WHEN MOBILE MENU IS OPEN ---
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMobileMenuOpen]);

  // --- SMOOTH SCROLL ROUTER ---
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    setIsMobileMenuOpen(false); 

    if (pathname !== '/') {
      router.push(`/#${targetId}`);
    } else {
      const element = document.getElementById(targetId);
      if (element) {
        const y = element.getBoundingClientRect().top + window.scrollY - 100;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }
  };

  // --- SMART HIDE LOGIC ---
  // Hide storefront navigation only on administrative routes
  if (pathname.startsWith('/admin')) {
    return null;
  }

  const getNavClass = (section: string) => {
    return activeSection === section 
      ? "text-[#0F3024] border-b-2 border-[#0F3024] pb-1 font-semibold" 
      : "text-[#718096] hover:text-[#0F3024] transition-colors pb-1";  
  };

  const getMobileNavClass = (section: string) => {
    return activeSection === section 
      ? "border-b-2 border-white pb-0.5 font-bold opacity-100" 
      : "opacity-70 hover:opacity-100 transition-opacity";
  };

  return (
    <>
      <nav className="w-full bg-[#FAFAFA] z-50 sticky top-0 border-b border-[#E2E8F0]">
        
        {/* ==========================================
            DESKTOP NAVBAR 
        ========================================== */}
        <div className="hidden md:block">
          <div className="bg-[#FAFAFA] w-full mx-auto pt-7 px-6 lg:px-12 py-3 flex items-center justify-between relative">
            {/* BRAND LOGO & TEXT */}
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center gap-3 group">
                <div className="relative w-10 h-10 lg:w-11 lg:h-11 flex-shrink-0 transition-transform duration-300 group-hover:scale-105">
                  <Image 
                    src="/images/ggnlogo-mark.webp" 
                    alt="Green Grows Natural Logo" 
                    fill 
                    sizes="(max-width: 768px) 36px, 44px"
                    priority
                    className="object-contain drop-shadow-xs" 
                  />
                </div>
                <div className="flex flex-col whitespace-nowrap">
                  <span className="text-[#0F3024] font-black text-2xl tracking-tight leading-none font-display">
                    GGN
                  </span>
                  <span className="text-[10px] font-semibold tracking-wider uppercase text-[#0F3024] mt-0.5">
                    Green Grows Natural
                  </span>
                </div>
              </Link>
            </div>

            {/* CATEGORIES DROPDOWN TRIGGER  */}
            <div 
              className="relative flex-shrink-0 ml-3 lg:ml-6" 
              ref={categoryMenuRef}
              onMouseEnter={() => setIsCategoryMenuOpen(true)}
              onMouseLeave={() => setIsCategoryMenuOpen(false)}
            >
              <button
                type="button"
                onClick={() => setIsCategoryMenuOpen((prev) => !prev)}
                className={`flex items-center gap-1.5 py-2 px-3.5 rounded-full text-xs lg:text-sm font-bold transition-all cursor-pointer ${
                  isCategoryMenuOpen 
                    ? 'text-[#0F3024] bg-white' 
                    : 'text-[#2D3748] hover:text-[#0F3024] hover:bg-white/80'
                }`}
                aria-expanded={isCategoryMenuOpen}
                aria-haspopup="true"
              >
                <span>Categories</span>
                <FiChevronDown 
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    isCategoryMenuOpen ? 'rotate-180 text-[#0F3024]' : 'text-[#718096]'
                  }`} 
                />
              </button>

              {/* POPUP DROPDOWN POPOVER */}
              {isCategoryMenuOpen && (
                <div 
                  className="absolute top-full left-0 pt-2 w-52 z-50 animate-fade-in"
                  role="menu"
                >
                  <div className="bg-white rounded-2xl shadow-xl border border-[#E2E8F0] py-2 overflow-hidden">
                    {categories.map((cat) => (
                      <Link 
                        key={cat}
                        href={`/products?category=${encodeURIComponent(cat)}`} 
                        onClick={() => setIsCategoryMenuOpen(false)} 
                        className="block px-4 py-2 text-sm font-medium text-[#2D3748] hover:bg-[#0F3024]/5 hover:text-[#0F3024] transition-colors"
                        role="menuitem"
                      >
                        {cat}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* CENTER: SEARCH BAR (FROST BORDER & WHITE CANVAS) */}
            <div className="flex-1 max-w-lg mx-6 lg:mx-10">
              <form 
                onSubmit={handleSearchSubmit} 
                className="w-full flex items-center pl-4 pr-1.5 py-1.5 bg-white border border-[#E2E8F0] rounded-full focus-within:border-[#0F3024] focus-within:ring-2 focus-within:ring-[#0F3024]/10 transition-all shadow-xs"
              >
                <CiSearch className="w-5 h-5 text-[#718096] mr-2.5 flex-shrink-0 font-bold" />
                <input 
                  type="text" 
                  placeholder="Search produce, fruits, grains..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full py-1 bg-transparent text-[#2D3748] text-sm outline-none placeholder-[#718096] font-medium" 
                />
                {searchQuery && (
                  <button 
                    type="button" 
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                    className="text-[#718096] hover:text-[#2D3748] p-1 mr-1"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                )}
                <button 
                  type="submit" 
                  aria-label="Submit search"
                  className="bg-[#0F3024] hover:bg-[#194b39] text-white px-5 py-1.5 rounded-full text-xs font-medium font-sans transition-colors flex-shrink-0 ml-1 cursor-pointer"
                >
                  Search
                </button>
              </form>
            </div>

            {/* RIGHT ACTION CLUSTER: CART + ACCOUNT (DEEP SLATE + MUTED TERRACOTTA) */}
            <div className="flex items-center gap-3 sm:gap-4 text-[#2D3748] text-sm font-medium">
              {/* CART TRIGGER BUTTON */}
              <button
                type="button"
                onClick={openCartModal}
                aria-label="Open shopping cart"
                className={`relative p-2 hover:bg-white rounded-xl border border-transparent hover:border-[#E2E8F0] transition-all flex items-center gap-2 cursor-pointer ${
                  isCartModalOpen ? 'scale-105 bg-white border-[#E2E8F0]' : ''
                }`}
              >
                <FiShoppingCart className="w-5 h-5 text-[#2D3748]" />
                {itemCount > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-[#C05E44] rounded-full border border-white shadow-2xs">
                    {itemCount}
                  </span>
                )}
              </button>
              
              {/* ACCOUNT LINK */}
              <Link 
                href={isLoggedIn ? '/dashboard' : '/login'} 
                className="hover:bg-white p-2 rounded-xl border border-transparent hover:border-[#E2E8F0] transition-colors text-[#2D3748]" 
                aria-label="Account"
              >
                <VscAccount className="w-5 h-5" />
              </Link>
            </div>
          </div>
          
          {/* DYNAMIC MARKETING ANNOUNCEMENT & COUNTDOWN TICKER (HOMEPAGE ONLY) */}
          <MarketingNavbarBanner />
        </div>

        {/* ==========================================
            MOBILE NAVBAR (EVERGREEN APOTHECARY & TEMU STRUCTURE)
        ========================================== */}
        <div className="md:hidden bg-[#FAFAFA] w-full flex flex-col border-b border-[#E2E8F0]">
          {/* ROW 1: PRIMARY APP BAR */}
          <div className="w-full px-3 py-2.5 flex items-center justify-between gap-2">
            {/* BRAND LOGO & MONOGRAM */}
            <Link href="/" className="flex items-center gap-1.5 flex-shrink-0" aria-label="GGN Home">
              <div className="relative w-7 h-7 flex-shrink-0">
                <Image
                  src="/images/ggnlogo-mark.webp"
                  alt="Green Grows Natural Logo"
                  fill
                  sizes="28px"
                  priority
                  className="object-contain"
                />
              </div>
              <span className="font-black text-lg tracking-tight text-[#0F3024] font-display leading-none">
                GGN
              </span>
            </Link>

            {/* ALWAYS-VISIBLE SEARCH PILL */}
            <form 
              onSubmit={handleSearchSubmit} 
              className="flex-1 min-w-0 flex items-center bg-white border border-[#E2E8F0] rounded-full px-2.5 py-1.5 focus-within:border-[#0F3024] focus-within:ring-2 focus-within:ring-[#0F3024]/10 shadow-2xs transition-all"
            >
              <CiSearch className="w-4 h-4 text-[#718096] flex-shrink-0 mr-1.5 font-bold" />
              <input 
                ref={mobileSearchInputRef}
                type="text" 
                placeholder="Search produce, grains..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-xs text-[#2D3748] placeholder-[#718096] outline-none font-medium font-sans min-w-0" 
              />
              {searchQuery && (
                <button 
                  type="button"
                  onClick={() => { setSearchQuery(''); mobileSearchInputRef.current?.focus(); }}
                  aria-label="Clear search"
                  className="text-[#718096] hover:text-[#2D3748] p-0.5 ml-1 flex-shrink-0"
                >
                  <FiX className="w-3.5 h-3.5" />
                </button>
              )}
            </form>

            {/* RIGHT ACTION CLUSTER: CATEGORIES + ACCOUNT + CART */}
            <div className="flex items-center gap-0.5 flex-shrink-0 text-[#2D3748]">
              {/* CATEGORIES DRAWER TRIGGER (TEMU STYLE LIST ICON) */}
              <button 
                type="button"
                onClick={() => setIsMobileMenuOpen(true)} 
                className="p-1.5 rounded-xl hover:bg-white border border-transparent hover:border-[#E2E8F0] text-[#2D3748] hover:text-[#0F3024] transition-colors" 
                aria-label="Open categories menu"
              >
                <FiList className="w-5 h-5" />
              </button>

              {/* USER ACCOUNT LINK */}
              <Link 
                href={isLoggedIn ? '/dashboard' : '/login'} 
                className="p-1.5 rounded-xl hover:bg-white border border-transparent hover:border-[#E2E8F0] text-[#2D3748] hover:text-[#0F3024] transition-colors" 
                aria-label="Account"
              >
                <VscAccount className="w-5 h-5" />
              </Link>

              {/* SHOPPING CART BUTTON */}
              <button
                type="button"
                onClick={openCartModal}
                aria-label="Open shopping cart"
                className={`relative p-1.5 rounded-xl hover:bg-white border border-transparent hover:border-[#E2E8F0] text-[#2D3748] hover:text-[#0F3024] transition-all ${
                  isCartModalOpen ? 'scale-105 bg-white border-[#E2E8F0]' : ''
                }`}
              >
                <FiShoppingCart className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.2 text-[9px] font-bold text-white bg-[#C05E44] rounded-full border border-white leading-tight min-w-[16px] h-4 shadow-2xs font-sans">
                    {itemCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* ROW 2: HORIZONTAL QUICK-CATEGORY SCROLL STRIP */}
          <div className="bg-white border-t border-[#E2E8F0] px-3.5 py-2 flex items-center gap-5 overflow-x-auto no-scrollbar scrollbar-none whitespace-nowrap text-xs font-sans">
            <Link
              href="/products"
              className={`transition-colors pb-0.5 ${
                pathname === '/products' && !searchQuery
                  ? 'text-[#0F3024] font-bold border-b-2 border-[#0F3024]'
                  : 'text-[#718096] hover:text-[#0F3024] font-medium'
              }`}
            >
              All Produce
            </Link>
            {categories.map((cat) => (
              <Link 
                key={cat}
                href={`/products?category=${encodeURIComponent(cat)}`}
                className="text-[#718096] hover:text-[#0F3024] font-medium transition-colors pb-0.5"
              >
                {cat}
              </Link>
            ))}
            <Link 
              href="/products?filter=Bulk+Buy"
              className="text-[#718096] hover:text-[#0F3024] font-medium transition-colors pb-0.5"
            >
              Bulk Buy
            </Link>
            <a 
              href="#deals"
              onClick={(e) => handleNavClick(e, 'deals')}
              className={`transition-colors pb-0.5 ${
                activeSection === 'deals' && pathname === '/'
                  ? 'text-[#0F3024] font-bold border-b-2 border-[#0F3024]'
                  : 'text-[#718096] hover:text-[#0F3024] font-medium'
              }`}
            >
              Offers & Deals
            </a>
          </div>
        </div>

        {/* MOBILE MARKETING TICKER (HOMEPAGE ONLY) */}
        <div className="md:hidden">
          <MarketingNavbarBanner />
        </div>
      </nav>

      {/* ==========================================
          MOBILE SIDEBAR DRAWER (EVERGREEN APOTHECARY THEME)
      ========================================== */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[100] flex">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
          <div className="relative w-[85%] max-w-[320px] bg-[#FAFAFA] h-full flex flex-col overflow-y-auto animate-slide-in-left shadow-2xl">
            <div className="bg-[#0F3024] p-5 text-white flex flex-col justify-between h-[125px]">
              
              <div className="flex justify-end">
                <Link 
                  href={isLoggedIn ? '/dashboard' : '/login'} 
                  onClick={() => setIsMobileMenuOpen(false)} 
                  className="flex items-center gap-1.5 text-xs font-medium text-white/90 hover:text-white bg-white/10 px-3 py-1 rounded-full border border-white/15 transition-colors font-sans"
                >
                  <VscAccount className="text-sm" />
                  <span>{isLoggedIn ? 'My Profile' : 'Sign in'}</span>
                </Link>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative w-9 h-9 flex-shrink-0">
                  <Image
                    src="/images/ggnlogo-mark.webp"
                    alt="Green Grows Natural Logo"
                    fill
                    sizes="36px"
                    className="object-contain"
                  />
                </div>
                <div className="leading-tight">
                  <p className="text-[9px] font-semibold tracking-wider uppercase text-emerald-200">Fresh Agro Marketplace</p>
                  <h2 className="text-base font-black tracking-tight text-white leading-tight font-display">Green Grows Natural</h2>
                </div>
              </div>
            </div>

            <div className="flex flex-col text-[#2D3748] text-sm font-medium font-sans divide-y divide-[#E2E8F0]">
              <div className="py-2 px-3 flex flex-col gap-0.5">
                <a 
                  href="#home" 
                  onClick={(e) => handleNavClick(e, 'home')} 
                  className={`flex justify-between items-center px-3 py-2.5 rounded-xl hover:bg-white transition-colors ${
                    activeSection === 'home' && pathname === '/' ? 'text-[#0F3024] font-semibold bg-white' : 'text-[#2D3748]'
                  }`}
                >
                  <span>Home</span> <FiHome className="text-base text-[#718096]" />
                </a>
                <Link 
                  href="/dashboard" 
                  onClick={() => setIsMobileMenuOpen(false)} 
                  className="flex justify-between items-center px-3 py-2.5 rounded-xl hover:bg-white transition-colors text-[#2D3748]"
                >
                  <span>My Orders</span> <FiShoppingCart className="text-base text-[#718096]" />
                </Link>
                <Link 
                  href="/products" 
                  onClick={() => setIsMobileMenuOpen(false)} 
                  className="flex justify-between items-center px-3 py-2.5 rounded-xl hover:bg-white transition-colors text-[#2D3748]"
                >
                  <span>All Products</span> <FiShoppingCart className="text-base text-[#718096]" />
                </Link>
              </div>

              <div className="p-4 flex flex-col gap-2.5">
                <h3 className="font-semibold font-display text-[#0F3024] text-xs uppercase tracking-wider">Product Categories</h3>
                <div className="flex flex-col gap-1">
                  {categories.map((cat) => (
                    <Link 
                      key={cat}
                      href={`/products?category=${encodeURIComponent(cat)}`} 
                      onClick={() => setIsMobileMenuOpen(false)} 
                      className="px-3 py-2 rounded-xl text-sm font-medium text-[#718096] hover:text-[#0F3024] hover:bg-white transition-colors"
                    >
                      {cat}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="p-4 flex flex-col gap-2.5">
                <h3 className="font-semibold font-display text-[#0F3024] text-xs uppercase tracking-wider">Deals & Savings</h3>
                <div className="flex flex-col gap-1">
                  <Link 
                    href="/products?filter=Bulk+Buy" 
                    onClick={() => setIsMobileMenuOpen(false)} 
                    className="px-3 py-2 rounded-xl text-sm font-medium text-[#718096] hover:text-[#0F3024] hover:bg-white transition-colors"
                  >
                    Bulk Purchase
                  </Link>
                  {FEATURES.ENABLE_GROUP_BUY && (
                    <Link 
                      href="/products?filter=Group+Buy" 
                      onClick={() => setIsMobileMenuOpen(false)} 
                      className="px-3 py-2 rounded-xl text-sm font-medium text-[#718096] hover:text-[#0F3024] hover:bg-white transition-colors"
                    >
                      Group Purchase
                    </Link>
                  )}
                </div>
              </div>

              <div className="p-4 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold font-display text-[#0F3024] text-xs uppercase tracking-wider">Need Help?</h3>
                  <RiCustomerService2Fill className="text-base text-[#0F3024]" />
                </div>
                <div className="flex flex-col gap-2 text-xs">
                  <a 
                    href="mailto:greengrowsnatural@gmail.com" 
                    className="flex items-center gap-2.5 text-[#718096] hover:text-[#0F3024] transition-colors"
                  >
                    <FiMail className="text-sm text-[#0F3024]" /> greengrowsnatural@gmail.com
                  </a>
                  <a 
                    href="tel:09065670171" 
                    className="flex items-center gap-2.5 text-[#718096] hover:text-[#0F3024] transition-colors"
                  >
                    <FiPhone className="text-sm text-[#0F3024]" /> 09065670171
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1 p-3">
            <button 
              onClick={() => setIsMobileMenuOpen(false)} 
              className="text-white hover:text-gray-300 transition-colors p-2" 
              aria-label="Close menu"
            >
              <FiX className="text-3xl drop-shadow-lg" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}