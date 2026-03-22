'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase'; // <-- NEW: Import Supabase

// --- ICONS IMPORT ---
import { CiBellOn, CiSearch } from "react-icons/ci";
import { RiCustomerService2Fill } from "react-icons/ri";
import { FiMenu, FiX, FiHome, FiShoppingCart, FiHeart, FiChevronDown, FiMail, FiPhone } from "react-icons/fi";
import { FaFacebook, FaTiktok, FaInstagram, FaXTwitter } from "react-icons/fa6";
import { SiThreads } from "react-icons/si";
import { VscAccount } from "react-icons/vsc";

export default function Navbar() {
  const { itemCount } = useCart();
  const pathname = usePathname();
  const router = useRouter();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  
  // --- NEW: AUTH STATE ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);

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
      const homeSection = document.getElementById('home');
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
          <div className="bg-[#286266] w-full max-w-[90%] mx-auto mt-2 rounded-lg px-6 lg:px-12 py-3 flex items-center justify-between shadow-sm">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-white font-black text-3xl tracking-tighter flex flex-col leading-none">
                GGN
                <span className="text-[9px] font-medium tracking-[0.2em] uppercase text-green-200 mt-1">
                  Green Grows Natural
                </span>
              </Link>
            </div>

            <div className="flex-1 max-w-2xl mx-8 relative">
              <input type="text" placeholder="Search Products..." className="w-full py-2.5 pl-4 pr-10 rounded-md outline-none bg-white text-gray-900 text-sm shadow-inner" />
              <button className="absolute right-3 top-2.5 text-gray-500 hover:text-[#1A4331] transition-colors">
                <CiSearch className="w-5 h-5 text-gray-800 font-bold" />
              </button>
            </div>

            <div className="flex items-center gap-4 sm:gap-6 text-white text-sm font-medium">
              <Link href="/dashboard" className="hover:text-green-200 transition-colors">My Orders</Link>
              <Link href="/cart" className="relative p-2 hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2">
                <FiShoppingCart className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-[#872022] rounded-full border border-white">
                    {itemCount}
                  </span>
                )}
              </Link>
              
              {/* --- UPDATED: Dynamic Account Link --- */}
              <Link href={isLoggedIn ? '/dashboard' : '/login'} className="hover:bg-white/10 p-2 rounded-lg transition-colors">
                <VscAccount className="w-5 h-5" />
              </Link>

              <Link href="/"><CiBellOn className="w-6 h-6 hover:bg-white/10 rounded-lg transition-colors" /></Link>
            </div>
          </div>

          <div className="flex max-w-[90%] mx-auto px-6 lg:px-12 py-3 border-b border-gray-100 justify-between items-center text-sm font-bold text-gray-700 bg-white shadow-sm rounded-b-lg">
            <nav className="flex gap-8">
              <a href="#home" onClick={(e) => handleNavClick(e, 'home')} className={getNavClass('home')}>Home</a>
              <a href="#categories" onClick={(e) => handleNavClick(e, 'categories')} className={getNavClass('categories')}>Categories</a>
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
        <div className="md:hidden bg-[#286266] w-full px-4 py-3 flex flex-col gap-3 shadow-md">
          <div className="flex justify-between items-center text-white">
            <div className="flex items-center gap-3">
              <button onClick={() => setIsMobileMenuOpen(true)}>
                <FiMenu className="text-2xl hover:text-green-200 transition-colors" />
              </button>
              <Link href="/" className="font-black text-[22px] leading-none flex flex-col pt-1">
                GGN <span className="text-[6px] font-medium tracking-[0.2em] uppercase text-green-100 mt-0.5">Green Grows Natural</span>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/cart" className="relative">
                <FiShoppingCart className="text-[22px]" />
                {itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 inline-flex items-center justify-center px-1.5 py-0.5 text-[9px] font-bold text-white bg-[#872022] rounded-full">{itemCount}</span>
                )}
              </Link>
              
              {/* --- UPDATED: Dynamic Account Link --- */}
              <Link href={isLoggedIn ? '/dashboard' : '/login'}>
                <VscAccount className="text-[22px]" />
              </Link>

              <Link href="/notifications"><CiBellOn className="text-[24px]" /></Link>
            </div>
          </div>

          <div className="relative w-full">
            <input type="text" placeholder="Search Products" className="w-full py-2 pl-3 pr-10 rounded bg-white text-gray-900 text-sm outline-none font-medium" />
            <button className="absolute right-2 top-1.5 text-gray-800"><CiSearch className="text-xl font-bold" /></button>
          </div>

          <div className="flex justify-between items-center text-white text-xs font-medium pt-1">
            <div className="flex gap-4 tracking-wide">
              <a href="#home" onClick={(e) => handleNavClick(e, 'home')} className={getMobileNavClass('home')}>Home</a>
              <a href="#categories" onClick={(e) => handleNavClick(e, 'categories')} className={getMobileNavClass('categories')}>Categories</a>
              <a href="#deals" onClick={(e) => handleNavClick(e, 'deals')} className={getMobileNavClass('deals')}>Offers & Deals</a>
            </div>
            <div className="flex items-center gap-3">
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

              <div className="leading-tight">
                <p className="text-xs font-bold tracking-wide">Browse</p>
                <h2 className="text-[32px] font-light tracking-wide mt-0.5">GGN</h2>
              </div>
            </div>

            <div className="flex flex-col text-gray-800 text-sm font-semibold">
              <a href="#home" onClick={(e) => handleNavClick(e, 'home')} className={`flex justify-between items-center p-4 border-b border-gray-100 hover:bg-gray-50 ${activeSection === 'home' ? 'text-[#1A4331]' : ''}`}>
                Home <FiHome className="text-lg text-gray-600" />
              </a>
              <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="flex justify-between items-center p-4 hover:bg-gray-50">
                My Order <FiShoppingCart className="text-lg text-gray-600" />
              </Link>
              <Link href="/wishlist" onClick={() => setIsMobileMenuOpen(false)} className="flex justify-between items-center p-4 border-b border-gray-100 hover:bg-gray-50">
                Wishlist <FiHeart className="text-lg text-gray-600" />
              </Link>

              <div className="p-4 border-b border-gray-100 flex flex-col gap-4">
                <h3 className="font-bold text-black text-base">Top Categories</h3>
                <Link href="/category/fruits" onClick={() => setIsMobileMenuOpen(false)} className="text-gray-600 font-medium">Fruits</Link>
                <Link href="/category/nuts" onClick={() => setIsMobileMenuOpen(false)} className="text-gray-600 font-medium">Nuts, Grains & Legumes</Link>
                <Link href="/category/vegetables" onClick={() => setIsMobileMenuOpen(false)} className="text-gray-600 font-medium">Vegetables</Link>
                <Link href="/category/herbs" onClick={() => setIsMobileMenuOpen(false)} className="text-gray-600 font-medium">Herbs & Spices</Link>
              </div>

              <div className="p-4 border-b border-gray-100 flex flex-col gap-4">
                <h3 className="font-bold text-black text-base">Best Deals & Offers</h3>
                <a href="#deals" onClick={(e) => handleNavClick(e, 'deals')} className="text-gray-600 font-medium">Bulk Purchase</a>
                <a href="#deals" onClick={(e) => handleNavClick(e, 'deals')} className="text-gray-600 font-medium">Group Purchase</a>
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