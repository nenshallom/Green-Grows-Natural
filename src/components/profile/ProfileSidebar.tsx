'use client';

import React, { useState } from 'react';
import {
  FiPackage,
  FiUser,
  FiMapPin,
  FiGlobe,
  FiShield,
  FiBell,
  FiStar,
  FiChevronDown,
  FiChevronRight,
  FiLogOut,
} from 'react-icons/fi';

export type ProfileSection =
  | 'orders'
  | 'reviews'
  | 'profile'
  | 'addresses'
  | 'country'
  | 'security'
  | 'delete-account'
  | 'notifications';

export type OrderStatusFilter = 'all' | 'processing' | 'in_transit' | 'delayed' | 'delivered' | 'cancelled';

interface ProfileSidebarProps {
  activeSection: ProfileSection;
  activeOrderFilter: OrderStatusFilter;
  orderCounts: Record<OrderStatusFilter, number>;
  onSelectSection: (section: ProfileSection) => void;
  onSelectOrderFilter: (filter: OrderStatusFilter) => void;
  onLogout: () => void;
}

export default function ProfileSidebar({
  activeSection,
  activeOrderFilter,
  orderCounts,
  onSelectSection,
  onSelectOrderFilter,
  onLogout,
}: ProfileSidebarProps) {
  const [isOrdersExpanded, setIsOrdersExpanded] = useState(true);
  const [isSecurityExpanded, setIsSecurityExpanded] = useState(false);

  return (
    <aside className="w-full lg:w-60 flex-shrink-0 bg-white rounded-2xl border border-gray-100 p-3 shadow-2xs lg:sticky lg:top-24 self-start max-h-[calc(100vh-7rem)] overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <nav className="space-y-1 text-sm font-medium">
        {/* =========================================================
            1. YOUR ORDERS (EXPANDABLE)
        ========================================================= */}
        <div>
          <button
            type="button"
            onClick={() => {
              onSelectSection('orders');
              setIsOrdersExpanded(!isOrdersExpanded);
            }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-bold transition-colors cursor-pointer ${
              activeSection === 'orders'
                ? 'text-gray-900 bg-gray-50'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <FiPackage className="w-4 h-4 text-gray-500" />
              <span>Your orders</span>
            </div>
            {isOrdersExpanded ? (
              <FiChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <FiChevronRight className="w-4 h-4 text-gray-400" />
            )}
          </button>

          {/* SUB-MENU (ALL, PROCESSING, IN TRANSIT, DELAYED, DELIVERED, CANCELLED) */}
          {isOrdersExpanded && (
            <div className="ml-4 pl-3 border-l-2 border-gray-100 my-1 space-y-0.5">
              {(
                [
                  { id: 'all', label: 'All orders' },
                  { id: 'processing', label: 'Processing' },
                  { id: 'in_transit', label: 'In Transit' },
                  { id: 'delayed', label: 'Delayed' },
                  { id: 'delivered', label: 'Delivered' },
                  { id: 'cancelled', label: 'Cancelled' },
                ] as const
              ).map((sub) => {
                const isSelected = activeSection === 'orders' && activeOrderFilter === sub.id;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => {
                      onSelectSection('orders');
                      onSelectOrderFilter(sub.id);
                    }}
                    className={`w-full flex items-center justify-between text-left text-xs py-2 px-2.5 rounded-lg transition-all cursor-pointer ${
                      isSelected
                        ? 'text-[#0F3024] font-semibold bg-[#FAFAFA] border-l-2 border-[#0F3024]'
                        : 'text-[#718096] hover:text-[#2D3748] hover:bg-[#FAFAFA]'
                    }`}
                  >
                    <span>{sub.label}</span>
                    {orderCounts[sub.id] > 0 && (
                      <span className="text-[10px] text-[#718096] font-medium">
                        ({orderCounts[sub.id]})
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* =========================================================
            2. YOUR REVIEWS
        ========================================================= */}
        <button
          type="button"
          onClick={() => onSelectSection('reviews')}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-medium transition-colors cursor-pointer ${
            activeSection === 'reviews'
              ? 'text-[#0F3024] bg-[#FAFAFA] font-semibold'
              : 'text-[#2D3748] hover:bg-[#FAFAFA]'
          }`}
        >
          <FiStar className="w-4 h-4 text-[#718096]" />
          <span>Your reviews</span>
        </button>

        {/* =========================================================
            3. YOUR PROFILE
        ========================================================= */}
        <button
          type="button"
          onClick={() => onSelectSection('profile')}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-medium transition-colors cursor-pointer ${
            activeSection === 'profile'
              ? 'text-[#0F3024] bg-[#FAFAFA] font-semibold'
              : 'text-[#2D3748] hover:bg-[#FAFAFA]'
          }`}
        >
          <FiUser className="w-4 h-4 text-[#718096]" />
          <span>Your profile</span>
        </button>

        {/* =========================================================
            4. ADDRESSES
        ========================================================= */}
        <button
          type="button"
          onClick={() => onSelectSection('addresses')}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-medium transition-colors cursor-pointer ${
            activeSection === 'addresses'
              ? 'text-[#0F3024] bg-[#FAFAFA] font-semibold'
              : 'text-[#2D3748] hover:bg-[#FAFAFA]'
          }`}
        >
          <FiMapPin className="w-4 h-4 text-[#718096]" />
          <span>Addresses</span>
        </button>

        {/* =========================================================
            5. COUNTRY/REGION & LANGUAGE
        ========================================================= */}
        <button
          type="button"
          onClick={() => onSelectSection('country')}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-medium transition-colors cursor-pointer ${
            activeSection === 'country'
              ? 'text-[#0F3024] bg-[#FAFAFA] font-semibold'
              : 'text-[#2D3748] hover:bg-[#FAFAFA]'
          }`}
        >
          <FiGlobe className="w-4 h-4 text-[#718096]" />
          <span>Country & Language</span>
        </button>

        {/* =========================================================
            9. ACCOUNT SECURITY (EXPANDABLE)
        ========================================================= */}
        <div>
          <button
            type="button"
            onClick={() => {
              onSelectSection('security');
              setIsSecurityExpanded(!isSecurityExpanded);
            }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium transition-colors cursor-pointer ${
              activeSection === 'security' || activeSection === 'delete-account'
                ? 'text-[#2D3748] bg-[#FAFAFA] font-semibold'
                : 'text-[#2D3748] hover:bg-[#FAFAFA]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <FiShield className="w-4 h-4 text-[#718096]" />
              <span>Account security</span>
            </div>
            {isSecurityExpanded ? (
              <FiChevronDown className="w-4 h-4 text-[#718096]" />
            ) : (
              <FiChevronRight className="w-4 h-4 text-[#718096]" />
            )}
          </button>

          {isSecurityExpanded && (
            <div className="ml-4 pl-3 border-l-2 border-[#E2E8F0] my-1 space-y-0.5">
              <button
                type="button"
                onClick={() => onSelectSection('security')}
                className={`w-full text-left text-xs py-2 px-2.5 rounded-lg transition-all cursor-pointer ${
                  activeSection === 'security'
                    ? 'text-[#0F3024] font-semibold bg-[#FAFAFA]'
                    : 'text-[#718096] hover:text-[#2D3748] hover:bg-[#FAFAFA]'
                }`}
              >
                Account Info & Security
              </button>
              <button
                type="button"
                onClick={() => onSelectSection('delete-account')}
                className={`w-full text-left text-xs py-2 px-2.5 rounded-lg transition-all cursor-pointer ${
                  activeSection === 'delete-account'
                    ? 'text-[#C05E44] font-semibold bg-red-50/50'
                    : 'text-[#718096] hover:text-[#C05E44] hover:bg-[#FAFAFA]'
                }`}
              >
                Delete your GGN account
              </button>
            </div>
          )}
        </div>

        {/* =========================================================
            10. NOTIFICATIONS
        ========================================================= */}
        <button
          type="button"
          onClick={() => onSelectSection('notifications')}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-medium transition-colors cursor-pointer ${
            activeSection === 'notifications'
              ? 'text-[#0F3024] bg-[#FAFAFA] font-semibold'
              : 'text-[#2D3748] hover:bg-[#FAFAFA]'
          }`}
        >
          <FiBell className="w-4 h-4 text-[#718096]" />
          <span>Notifications</span>
        </button>

        {/* =========================================================
            11. LOG OUT
        ========================================================= */}
        <div className="pt-3 mt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-bold text-red-600 hover:bg-red-50 transition-colors cursor-pointer text-xs"
          >
            <FiLogOut className="w-4 h-4" />
            <span>Sign out</span>
          </button>
        </div>
      </nav>
    </aside>
  );
}
