'use client';

import React from 'react';
import Image from 'next/image';
import { FiX, FiMapPin, FiPhone, FiCreditCard, FiCalendar, FiClock } from 'react-icons/fi';
import { Order, Product } from '@/types';
import { formatNaira } from '@/utils/format';

interface OrderDetailsModalProps {
  order: Order | null;
  productsMap: Map<string, Product>;
  isOpen: boolean;
  onClose: () => void;
}

export default function OrderDetailsModal({
  order,
  productsMap,
  isOpen,
  onClose,
}: OrderDetailsModalProps) {
  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div
        className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-100 relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* CLOSE BUTTON */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close order details modal"
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors cursor-pointer"
        >
          <FiX className="w-5 h-5" />
        </button>

        {/* HEADER */}
        <div className="border-b border-gray-100 pb-4 mb-5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Order Details
            </span>
            <span className="text-xs text-gray-300">•</span>
            <span className="text-xs font-bold text-[#1A4331]">{order.tracking_number}</span>
          </div>
          <h2 className="text-2xl font-black text-gray-900 mt-1">
            Order #{order.tracking_number}
          </h2>
          <div className="flex items-center gap-4 text-xs text-gray-500 mt-1 flex-wrap font-medium">
            <span className="flex items-center gap-1">
              <FiCalendar /> Placed on{' '}
              {new Date(order.created_at).toLocaleDateString('en-NG', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
            <span className="flex items-center gap-1">
              <FiClock />{' '}
              {new Date(order.created_at).toLocaleTimeString('en-NG', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                order.payment_status === 'paid'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                  : 'bg-amber-50 text-amber-700 border border-amber-100'
              }`}
            >
              Payment: {order.payment_status}
            </span>
          </div>
        </div>

        {/* ITEMS LIST */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">
            Purchased Produce ({order.order_items?.length || 0})
          </h3>
          <div className="space-y-3">
            {(order.order_items || []).map((item) => {
              const matchedProduct = item.product_id ? productsMap.get(item.product_id) : undefined;
              const imageUrl = matchedProduct?.image_url;

              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3.5 p-3 rounded-xl border border-gray-100 bg-gray-50/50"
                >
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={item.product_name}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400 font-bold">
                        Produce
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-gray-900 truncate">{item.product_name}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-500 font-medium">
                        Qty: <strong className="text-gray-800">{item.quantity}</strong>
                      </span>
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-white border border-gray-200 text-gray-600">
                        {item.purchase_type || 'standard'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-black text-gray-900">
                      {formatNaira(item.price_at_purchase * item.quantity)}
                    </p>
                    <p className="text-[10px] text-gray-400 font-medium">
                      {formatNaira(item.price_at_purchase)} each
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* DESTINATION & RECIPIENT */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 pt-4 border-t border-gray-100">
          <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
            <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider mb-2 flex items-center gap-1.5">
              <FiMapPin className="text-[#FA5400]" /> Delivery Destination
            </h4>
            <p className="text-xs text-gray-800 font-semibold leading-relaxed">
              {order.shipping_address || 'No street address provided'}
            </p>
            <p className="text-xs text-gray-600 mt-0.5">
              {order.lga ? `${order.lga}, ` : ''}{order.state || ''}
            </p>
            {order.landmark && (
              <p className="text-[11px] text-gray-500 mt-1 italic">
                Landmark: {order.landmark}
              </p>
            )}
          </div>

          <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
            <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider mb-2 flex items-center gap-1.5">
              <FiPhone className="text-[#1A4331]" /> Recipient Information
            </h4>
            <p className="text-xs text-gray-800 font-bold">
              {order.first_name || ''} {order.last_name || ''}
            </p>
            <p className="text-xs text-gray-600 mt-0.5 font-medium">
              Phone: {order.contact_phone || 'N/A'}
            </p>
            {order.email && (
              <p className="text-xs text-gray-600 mt-0.5 font-medium">
                Email: {order.email}
              </p>
            )}
            <div className="mt-2 pt-2 border-t border-gray-200/60 flex items-center gap-1 text-[11px] text-gray-500">
              <FiCreditCard className="text-gray-400" />
              <span>Paid via {order.payment_method || 'Paystack / Online'}</span>
            </div>
          </div>
        </div>

        {/* TOTAL INVOICE SUMMARY */}
        <div className="bg-[#FAF9F6] p-4 rounded-xl border border-gray-200/70 space-y-2 text-xs">
          <div className="flex justify-between text-gray-600">
            <span>Produce Subtotal:</span>
            <span className="font-semibold text-gray-900">{formatNaira(order.total_amount)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Farm Direct Handling & Delivery:</span>
            <span className="font-semibold text-emerald-700">Included / Free</span>
          </div>
          <div className="border-t border-gray-200 pt-2 flex justify-between items-baseline">
            <span className="text-sm font-black text-gray-900">Total Paid:</span>
            <span className="text-xl font-black text-[#FA5400]">{formatNaira(order.total_amount)}</span>
          </div>
        </div>

        {/* CLOSE BUTTON */}
        <div className="mt-6">
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-[#1A4331] hover:bg-[#123122] text-white font-bold py-3 rounded-xl transition-colors cursor-pointer text-sm shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
