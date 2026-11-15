'use client';

import React, { useState } from 'react';
import { FiMapPin, FiCheckCircle, FiEdit2, FiPlus } from 'react-icons/fi';
import { useToast } from '@/context/ToastContext';

interface AddressesViewProps {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  stateName: string;
  lga: string;
  landmark: string;
  onSaveAddress: (data: {
    address: string;
    stateName: string;
    lga: string;
    landmark: string;
  }) => Promise<void>;
}

export default function AddressesView({
  firstName,
  lastName,
  phone,
  address,
  stateName,
  lga,
  landmark,
  onSaveAddress,
}: AddressesViewProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editAddress, setEditAddress] = useState(address);
  const [editState, setEditState] = useState(stateName);
  const [editLga, setEditLga] = useState(lga);
  const [editLandmark, setEditLandmark] = useState(landmark);
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSaveAddress({
        address: editAddress,
        stateName: editState,
        lga: editLga,
        landmark: editLandmark,
      });
      setIsEditing(false);
      toast.success('Default delivery address saved!');
    } catch {
      toast.error('Failed to update address. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 shadow-2xs">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-gray-900">Your Addresses</h2>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Manage your default and saved delivery destinations for farm dispatches
          </p>
        </div>
        {!isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-gray-300 text-xs font-bold text-gray-700 hover:border-black hover:text-black transition-colors"
          >
            <FiEdit2 className="w-3.5 h-3.5" /> Edit Address
          </button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSave} className="space-y-4 max-w-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">State</label>
              <input
                type="text"
                required
                value={editState}
                onChange={(e) => setEditState(e.target.value)}
                placeholder="e.g. Lagos"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs text-gray-800 outline-none focus:border-[#1A4331]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">LGA</label>
              <input
                type="text"
                required
                value={editLga}
                onChange={(e) => setEditLga(e.target.value)}
                placeholder="e.g. Ikeja"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs text-gray-800 outline-none focus:border-[#1A4331]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Street Address</label>
            <textarea
              rows={3}
              required
              value={editAddress}
              onChange={(e) => setEditAddress(e.target.value)}
              placeholder="e.g. Flat 4, 12 Farm Road, off Greenfield Ave"
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs text-gray-800 outline-none focus:border-[#1A4331] resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Closest Landmark</label>
            <input
              type="text"
              value={editLandmark}
              onChange={(e) => setEditLandmark(e.target.value)}
              placeholder="e.g. Near St. Mary Church / Mobil Gas Station"
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs text-gray-800 outline-none focus:border-[#1A4331]"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-[#FA5400] hover:bg-[#E04B00] text-white text-xs font-bold py-2.5 px-6 rounded-full transition-colors cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Address'}
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-gray-500 hover:text-gray-800 text-xs font-bold py-2.5 px-4"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* PRIMARY SAVED ADDRESS CARD */}
          <div className="p-5 rounded-2xl border-2 border-orange-500/80 bg-orange-50/20 relative">
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FA5400] text-white">
                <FiCheckCircle className="w-3 h-3" /> Default Delivery
              </span>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="text-xs text-[#FA5400] font-bold hover:underline"
              >
                Edit
              </button>
            </div>

            <div className="space-y-1.5 text-xs">
              <p className="font-extrabold text-sm text-gray-900">
                {firstName || 'Green Grown'} {lastName || 'Customer'}
              </p>
              <p className="text-gray-600 font-medium">
                {phone || 'No phone number provided'}
              </p>
              <p className="text-gray-800 font-semibold leading-relaxed pt-1">
                {address || 'No street address saved yet.'}
              </p>
              <p className="text-gray-600 font-medium">
                {lga ? `${lga}, ` : ''}{stateName || 'Nigeria'}
              </p>
              {landmark && (
                <p className="text-gray-500 text-[11px] italic pt-1">
                  Landmark: {landmark}
                </p>
              )}
            </div>
          </div>

          {/* ADD SECONDARY ADDRESS PLACEHOLDER */}
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="p-5 rounded-2xl border border-dashed border-gray-300 hover:border-gray-400 bg-gray-50/50 hover:bg-gray-50 flex flex-col items-center justify-center gap-2 text-gray-500 transition-colors cursor-pointer min-h-[160px]"
          >
            <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 shadow-2xs">
              <FiPlus className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-gray-700">Add Alternate Delivery Address</span>
            <span className="text-[11px] text-gray-400">Ship farm produce to family or catering venue</span>
          </button>
        </div>
      )}
    </div>
  );
}
