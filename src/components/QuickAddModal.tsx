'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FiX, FiShoppingCart, FiChevronDown, FiCheck } from 'react-icons/fi';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { Product } from '@/types';
import { formatNaira } from '@/utils/format';

interface QuickAddModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'standard' | 'bulk';
}

export default function QuickAddModal({
  product,
  isOpen,
  onClose,
  initialMode = 'standard',
}: QuickAddModalProps) {
  const { addToCart } = useCart();
  const { toast } = useToast();

  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedMode, setSelectedMode] = useState<'standard' | 'bulk'>('standard');

  // Sync state whenever the selected product changes or modal opens
  useEffect(() => {
    if (product) {
      setActiveImage(product.image_url || null);
      const isBulkStart =
        initialMode === 'bulk' &&
        Boolean(product.is_bulk_buy_enabled && product.bulk_threshold);
      setSelectedMode(isBulkStart ? 'bulk' : 'standard');
      setQuantity(isBulkStart ? (product.bulk_threshold || 2) : 1);
    }
  }, [product, isOpen, initialMode]);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  // Image list (main + additional images)
  const allImages: string[] = [
    product.image_url,
    ...(product.additional_images || []),
  ].filter((img): img is string => Boolean(img));

  // Discount calculation
  const hasDiscount = Boolean(
    product.original_price && product.original_price > product.price_per_unit
  );
  const discountPercent = hasDiscount
    ? Math.round(
        (((product.original_price || 0) - product.price_per_unit) /
          (product.original_price || 1)) *
          100
      )
    : 0;

  // Bulk buy availability
  const hasBulkBuy = Boolean(
    product.is_bulk_buy_enabled && product.bulk_threshold && product.bulk_buy_price
  );

  const bulkMin = product.bulk_threshold || 2;
  const isBulkActive =
    selectedMode === 'bulk' || (hasBulkBuy && quantity >= bulkMin);

  // Active unit price based on mode/quantity
  const unitPrice =
    isBulkActive && product.bulk_buy_price
      ? product.bulk_buy_price
      : product.price_per_unit;

  const totalPrice = unitPrice * quantity;

  // Quantity boundaries
  const minQuantity = selectedMode === 'bulk' ? bulkMin : 1;
  const maxQuantity = Math.max(minQuantity, product.stock_quantity || 99);

  // Mode selection handler
  const handleModeChange = (mode: 'standard' | 'bulk') => {
    setSelectedMode(mode);
    if (mode === 'bulk') {
      setQuantity(bulkMin);
    } else {
      setQuantity(1);
    }
  };

  // Quantity change handler
  const handleQuantityChange = (newQty: number) => {
    if (isNaN(newQty)) return;
    let clamped = Math.max(minQuantity, Math.min(newQty, maxQuantity));
    setQuantity(clamped);

    // Auto-switch mode based on quantity if bulk buy is available
    if (hasBulkBuy) {
      if (clamped >= bulkMin && selectedMode === 'standard') {
        setSelectedMode('bulk');
      } else if (clamped < bulkMin && selectedMode === 'bulk') {
        setSelectedMode('standard');
      }
    }
  };

  // Dropdown options array (from min to min+19, capped by max)
  const qtyOptions = Array.from(
    { length: Math.min(20, maxQuantity - minQuantity + 1) },
    (_, i) => minQuantity + i
  );

  // Add to cart action
  const handleAddToCart = () => {
    const purchaseType = isBulkActive ? 'bulk' : 'standard';
    const effectiveOriginalPrice = isBulkActive
      ? product.original_price || product.price_per_unit
      : product.original_price || null;

    const calculatedDiscount =
      effectiveOriginalPrice && effectiveOriginalPrice > unitPrice
        ? Math.round(((effectiveOriginalPrice - unitPrice) / effectiveOriginalPrice) * 100)
        : null;

    addToCart({
      productId: product.id,
      name: product.name,
      priceAtAddition: unitPrice,
      originalPrice: effectiveOriginalPrice,
      discountPercent: calculatedDiscount,
      quantity,
      purchaseType,
      image: product.image_url || '',
    });

    toast.success(`Added ${quantity}x ${product.name} to your cart!`);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      {/* MODAL DIALOG CONTAINER */}
      <div
        className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-5 sm:p-7 md:p-8 animate-in zoom-in-95 duration-200 border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* CLOSE 'X' BUTTON */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors z-20"
        >
          <FiX className="w-5 h-5" />
        </button>

        {/* 2-COLUMN LAYOUT (Image on left, details on right) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* =========================================================
              LEFT COLUMN: MAIN IMAGE & THUMBNAIL GALLERY
          ========================================================= */}
          <div className="flex flex-col gap-3">
            {/* LARGE MAIN IMAGE PREVIEW */}
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-gray-50 border border-gray-100">
              {activeImage ? (
                <Image
                  src={activeImage}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 350px"
                  className="object-cover transition-transform duration-500 hover:scale-105"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                  No image available
                </div>
              )}

              {/* DISCOUNT BADGE */}
              {discountPercent > 0 && (
                <div className="absolute top-3 left-3 bg-[#C05E44] text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-xs z-10 font-sans tracking-wide">
                  -{discountPercent}%
                </div>
              )}

              {/* BULK BUY BADGE */}
              {isBulkActive && (
                <div className="absolute top-3 right-3 bg-[#0F3024] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs z-10 flex items-center gap-1 font-sans">
                  Bulk Pricing
                </div>
              )}
            </div>

            {/* THUMBNAILS GALLERY */}
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImage(img)}
                    className={`relative w-14 h-14 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${
                      activeImage === img
                        ? 'border-[#0F3024] ring-2 ring-[#0F3024]/20 scale-102 shadow-xs'
                        : 'border-[#E2E8F0] hover:border-[#718096] opacity-75 hover:opacity-100'
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* =========================================================
              RIGHT COLUMN: PRODUCT DETAILS, OPTIONS & ADD TO CART
          ========================================================= */}
          <div className="flex flex-col pt-1">
            {/* CATEGORY TAG */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#0F3024] bg-[#0F3024]/10 px-2.5 py-0.5 rounded-full font-display">
                {product.category || 'Farm Fresh'}
              </span>
              <span className="text-xs text-[#718096] font-medium font-sans">
                • 100% Inspected Harvest
              </span>
            </div>

            {/* PRODUCT NAME */}
            <h2 className="text-xl md:text-2xl font-medium text-[#2D3748] leading-snug mb-2 font-display">
              {product.name}
            </h2>

            {/* PRICE & DISCOUNT DISPLAY */}
            <div className="flex items-baseline flex-wrap gap-2.5 mb-4 font-sans">
              <span className="text-2xl font-semibold text-[#C05E44]">
                {formatNaira(unitPrice)}
                <span className="text-xs font-normal text-[#718096] ml-0.5">
                  /{product.unit || 'kg'}
                </span>
              </span>

              {hasDiscount && (
                <span className="text-sm text-[#718096] line-through font-normal">
                  {formatNaira(product.original_price)}
                </span>
              )}

              {discountPercent > 0 && (
                <span className="text-[11px] font-bold text-[#C05E44] bg-[#C05E44]/10 border border-[#C05E44]/20 px-2 py-0.5 rounded-full">
                  {discountPercent}% OFF
                </span>
              )}
            </div>

            {/* =====================================================
                OPTIONS / PURCHASE TYPE (Standard vs Bulk Buy)
            ===================================================== */}
            {hasBulkBuy && (
              <div className="mb-4">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-600 block mb-2">
                  Choose Purchase Option:
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {/* STANDARD OPTION */}
                  <button
                    type="button"
                    onClick={() => handleModeChange('standard')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      selectedMode === 'standard'
                        ? 'border-[#0F3024] bg-[#0F3024]/5 shadow-xs ring-1 ring-[#0F3024]'
                        : 'border-[#E2E8F0] hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#2D3748]">Standard</span>
                      {selectedMode === 'standard' && (
                        <FiCheck className="w-3.5 h-3.5 text-[#0F3024]" />
                      )}
                    </div>
                    <p className="text-[11px] font-semibold text-[#0F3024] mt-0.5">
                      {formatNaira(product.price_per_unit)}
                      <span className="text-[9px] text-[#718096]">/{product.unit || 'kg'}</span>
                    </p>
                    <p className="text-[9px] text-[#718096] mt-0.5">Single unit orders</p>
                  </button>

                  {/* BULK BUY OPTION */}
                  <button
                    type="button"
                    onClick={() => handleModeChange('bulk')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      selectedMode === 'bulk'
                        ? 'border-[#0F3024] bg-[#0F3024]/5 shadow-xs ring-1 ring-[#0F3024]'
                        : 'border-[#E2E8F0] hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#2D3748] flex items-center gap-1">
                        Bulk Buy
                      </span>
                      {selectedMode === 'bulk' && (
                        <FiCheck className="w-3.5 h-3.5 text-[#0F3024]" />
                      )}
                    </div>
                    <p className="text-[11px] font-bold text-[#C05E44] mt-0.5">
                      {formatNaira(product.bulk_buy_price)}
                      <span className="text-[9px] text-[#718096]">/{product.unit || 'kg'}</span>
                    </p>
                    <p className="text-[9px] text-[#718096] mt-0.5">
                      Min {bulkMin} {product.unit || 'units'}
                    </p>
                  </button>
                </div>
              </div>
            )}

            {/* =====================================================
                QUANTITY SELECTOR (TEMU STYLE DROPDOWN + STEPPER)
            ===================================================== */}
            <div className="mb-5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-600 block mb-2">
                Quantity
              </label>

              <div className="flex items-center gap-3">
                {/* STYLED DROPDOWN */}
                <div className="relative">
                  <select
                    id="modal-qty-select"
                    value={quantity}
                    onChange={(e) => handleQuantityChange(Number(e.target.value))}
                    className="appearance-none bg-white border border-[#E2E8F0] rounded-xl pl-3.5 pr-8 py-2 text-sm font-medium text-[#2D3748] hover:border-[#0F3024] focus:outline-none focus:border-[#0F3024] cursor-pointer shadow-2xs font-sans"
                  >
                    {qtyOptions.map((q) => (
                      <option key={q} value={q}>
                        {q}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-gray-500">
                    <FiChevronDown className="w-4 h-4" />
                  </div>
                </div>

                {/* QUICK +/- STEPPER BUTTONS */}
                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-gray-50 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= minQuantity}
                    aria-label="Decrease quantity"
                    className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-transparent transition-colors font-bold text-base"
                  >
                    −
                  </button>
                  <span className="w-9 text-center text-xs font-bold text-gray-900">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(quantity + 1)}
                    disabled={quantity >= maxQuantity}
                    aria-label="Increase quantity"
                    className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-transparent transition-colors font-bold text-base"
                  >
                    +
                  </button>
                </div>

                {/* STOCK STATUS */}
                <span className="text-xs font-medium text-gray-500">
                  {product.stock_quantity > 0 ? (
                    product.stock_quantity <= 5 ? (
                      <span className="text-[#C05E44] font-bold">
                        Only {product.stock_quantity} left!
                      </span>
                    ) : (
                      <span>{product.stock_quantity} available</span>
                    )
                  ) : (
                    <span className="text-[#C05E44] font-bold">Out of stock</span>
                  )}
                </span>
              </div>
            </div>

            {/* SUBTOTAL CALCULATION */}
            <div className="flex justify-between items-baseline py-2.5 border-t border-[#E2E8F0] mb-4">
              <span className="text-xs font-semibold text-[#718096]">Subtotal:</span>
              <span className="text-xl font-bold text-[#C05E44] font-sans">
                {formatNaira(totalPrice)}
              </span>
            </div>

            {/* =====================================================
                ADD TO CART BUTTON (PRIMARY ACTION - MIDNIGHT PINE)
            ===================================================== */}
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={product.stock_quantity === 0}
              className="w-full bg-[#0F3024] hover:bg-[#194b39] text-white font-bold py-3.5 px-6 rounded-full flex items-center justify-center gap-2 shadow-xs transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer font-sans"
            >
              <FiShoppingCart className="w-5 h-5" />
              <span>Add to cart</span>
            </button>

            {/* ALL DETAILS LINK */}
            <div className="mt-3 text-center">
              <Link
                href={`/product/${product.id}`}
                onClick={onClose}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#718096] hover:text-[#0F3024] transition-colors font-sans"
              >
                <span>All details</span>
                <span className="text-sm leading-none">›</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
