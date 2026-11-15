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

export default function BulkProductCard({
  product,
  onQuickAdd,
  priority = false,
}: BulkProductCardProps) {
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
      className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-300 block"
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
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
            No image
          </div>
        )}

        {/* TOP-LEFT: WHOLESALE SAVINGS BADGE */}
        {savingsPercent > 0 ? (
          <div className="absolute top-2 left-2 bg-[#D93F3F] text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow-2xs z-10 flex items-center gap-1">
            <span>BULK</span>
            <span>-{savingsPercent}%</span>
          </div>
        ) : (
          <div className="absolute top-2 left-2 bg-emerald-700 text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow-2xs z-10">
            WHOLESALE
          </div>
        )}

        {/* TOP-RIGHT: MINIMUM THRESHOLD (MOQ) BADGE */}
        <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-xs text-orange-600 text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1 z-10 border border-orange-100">
          <span>🔥</span>
          <span>Min {bulkThreshold} {product.unit || 'kg'}</span>
        </div>
      </div>

      {/* =========================================================
          BOTTOM: WHITE PRODUCT DETAILS CARD (BULK EMPHASIS)
      ========================================================= */}
      <div className="p-2.5 sm:p-3 flex flex-col flex-1 justify-between gap-1.5">
        <div>
          {/* TITLE */}
          <h3 className="font-medium text-xs sm:text-sm text-gray-900 leading-snug line-clamp-2 group-hover:text-[#FA5400] transition-colors mb-1">
            {product.name}
          </h3>

          {/* PRICING & CIRCULAR CART ACTION ROW */}
          <div className="flex items-center justify-between gap-1.5 mt-0.5">
            <div className="flex items-baseline gap-1.5 flex-wrap min-w-0">
              {/* Cancelled Standard Unit Price */}
              {standardPrice > bulkPrice && (
                <span className="text-[11px] sm:text-xs text-gray-400 line-through font-medium">
                  {formatNaira(standardPrice)}
                </span>
              )}

              {/* Bold Wholesale Bulk Price */}
              <span className="text-sm sm:text-base font-extrabold text-[#FA5400]">
                {formatNaira(bulkPrice)}
                <span className="text-[10px] text-gray-500 font-medium ml-0.5">
                  /{product.unit || 'kg'}
                </span>
              </span>
            </div>

            {/* TEMU CIRCULAR OUTLINE CART BUTTON (PRE-LOADS BULK) */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onQuickAdd(product);
              }}
              aria-label={`Bulk purchase for ${product.name}`}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-gray-300 hover:border-black text-gray-700 hover:text-black hover:bg-gray-50 flex items-center justify-center transition-all cursor-pointer active:scale-90 flex-shrink-0 shadow-2xs"
            >
              <FiShoppingCart className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* MINIMUM BATCH / LOT COMMITMENT CALLOUT */}
          <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-gray-600 bg-gray-50 border border-gray-100 rounded px-1.5 py-0.5 font-medium">
            <span className="text-gray-400">📦</span>
            <span>Lot:</span>
            <span className="font-bold text-gray-900">{formatNaira(minOrderTotal)}</span>
            <span className="text-gray-400">({bulkThreshold} {product.unit || 'kg'})</span>
          </div>
        </div>

        {/* RANKING & BULK PROOF */}
        <div className="pt-1.5 border-t border-gray-50 space-y-0.5">
          {/* WHOLESALE RANKING SUBTEXT */}
          <p className="text-[10px] text-[#C25E00] font-bold uppercase tracking-tight truncate">
            WHOLESALE DEAL | In {product.category || 'Produce'}
          </p>

          {/* RATINGS & VOLUME */}
          <div className="flex items-center gap-1.5 text-[11px] text-gray-600 font-medium">
            <span className="text-amber-500 font-bold text-xs tracking-tighter">★★★★★</span>
            <span className="text-[10px] text-gray-400">•</span>
            <span className="text-[10px] text-gray-600 font-semibold">100+ bulk orders</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
