'use client';

import React, { useState } from 'react';
import { FiUser, FiShield, FiCheckCircle } from 'react-icons/fi';
import { useToast } from '@/context/ToastContext';

interface ProfileInfoViewProps {
  firstName: string;
  lastName: string;
  userEmail: string;
  phone: string;
  onUpdateProfile: (data: {
    firstName: string;
    lastName: string;
    phone: string;
  }) => Promise<void>;
}

export default function ProfileInfoView({
  firstName,
  lastName,
  userEmail,
  phone,
  onUpdateProfile,
}: ProfileInfoViewProps) {
  const { toast } = useToast();
  const [first, setFirst] = useState(firstName);
  const [last, setLast] = useState(lastName);
  const [userPhone, setUserPhone] = useState(phone);
  const [updating, setUpdating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await onUpdateProfile({
        firstName: first,
        lastName: last,
        phone: userPhone,
      });
      toast.success('Profile details saved successfully!');
    } catch {
      toast.error('Failed to update profile.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 shadow-2xs">
      <div className="mb-6">
        <h2 className="text-xl md:text-2xl font-black text-gray-900">Your Profile</h2>
        <p className="text-xs text-gray-500 font-medium mt-0.5">
          Manage your personal details and account contact information
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 max-w-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#2D3748] mb-1 font-sans">First Name</label>
            <input
              type="text"
              required
              value={first}
              onChange={(e) => setFirst(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-[#E2E8F0] rounded-xl text-xs text-[#2D3748] outline-none focus:border-[#0F3024] font-sans"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#2D3748] mb-1 font-sans">Last Name</label>
            <input
              type="text"
              required
              value={last}
              onChange={(e) => setLast(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-[#E2E8F0] rounded-xl text-xs text-[#2D3748] outline-none focus:border-[#0F3024] font-sans"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
          <div className="relative">
            <input
              type="email"
              value={userEmail}
              readOnly
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs bg-gray-50 text-gray-500 outline-none cursor-not-allowed pr-10"
            />
            <FiShield className="absolute right-3.5 top-3 text-gray-400 w-4 h-4" />
          </div>
          <p className="text-[11px] text-gray-400 mt-1 font-medium">
            Secured login email. Cannot be modified directly.
          </p>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number</label>
          <input
            type="tel"
            value={userPhone}
            onChange={(e) => setUserPhone(e.target.value)}
            placeholder="+234 800 000 0000"
            className="w-full px-3.5 py-2.5 border border-[#E2E8F0] rounded-xl text-xs text-[#2D3748] outline-none focus:border-[#0F3024] font-sans"
          />
        </div>

        <div className="pt-2 font-sans">
          <button
            type="submit"
            disabled={updating}
            className="bg-[#0F3024] hover:bg-[#153426] text-white text-xs font-medium py-2.5 px-6 rounded-full transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
          >
            {updating ? 'Saving Changes...' : 'Save Profile Details'}
          </button>
        </div>
      </form>
    </div>
  );
}
