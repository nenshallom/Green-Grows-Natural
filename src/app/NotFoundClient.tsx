'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FiHome,
  FiShoppingBag,
  FiArrowLeft,
  FiSearch,
  FiPackage,
  FiMessageCircle,
  FiCompass,
} from 'react-icons/fi';

const QUICK_CATEGORIES = [
  { name: 'Tubers & Roots', emoji: '🥔', href: '/products?category=Tubers' },
  { name: 'Fresh Vegetables', emoji: '🍅', href: '/products?category=Vegetables' },
  { name: 'Nuts & Grains', emoji: '🌾', href: '/products?category=Grains' },
  { name: 'Fresh Fruits', emoji: '🥑', href: '/products?category=Fruits' },
  { name: 'Special Offers', emoji: '🏷️', href: '/products?filter=discount' },
];

export default function NotFoundClient() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/products');
    }
  };

  const handleGoBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  return (
    <main className="min-h-[75vh] bg-[#FDFBF7] flex items-center justify-center px-4 py-12 md:py-20">
      <div className="max-w-2xl w-full mx-auto text-center">
        {/* =========================================================
            1. FARM THEMED 404 VISUAL / MASCOT
        ========================================================= */}
        <div className="relative inline-flex items-center justify-center mb-6">
          <div className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-emerald-100/60 border-2 border-dashed border-emerald-300 flex items-center justify-center relative animate-float-produce shadow-inner">
            <span className="text-5xl md:text-6xl select-none" role="img" aria-label="Sprout seedling">
              🌱
            </span>
            {/* Small floating farm elements */}
            <span
              className="absolute -top-1 -right-1 text-2xl select-none animate-bounce"
              style={{ animationDuration: '2.5s' }}
              role="img"
              aria-label="Fresh carrot"
            >
              🥕
            </span>
            <span
              className="absolute -bottom-1 -left-1 text-xl select-none"
              role="img"
              aria-label="Grain ear"
            >
              🌾
            </span>
          </div>

          {/* 404 PILL OVERLAY */}
          <div className="absolute -bottom-2 bg-[#C05E44] text-white text-[11px] md:text-xs font-medium uppercase tracking-[1.5px] px-3.5 py-1 rounded-full shadow-xs border-2 border-white font-display">
            404 · Page Not Found
          </div>
        </div>

        {/* =========================================================
            2. HEADLINE & EXPLANATORY PROSE
        ========================================================= */}
        <h1 className="text-2xl md:text-4xl font-semibold text-[#2D3748] tracking-tight mt-4 mb-3 font-display">
          Whoops! This Harvest Trail Has Gone Cold
        </h1>
        <p className="text-sm md:text-base text-[#718096] max-w-lg mx-auto leading-relaxed mb-8 font-sans">
          The crop or page you are looking for might have been harvested, moved to another patch,
          or the link has a slight typo. Let&apos;s get you back on track!
        </p>

        {/* =========================================================
            3. INLINE PRODUCE SEARCH BAR
        ========================================================= */}
        <form
          onSubmit={handleSearchSubmit}
          className="max-w-md mx-auto mb-8 relative flex items-center shadow-xs rounded-full overflow-hidden border border-[#E2E8F0] focus-within:border-[#0F3024] focus-within:ring-1 focus-within:ring-[#0F3024] bg-white transition-all font-sans"
        >
          <div className="pl-4 text-[#718096]">
            <FiSearch className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search fresh tomatoes, yam, honey..."
            className="w-full py-3 px-3 text-xs md:text-sm text-[#2D3748] placeholder-[#718096] bg-transparent focus:outline-none"
            aria-label="Search produce"
          />
          <button
            type="submit"
            className="bg-[#0F3024] hover:bg-[#153426] text-white text-xs md:text-sm font-medium px-5 py-3 transition-colors cursor-pointer flex-shrink-0"
          >
            Search
          </button>
        </form>

        {/* =========================================================
            4. PRIMARY ACTION BUTTONS
        ========================================================= */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-10 font-sans">
          {/* RETURN HOME */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-[#0F3024] hover:bg-[#153426] text-white font-medium text-xs md:text-sm py-3 px-6 rounded-full transition-all shadow-xs hover:shadow active:scale-98"
          >
            <FiHome className="w-4 h-4" />
            <span>Return to Store</span>
          </Link>

          {/* BROWSE ALL PRODUCTS */}
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-[#C05E44] hover:bg-[#a84f37] text-white font-medium text-xs md:text-sm py-3 px-6 rounded-full transition-all shadow-xs hover:shadow active:scale-98"
          >
            <FiShoppingBag className="w-4 h-4" />
            <span>Browse All Harvests</span>
          </Link>

          {/* GO BACK */}
          <button
            type="button"
            onClick={handleGoBack}
            className="inline-flex items-center gap-2 bg-white hover:bg-[#FAFAFA] border border-[#E2E8F0] text-[#2D3748] font-medium text-xs md:text-sm py-3 px-5 rounded-full transition-all cursor-pointer active:scale-98"
          >
            <FiArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
        </div>

        {/* =========================================================
            5. POPULAR CATEGORY PATHFINDERS
        ========================================================= */}
        <div className="border-t border-gray-200/80 pt-8 mb-8">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center justify-center gap-1.5">
            <FiCompass className="w-3.5 h-3.5 text-emerald-700" />
            <span>Quick Shortcuts to Popular Produce</span>
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-xl mx-auto">
            {QUICK_CATEGORIES.map((category) => (
              <Link
                key={category.name}
                href={category.href}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-emerald-50 border border-gray-200 hover:border-emerald-300 text-xs font-semibold text-gray-700 hover:text-emerald-900 transition-all shadow-2xs hover:shadow-xs"
              >
                <span>{category.emoji}</span>
                <span>{category.name}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* =========================================================
            6. ORDER LOOKUP & ASSISTANCE CARD
        ========================================================= */}
        <div className="max-w-md mx-auto p-4 rounded-2xl bg-white border border-gray-200/80 shadow-2xs text-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0 text-lg">
              <FiPackage />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900">Looking for an existing order?</p>
              <p className="text-[11px] text-gray-500">Track shipment progress in your account</p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Link
              href="/dashboard"
              className="text-center w-full sm:w-auto text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3.5 py-2 rounded-xl transition-colors whitespace-nowrap"
            >
              My Orders
            </Link>
            <a
              href="https://wa.me/2348004463276?text=Hello%20GGN%20Farm%20Desk,%20I%20hit%20a%20broken%20link%20and%20need%20assistance."
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Contact farm desk on WhatsApp"
              className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:text-emerald-700 hover:bg-gray-50 transition-colors"
              title="WhatsApp Farm Support Desk"
            >
              <FiMessageCircle className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
