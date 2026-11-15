'use client';

import React from 'react';
import { FiGlobe, FiCheck } from 'react-icons/fi';

export default function CountryLanguageView() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 shadow-2xs">
      <div className="mb-6">
        <h2 className="text-xl md:text-2xl font-black text-gray-900">Country / Region & Language</h2>
        <p className="text-xs text-gray-500 font-medium mt-0.5">
          Your delivery region and currency preference for fresh farm produce
        </p>
      </div>

      <div className="space-y-4 max-w-lg">
        <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🇳🇬</span>
            <div>
              <h4 className="text-xs font-bold text-gray-900">Country / Region</h4>
              <p className="text-[11px] text-gray-500">Nigeria (Federal Republic of Nigeria)</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
            <FiCheck className="w-3 h-3" /> Default
          </span>
        </div>

        <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-800 font-black text-sm flex items-center justify-center">
              ₦
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900">Store Currency</h4>
              <p className="text-[11px] text-gray-500">Nigerian Naira (NGN / ₦)</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
            <FiCheck className="w-3 h-3" /> Active
          </span>
        </div>

        <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center">
              <FiGlobe className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900">Language</h4>
              <p className="text-[11px] text-gray-500">English (NG)</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
            <FiCheck className="w-3 h-3" /> Active
          </span>
        </div>
      </div>
    </div>
  );
}
