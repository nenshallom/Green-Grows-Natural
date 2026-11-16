'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { validateGroupBuyCart } from '@/lib/campaign';
import { formatNaira, getErrorMessage } from '@/utils/format';
import {
  FiCheck,
  FiTrash2,
  FiChevronDown,
  FiLock,
  FiShield,
  FiInfo,
  FiShoppingCart,
} from 'react-icons/fi';
import { Product } from '@/types';
import QuickAddModal from '@/components/QuickAddModal';

export default function CartPage() {
  const { cartItems, removeFromCart, updateQuantity, clearCart } = useCart();
  const { toast } = useToast();
  const router = useRouter();

  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  // Selection state for cart items (all selected by default)
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  // Cross-sell recommended products
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [quickAddProduct, setQuickAddProduct] = useState<Product | null>(null);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  // Sync selected keys with cart items
  useEffect(() => {
    setSelectedKeys(new Set(cartItems.map((i) => `${i.productId}-${i.purchaseType}`)));
  }, [cartItems]);

  // Check login state
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(Boolean(session));
    });
  }, []);

  // Fetch cross-sell recommendations
  useEffect(() => {
    supabase
      .from('products')
      .select('*')
      .limit(6)
      .then(({ data }) => {
        if (data) setRecommendedProducts(data);
      });
  }, []);

  // Selection Helpers
  const isAllSelected = cartItems.length > 0 && selectedKeys.size === cartItems.length;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedKeys(new Set());
    } else {
      setSelectedKeys(new Set(cartItems.map((i) => `${i.productId}-${i.purchaseType}`)));
    }
  };

  const toggleSelectItem = (key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // Calculations for selected items
  const selectedItems = useMemo(() => {
    return cartItems.filter((item) =>
      selectedKeys.has(`${item.productId}-${item.purchaseType}`)
    );
  }, [cartItems, selectedKeys]);

  const selectedTotal = useMemo(() => {
    return selectedItems.reduce(
      (acc, item) => acc + item.priceAtAddition * item.quantity,
      0
    );
  }, [selectedItems]);

  const totalOriginalPrice = useMemo(() => {
    return selectedItems.reduce((acc, item) => {
      const orig =
        item.originalPrice && item.originalPrice > item.priceAtAddition
          ? item.originalPrice
          : item.priceAtAddition;
      return acc + orig * item.quantity;
    }, 0);
  }, [selectedItems]);

  const totalDiscount = Math.max(0, totalOriginalPrice - selectedTotal);
  const selectedCount = selectedItems.reduce((acc, item) => acc + item.quantity, 0);

  // Proceed to Checkout Handler
  const handleCheckout = async () => {
    if (selectedItems.length === 0) {
      toast.warning('Please select at least one item to proceed.');
      return;
    }

    setIsCheckingOut(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const hasGroupBuy = selectedItems.some((item) => item.purchaseType === 'group');

      if (hasGroupBuy && !session?.user) {
        toast.warning('Please log in to proceed with a Group Buy purchase.');
        router.push('/login');
        setIsCheckingOut(false);
        return;
      }

      // Pre-flight campaign validation via shared engine
      const validation = await validateGroupBuyCart(selectedItems, session?.user?.id ?? null);
      if (!validation.valid) {
        toast.error(validation.error || 'Campaign validation failed. Please review your cart.');
        setIsCheckingOut(false);
        return;
      }

      // Save selected item keys to sessionStorage so /checkout processes only the selected items
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(
          'ggn_selected_cart_keys',
          JSON.stringify(Array.from(selectedKeys))
        );
      }

      router.push('/checkout');
    } catch (error) {
      console.error('Cart verification error:', error);
      toast.error(`An error occurred while verifying your cart: ${getErrorMessage(error)}`);
    } finally {
      setIsCheckingOut(false);
    }
  };

  // =========================================================
  // EMPTY BASKET STATE
  // =========================================================
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] font-sans py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto flex flex-col items-center justify-center text-center">
          <div className="text-6xl mb-4 select-none">🛒</div>
          <h2 className="text-2xl md:text-3xl font-medium font-display text-[#2D3748] mb-2">
            Your shopping basket is empty
          </h2>
          <p className="text-[#718096] text-sm max-w-sm mb-6 leading-relaxed">
            Looks like you have not added any fresh farm produce to your cart yet. Explore our
            seasonal harvests today!
          </p>
          <Link
            href="/"
            className="bg-[#0F3024] hover:bg-[#153426] text-white font-medium py-3.5 px-8 rounded-full shadow-xs transition-all active:scale-95 text-sm"
          >
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  // =========================================================
  // ACTIVE CART LAYOUT
  // =========================================================
  return (
    <div className="min-h-screen bg-[#FAFAFA] py-8 px-4 sm:px-6 lg:px-12 text-[#2D3748] font-sans">
      <div className="max-w-7xl mx-auto">
        {/* BREADCRUMB */}
        <nav className="hidden md:flex text-xs text-[#718096] mb-6 items-center gap-1.5 font-normal">
          <Link href="/" className="hover:text-[#0F3024] transition-colors">
            Home
          </Link>
          <span>›</span>
          <span className="text-[#2D3748] font-medium">Cart</span>
        </nav>

        {/* 2-COLUMN LAYOUT */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* =========================================================
              LEFT COLUMN: SELECT ALL, CART ITEMS & EXPLORE
          ========================================================= */}
          <div className="w-full lg:w-[67%] space-y-6">

            {/* WHITE CART CONTAINER */}
            <div className="bg-white rounded-3xl p-5 md:p-8 shadow-xs border border-[#E2E8F0]">
              {/* SELECT ALL BAR */}
              <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0] mb-2">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    aria-label="Select all items"
                    className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                      isAllSelected
                        ? 'bg-[#0F3024] text-white'
                        : 'border-2 border-[#E2E8F0] hover:border-[#0F3024] bg-white'
                    }`}
                  >
                    {isAllSelected && <FiCheck className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>
                  <span className="text-sm font-medium font-display text-[#2D3748]">
                    Select all ({cartItems.length})
                  </span>
                </div>

                <button
                  type="button"
                  onClick={clearCart}
                  className="text-xs text-[#718096] hover:text-[#C05E44] transition-colors cursor-pointer"
                >
                  Clear all
                </button>
              </div>

              {/* CART ITEMS LIST */}
              <div className="divide-y divide-[#E2E8F0]">
                {cartItems.map((item) => {
                  const itemKey = `${item.productId}-${item.purchaseType}`;
                  const isSelected = selectedKeys.has(itemKey);

                  const hasDiscount = Boolean(
                    item.originalPrice && item.originalPrice > item.priceAtAddition
                  );
                  const discountPercent =
                    item.discountPercent ??
                    (hasDiscount
                      ? Math.round(
                          (((item.originalPrice || 0) - item.priceAtAddition) /
                            (item.originalPrice || 1)) *
                            100
                        )
                      : 0);

                  return (
                    <div
                      key={itemKey}
                      className="py-5 flex items-start gap-3 md:gap-4 transition-colors"
                    >
                      {/* CIRCULAR SELECTION TOGGLE */}
                      <button
                        type="button"
                        onClick={() => toggleSelectItem(itemKey)}
                        aria-label={`Select ${item.name}`}
                        className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors flex-shrink-0 mt-7 cursor-pointer ${
                          isSelected
                            ? 'bg-[#0F3024] text-white'
                            : 'border-2 border-[#E2E8F0] hover:border-[#0F3024] bg-white'
                        }`}
                      >
                        {isSelected && <FiCheck className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>

                      {/* PRODUCT THUMBNAIL */}
                      <Link
                        href={`/product/${item.productId}`}
                        className="relative w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden bg-[#FAFAFA] border border-[#E2E8F0] flex-shrink-0 block group"
                      >
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            sizes="96px"
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#718096] text-[10px]">
                            No img
                          </div>
                        )}
                      </Link>

                      {/* PRODUCT DETAILS & PRICING */}
                      <div className="flex-1 min-w-0">
                        {/* Title & Delete Icon */}
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <Link
                            href={`/product/${item.productId}`}
                            className="font-medium font-display text-sm md:text-base text-[#2D3748] leading-snug line-clamp-2 hover:text-[#0F3024] transition-colors"
                          >
                            {item.name}
                          </Link>

                          <button
                            type="button"
                            onClick={() => removeFromCart(item.productId, item.purchaseType)}
                            aria-label={`Remove ${item.name}`}
                            className="text-[#718096] hover:text-[#C05E44] p-1 rounded-md transition-colors flex-shrink-0 cursor-pointer"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Mode / Variant subtitle */}
                        <div className="mb-2">
                          {item.purchaseType === 'bulk' && (
                            <span className="text-[11px] font-medium text-[#0F3024] bg-[#FAFAFA] px-2.5 py-0.5 rounded-full border border-[#E2E8F0] font-display">
                              Bulk Wholesale
                            </span>
                          )}
                          {item.purchaseType === 'group' && (
                            <span className="text-[11px] font-medium text-[#C05E44] bg-[#C05E44]/10 px-2.5 py-0.5 rounded-full border border-[#C05E44]/30 font-display">
                              Group Buy Deal
                            </span>
                          )}
                          {item.purchaseType === 'standard' && (
                            <span className="text-[11px] text-[#718096]">
                              Standard Farm Harvest
                            </span>
                          )}
                        </div>

                        {/* Price & Quantity Row */}
                        <div className="flex items-end justify-between flex-wrap gap-2 pt-1">
                          {/* PRICING SEQUENCE */}
                          <div className="flex items-baseline gap-1.5 flex-wrap font-sans">
                            <span className="text-sm md:text-base font-semibold text-[#C05E44]">
                              {formatNaira(item.priceAtAddition)}
                            </span>

                            {hasDiscount && (
                              <span className="text-xs text-[#718096] line-through">
                                {formatNaira(item.originalPrice)}
                              </span>
                            )}

                            {discountPercent > 0 && (
                              <span className="text-[10px] font-semibold text-[#C05E44] border border-[#C05E44]/30 bg-[#C05E44]/10 px-2 py-0.5 rounded-full">
                                -{discountPercent}%
                              </span>
                            )}
                          </div>

                          {/* QTY DROPDOWN SELECTOR */}
                          <div className="relative">
                            <select
                              value={item.quantity}
                              onChange={(e) =>
                                updateQuantity(
                                  item.productId,
                                  item.purchaseType,
                                  Number(e.target.value)
                                )
                              }
                              disabled={item.purchaseType === 'group'}
                              className="appearance-none bg-white border border-[#E2E8F0] rounded-xl pl-3 pr-7 py-1 text-xs font-medium text-[#2D3748] hover:border-[#0F3024] focus:outline-none focus:border-[#0F3024] cursor-pointer shadow-2xs disabled:bg-gray-100"
                            >
                              {Array.from({ length: 20 }, (_, i) => i + 1).map((q) => (
                                <option key={q} value={q}>
                                  Qty {q}
                                </option>
                              ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-[#718096]">
                              <FiChevronDown className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* SIGN-IN PROMPT (IF GUEST) */}
              {!isLoggedIn && (
                <div className="mt-4 pt-4 border-t border-[#E2E8F0] text-xs text-[#718096] flex items-center gap-1.5 font-sans">
                  <FiInfo className="w-4 h-4 text-[#718096] flex-shrink-0" />
                  <span>Can&apos;t find your items?</span>
                  <Link
                    href="/login"
                    className="text-[#0F3024] font-medium hover:underline"
                  >
                    Sign in to check your cart ›
                  </Link>
                </div>
              )}
            </div>

            {/* =====================================================
                "EXPLORE GGN'S PICKS" (CROSS-SELL RECOMMENDATIONS)
            ===================================================== */}
            {recommendedProducts.length > 0 && (
              <div className="pt-6">
                <h3 className="text-xl md:text-2xl font-medium text-[#0F3024] font-display mb-4 tracking-tight">
                  Explore GGN&apos;s Picks
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
                  {recommendedProducts.map((p) => {
                    const discount =
                      p.original_price && p.original_price > p.price_per_unit
                        ? Math.round(
                            (((p.original_price - p.price_per_unit) / p.original_price) * 100)
                          )
                        : 0;

                    return (
                      <Link
                        key={p.id}
                        href={`/product/${p.id}`}
                        className="bg-white rounded-2xl p-3 border border-[#E2E8F0] hover:shadow-xs transition-all block group"
                      >
                        <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-[#FAFAFA] mb-2.5">
                          {p.image_url && (
                            <Image
                              src={p.image_url}
                              alt={p.name}
                              fill
                              sizes="(max-width: 768px) 50vw, 20vw"
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          )}
                          {discount > 0 && (
                            <div className="absolute top-2 left-2 bg-[#C05E44] text-white text-[9px] font-semibold px-2 py-0.5 rounded-full font-sans">
                              -{discount}%
                            </div>
                          )}
                        </div>

                        <div className="flex items-start justify-between gap-1">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium font-display text-xs text-[#2D3748] truncate">
                              {p.name}
                            </p>
                            <span className="font-semibold text-xs text-[#C05E44] font-sans">
                              {formatNaira(p.price_per_unit)}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setQuickAddProduct(p);
                              setIsQuickAddOpen(true);
                            }}
                            className="w-7 h-7 rounded-full bg-[#FAFAFA] border border-[#E2E8F0] hover:bg-[#0F3024] text-[#2D3748] hover:text-white flex items-center justify-center transition-colors flex-shrink-0 cursor-pointer"
                          >
                            <FiShoppingCart className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* =========================================================
              RIGHT COLUMN: STICKY ORDER SUMMARY & TRUST BADGES
          ========================================================= */}
          <div className="w-full lg:w-[33%] sticky top-24 space-y-4">
            <div className="bg-white rounded-3xl p-6 shadow-xs border border-[#E2E8F0]">
              {/* ITEM(S) DISCOUNT */}
              {totalDiscount > 0 && (
                <div className="flex items-center justify-between text-xs font-normal mb-3 font-sans">
                  <span className="text-[#718096]">Item(s) discount:</span>
                  <span className="text-[#C05E44] font-semibold">
                    −{formatNaira(totalDiscount)}
                  </span>
                </div>
              )}

              {/* TOTAL AMOUNT */}
              <div className="flex items-baseline justify-between pt-1 mb-1 font-sans">
                <span className="text-base font-medium font-display text-[#2D3748]">Total</span>
                <span className="text-2xl font-semibold text-[#C05E44]">
                  {formatNaira(selectedTotal)}
                </span>
              </div>
              <p className="text-[11px] text-[#718096] mb-6 leading-tight font-sans">
                Please refer to your final actual payment amount.
              </p>

              {/* CHECKOUT BUTTON */}
              <button
                type="button"
                onClick={handleCheckout}
                disabled={isCheckingOut || selectedItems.length === 0}
                className="w-full bg-[#0F3024] hover:bg-[#153426] text-white font-medium text-sm py-4 px-6 rounded-full transition-all shadow-xs hover:shadow-md active:scale-[0.99] disabled:bg-gray-300 disabled:cursor-not-allowed cursor-pointer font-sans"
              >
                {isCheckingOut
                  ? 'Verifying Cart...'
                  : selectedItems.length === 0
                  ? 'Select Items to Checkout'
                  : `Checkout (${selectedCount})`}
              </button>

              {/* PRICING DISCLAIMERS */}
              <div className="space-y-2 mt-5 pt-5 border-t border-[#E2E8F0] text-[11px] text-[#718096] leading-normal font-sans">
                <div className="flex items-start gap-1.5">
                  <FiInfo className="w-3.5 h-3.5 text-[#718096] flex-shrink-0 mt-0.5" />
                  <span>
                    Item availability and pricing are not guaranteed until payment is final.
                  </span>
                </div>
                <div className="flex items-start gap-1.5">
                  <FiLock className="w-3.5 h-3.5 text-[#0F3024] flex-shrink-0 mt-0.5" />
                  <span>You will not be charged until you review this order on the next page.</span>
                </div>
              </div>

              {/* SAFE PAYMENT OPTIONS */}
              <div className="mt-5 pt-5 border-t border-[#E2E8F0]">
                <div className="flex items-center gap-1.5 text-xs font-medium text-[#2D3748] mb-2 font-display">
                  <span className="w-4 h-4 rounded-full bg-[#0F3024] text-white flex items-center justify-center text-[10px] font-bold">
                    ✓
                  </span>
                  <span>Safe Payment Options</span>
                </div>
                <p className="text-[11px] text-[#718096] mb-3 leading-relaxed font-sans">
                  GGN is committed to protecting your payment information. We follow PCI DSS
                  standards and use 256-bit SSL encryption.
                </p>

                {/* PAYMENT METHOD BADGES */}
                <div className="mb-3">
                  <span className="text-[10px] font-medium text-[#718096] uppercase tracking-wider block mb-1.5 font-display">
                    1. Payment Methods
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {['Verve', 'VISA', 'Mastercard', 'OPay', 'Paystack', 'Bank Transfer'].map(
                      (method) => (
                        <span
                          key={method}
                          className="bg-[#FAFAFA] border border-[#E2E8F0] text-[#2D3748] text-[10px] font-medium px-2 py-0.5 rounded shadow-2xs font-sans"
                        >
                          {method}
                        </span>
                      )
                    )}
                  </div>
                </div>

                {/* SECURITY BADGES */}
                <div>
                  <span className="text-[10px] font-medium text-[#718096] uppercase tracking-wider block mb-1.5 font-display">
                    2. Security Certification
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {['256-Bit SSL', 'PCI-DSS Verified', 'SafeKey', 'Fraud Protected'].map(
                      (badge) => (
                        <span
                          key={badge}
                          className="bg-[#FAFAFA] text-[#0F3024] border border-[#E2E8F0] text-[9px] font-medium px-2 py-0.5 rounded shadow-2xs flex items-center gap-1 font-sans"
                        >
                          <FiShield className="w-2.5 h-2.5" />
                          {badge}
                        </span>
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* SECURE PRIVACY COMMITMENT */}
              <div className="mt-5 pt-5 border-t border-[#E2E8F0]">
                <div className="flex items-center gap-1.5 text-xs font-medium text-[#2D3748] mb-1 font-display">
                  <FiLock className="w-3.5 h-3.5 text-[#0F3024]" />
                  <span>Secure Privacy</span>
                </div>
                <p className="text-[11px] text-[#718096] leading-relaxed mb-1 font-sans">
                  Protecting your privacy is important to us. Your data is kept secure and never
                  shared with third parties.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK ADD MODAL FOR CROSS-SELL ITEMS */}
      <QuickAddModal
        product={quickAddProduct}
        isOpen={isQuickAddOpen}
        onClose={() => {
          setIsQuickAddOpen(false);
          setQuickAddProduct(null);
        }}
      />
    </div>
  );
}
