'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/types';
import { formatNaira } from '@/utils/format';
import { FEATURES } from '@/config/features';
import { FiShoppingCart } from 'react-icons/fi';

interface ProductCardProps {
  product: Product;
  onQuickAdd: (product: Product) => void;
  priority?: boolean;
}

export default function ProductCard({ product, onQuickAdd, priority = false }: ProductCardProps) {
  const discountPercent =
    product.original_price && product.original_price > product.price_per_unit
      ? Math.round(
          ((product.original_price - product.price_per_unit) / product.original_price) * 100
        )
      : 0;

  return (
    <Link
      href={`/product/${product.id}`}
      className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-[#E2E8F0] hover:border-[#718096]/40 hover:shadow-sm transition-all duration-300 block"
    >
      {/* =========================================================
          TOP: PRODUCT IMAGE (STUDIO BACKGROUND)
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

        {/* DISCOUNT BADGE (MUTED TERRACOTTA PILL SHAPE) */}
        {discountPercent > 0 && (
          <div className="absolute top-2.5 left-2.5 bg-[#C05E44] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-2xs z-10 font-sans tracking-wide">
            -{discountPercent}%
          </div>
        )}

        {/* BULK / GROUP BUY BADGE */}
        {(product.is_bulk_buy_enabled ||
          (FEATURES.ENABLE_GROUP_BUY && product.is_group_buy_enabled)) && (
          <div className="absolute bottom-2.5 left-2.5 z-10">
            <span className="bg-[#0F3024]/85 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-sans">
              {product.is_bulk_buy_enabled ? 'Bulk Available' : 'Group Buy'}
            </span>
          </div>
        )}
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
              {/* Cancelled Original Price (Soft Ash) */}
              {product.original_price && product.original_price > product.price_per_unit && (
                <span className="text-xs text-[#718096] line-through font-normal">
                  {formatNaira(product.original_price)}
                </span>
              )}

              {/* Active Price (Muted Terracotta DM Sans SemiBold) */}
              <span className="text-base sm:text-lg font-semibold text-[#C05E44] leading-none">
                {formatNaira(product.price_per_unit)}
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
              aria-label={`Select quantity for ${product.name}`}
              className="w-8 h-8 rounded-full border border-[#E2E8F0] hover:border-[#0F3024] text-[#2D3748] hover:text-[#0F3024] hover:bg-[#FAFAFA] flex items-center justify-center transition-all cursor-pointer active:scale-90 flex-shrink-0 shadow-2xs"
            >
              <FiShoppingCart className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* PROVENANCE & SOCIAL PROOF */}
        <div className="pt-2 border-t border-[#E2E8F0] space-y-0.5">
          <p className="text-[10px] text-[#718096] font-semibold uppercase tracking-wider truncate font-display">
            FARM HARVEST | In {product.category || 'Produce'}
          </p>

          <div className="flex items-center gap-1.5 text-xs text-[#718096] font-sans">
            <span className="text-[#C05E44] font-bold text-xs tracking-tighter">★★★★★</span>
            <span className="text-[10px] text-[#718096]">•</span>
            <span className="text-[11px] text-[#718096] font-medium">100+ harvested</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
