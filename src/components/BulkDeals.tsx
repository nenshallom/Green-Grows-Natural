'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Product } from '@/types';
import BulkProductCard from '@/components/BulkProductCard';
import QuickAddModal from '@/components/QuickAddModal';

export default function BulkDeals({ products }: { products: Product[] }) {
  const [modalProduct, setModalProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 1. Filter products that have Bulk Buying enabled
  const bulkProducts = products.filter((p) => p.is_bulk_buy_enabled);

  // If there are no bulk products, hide the section gracefully
  if (bulkProducts.length === 0) return null;

  const handleOpenQuickAdd = (product: Product) => {
    setModalProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseQuickAdd = () => {
    setIsModalOpen(false);
    setModalProduct(null);
  };

  return (
    <section id="bulk-deals" className="w-full my-20 md:my-24 scroll-mt-28">
      {/* HEADER & VIEW ALL LINK */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-medium text-[#0F3024] tracking-[-0.5px] font-display">
            Bulk Purchase Deals for You
          </h2>
          <p className="text-xs md:text-sm text-[#718096] font-normal mt-1 font-sans">
            Direct wholesale prices on farm harvests when ordering in batch quantities
          </p>
        </div>
        <Link
          href="/products?filter=Bulk+Buy"
          className="text-xs md:text-sm font-semibold text-[#2D3748] bg-white border border-[#E2E8F0] rounded-full px-5 py-2 hover:border-[#0F3024] hover:text-[#0F3024] transition-colors flex items-center gap-1 shadow-2xs flex-shrink-0 font-sans cursor-pointer"
        >
          View All <span className="text-base leading-none">↗</span>
        </Link>
      </div>

      {/* RESPONSIVE BULK PRODUCT GRID (24PX TO 32PX GAPS) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 lg:gap-8">
        {bulkProducts.slice(0, 8).map((product) => (
          <BulkProductCard
            key={product.id}
            product={product}
            onQuickAdd={handleOpenQuickAdd}
          />
        ))}
      </div>

      {/* QUICK ADD MODAL PRELOADED IN BULK MODE */}
      <QuickAddModal
        product={modalProduct}
        isOpen={isModalOpen}
        onClose={handleCloseQuickAdd}
        initialMode="bulk"
      />
    </section>
  );
}
