'use client';

import React from 'react';
import { FiX, FiCheck, FiTruck, FiBox, FiHome, FiPhone, FiCopy } from 'react-icons/fi';
import { Order } from '@/types';
import { useToast } from '@/context/ToastContext';

interface OrderTrackingModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function OrderTrackingModal({ order, isOpen, onClose }: OrderTrackingModalProps) {
  const { toast } = useToast();

  if (!isOpen || !order) return null;

  const copyTracking = () => {
    navigator.clipboard.writeText(order.tracking_number);
    toast.success('Tracking number copied to clipboard!');
  };

  const status = (order.delivery_status || 'processing').toLowerCase();
  const isDelivered = status === 'delivered';
  const isDelayed = status === 'delayed';
  const isInTransit = status === 'in transit' || status === 'in_transit' || status === 'shipped';
  const isProcessing = status === 'processing' || status === 'pending' || status === 'pending delivery';

  // Step active indexes:
  // Step 1: Placed (always done)
  // Step 2: Quality Check / Packed (done if in transit, delayed, or delivered, active if processing)
  // Step 3: Dispatched (done if delivered, active if in transit or delayed)
  // Step 4: Delivered (done if delivered)
  const currentStep = isDelivered ? 4 : isInTransit || isDelayed ? 3 : 2;

  const steps = [
    {
      title: 'Order Placed & Confirmed',
      desc: `Payment ${order.payment_status} via ${order.payment_method || 'Paystack'}`,
      time: new Date(order.created_at).toLocaleString('en-NG', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      icon: FiBox,
      stepNum: 1,
    },
    {
      title: 'Farm Harvest & Quality Sorting',
      desc: 'Selected fresh from farm batches and temperature-packed',
      time: isProcessing ? 'In progress at farm station' : 'Quality inspected',
      icon: FiCheck,
      stepNum: 2,
    },
    {
      title: isDelayed ? '⚠️ Logistics Delay (In Transit)' : 'Dispatched & On the Way',
      desc: isDelayed
        ? 'Logistics delay noted. ₦1,500 Freshness Delay Credit activated.'
        : 'Handed to GGN Express Farm Logistics courier',
      time: isDelayed
        ? 'In transit (delay compensation applied)'
        : isInTransit
        ? 'Out for delivery today'
        : isDelivered
        ? 'Dispatched'
        : 'Pending dispatch',
      icon: FiTruck,
      stepNum: 3,
    },
    {
      title: 'Delivered to Address',
      desc: order.shipping_address
        ? `${order.shipping_address}, ${order.lga || ''}, ${order.state || ''}`
        : 'Destination address',
      time: isDelivered ? 'Delivery confirmed' : 'Estimated within 24-48 hrs',
      icon: FiHome,
      stepNum: 4,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div
        className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* CLOSE BUTTON */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close tracking modal"
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors cursor-pointer"
        >
          <FiX className="w-5 h-5" />
        </button>

        {/* HEADER */}
        <div className="mb-5">
          <span className="text-[10px] font-black uppercase tracking-wider text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
            Live Package Tracking
          </span>
          <h2 className="text-xl font-black text-gray-900 mt-1">Order #{order.tracking_number}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-500 font-medium">Tracking Ref:</span>
            <span className="font-mono text-xs font-bold text-gray-800">{order.tracking_number}</span>
            <button
              type="button"
              onClick={copyTracking}
              aria-label="Copy tracking ID"
              className="text-gray-400 hover:text-gray-700 transition-colors p-1"
            >
              <FiCopy className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* COURIER DISPATCH CARD */}
        <div className="bg-orange-50/70 border border-orange-200/60 rounded-xl p-3.5 mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center text-lg flex-shrink-0 shadow-xs">
              <FiTruck />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900">Green Grown Farm Logistics</p>
              <p className="text-[11px] text-gray-600">Courier Hotline: 0800-GGN-FARM</p>
            </div>
          </div>
          <a
            href="tel:+2348004463276"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-orange-300 text-orange-700 text-xs font-bold hover:bg-orange-100 transition-colors shadow-2xs"
          >
            <FiPhone className="w-3 h-3" />
            <span>Call</span>
          </a>
        </div>

        {/* 4-STEP TIMELINE */}
        <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
          {steps.map((step) => {
            const isCompleted = step.stepNum <= currentStep;
            const isCurrent = step.stepNum === currentStep;
            const Icon = step.icon;

            return (
              <div key={step.stepNum} className="relative flex items-start gap-4">
                {/* TIMELINE ICON BULLET */}
                <div
                  className={`absolute -left-6 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all z-10 ${
                    isCompleted
                      ? 'bg-[#FA5400] text-white shadow-xs'
                      : 'bg-gray-100 text-gray-400 border border-gray-300'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>

                <div className="pt-0.5">
                  <div className="flex items-center gap-2">
                    <h3
                      className={`text-sm font-bold leading-tight ${
                        isCurrent ? 'text-[#FA5400]' : isCompleted ? 'text-gray-900' : 'text-gray-400'
                      }`}
                    >
                      {step.title}
                    </h3>
                    {isCurrent && (
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full bg-[#FA5400]/10 text-[#FA5400]">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{step.desc}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5 font-medium">{step.time}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* FOOTER */}
        <div className="mt-8 pt-4 border-t border-gray-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-[#FA5400] hover:bg-[#E04B00] text-white font-bold py-3 rounded-xl transition-colors cursor-pointer text-sm shadow-sm"
          >
            Close Tracking
          </button>
        </div>
      </div>
    </div>
  );
}
