'use client';

import React from 'react';
import { FiX, FiRefreshCw, FiMessageCircle, FiPhoneCall, FiCopy } from 'react-icons/fi';
import { Order } from '@/types';
import { useToast } from '@/context/ToastContext';

interface ReturnRefundModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ReturnRefundModal({
  order,
  isOpen,
  onClose,
}: ReturnRefundModalProps) {
  const { toast } = useToast();

  if (!isOpen || !order) return null;

  const orderId = order.tracking_number;
  const whatsappMessage = encodeURIComponent(
    `Hello Green Grown Natural Farm Support, I need assistance regarding my Order #${orderId}.`
  );
  const whatsappUrl = `https://wa.me/2348004463276?text=${whatsappMessage}`;

  const copyOrderRef = () => {
    navigator.clipboard.writeText(orderId);
    toast.success('Order Reference copied!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div
        className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* CLOSE BUTTON */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close refund modal"
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors cursor-pointer"
        >
          <FiX className="w-5 h-5" />
        </button>

        {/* HEADER */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-orange-50 text-[#FA5400] flex items-center justify-center text-2xl font-bold flex-shrink-0">
            <FiRefreshCw />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight">
              Return / Freshness Claim
            </h2>
            <p className="text-xs text-gray-500 font-medium">
              Order #{orderId}
            </p>
          </div>
        </div>

        {/* EXPLANATION */}
        <div className="p-3.5 rounded-xl bg-orange-50/70 border border-orange-100 mb-5 text-xs text-orange-950 leading-relaxed">
          <p className="font-bold text-orange-900 mb-1">
            🌿 Perishable Farm Fresh Policy
          </p>
          Because our harvests are perishable, items damaged during transit or not meeting harvest quality are backed by our <strong>24-hour instant replacement or refund</strong>.
        </div>

        {/* FAST ACTIONS */}
        <div className="space-y-3 mb-6">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center text-lg flex-shrink-0">
                <FiMessageCircle />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-emerald-950">Chat with Farm Support Desk</p>
                <p className="text-[11px] text-emerald-700">Instant WhatsApp resolution (photo proof)</p>
              </div>
            </div>
            <span className="text-emerald-700 font-black text-sm group-hover:translate-x-0.5 transition-transform">
              ›
            </span>
          </a>

          <a
            href="tel:+2348004463276"
            className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gray-800 text-white flex items-center justify-center text-lg flex-shrink-0">
                <FiPhoneCall />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-gray-900">Call Dispatch Hotline</p>
                <p className="text-[11px] text-gray-500">Toll-free: +234 800 GGN FARM</p>
              </div>
            </div>
            <span className="text-gray-600 font-black text-sm group-hover:translate-x-0.5 transition-transform">
              ›
            </span>
          </a>
        </div>

        {/* COPY ORDER ID */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100 text-xs">
          <span className="text-gray-500 font-medium">Order Reference:</span>
          <div className="flex items-center gap-2 font-mono font-bold text-gray-800">
            <span>{orderId}</span>
            <button
              type="button"
              onClick={copyOrderRef}
              className="text-gray-400 hover:text-gray-700 p-1"
            >
              <FiCopy className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* CLOSE */}
        <div className="mt-5">
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2.5 rounded-xl transition-colors text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
