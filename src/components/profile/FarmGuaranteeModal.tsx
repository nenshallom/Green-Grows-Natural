'use client';

import React from 'react';
import { FiX, FiShield, FiTruck, FiRefreshCw, FiClock, FiPhoneCall } from 'react-icons/fi';

interface FarmGuaranteeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FarmGuaranteeModal({ isOpen, onClose }: FarmGuaranteeModalProps) {
  if (!isOpen) return null;

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
          aria-label="Close guarantee details"
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors cursor-pointer"
        >
          <FiX className="w-5 h-5" />
        </button>

        {/* HEADER */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center text-2xl font-bold flex-shrink-0">
            <FiShield />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight">
              100% Farm Fresh Guarantee
            </h2>
            <p className="text-xs text-gray-500 font-medium">
              Green Grown Natural buyer protection & harvest commitments
            </p>
          </div>
        </div>

        {/* GUARANTEE PILLARS */}
        <div className="space-y-4 pt-2">
          <div className="flex gap-3.5 p-3.5 rounded-xl bg-gray-50 border border-gray-100">
            <div className="text-emerald-700 mt-0.5 text-lg flex-shrink-0">
              <FiRefreshCw />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Perishable Replacement Guarantee</h3>
              <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                If produce arrives damaged, wilted, or below quality standards, notify our farm desk within 24 hours of delivery for an instant replacement or refund.
              </p>
            </div>
          </div>

          <div className="flex gap-3.5 p-3.5 rounded-xl bg-gray-50 border border-gray-100">
            <div className="text-emerald-700 mt-0.5 text-lg flex-shrink-0">
              <FiClock />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Priority Transit Tracking</h3>
              <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                We actively monitor transit schedules. If unexpected road delays occur, our logistics desk provides live updates and prioritizes prompt delivery.
              </p>
            </div>
          </div>

          <div className="flex gap-3.5 p-3.5 rounded-xl bg-gray-50 border border-gray-100">
            <div className="text-emerald-700 mt-0.5 text-lg flex-shrink-0">
              <FiTruck />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Harvest-to-Door Cold Packing</h3>
              <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                Produce is picked at peak ripeness and handled in temperature-conscious ventilated packaging to ensure field-to-kitchen flavor.
              </p>
            </div>
          </div>

          <div className="flex gap-3.5 p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
            <div className="text-emerald-700 mt-0.5 text-lg flex-shrink-0">
              <FiPhoneCall />
            </div>
            <div>
              <h3 className="text-sm font-bold text-emerald-900">Dedicated Farm Logistics Desk</h3>
              <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
                Live dispatch assistance available Monday – Saturday, 7:00 AM to 6:00 PM via direct WhatsApp and courier dispatch line: <strong>+234 800 GGN FARM</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* FOOTER BUTTON */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-[#1A4331] hover:bg-[#123122] text-white font-bold py-3 rounded-xl transition-colors cursor-pointer text-sm shadow-sm"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
}
