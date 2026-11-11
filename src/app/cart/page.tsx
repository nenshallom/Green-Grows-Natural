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
      <div className="min-h-screen bg-[#FDFDFD] py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto flex flex-col items-center justify-center text-center">
          <div className="text-6xl mb-4 select-none">🛒</div>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-2">
            Your shopping basket is empty
          </h2>
          <p className="text-gray-500 text-sm max-w-sm mb-6 leading-relaxed">
            Looks like you have not added any fresh farm produce to your cart yet. Explore our
            seasonal harvests today!
          </p>
          <Link
            href="/"
            className="bg-[#1A4331] hover:bg-[#123023] text-white font-bold py-3.5 px-8 rounded-full shadow-md hover:shadow-lg transition-all active:scale-95 text-sm"
          >
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  // =========================================================
  // ACTIVE TEMU-STYLE CART LAYOUT
  // =========================================================
  return (
    <div className="min-h-screen bg-[#F8F9FA] py-6 px-4 sm:px-6 lg:px-12 text-gray-900">
      <div className="max-w-7xl mx-auto">
        {/* BREADCRUMB */}
        <nav className="text-xs text-gray-500 mb-4 flex items-center gap-1.5 font-medium">
          <Link href="/" className="hover:text-gray-800 transition-colors">
            Home
          </Link>
          <span>›</span>
          <span className="text-gray-800 font-bold">Cart</span>
        </nav>

        {/* 2-COLUMN TEMU LAYOUT */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* =========================================================
              LEFT COLUMN: INCENTIVE, SELECT ALL, CART ITEMS & EXPLORE
          ========================================================= */}
          <div className="w-full lg:w-[67%] space-y-4">
            {/* INCENTIVE PROMOTIONAL BANNER */}
            <div className="bg-[#EBF7EE] text-[#1A4331] border border-[#D5EED8] rounded-xl px-4 py-3 flex items-center justify-between text-xs font-semibold shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black">
                  ✓
                </span>
                <span>Free shipping special for you</span>
              </div>
              <span className="text-gray-500 font-normal">Limited-time offer</span>
            </div>

            {/* WHITE CART CONTAINER */}
            <div className="bg-white rounded-2xl p-4 md:p-6 shadow-2xs border border-gray-100">
              {/* SELECT ALL BAR */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-2">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    aria-label="Select all items"
                    className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                      isAllSelected
                        ? 'bg-black text-white'
                        : 'border-2 border-gray-300 hover:border-gray-500 bg-white'
                    }`}
                  >
                    {isAllSelected && <FiCheck className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>
                  <span className="text-sm font-bold text-gray-900">
                    Select all ({cartItems.length})
                  </span>
                </div>

                <button
                  type="button"
                  onClick={clearCart}
                  className="text-xs text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                >
                  Clear all
                </button>
              </div>

              {/* CART ITEMS LIST */}
              <div className="divide-y divide-gray-100">
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
                      className="py-4 flex items-start gap-3 md:gap-4 transition-colors"
                    >
                      {/* CIRCULAR SELECTION TOGGLE */}
                      <button
                        type="button"
                        onClick={() => toggleSelectItem(itemKey)}
                        aria-label={`Select ${item.name}`}
                        className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors flex-shrink-0 mt-7 cursor-pointer ${
                          isSelected
                            ? 'bg-black text-white'
                            : 'border-2 border-gray-300 hover:border-gray-500 bg-white'
                        }`}
                      >
                        {isSelected && <FiCheck className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>

                      {/* PRODUCT THUMBNAIL */}
                      <Link
                        href={`/product/${item.productId}`}
                        className="relative w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0 block group"
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
                          <div className="w-full h-full flex items-center justify-center text-gray-300 text-[10px]">
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
                            className="font-medium text-xs md:text-sm text-gray-900 leading-snug line-clamp-2 hover:text-[#FA5400] transition-colors"
                          >
                            {item.name}
                          </Link>

                          <button
                            type="button"
                            onClick={() => removeFromCart(item.productId, item.purchaseType)}
                            aria-label={`Remove ${item.name}`}
                            className="text-gray-400 hover:text-gray-700 p-1 rounded-md transition-colors flex-shrink-0 cursor-pointer"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Mode / Variant subtitle */}
                        <div className="mb-2">
                          {item.purchaseType === 'bulk' && (
                            <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              🔥 Bulk Purchase Deal
                            </span>
                          )}
                          {item.purchaseType === 'group' && (
                            <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              🤝 Group Buy Campaign
                            </span>
                          )}
                          {item.purchaseType === 'standard' && (
                            <span className="text-[11px] text-gray-500">
                              Standard Farm Harvest
                            </span>
                          )}
                        </div>

                        {/* Price & Quantity Row */}
                        <div className="flex items-end justify-between flex-wrap gap-2 pt-1">
                          {/* PRICING SEQUENCE */}
                          <div className="flex items-baseline gap-1.5 flex-wrap">
                            <span className="text-sm md:text-base font-black text-gray-900">
                              {formatNaira(item.priceAtAddition)}
                            </span>

                            {hasDiscount && (
                              <span className="text-xs text-gray-400 line-through">
                                {formatNaira(item.originalPrice)}
                              </span>
                            )}

                            {discountPercent > 0 && (
                              <span className="text-[10px] font-bold text-[#FA5400] border border-[#FA5400] bg-[#FFF8F2] px-1.5 py-0.2 rounded">
                                -{discountPercent}%
                              </span>
                            )}
                          </div>

                          {/* TEMU QTY DROPDOWN SELECTOR */}
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
                              className="appearance-none bg-white border border-gray-300 rounded-lg pl-2.5 pr-7 py-1 text-xs font-bold text-gray-900 hover:border-gray-400 focus:outline-none focus:border-[#FA5400] cursor-pointer shadow-2xs disabled:bg-gray-100"
                            >
                              {Array.from({ length: 20 }, (_, i) => i + 1).map((q) => (
                                <option key={q} value={q}>
                                  Qty {q}
                                </option>
                              ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-gray-500">
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
                <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-600 flex items-center gap-1.5">
                  <FiInfo className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span>Can&apos;t find your items?</span>
                  <Link
                    href="/login"
                    className="text-[#FA5400] font-bold hover:underline"
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
              <div className="pt-4">
                <h3 className="text-base md:text-lg font-black text-gray-900 mb-3 tracking-tight">
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
                        className="bg-white rounded-xl p-2.5 border border-gray-100 hover:shadow-sm transition-all block group"
                      >
                        <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-gray-50 mb-2">
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
                            <div className="absolute top-1.5 left-1.5 bg-[#D93F3F] text-white text-[9px] font-black px-1.5 py-0.5 rounded">
                              -{discount}%
                            </div>
                          )}
                        </div>

                        <div className="flex items-start justify-between gap-1">
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-xs text-gray-900 truncate">
                              {p.name}
                            </p>
                            <span className="font-black text-xs text-gray-900">
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
                            className="w-6 h-6 rounded-full bg-gray-100 hover:bg-[#FA5400] text-gray-700 hover:text-white flex items-center justify-center transition-colors flex-shrink-0 cursor-pointer"
                          >
                            <FiShoppingCart className="w-3 h-3" />
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
            <div className="bg-white rounded-2xl p-5 shadow-2xs border border-gray-100">
              {/* ITEM(S) DISCOUNT */}
              {totalDiscount > 0 && (
                <div className="flex items-center justify-between text-xs font-semibold mb-3">
                  <span className="text-gray-600">Item(s) discount:</span>
                  <span className="text-[#FA5400] font-bold">
                    −{formatNaira(totalDiscount)}
                  </span>
                </div>
              )}

              {/* TOTAL AMOUNT */}
              <div className="flex items-baseline justify-between pt-1 mb-1">
                <span className="text-base font-extrabold text-gray-900">Total</span>
                <span className="text-2xl font-black text-gray-900">
                  {formatNaira(selectedTotal)}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 mb-5 leading-tight">
                Please refer to your final actual payment amount.
              </p>

              {/* VIBRANT TEMU CHECKOUT BUTTON */}
              <button
                type="button"
                onClick={handleCheckout}
                disabled={isCheckingOut || selectedItems.length === 0}
                className="w-full bg-[#FA5400] hover:bg-[#E04B00] text-white font-bold text-base py-3.5 px-6 rounded-full transition-all shadow-md hover:shadow-lg active:scale-[0.99] disabled:bg-gray-300 disabled:cursor-not-allowed cursor-pointer"
              >
                {isCheckingOut
                  ? 'Verifying Cart...'
                  : selectedItems.length === 0
                  ? 'Select Items to Checkout'
                  : `Checkout (${selectedCount})`}
              </button>

              {/* PRICING DISCLAIMERS */}
              <div className="space-y-2 mt-4 pt-4 border-t border-gray-100 text-[11px] text-gray-500 leading-normal">
                <div className="flex items-start gap-1.5">
                  <FiInfo className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <span>
                    Item availability and pricing are not guaranteed until payment is final.
                  </span>
                </div>
                <div className="flex items-start gap-1.5">
                  <FiLock className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>You will not be charged until you review this order on the next page.</span>
                </div>
              </div>

              {/* SAFE PAYMENT OPTIONS */}
              <div className="mt-5 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 mb-1.5">
                  <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                    ✓
                  </span>
                  <span>Safe Payment Options</span>
                </div>
                <p className="text-[11px] text-gray-500 mb-3 leading-relaxed">
                  GGN is committed to protecting your payment information. We follow PCI DSS
                  standards and use 256-bit SSL encryption.
                </p>

                {/* PAYMENT METHOD BADGES */}
                <div className="mb-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                    1. Payment Methods
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {['Verve', 'VISA', 'Mastercard', 'OPay', 'Paystack', 'Bank Transfer'].map(
                      (method) => (
                        <span
                          key={method}
                          className="bg-gray-50 border border-gray-200 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded shadow-2xs"
                        >
                          {method}
                        </span>
                      )
                    )}
                  </div>
                </div>

                {/* SECURITY BADGES */}
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                    2. Security Certification
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {['256-Bit SSL', 'PCI-DSS Verified', 'SafeKey', 'Fraud Protected'].map(
                      (badge) => (
                        <span
                          key={badge}
                          className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[9px] font-bold px-2 py-0.5 rounded shadow-2xs flex items-center gap-1"
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
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 mb-1">
                  <FiLock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Secure Privacy</span>
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed mb-1">
                  Protecting your privacy is important to us. Your data is kept secure and never
                  shared with third parties.
                </p>
                <Link
                  href="/privacy"
                  className="text-[11px] font-bold text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Learn more ›
                </Link>
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
