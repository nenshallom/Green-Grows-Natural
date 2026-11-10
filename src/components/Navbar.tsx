'use client';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase'; // <-- NEW: Import Supabase
import { FEATURES } from '@/config/features';

// --- ICONS IMPORT ---
import { CiBellOn, CiSearch } from "react-icons/ci";
import { RiCustomerService2Fill } from "react-icons/ri";
import { FiMenu, FiX, FiHome, FiShoppingCart, FiMail, FiPhone } from "react-icons/fi";
import { VscAccount } from "react-icons/vsc";

export default function Navbar() {
  const { itemCount, openCartModal, isCartModalOpen } = useCart();
  const pathname = usePathname();
  const router = useRouter();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  
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
  if (pathname.startsWith('/admin') || pathname.includes('login') || pathname.includes('checkout')) {
    return null;
  }

  const getNavClass = (section: string) => {
    return activeSection === section 
      ? "text-[#1A4331] border-b-2 border-[#1A4331] pb-1 font-black" 
      : "text-gray-600 hover:text-[#1A4331] transition-colors pb-1";  
  };

  const getMobileNavClass = (section: string) => {
    return activeSection === section 
      ? "border-b-2 border-white pb-0.5 font-bold opacity-100" 
      : "opacity-70 hover:opacity-100 transition-opacity";
  };

  return (
    <>
      <nav className="w-full bg-white md:bg-transparent shadow-sm md:shadow-none z-50 sticky top-0">
        
        {/* ==========================================
            DESKTOP NAVBAR 
        ========================================== */}
        <div className="hidden md:block">
          {/* change bg to white */}
          <div className="bg-white w-full mx-auto pt-9 px-6 lg:px-12 py-3 flex items-center justify-between relative border-gray-100 border-b-1">
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
                    className="object-contain drop-shadow-sm" 
                  />
                </div>
                <div className="flex flex-col whitespace-nowrap">
                  <span className="text-[#286266] font-black text-2xl tracking-tight leading-none">
                    GGN
                  </span>
                  <span className="text-[10px] font-semibold tracking-wider uppercase text-[#286266] mt-0.5">
                    Green Grows Natural
                  </span>
                </div>
              </Link>
            </div>

            {/* CENTER: PERMANENT STAGNANT SEARCH BAR */}
            <div className="flex-1 max-w-lg mx-6 lg:mx-10">
              <form 
                onSubmit={handleSearchSubmit} 
                className="w-full flex items-center pl-4 pr-1.5 py-1.5 bg-gray-50 border border-gray-200 rounded-full focus-within:border-[#286266] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#286266]/15 transition-all shadow-sm"
              >
                <CiSearch className="w-5 h-5 text-gray-400 mr-2.5 flex-shrink-0 font-bold" />
                <input 
                  type="text" 
                  placeholder="Search produce, fruits, grains..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full py-1 bg-transparent text-gray-900 text-sm outline-none placeholder-gray-400 font-medium" 
                />
                {searchQuery && (
                  <button 
                    type="button" 
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                    className="text-gray-400 hover:text-gray-600 p-1 mr-1"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                )}
                <button 
                  type="submit" 
                  aria-label="Submit search"
                  className="bg-[#286266] text-white px-4 py-1.5 rounded-full text-xs font-bold hover:bg-[#1f4e51] transition-colors flex-shrink-0 ml-1"
                >
                  Search
                </button>
              </form>
            </div>

            {/* RIGHT ACTION CLUSTER: CART + ACCOUNT */}
            <div className="flex items-center gap-3 sm:gap-4 text-[#286266] text-sm font-medium">
              {/* CART TRIGGER BUTTON */}
              <button
                type="button"
                onClick={openCartModal}
                aria-label="Open shopping cart"
                className={`relative p-2 hover:bg-gray-100 rounded-lg transition-all flex items-center gap-2 ${
                  isCartModalOpen ? 'scale-110 bg-gray-100' : ''
                }`}
              >
                <FiShoppingCart className="w-5 h-5 text-[#286266]" />
                {itemCount > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-[#872022] rounded-full border border-white">
                    {itemCount}
                  </span>
                )}
              </button>
              
              {/* ACCOUNT LINK */}
              <Link href={isLoggedIn ? '/dashboard' : '/login'} className="hover:bg-gray-100 p-2 rounded-lg transition-colors text-[#286266]" aria-label="Account">
                <VscAccount className="w-5 h-5" />
              </Link>
            </div>
          </div>
          
          {/* bottom navigation  */}
          <div className="flex  mx-auto px-6 lg:px-12 py-3  justify-between items-center text-sm font-bold text-gray-700 bg-white rounded-b-lg">
            <nav className="flex gap-8">
              <a href="#home" onClick={(e) => handleNavClick(e, 'home')} className={getNavClass('home')}>Home</a>
              <a href="#deals" onClick={(e) => handleNavClick(e, 'deals')} className={getNavClass('deals')}>Offers & Deals</a>
            </nav>
            <nav className="flex gap-8 items-center">
              <a href="#faq" onClick={(e) => handleNavClick(e, 'faq')} className={getNavClass('faq')}>FAQ</a>
              <a href="#footer" onClick={(e) => handleNavClick(e, 'footer')} className={`transition-colors pb-1 ${activeSection === 'footer' ? 'text-[#1A4331]' : 'text-gray-600 hover:text-[#1A4331]'}`}>
                <RiCustomerService2Fill className="w-5 h-5" />
              </a>
            </nav>
          </div>
        </div>

        {/* ==========================================
            MOBILE NAVBAR 
        ========================================== */}
        <div className="md:hidden bg-[#286266] w-full px-4 py-3 flex flex-col gap-2.5 shadow-md">
          <div className="flex justify-between items-center text-white">
            <div className="flex items-center gap-2.5">
              <button onClick={() => setIsMobileMenuOpen(true)} aria-label="Open mobile menu">
                <FiMenu className="text-2xl hover:text-green-200 transition-colors" />
              </button>
              <Link href="/" className="flex items-center gap-2">
                <div className="relative w-8 h-8 flex-shrink-0">
                  <Image
                    src="/images/ggnlogo-mark.webp"
                    alt="Green Grows Natural Logo"
                    fill
                    sizes="32px"
                    priority
                    className="object-contain"
                  />
                </div>
                <div className="leading-tight">
                  <span className="font-black text-lg tracking-tight block">GGN</span>
                  <span className="text-[7px] font-semibold tracking-wider uppercase text-green-200 block -mt-0.5">Green Grows Natural</span>
                </div>
              </Link>
            </div>
            
            <div className="flex items-center gap-3">
              {/* MOBILE SEARCH TOGGLE */}
              <button
                type="button"
                onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
                aria-label="Toggle search"
                className={`p-1.5 rounded-full transition-colors ${
                  isMobileSearchOpen ? 'bg-white/20 text-green-200' : 'hover:bg-white/10 text-white'
                }`}
              >
                <CiSearch className="text-[22px] font-bold" />
              </button>

              {/* MOBILE CART BUTTON */}
              <button
                type="button"
                onClick={openCartModal}
                aria-label="Open shopping cart"
                className={`relative p-1 transition-transform active:scale-90 ${
                  isCartModalOpen ? 'scale-110' : ''
                }`}
              >
                <FiShoppingCart className="text-[22px]" />
                {itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 inline-flex items-center justify-center px-1.5 py-0.5 text-[9px] font-bold text-white bg-[#872022] rounded-full border border-white">
                    {itemCount}
                  </span>
                )}
              </button>
              
              {/* MOBILE ACCOUNT LINK */}
              <Link href={isLoggedIn ? '/dashboard' : '/login'} aria-label="Account">
                <VscAccount className="text-[22px]" />
              </Link>

              <Link href="/dashboard" title="Dashboard" aria-label="Notifications">
                <CiBellOn className="text-[24px]" />
              </Link>
            </div>
          </div>

          {/* EXPANDABLE MOBILE SEARCH BAR */}
          {isMobileSearchOpen && (
            <div className="w-full pt-1 pb-1 animate-fade-in">
              <form onSubmit={handleSearchSubmit} className="relative w-full flex items-center">
                <input 
                  ref={mobileSearchInputRef}
                  type="text" 
                  placeholder="Search produce, fruits, grains..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full py-2 pl-3.5 pr-16 rounded-full bg-white text-gray-900 text-sm outline-none font-medium shadow-md" 
                />
                <div className="absolute right-2 flex items-center gap-1">
                  {searchQuery && (
                    <button 
                      type="button"
                      onClick={() => { setSearchQuery(''); mobileSearchInputRef.current?.focus(); }}
                      aria-label="Clear search"
                      className="text-gray-400 hover:text-gray-600 p-1"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  )}
                  <button type="submit" aria-label="Search" className="bg-[#286266] text-white p-1.5 rounded-full">
                    <CiSearch className="text-base font-bold" />
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="flex justify-between items-center text-white text-xs font-medium pt-0.5 border-t border-white/10">
            <div className="flex gap-4 tracking-wide pt-1">
              <a href="#categories" onClick={(e) => handleNavClick(e, 'categories')} className={getMobileNavClass('categories')}>Categories</a>
              <a href="#deals" onClick={(e) => handleNavClick(e, 'deals')} className={getMobileNavClass('deals')}>Offers & Deals</a>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <a href="#faq" onClick={(e) => handleNavClick(e, 'faq')} className={`opacity-90 hover:opacity-100 ${activeSection === 'faq' ? 'border-b border-white' : ''}`}>
                FAQs
              </a>
              <a href="#footer" onClick={(e) => handleNavClick(e, 'footer')} className={`opacity-90 hover:opacity-100 ${activeSection === 'footer' ? 'text-green-200' : ''}`}>
                <RiCustomerService2Fill className="text-sm" />
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* ==========================================
          MOBILE SIDEBAR DRAWER
      ========================================== */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[100] flex">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="relative w-[80%] max-w-[320px] bg-white h-full flex flex-col overflow-y-auto animate-slide-in-left shadow-2xl">
            <div className="bg-[#286266] p-5 text-white flex flex-col justify-between h-[120px]">
              
              <div className="flex justify-end">
                {/* --- UPDATED: Dynamic Drawer Link and Text --- */}
                <Link href={isLoggedIn ? '/dashboard' : '/login'} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-1 text-sm font-medium hover:text-green-200">
                  {isLoggedIn ? 'My Profile' : 'Sign in'} <VscAccount className="text-lg" />
                </Link>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 flex-shrink-0">
                  <Image
                    src="/images/ggnlogo-mark.webp"
                    alt="Green Grows Natural Logo"
                    fill
                    sizes="40px"
                    className="object-contain"
                  />
                </div>
                <div className="leading-tight">
                  <p className="text-[10px] font-bold tracking-wider uppercase text-green-200">Browse Catalog</p>
                  <h2 className="text-base font-black tracking-tight text-white leading-tight">Green Grows Natural</h2>
                </div>
              </div>
            </div>

            <div className="flex flex-col text-gray-800 text-sm font-semibold">
              <a href="#home" onClick={(e) => handleNavClick(e, 'home')} className={`flex justify-between items-center p-4 border-b border-gray-100 hover:bg-gray-50 ${activeSection === 'home' ? 'text-[#1A4331]' : ''}`}>
                Home <FiHome className="text-lg text-gray-600" />
              </a>
              <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="flex justify-between items-center p-4 hover:bg-gray-50">
                My Order <FiShoppingCart className="text-lg text-gray-600" />
              </Link>
              <Link href="/products" onClick={() => setIsMobileMenuOpen(false)} className="flex justify-between items-center p-4 border-b border-gray-100 hover:bg-gray-50">
                All Products <FiShoppingCart className="text-lg text-gray-600" />
              </Link>

              <div className="p-4 border-b border-gray-100 flex flex-col gap-4">
                <h3 className="font-bold text-black text-base">Top Categories</h3>
                <Link href="/products?category=Fruits" onClick={() => setIsMobileMenuOpen(false)} className="text-gray-600 font-medium">Fruits</Link>
                <Link href="/products?category=Grains" onClick={() => setIsMobileMenuOpen(false)} className="text-gray-600 font-medium">Nuts, Grains & Legumes</Link>
                <Link href="/products?category=Vegetables" onClick={() => setIsMobileMenuOpen(false)} className="text-gray-600 font-medium">Vegetables</Link>
                <Link href="/products?category=Tubers" onClick={() => setIsMobileMenuOpen(false)} className="text-gray-600 font-medium">Tubers & Roots</Link>
              </div>

              <div className="p-4 border-b border-gray-100 flex flex-col gap-4">
                <h3 className="font-bold text-black text-base">Best Deals & Offers</h3>
                <Link href="/products?filter=Bulk+Buy" onClick={() => setIsMobileMenuOpen(false)} className="text-gray-600 font-medium">Bulk Purchase</Link>
                {FEATURES.ENABLE_GROUP_BUY && (
                  <Link href="/products?filter=Group+Buy" onClick={() => setIsMobileMenuOpen(false)} className="text-gray-600 font-medium">Group Purchase</Link>
                )}
              </div>

              <div className="p-4 flex flex-col gap-4 mb-6">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-black text-base">Contact Us</h3>
                  <RiCustomerService2Fill className="text-xl text-black" />
                </div>
                <a href="mailto:greengrowsnatural@gmail.com" className="flex items-center gap-3 text-gray-700 font-medium text-xs hover:text-green-700">
                  <FiMail className="text-base text-black" /> greengrowsnatural@gmail.com
                </a>
                <a href="tel:09065670171" className="flex items-center gap-3 text-gray-700 font-medium text-xs hover:text-green-700">
                  <FiPhone className="text-base text-black" /> 09065670171
                </a>
              </div>
            </div>
          </div>
          <div className="flex-1 p-3">
            <button onClick={() => setIsMobileMenuOpen(false)} className="text-white hover:text-gray-300 transition-colors">
              <FiX className="text-4xl drop-shadow-lg" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}