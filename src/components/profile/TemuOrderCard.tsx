'use client';

import React from 'react';
import Image from 'next/image';
import { FiCheck, FiTruck, FiClock, FiPhone, FiChevronRight, FiAlertCircle, FiXCircle } from 'react-icons/fi';
import { Order, Product } from '@/types';
import { formatNaira } from '@/utils/format';

interface TemuOrderCardProps {
  order: Order;
  productsMap: Map<string, Product>;
  onTrackOrder: (order: Order) => void;
  onViewDetails: (order: Order) => void;
  onLeaveReview?: (order: Order) => void;
  onReturnRefund?: (order: Order) => void;
  onBuyAgain: (order: Order) => void;
}

export default function TemuOrderCard({
  order,
  productsMap,
  onTrackOrder,
  onViewDetails,
  onLeaveReview,
  onReturnRefund,
  onBuyAgain,
}: TemuOrderCardProps) {
  const status = (order.delivery_status || 'processing').toLowerCase();
  const isDelivered = status === 'delivered';
  const isDelayed = status === 'delayed';
  const isInTransit = status === 'in transit' || status === 'in_transit' || status === 'shipped';
  const isCancelled = status === 'cancelled' || status === 'refunded';

  const items = order.order_items || [];
  const totalItemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  // Formatted date
  const orderDate = new Date(order.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs hover:shadow-sm transition-all overflow-hidden">
      {/* =========================================================
          1. HEADER: STATUS ROW & "VIEW ORDER DETAILS"
      ========================================================= */}
      <div className="px-5 pt-4 pb-2.5 flex items-center justify-between border-b border-gray-100 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {isDelivered ? (
            <span className="flex items-center gap-1.5 text-sm md:text-base font-bold text-emerald-700">
              <FiCheck className="w-4 h-4 stroke-[3]" />
              Delivered on {orderDate}
            </span>
          ) : isDelayed ? (
            <span className="flex items-center gap-1.5 text-sm md:text-base font-bold text-amber-700">
              <FiAlertCircle className="w-4 h-4 text-amber-600" />
              Delivery Delayed · Logistics Update
            </span>
          ) : isInTransit ? (
            <span className="flex items-center gap-1.5 text-sm md:text-base font-bold text-indigo-700">
              <FiTruck className="w-4 h-4" />
              In Transit · Out for Delivery
            </span>
          ) : isCancelled ? (
            <span className="flex items-center gap-1.5 text-sm md:text-base font-bold text-gray-500">
              <FiXCircle className="w-4 h-4" />
              Order Cancelled
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-sm md:text-base font-bold text-blue-700">
              <FiClock className="w-4 h-4" />
              Processing Harvest · Sorting & Packing
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => onViewDetails(order)}
          className="text-xs md:text-sm font-medium text-[#718096] hover:text-[#0F3024] transition-colors flex items-center gap-0.5 cursor-pointer font-sans"
        >
          View order details <FiChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* =========================================================
          2. COURIER & LOGISTICS SUB-ROW
      ========================================================= */}
      <div className="px-5 py-2 bg-[#FBFBFA] flex items-center justify-between flex-wrap gap-2 text-xs border-b border-gray-100">
        <button
          type="button"
          onClick={() => onTrackOrder(order)}
          className="text-gray-600 hover:text-gray-900 font-medium flex items-center gap-0.5 cursor-pointer"
        >
          View Proof of Dispatch & Tracking <FiChevronRight className="w-3 h-3 text-gray-400" />
        </button>

        <div className="flex items-center gap-1.5 text-gray-600 font-medium">
          <span>Courier: 0800-GGN-FARM</span>
          <a
            href="tel:+2348004463276"
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-orange-300 text-[10px] font-bold text-orange-700 hover:bg-orange-50 transition-colors"
          >
            <FiPhone className="w-2.5 h-2.5" /> Call
          </a>
        </div>
      </div>

      {/* DELAY ALERT BANNER */}
      {isDelayed && (
        <div className="px-5 py-2.5 bg-amber-50/80 border-b border-amber-200/70 text-xs text-amber-900 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm">⚠️</span>
            <span className="font-semibold">
              Logistics Notice: Transport delay encountered. Our farm dispatch team is actively expediting delivery.
            </span>
          </div>
          <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
            Delay Update
          </span>
        </div>
      )}

      {/* =========================================================
          3. CARD BODY: PRODUCE THUMBNAIL(S) & 4-BUTTON ACTION STACK
      ========================================================= */}
      <div className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        {/* PRODUCE ITEMS PREVIEW */}
        <div className="flex-1 min-w-0">
          <div className="space-y-3">
            {items.map((item) => {
              const matchedProduct = item.product_id ? productsMap.get(item.product_id) : undefined;
              const imageUrl = matchedProduct?.image_url;

              return (
                <div key={item.id} className="flex items-center gap-3.5">
                  {/* IMAGE THUMBNAIL WITH QUANTITY BADGE */}
                  <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0 border border-gray-100 shadow-2xs">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={item.product_name}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400 font-bold bg-gray-100">
                        Produce
                      </div>
                    )}
                    {/* QUANTITY BADGE (TEMU STYLE) */}
                    <div className="absolute top-1 left-1 bg-black/70 backdrop-blur-xs text-white text-[9px] font-black px-1.5 py-0.2 rounded">
                      {item.quantity}x
                    </div>
                  </div>

                  {/* ITEM DETAILS */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                      {item.product_name}
                    </h4>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">
                      {formatNaira(item.price_at_purchase)}
                    </p>
                    <span className="inline-block mt-1 text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">
                      {item.purchase_type}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ACTION BUTTON STACK */}
        <div className="w-full md:w-44 flex flex-col gap-2 flex-shrink-0 font-sans">
          {/* 1. TRACK ORDER */}
          <button
            type="button"
            onClick={() => onTrackOrder(order)}
            className="w-full bg-[#0F3024] hover:bg-[#153426] text-white text-xs md:text-sm font-medium py-2.5 px-4 rounded-full transition-all shadow-xs cursor-pointer active:scale-98"
          >
            Track order
          </button>

          {/* 2. BUY THIS AGAIN */}
          <button
            type="button"
            onClick={() => onBuyAgain(order)}
            className="w-full bg-white hover:bg-[#FAFAFA] border border-[#E2E8F0] text-[#2D3748] hover:border-[#0F3024] text-xs md:text-sm font-medium py-2 px-4 rounded-full transition-all cursor-pointer active:scale-98"
          >
            Buy this again
          </button>
        </div>
      </div>

      {/* =========================================================
          4. FOOTER: SUMMARY & ORDER ID
      ========================================================= */}
      <div className="px-5 py-3 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between flex-wrap gap-2 text-xs text-gray-500">
        <div>
          <span className="font-medium">
            {totalItemCount} item{totalItemCount > 1 ? 's' : ''}:{' '}
          </span>
          <span className="font-extrabold text-gray-900 text-sm">
            {formatNaira(order.total_amount)}
          </span>
        </div>

        <div className="flex items-center gap-4 flex-wrap text-gray-500">
          <span>Order Time: {orderDate}</span>
          <span>•</span>
          <span className="font-mono text-gray-700">
            Order ID: <strong>{order.tracking_number}</strong>
          </span>
        </div>
      </div>
    </div>
  );
}
