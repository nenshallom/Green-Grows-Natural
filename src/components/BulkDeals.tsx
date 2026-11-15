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
    <section className="w-full mt-16 mb-12">
      {/* HEADER & VIEW ALL LINK */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-xl md:text-3xl font-black text-[#1A4331] tracking-tight">
            Bulk Purchase Deals for You!
          </h2>
          <p className="text-xs md:text-sm text-gray-500 font-medium mt-0.5">
            Direct wholesale prices on farm harvests when ordering in batch quantities
          </p>
        </div>
        <Link
          href="/products?filter=Bulk+Buy"
          className="text-xs md:text-sm font-bold text-gray-700 bg-white border border-gray-200 rounded-full px-4 py-2 hover:bg-gray-50 transition-colors flex items-center gap-1 shadow-xs flex-shrink-0"
        >
          View All <span className="text-lg leading-none">↗</span>
        </Link>
      </div>

      {/* RESPONSIVE TEMU-STYLE BULK PRODUCT GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
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
