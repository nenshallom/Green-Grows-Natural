'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/types';
import { formatNaira } from '@/utils/format';
import { FiShoppingCart } from 'react-icons/fi';

interface BulkProductCardProps {
  product: Product;
  onQuickAdd: (product: Product) => void;
  priority?: boolean;
}

export default function BulkProductCard({ product, onQuickAdd, priority = false }: BulkProductCardProps) {
  const bulkThreshold = product.bulk_threshold || 2;
  const bulkPrice = product.bulk_buy_price ?? product.price_per_unit;
  const standardPrice = product.price_per_unit;
  const savingsPercent =
    standardPrice > bulkPrice
      ? Math.round(((standardPrice - bulkPrice) / standardPrice) * 100)
      : 0;
  const minOrderTotal = bulkPrice * bulkThreshold;

  return (
    <Link
      href={`/product/${product.id}`}
      className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-[#E2E8F0] hover:border-[#718096]/40 hover:shadow-sm transition-all duration-300 block"
    >
      {/* =========================================================
          TOP: ASPECT-SQUARE PRODUCT IMAGE & BULK BADGES
      ========================================================= */}
      <div className="relative w-full aspect-square bg-[#F8F9FA] overflow-hidden">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            priority={priority}
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#718096] text-xs font-sans">
            No image
          </div>
        )}

        {/* TOP-LEFT: WHOLESALE SAVINGS BADGE (MUTED TERRACOTTA PILL) */}
        {savingsPercent > 0 ? (
          <div className="absolute top-2.5 left-2.5 bg-[#C05E44] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-2xs z-10 flex items-center gap-1 font-sans tracking-wide">
            <span>BULK</span>
            <span>-{savingsPercent}%</span>
          </div>
        ) : (
          <div className="absolute top-2.5 left-2.5 bg-[#0F3024] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-2xs z-10 font-sans tracking-wide">
            WHOLESALE
          </div>
        )}

        {/* TOP-RIGHT: MINIMUM THRESHOLD (MOQ) BADGE */}
        <div className="absolute top-2.5 right-2.5 bg-white/95 backdrop-blur-xs text-[#2D3748] text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1 z-10 border border-[#E2E8F0] font-sans">
          <span>Min {bulkThreshold} {product.unit || 'kg'}</span>
        </div>
      </div>

      {/* =========================================================
          BOTTOM: PRODUCT DETAILS (MIN 16PX PADDING)
      ========================================================= */}
      <div className="p-4 sm:p-4.5 flex flex-col flex-1 justify-between gap-2.5">
        <div>
          {/* TITLE (OUTFIT MEDIUM 18PX) */}
          <h3 className="font-medium text-sm sm:text-base text-[#2D3748] leading-snug line-clamp-2 group-hover:text-[#0F3024] transition-colors mb-1.5 font-display">
            {product.name}
          </h3>

          {/* PRICING & CART ACTION ROW */}
          <div className="flex items-center justify-between gap-2 mt-1">
            <div className="flex items-baseline gap-1.5 flex-wrap min-w-0 font-sans">
              {/* Cancelled Standard Unit Price (Soft Ash) */}
              {standardPrice > bulkPrice && (
                <span className="text-xs text-[#718096] line-through font-normal">
                  {formatNaira(standardPrice)}
                </span>
              )}

              {/* Bold Wholesale Bulk Price (Muted Terracotta) */}
              <span className="text-base sm:text-lg font-semibold text-[#C05E44] leading-none">
                {formatNaira(bulkPrice)}
                <span className="text-xs text-[#718096] font-normal ml-0.5">
                  /{product.unit || 'kg'}
                </span>
              </span>
            </div>

            {/* MINIMAL CIRCULAR CART BUTTON */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onQuickAdd(product);
              }}
              aria-label={`Bulk purchase for ${product.name}`}
              className="w-8 h-8 rounded-full border border-[#E2E8F0] hover:border-[#0F3024] text-[#2D3748] hover:text-[#0F3024] hover:bg-[#FAFAFA] flex items-center justify-center transition-all cursor-pointer active:scale-90 flex-shrink-0 shadow-2xs"
            >
              <FiShoppingCart className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* MINIMUM BATCH / LOT COMMITMENT CALLOUT */}
          <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-[#2D3748] bg-[#FAFAFA] border border-[#E2E8F0] rounded-lg px-2 py-1 font-sans">
            <span className="text-[#718096]">Batch:</span>
            <span className="font-bold text-[#2D3748]">{formatNaira(minOrderTotal)}</span>
            <span className="text-[#718096]">({bulkThreshold} {product.unit || 'kg'})</span>
          </div>
        </div>

        {/* PROVENANCE & BULK PROOF */}
        <div className="pt-2 border-t border-[#E2E8F0] space-y-0.5">
          <p className="text-[10px] text-[#718096] font-semibold uppercase tracking-wider truncate font-display">
            DIRECT WHOLESALE | In {product.category || 'Produce'}
          </p>

          <div className="flex items-center gap-1.5 text-xs text-[#718096] font-sans">
            <span className="text-[#C05E44] font-bold text-xs tracking-tighter">★★★★★</span>
            <span className="text-[10px] text-[#718096]">•</span>
            <span className="text-[11px] text-[#718096] font-medium">Verified farm harvest</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
