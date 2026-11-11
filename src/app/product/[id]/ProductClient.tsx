'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/types';
import { formatNaira } from '@/utils/format';
import { FEATURES } from '@/config/features';
import { FiShare2, FiChevronDown, FiShoppingCart } from 'react-icons/fi';
import QuickAddModal from '@/components/QuickAddModal';

interface ProductClientProps {
  product: Product;
  relatedProducts: Product[];
}

export default function ProductClient({ product, relatedProducts }: ProductClientProps) {
  const { addToCart } = useCart();
  const { toast } = useToast();

  const [quantity, setQuantity] = useState(1);
  const [purchaseMode, setPurchaseMode] = useState<'standard' | 'group'>('standard');

  // Quick Add Modal state for suggested products
  const [quickAddProduct, setQuickAddProduct] = useState<Product | null>(null);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  // All product images
  const allImages: string[] = useMemo(() => {
    return [product.image_url, ...(product.additional_images || [])].filter(
      (img): img is string => Boolean(img)
    );
  }, [product.image_url, product.additional_images]);

  // Image Carousel state & gestures
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const isDragging = useRef<boolean>(false);
  const mouseStartX = useRef<number | null>(null);

  // Auto-slide next and previous actions
  const nextSlide = useCallback(() => {
    if (allImages.length <= 1) return;
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  }, [allImages.length]);

  const prevSlide = useCallback(() => {
    if (allImages.length <= 1) return;
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  }, [allImages.length]);

  // Continuous Auto-Slide Timer (every 3.5s, pauses on hover/touch)
  useEffect(() => {
    if (allImages.length <= 1 || isPaused) return;

    timerRef.current = setInterval(() => {
      nextSlide();
    }, 3500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [allImages.length, isPaused, nextSlide, currentImageIndex]);

  // Bidirectional Touch Swiping
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    setIsPaused(false);
    if (touchStartX.current === null || touchEndX.current === null) return;
    const distance = touchStartX.current - touchEndX.current;
    if (distance > 40) {
      nextSlide();
    } else if (distance < -40) {
      prevSlide();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Bidirectional Mouse Dragging (for desktop swipe)
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    mouseStartX.current = e.clientX;
    setIsPaused(true);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDragging.current || mouseStartX.current === null) return;
    const distance = mouseStartX.current - e.clientX;
    if (distance > 40) {
      nextSlide();
    } else if (distance < -40) {
      prevSlide();
    }
    isDragging.current = false;
    mouseStartX.current = null;
    setIsPaused(false);
  };

  // Computed Price Type based on threshold and mode
  const computedPriceType: 'standard' | 'bulk' | 'group' = useMemo(() => {
    if (FEATURES.ENABLE_GROUP_BUY && purchaseMode === 'group') return 'group';
    if (product.is_bulk_buy_enabled && product.bulk_threshold && quantity >= product.bulk_threshold) {
      return 'bulk';
    }
    return 'standard';
  }, [purchaseMode, product.is_bulk_buy_enabled, product.bulk_threshold, quantity]);

  // Current active unit price
  const currentUnitPrice = useMemo(() => {
    if (computedPriceType === 'bulk') {
      return product.bulk_buy_price ?? product.price_per_unit;
    }
    if (computedPriceType === 'group') {
      return product.group_buy_price ?? product.price_per_unit;
    }
    return product.price_per_unit;
  }, [computedPriceType, product]);

  // Baseline price for discount calculations
  const baselinePrice = useMemo(() => {
    if (product.original_price && product.original_price > currentUnitPrice) {
      return product.original_price;
    }
    if (computedPriceType === 'bulk' && product.price_per_unit > currentUnitPrice) {
      return product.price_per_unit;
    }
    return null;
  }, [product.original_price, product.price_per_unit, currentUnitPrice, computedPriceType]);

  const isDiscountActive = Boolean(baselinePrice && baselinePrice > currentUnitPrice);

  const activeDiscountPercent = useMemo(() => {
    if (!isDiscountActive || !baselinePrice) return 0;
    return Math.round(((baselinePrice - currentUnitPrice) / baselinePrice) * 100);
  }, [isDiscountActive, baselinePrice, currentUnitPrice]);

  const handleModeSelect = (mode: 'standard' | 'group') => {
    setPurchaseMode(mode);
    if (mode === 'group') {
      setQuantity(1);
    }
  };

  const handleQuantityChange = (newQty: number) => {
    if (purchaseMode === 'group') return;
    if (isNaN(newQty)) return;
    let clamped = Math.max(1, Math.min(newQty, product.stock_quantity || 99));
    setQuantity(clamped);
  };

  const handleAddToCart = () => {
    addToCart({
      productId: product.id,
      name: product.name,
      image: product.image_url || '',
      quantity,
      purchaseType: computedPriceType,
      priceAtAddition: currentUnitPrice,
      originalPrice: baselinePrice || null,
      discountPercent: isDiscountActive && activeDiscountPercent > 0 ? activeDiscountPercent : null,
    });
    toast.success(`Added ${quantity}x ${product.name} to your cart!`);
  };

  const handleShare = async () => {
    if (typeof window !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `Check out ${product.name} on Green Grown Natural!`,
          url: window.location.href,
        });
        return;
      } catch {
        // User cancelled or unsupported
      }
    }
    if (typeof window !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Product link copied to clipboard!');
    }
  };

  const isGroupFull =
    (product.current_group_buyers ?? 0) >= (product.group_threshold || 1);

  return (
    <div className="min-h-screen bg-white py-8 px-4 sm:px-6 lg:px-12">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-14 mb-16 items-start">
          {/* =========================================================
              LEFT COLUMN: CONTINUOUS AUTO-SLIDING & SWIPABLE CAROUSEL
              (Zero arrow pointers, swipable in both directions)
          ========================================================= */}
          <div className="flex flex-col gap-3">
            {/* HERO SLIDING TRACK CONTAINER */}
            <div
              className="relative w-full aspect-square rounded-3xl overflow-hidden bg-gray-50 border border-gray-100 shadow-sm group select-none cursor-grab active:cursor-grabbing"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => {
                setIsPaused(false);
                isDragging.current = false;
              }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
            >
              {/* SLIDING TRACK */}
              <div
                className="flex w-full h-full transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
              >
                {allImages.length > 0 ? (
                  allImages.map((img, idx) => (
                    <div key={idx} className="relative w-full h-full flex-shrink-0">
                      <Image
                        src={img}
                        alt={`${product.name} - slide ${idx + 1}`}
                        fill
                        priority={idx === 0}
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover pointer-events-none"
                        draggable={false}
                      />
                    </div>
                  ))
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                    No Image Available
                  </div>
                )}
              </div>

              {/* DISCOUNT BADGE (Top-Left) */}
              {isDiscountActive && activeDiscountPercent > 0 && (
                <div className="absolute top-4 left-4 bg-[#D93F3F] text-white text-xs font-black px-2.5 py-1 rounded shadow-sm z-10 pointer-events-none">
                  -{activeDiscountPercent}%
                </div>
              )}

              {/* BULK BUY BADGE (Top-Right) */}
              {computedPriceType === 'bulk' && (
                <div className="absolute top-4 right-4 bg-orange-600 text-white text-xs font-bold px-2.5 py-1 rounded shadow-sm z-10 flex items-center gap-1 pointer-events-none">
                  🔥 Bulk Buy
                </div>
              )}

              {/* SUBTLE PROGRESS DOTS (Bottom Center) */}
              {allImages.length > 1 && (
                <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/30 backdrop-blur-xs px-2.5 py-1 rounded-full z-10 pointer-events-none">
                  {allImages.map((_, idx) => (
                    <span
                      key={idx}
                      className={`transition-all duration-300 rounded-full ${
                        currentImageIndex === idx
                          ? 'w-4 h-1.5 bg-white'
                          : 'w-1.5 h-1.5 bg-white/60'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* SYNCHRONIZED THUMBNAIL GALLERY */}
            {allImages.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`relative w-16 h-16 rounded-2xl overflow-hidden border-2 flex-shrink-0 transition-all cursor-pointer ${
                      currentImageIndex === idx
                        ? 'border-[#FA5400] ring-2 ring-[#FA5400]/20 scale-102 shadow-xs'
                        : 'border-gray-200 hover:border-gray-400 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      fill
                      sizes="64px"
                      className="object-cover pointer-events-none"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* =========================================================
              RIGHT COLUMN: PRODUCT DETAILS & TEMU ACTION AREA
          ========================================================= */}
          <div className="flex flex-col pt-1">
            {/* TITLE & SHARE BUTTON */}
            <div className="flex items-start justify-between gap-4 mb-2">
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-snug">
                {product.name}
              </h1>
              <button
                type="button"
                onClick={handleShare}
                aria-label="Share product"
                className="p-2 rounded-full border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors flex-shrink-0 shadow-2xs cursor-pointer"
              >
                <FiShare2 className="w-5 h-5" />
              </button>
            </div>

            {/* TEMU SOCIAL PROOF & RATING ROW */}
            <div className="flex items-center justify-between flex-wrap gap-2 text-xs mb-3">
              <div className="flex items-center gap-1 text-gray-600 font-medium">
                <span>100+ sold</span>
                <span>|</span>
                <span className="text-gray-800 font-semibold">Sold by Green Grown Natural</span>
                <span className="text-gray-400 text-sm">›</span>
              </div>

              <div className="flex items-center gap-1 font-bold text-gray-900">
                <span>4.8</span>
                <span className="text-amber-500 tracking-tighter">★★★★★</span>
              </div>
            </div>

            {/* TEMU LAUREL RANKING BADGE */}
            <div className="mb-4">
              <div className="inline-flex items-center gap-1.5 bg-[#FFF4EB] border border-[#FFE0CC] text-[#C25E00] text-xs font-bold px-3 py-1.5 rounded-lg shadow-2xs">
                <span>🌾</span>
                <span>#1 Best-Selling Item</span>
                <span>in {product.category || 'Agro Produce'}</span>
                <span className="text-sm leading-none ml-0.5">›</span>
              </div>
            </div>

            {/* =========================================================
                TEMU PRICING ROW:
                1. Strikethrough Normal Price (FIRST)
                2. Discounted Price (SECOND)
                3. Discount Tag Box (THIRD)
            ========================================================= */}
            <div className="flex items-baseline flex-wrap gap-3 mb-5">
              {/* 1. CANCELLED NORMAL PRICE */}
              {isDiscountActive && baselinePrice && (
                <span className="text-xl md:text-2xl font-bold text-gray-400 line-through">
                  {formatNaira(baselinePrice)}
                </span>
              )}

              {/* 2. CURRENT ACTIVE PRICE */}
              <span className="text-3xl md:text-4xl font-black text-gray-900">
                {formatNaira(currentUnitPrice)}
                <span className="text-sm font-semibold text-gray-500 ml-1">
                  /{product.unit || 'kg'}
                </span>
              </span>

              {/* 3. ORANGE DISCOUNT BOX TAG */}
              {isDiscountActive && activeDiscountPercent > 0 && (
                <span className="text-xs font-bold text-[#FA5400] border border-[#FA5400] bg-[#FFF8F2] rounded-md px-2 py-0.5">
                  {activeDiscountPercent}% OFF
                </span>
              )}
            </div>

            {/* SERVICE & QUALITY GUARANTEE BANNER */}
            <div className="mb-6 bg-[#FFF8F2] border border-[#FFE7D6] rounded-2xl p-3.5 flex items-center justify-between text-xs font-bold text-gray-800 shadow-2xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-emerald-700 flex items-center gap-1">
                  <span className="text-sm font-bold">✓</span> 100% Farm Fresh Guarantee
                </span>
                <span className="text-gray-300">|</span>
                <span className="text-emerald-700 flex items-center gap-1">
                  <span className="text-sm font-bold">✓</span> Same-Day Harvest & Fast Delivery
                </span>
              </div>
              <span className="text-gray-400 text-sm font-black">›</span>
            </div>

            {/* PRODUCT DESCRIPTION */}
            <p className="text-sm text-gray-600 leading-relaxed mb-6">
              {product.description ||
                'Fresh, organically cultivated, and packed with essential nutrients directly from trusted local farms.'}
            </p>

            {/* GROUP BUY MODE SWITCH (If Feature Enabled) */}
            {FEATURES.ENABLE_GROUP_BUY && product.is_group_buy_enabled && (
              <div className="flex gap-2 mb-6">
                <button
                  type="button"
                  onClick={() => handleModeSelect('standard')}
                  className={`flex-1 py-2.5 px-2 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                    purchaseMode === 'standard'
                      ? 'bg-[#1A4331] text-white shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Standard & Bulk Buy
                </button>

                <button
                  type="button"
                  onClick={() => !isGroupFull && handleModeSelect('group')}
                  disabled={isGroupFull}
                  className={`flex-1 py-2.5 px-2 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                    purchaseMode === 'group'
                      ? 'bg-[#FA5400] text-white shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  } ${isGroupFull ? 'opacity-50 cursor-not-allowed border border-gray-300' : ''}`}
                >
                  {isGroupFull ? 'Campaign Full' : 'Join Group Buy'}
                </button>
              </div>
            )}

            {/* =========================================================
                PURCHASE OPTION CARDS (Standard vs Bulk Buy)
            ========================================================= */}
            {purchaseMode === 'standard' &&
              product.is_bulk_buy_enabled &&
              product.bulk_threshold && (
                <div className="mb-6">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-2.5">
                    Choose Purchase Option:
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {/* STANDARD OPTION CARD */}
                    <button
                      type="button"
                      onClick={() => {
                        if (quantity >= (product.bulk_threshold || 2)) {
                          setQuantity(1);
                        }
                      }}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        computedPriceType === 'standard'
                          ? 'border-[#FA5400] bg-[#FFF8F2] shadow-xs ring-1 ring-[#FA5400]'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-gray-900">Standard</span>
                        {computedPriceType === 'standard' && (
                          <span className="w-4 h-4 rounded-full bg-[#FA5400] text-white flex items-center justify-center text-[10px] font-bold">
                            ✓
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-gray-900">
                        {formatNaira(product.price_per_unit)}
                        <span className="text-[10px] font-medium text-gray-500">
                          /{product.unit || 'kg'}
                        </span>
                      </p>
                      <p className="text-[10px] text-gray-500 mt-0.5">Single unit orders</p>
                    </button>

                    {/* BULK BUY OPTION CARD */}
                    <button
                      type="button"
                      onClick={() => {
                        setQuantity(product.bulk_threshold || 2);
                      }}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        computedPriceType === 'bulk'
                          ? 'border-[#FA5400] bg-[#FFF8F2] shadow-xs ring-1 ring-[#FA5400]'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-gray-900 flex items-center gap-1">
                          🔥 Bulk Buy
                        </span>
                        {computedPriceType === 'bulk' && (
                          <span className="w-4 h-4 rounded-full bg-[#FA5400] text-white flex items-center justify-center text-[10px] font-bold">
                            ✓
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-[#FA5400]">
                        {formatNaira(product.bulk_buy_price || product.price_per_unit)}
                        <span className="text-[10px] font-medium text-gray-500">
                          /{product.unit || 'kg'}
                        </span>
                      </p>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        Min {product.bulk_threshold} {product.unit || 'units'}
                      </p>
                    </button>
                  </div>
                </div>
              )}

            {/* =========================================================
                TEMU QUANTITY SELECTOR (Qty [ 1 ▼ ] + Quick Stepper)
            ========================================================= */}
            <div className="mb-6">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-gray-700">Qty</span>

                {/* STYLED DROPDOWN */}
                <div className="relative">
                  <select
                    id="product-qty-select"
                    value={quantity}
                    onChange={(e) => handleQuantityChange(Number(e.target.value))}
                    disabled={purchaseMode === 'group'}
                    className="appearance-none bg-white border border-gray-300 rounded-xl pl-3.5 pr-8 py-2 text-sm font-bold text-gray-900 hover:border-gray-400 focus:outline-none focus:border-[#FA5400] cursor-pointer shadow-2xs disabled:bg-gray-100"
                  >
                    {Array.from(
                      { length: Math.min(25, product.stock_quantity || 10) },
                      (_, i) => i + 1
                    ).map((q) => (
                      <option key={q} value={q}>
                        {q}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                    <FiChevronDown className="w-4 h-4" />
                  </div>
                </div>

                {/* QUICK STEPPER BUTTONS */}
                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-gray-50 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= 1 || purchaseMode === 'group'}
                    className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-transparent transition-colors font-bold text-base cursor-pointer"
                  >
                    −
                  </button>
                  <span className="w-9 text-center text-xs font-bold text-gray-900">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(quantity + 1)}
                    disabled={quantity >= product.stock_quantity || purchaseMode === 'group'}
                    className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-transparent transition-colors font-bold text-base cursor-pointer"
                  >
                    +
                  </button>
                </div>

                {/* STOCK STATUS */}
                <span className="text-xs font-medium text-gray-500">
                  {product.stock_quantity > 0 ? (
                    product.stock_quantity <= 5 ? (
                      <span className="text-[#D93F3F] font-bold">
                        Only {product.stock_quantity} left in stock!
                      </span>
                    ) : (
                      <span>{product.stock_quantity} units available</span>
                    )
                  ) : (
                    <span className="text-red-500 font-bold">Out of stock</span>
                  )}
                </span>
              </div>
            </div>

            {/* =========================================================
                TEMU DYNAMIC "ADD TO CART" CALL-TO-ACTION
            ========================================================= */}
            <div className="space-y-3">
              {/* LIVE SUBTOTAL */}
              <div className="flex justify-between items-baseline px-1">
                <span className="text-xs font-semibold text-gray-500">Subtotal</span>
                <span className="text-xl font-black text-gray-900">
                  {formatNaira(currentUnitPrice * quantity)}
                </span>
              </div>

              {/* DYNAMIC ACTION BUTTON */}
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={product.stock_quantity < 1 || (purchaseMode === 'group' && isGroupFull)}
                className="w-full bg-[#FA5400] hover:bg-[#E04B00] text-white font-bold text-base md:text-lg py-4 px-8 rounded-full transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.99] disabled:bg-gray-300 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
              >
                {product.stock_quantity < 1 ? (
                  'Out of Stock'
                ) : purchaseMode === 'group' && isGroupFull ? (
                  'Campaign Full'
                ) : isDiscountActive && activeDiscountPercent > 0 ? (
                  `-${activeDiscountPercent}% now! Add to cart!`
                ) : (
                  'Add to cart'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* =========================================================
            CROSS-CATEGORY SUGGESTED PRODUCTS ("You Might Also Like")
            Expanded recommendations across diverse categories
        ========================================================= */}
        {relatedProducts.length > 0 && (
          <div className="pt-10 border-t border-gray-100">
            <div className="flex items-end justify-between mb-6">
              <div>
                <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
                  You Might Also Like
                </h2>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  Handpicked farm-fresh harvests across our store
                </p>
              </div>
              <Link
                href="/products"
                className="text-xs font-bold text-[#1A4331] hover:underline flex items-center gap-1"
              >
                View Catalog <span className="text-sm">›</span>
              </Link>
            </div>

            {/* EXPANDED RESPONSIVE GRID */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
              {relatedProducts.map((related) => {
                const relatedDiscount =
                  related.original_price && related.original_price > related.price_per_unit
                    ? Math.round(
                        (((related.original_price - related.price_per_unit) /
                          related.original_price) *
                          100)
                      )
                    : 0;

                return (
                  <Link
                    key={related.id}
                    href={`/product/${related.id}`}
                    className="group cursor-pointer block bg-white rounded-2xl p-2 md:p-3 border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-300"
                  >
                    {/* PRODUCT IMAGE CONTAINER */}
                    <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-gray-50 mb-2.5">
                      {related.image_url ? (
                        <Image
                          src={related.image_url}
                          alt={related.name}
                          fill
                          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-500 pointer-events-none"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                          No Img
                        </div>
                      )}

                      {/* DISCOUNT BADGE */}
                      {relatedDiscount > 0 && (
                        <div className="absolute top-2 left-2 bg-[#D93F3F] text-white text-[9px] md:text-[10px] font-black px-2 py-0.5 rounded shadow-2xs z-10">
                          -{relatedDiscount}%
                        </div>
                      )}

                      {/* CATEGORY TAG */}
                      <div className="absolute bottom-2 left-2 z-10">
                        <span className="bg-black/60 backdrop-blur-xs text-white text-[8px] md:text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                          {related.category || 'Produce'}
                        </span>
                      </div>
                    </div>

                    {/* PRODUCT DETAILS */}
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-xs md:text-sm text-gray-900 truncate group-hover:text-[#FA5400] transition-colors">
                          {related.name}
                        </p>

                        <div className="flex items-baseline gap-1 mt-0.5 flex-wrap">
                          <span className="font-black text-xs md:text-sm text-gray-900">
                            {formatNaira(related.price_per_unit)}
                            <span className="text-[9px] text-gray-500 font-medium">
                              /{related.unit || 'kg'}
                            </span>
                          </span>

                          {related.original_price &&
                            related.original_price > related.price_per_unit && (
                              <span className="text-[9px] text-gray-400 line-through">
                                {formatNaira(related.original_price)}
                              </span>
                            )}
                        </div>
                      </div>

                      {/* QUICK ADD BUTTON */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setQuickAddProduct(related);
                          setIsQuickAddOpen(true);
                        }}
                        aria-label={`Select options and add ${related.name} to cart`}
                        className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gray-100 hover:bg-[#FA5400] text-gray-700 hover:text-white flex items-center justify-center transition-all duration-200 shadow-2xs flex-shrink-0 active:scale-90 cursor-pointer"
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

      {/* QUICK ADD MODAL FOR SUGGESTED PRODUCTS */}
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
