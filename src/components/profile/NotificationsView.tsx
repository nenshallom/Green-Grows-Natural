'use client';

import React from 'react';
import { FiBell, FiPackage, FiTruck, FiTag } from 'react-icons/fi';

export default function NotificationsView() {
  const notifications = [
    {
      id: 'n1',
      title: 'Farm Fresh Harvest Season is Live!',
      desc: 'Fresh tomatoes, peppers, and sweet potatoes have been restocked from our Ogun State partner farms.',
      time: '2 hours ago',
      icon: FiTag,
      color: 'bg-emerald-100 text-emerald-800',
    },
    {
      id: 'n2',
      title: 'Logistics Dispatch Update',
      desc: 'All express deliveries within Lagos and Abuja now feature 24-hour temperature-safe packing.',
      time: 'Yesterday',
      icon: FiTruck,
      color: 'bg-blue-100 text-blue-800',
    },
    {
      id: 'n3',
      title: 'Bulk Order Savings Active',
      desc: 'Order above the bulk threshold on wholesale produce to automatically unlock wholesale pricing.',
      time: '3 days ago',
      icon: FiPackage,
      color: 'bg-orange-100 text-orange-800',
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 shadow-2xs">
      <div className="mb-6">
        <h2 className="text-xl md:text-2xl font-black text-gray-900">Notifications</h2>
        <p className="text-xs text-gray-500 font-medium mt-0.5">
          Order updates, dispatch announcements, and seasonal farm restocks
        </p>
      </div>

      <div className="space-y-3 max-w-2xl">
        {notifications.map((n) => {
          const Icon = n.icon;
          return (
            <div
              key={n.id}
              className="flex items-start gap-3.5 p-4 rounded-xl border border-gray-100 bg-gray-50/50"
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0 mt-0.5 ${n.color}`}
              >
                <Icon />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-gray-900">{n.title}</h4>
                  <span className="text-[10px] text-gray-400 font-medium flex-shrink-0">
                    {n.time}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{n.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
