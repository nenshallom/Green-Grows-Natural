'use client';

import React from 'react';
import Image from 'next/image';
import { FiStar, FiMessageSquare } from 'react-icons/fi';
import { Order, Product } from '@/types';

interface ReviewsViewProps {
  orders: Order[];
  productsMap: Map<string, Product>;
  onLeaveReview: (order: Order) => void;
}

export default function ReviewsView({
  orders,
  productsMap,
  onLeaveReview,
}: ReviewsViewProps) {
  // Collect unique products from delivered orders
  const deliveredOrders = orders.filter(
    (o) => (o.delivery_status || '').toLowerCase() === 'delivered'
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 shadow-2xs">
      <div className="mb-6">
        <h2 className="text-xl md:text-2xl font-black text-gray-900">Your Reviews</h2>
        <p className="text-xs text-gray-500 font-medium mt-0.5">
          Share your produce experience to help our local farmers maintain high harvest standards
        </p>
      </div>

      {deliveredOrders.length === 0 ? (
        <div className="py-16 text-center text-gray-400 font-medium bg-gray-50 rounded-2xl border border-dashed border-gray-200 p-6">
          <div className="w-12 h-12 rounded-full bg-white border border-gray-200 text-gray-400 flex items-center justify-center mx-auto mb-3">
            <FiStar className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-gray-700">No reviews yet</p>
          <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
            Once you receive a delivered order, you can rate the farm freshness and leave your feedback here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase text-gray-400 tracking-wider">
            Delivered Harvests Available for Review ({deliveredOrders.length})
          </h3>

          {deliveredOrders.map((order) => {
            const firstItem = order.order_items?.[0];
            const matchedProduct = firstItem?.product_id
              ? productsMap.get(firstItem.product_id)
              : undefined;

            return (
              <div
                key={order.id}
                className="flex items-center justify-between gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors flex-wrap"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                    {matchedProduct?.image_url ? (
                      <Image
                        src={matchedProduct.image_url}
                        alt={firstItem?.product_name || 'Produce'}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[9px] text-gray-400 font-bold">
                        Produce
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-gray-900 truncate">
                      {firstItem?.product_name || 'Farm Order'}
                      {(order.order_items?.length || 0) > 1
                        ? ` + ${(order.order_items?.length || 0) - 1} more item(s)`
                        : ''}
                    </h4>
                    <p className="text-[11px] text-gray-500">
                      Delivered · Order #{order.tracking_number}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onLeaveReview(order)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#E2E8F0] text-xs font-medium text-[#0F3024] hover:border-[#0F3024] hover:bg-[#FAFAFA] transition-colors cursor-pointer font-sans"
                >
                  <FiStar className="w-3.5 h-3.5" />
                  <span>Rate Freshness</span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
