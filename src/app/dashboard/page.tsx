'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { Order, Product, PurchaseType } from '@/types';
import { getErrorMessage } from '@/utils/format';

// --- TEMU PROFILE COMPONENTS ---
import ProfileSidebar, {
  ProfileSection,
  OrderStatusFilter,
} from '@/components/profile/ProfileSidebar';
import TemuOrderCard from '@/components/profile/TemuOrderCard';
import OrderTrackingModal from '@/components/profile/OrderTrackingModal';
import OrderDetailsModal from '@/components/profile/OrderDetailsModal';
import ProduceReviewModal from '@/components/profile/ProduceReviewModal';
import ReturnRefundModal from '@/components/profile/ReturnRefundModal';
import FarmGuaranteeModal from '@/components/profile/FarmGuaranteeModal';
import AddressesView from '@/components/profile/AddressesView';
import ReviewsView from '@/components/profile/ReviewsView';
import CountryLanguageView from '@/components/profile/CountryLanguageView';
import NotificationsView from '@/components/profile/NotificationsView';
import ProfileInfoView from '@/components/profile/ProfileInfoView';
import SecurityView from '@/components/profile/SecurityView';

// --- ICONS ---
import { FiSearch, FiShield, FiPackage, FiMessageCircle, FiPhoneCall, FiChevronRight } from 'react-icons/fi';

export default function DashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { addToCart } = useCart();

  // Navigation State
  const [activeSection, setActiveSection] = useState<ProfileSection>('orders');
  const [activeOrderFilter, setActiveOrderFilter] = useState<OrderStatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Data State
  const [orders, setOrders] = useState<Order[]>([]);
  const [productsMap, setProductsMap] = useState<Map<string, Product>>(new Map());
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');

  // Profile Form Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [stateName, setStateName] = useState('');
  const [lga, setLga] = useState('');
  const [landmark, setLandmark] = useState('');

  // Modal Control State
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);
  const [detailsOrder, setDetailsOrder] = useState<Order | null>(null);
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null);
  const [refundOrder, setRefundOrder] = useState<Order | null>(null);
  const [isGuaranteeOpen, setIsGuaranteeOpen] = useState(false);

  // 1. FETCH USER SESSION, METADATA, PRODUCTS, AND ORDERS
  useEffect(() => {
    const fetchData = async () => {
      try {
        const {
          data: { session },
          error: authError,
        } = await supabase.auth.getSession();
        if (authError || !session?.user) {
          router.push('/login');
          return;
        }

        const user = session.user;
        const meta = user.user_metadata;

        setUserEmail(user.email || '');
        setFirstName(meta?.first_name || meta?.full_name?.split(' ')[0] || '');
        setLastName(meta?.last_name || meta?.full_name?.split(' ')[1] || '');
        setPhone(meta?.phone_number || '');
        setAddress(meta?.default_address || '');
        setStateName(meta?.default_state || '');
        setLga(meta?.default_lga || '');
        setLandmark(meta?.default_landmark || '');

        // Fetch user orders with order_items
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select(`*, order_items (*)`)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (ordersError) throw ordersError;
        setOrders((ordersData || []) as unknown as Order[]);

        // Fetch products catalog to link actual images to order items
        const { data: productsData } = await supabase.from('products').select('*');
        if (productsData) {
          const map = new Map<string, Product>();
          productsData.forEach((p) => map.set(p.id, p as Product));
          setProductsMap(map);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  // 2. ORDER COUNTS BY STATUS
  const orderCounts = useMemo(() => {
    const counts: Record<OrderStatusFilter, number> = {
      all: orders.length,
      processing: 0,
      in_transit: 0,
      delayed: 0,
      delivered: 0,
      cancelled: 0,
    };

    orders.forEach((o) => {
      const status = (o.delivery_status || 'processing').toLowerCase();
      if (status === 'delivered') {
        counts.delivered += 1;
      } else if (status === 'delayed') {
        counts.delayed += 1;
      } else if (
        status === 'in transit' ||
        status === 'in_transit' ||
        status === 'shipped'
      ) {
        counts.in_transit += 1;
      } else if (status === 'cancelled' || status === 'refunded') {
        counts.cancelled += 1;
      } else {
        counts.processing += 1;
      }
    });

    return counts;
  }, [orders]);

  // 3. FILTERED ORDERS
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const status = (order.delivery_status || 'processing').toLowerCase();

      // Status Filter
      if (
        activeOrderFilter === 'processing' &&
        status !== 'processing' &&
        status !== 'pending' &&
        status !== 'pending delivery'
      ) {
        return false;
      }
      if (
        activeOrderFilter === 'in_transit' &&
        status !== 'in transit' &&
        status !== 'in_transit' &&
        status !== 'shipped'
      ) {
        return false;
      }
      if (activeOrderFilter === 'delayed' && status !== 'delayed') {
        return false;
      }
      if (activeOrderFilter === 'delivered' && status !== 'delivered') {
        return false;
      }
      if (
        activeOrderFilter === 'cancelled' &&
        status !== 'cancelled' &&
        status !== 'refunded'
      ) {
        return false;
      }

      // Search Query Filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesTracking = order.tracking_number?.toLowerCase().includes(query);
        const matchesId = order.id?.toLowerCase().includes(query);
        const matchesItem = order.order_items?.some((item) =>
          item.product_name.toLowerCase().includes(query)
        );
        if (!matchesTracking && !matchesId && !matchesItem) return false;
      }

      return true;
    });
  }, [orders, activeOrderFilter, searchQuery]);

  // 4. BUY THIS AGAIN HANDLER
  const handleBuyAgain = (order: Order) => {
    if (!order.order_items || order.order_items.length === 0) {
      toast.info('No produce items found in this order.');
      return;
    }

    order.order_items.forEach((item) => {
      const matchedProduct = item.product_id ? productsMap.get(item.product_id) : undefined;
      addToCart({
        productId: item.product_id || item.id,
        name: item.product_name,
        image: matchedProduct?.image_url || '',
        quantity: item.quantity,
        purchaseType: (item.purchase_type as PurchaseType) || 'standard',
        priceAtAddition: item.price_at_purchase,
      });
    });

    toast.success('Items from this order added to your cart!');
  };

  // 5. PROFILE UPDATE HANDLER
  const handleUpdateProfile = async (data: {
    firstName: string;
    lastName: string;
    phone: string;
  }) => {
    const { error } = await supabase.auth.updateUser({
      data: {
        first_name: data.firstName,
        last_name: data.lastName,
        phone_number: data.phone,
      },
    });
    if (error) throw error;
    setFirstName(data.firstName);
    setLastName(data.lastName);
    setPhone(data.phone);
  };

  // 6. ADDRESS UPDATE HANDLER
  const handleSaveAddress = async (data: {
    address: string;
    stateName: string;
    lga: string;
    landmark: string;
  }) => {
    const { error } = await supabase.auth.updateUser({
      data: {
        default_address: data.address,
        default_state: data.stateName,
        default_lga: data.lga,
        default_landmark: data.landmark,
      },
    });
    if (error) throw error;
    setAddress(data.address);
    setStateName(data.stateName);
    setLga(data.lga);
    setLandmark(data.landmark);
  };

  // 7. PASSWORD UPDATE HANDLER
  const handleUpdatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  };

  // 8. DELETE ACCOUNT HANDLER
  const handleDeleteAccount = async () => {
    await supabase.auth.updateUser({ data: { is_deleted: true } });
    await supabase.auth.signOut();
    toast.info('Your account has been deactivated.');
    router.push('/');
  };

  // 9. LOGOUT HANDLER
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#FDFDFD] p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1A4331]" />
      </main>
    );
  }

  // Active section title for breadcrumb
  const sectionTitleMap: Record<ProfileSection, string> = {
    orders: 'Your orders',
    reviews: 'Your reviews',
    profile: 'Your profile',
    addresses: 'Addresses',
    country: 'Country & Language',
    security: 'Account security',
    'delete-account': 'Delete your account',
    notifications: 'Notifications',
  };

  return (
    <main className="min-h-screen bg-[#F7F7F7] py-6 px-3 sm:px-6 lg:px-12 text-gray-800">
      <div className="max-w-7xl mx-auto">
        {/* =========================================================
            BREADCRUMB BAR (TEMU STYLE: "Home > Your orders")
        ========================================================= */}
        <div className="mb-4 text-xs text-gray-500 font-medium flex items-center gap-1.5">
          <Link href="/" className="hover:text-black transition-colors">
            Home
          </Link>
          <span className="text-gray-300">›</span>
          <span className="text-gray-800 font-bold">{sectionTitleMap[activeSection]}</span>
        </div>

        {/* =========================================================
            DESKTOP 2-COLUMN LAYOUT (SIDEBAR + WORKSPACE)
        ========================================================= */}
        <div className="flex flex-col lg:flex-row items-start gap-6">
          {/* LEFT SIDEBAR NAVIGATION */}
          <ProfileSidebar
            activeSection={activeSection}
            activeOrderFilter={activeOrderFilter}
            orderCounts={orderCounts}
            onSelectSection={(sec) => setActiveSection(sec)}
            onSelectOrderFilter={(f) => {
              setActiveSection('orders');
              setActiveOrderFilter(f);
            }}
            onLogout={handleLogout}
          />

          {/* RIGHT WORKSPACE AREA */}
          <div className="flex-1 w-full min-w-0 space-y-4">
            {/* =====================================================
                SECTION: YOUR ORDERS
            ===================================================== */}
            {activeSection === 'orders' && (
              <div className="space-y-4">
                {/* TOP TABS & CAPSULE SEARCH ROW */}
                <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                  {/* HORIZONTAL STATUS TABS (TEMU STYLE) */}
                  <div className="flex items-center gap-4 md:gap-6 overflow-x-auto scrollbar-hide text-xs sm:text-sm font-bold border-b md:border-b-0 border-gray-100 pb-2 md:pb-0">
                    {(
                      [
                        { id: 'all', label: 'All orders' },
                        { id: 'processing', label: 'Processing' },
                        { id: 'in_transit', label: 'In Transit' },
                        { id: 'delayed', label: 'Delayed' },
                        { id: 'delivered', label: 'Delivered' },
                        { id: 'cancelled', label: 'Cancelled' },
                      ] as const
                    ).map((tab) => {
                      const isSelected = activeOrderFilter === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setActiveOrderFilter(tab.id)}
                          className={`relative py-1 cursor-pointer whitespace-nowrap transition-colors ${
                            isSelected
                              ? 'text-black font-extrabold after:absolute after:bottom-[-2px] after:left-0 after:right-0 after:h-[2.5px] after:bg-black after:rounded-full'
                              : 'text-gray-500 hover:text-black font-semibold'
                          }`}
                        >
                          {tab.label}
                          {orderCounts[tab.id] > 0 && (
                            <span className="ml-1 text-xs text-gray-400 font-normal">
                              ({orderCounts[tab.id]})
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* PILL SEARCH INPUT */}
                  <div className="relative w-full md:w-72">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Item name / Order ID / Tracking No."
                      className="w-full pl-3.5 pr-8 py-2 rounded-full border border-gray-200 text-xs text-gray-800 outline-none focus:border-[#FA5400] transition-colors placeholder:text-gray-400 shadow-2xs"
                    />
                    <FiSearch className="absolute right-3 top-2.5 text-gray-400 w-3.5 h-3.5" />
                  </div>
                </div>

                {/* TEMU GREEN GUARANTEE RIBBON BANNER */}
                <button
                  type="button"
                  onClick={() => setIsGuaranteeOpen(true)}
                  className="w-full text-left bg-[#F4FAF6] border border-[#CDEBD8] hover:border-emerald-400 rounded-xl px-4 py-2.5 text-xs text-emerald-900 flex items-center justify-between gap-3 transition-colors cursor-pointer shadow-2xs"
                >
                  <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
                    <FiShield className="text-emerald-700 w-4 h-4 flex-shrink-0" />
                    <span className="font-extrabold text-emerald-800">Order guarantee</span>
                    <span className="text-emerald-400">•</span>
                    <span className="truncate text-emerald-700 font-medium">
                      100% Farm Fresh Guarantee · Harvest Cold Packing · ₦1,500 Credit for delay · Replacement if damaged
                    </span>
                  </div>
                  <span className="text-emerald-700 font-bold text-xs flex-shrink-0">
                    ›
                  </span>
                </button>

                {/* ORDERS LIST */}
                {filteredOrders.length === 0 ? (
                  <div className="bg-white p-12 md:p-16 rounded-2xl text-center border border-gray-100 shadow-2xs flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-3">
                      <FiPackage className="w-8 h-8" />
                    </div>
                    <h3 className="text-base font-bold text-gray-900">
                      {searchQuery ? 'No matching orders found' : 'No orders in this category'}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 mb-5 max-w-sm">
                      {searchQuery
                        ? 'Try searching with another item name or tracking number.'
                        : 'Explore our catalog for farm-fresh produce picked right from harvest.'}
                    </p>
                    <Link
                      href="/products"
                      className="bg-[#FA5400] hover:bg-[#E04B00] text-white text-xs font-bold py-2.5 px-6 rounded-full transition-colors shadow-xs"
                    >
                      Start Shopping
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredOrders.map((order) => (
                      <TemuOrderCard
                        key={order.id}
                        order={order}
                        productsMap={productsMap}
                        onTrackOrder={(o) => setTrackingOrder(o)}
                        onViewDetails={(o) => setDetailsOrder(o)}
                        onLeaveReview={(o) => setReviewOrder(o)}
                        onReturnRefund={(o) => setRefundOrder(o)}
                        onBuyAgain={handleBuyAgain}
                      />
                    ))}
                  </div>
                )}

                {/* =====================================================
                    CAN'T FIND YOUR ORDER? (ASSISTANCE BOTTOM CARDS)
                ===================================================== */}
                <div className="pt-4">
                  <h3 className="text-xs font-bold text-gray-700 mb-2">Can&apos;t find your order?</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <a
                      href="https://wa.me/2348004463276?text=Hello%20GGN%20Farm%20Desk,%20I%20need%20help%20locating%20my%20order."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-4 rounded-xl border border-orange-200/80 bg-white hover:bg-orange-50/30 flex items-center justify-between text-xs transition-colors group cursor-pointer shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <FiMessageCircle className="w-4 h-4 text-[#FA5400]" />
                        <span className="font-semibold text-gray-800">
                          WhatsApp Farm Dispatch Desk
                        </span>
                      </div>
                      <span className="text-[#FA5400] font-black group-hover:translate-x-0.5 transition-transform">
                        ›
                      </span>
                    </a>

                    <button
                      type="button"
                      onClick={() => setIsGuaranteeOpen(true)}
                      className="p-4 rounded-xl border border-orange-200/80 bg-white hover:bg-orange-50/30 flex items-center justify-between text-xs transition-colors group cursor-pointer shadow-2xs text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <FiShield className="w-4 h-4 text-[#FA5400]" />
                        <span className="font-semibold text-gray-800">
                          Self-service farm guarantee & tracking
                        </span>
                      </div>
                      <span className="text-[#FA5400] font-black group-hover:translate-x-0.5 transition-transform">
                        ›
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* =====================================================
                SECTION: YOUR REVIEWS
            ===================================================== */}
            {activeSection === 'reviews' && (
              <ReviewsView
                orders={orders}
                productsMap={productsMap}
                onLeaveReview={(o) => setReviewOrder(o)}
              />
            )}

            {/* =====================================================
                SECTION: YOUR PROFILE
            ===================================================== */}
            {activeSection === 'profile' && (
              <ProfileInfoView
                firstName={firstName}
                lastName={lastName}
                userEmail={userEmail}
                phone={phone}
                onUpdateProfile={handleUpdateProfile}
              />
            )}

            {/* =====================================================
                SECTION: ADDRESSES
            ===================================================== */}
            {activeSection === 'addresses' && (
              <AddressesView
                firstName={firstName}
                lastName={lastName}
                phone={phone}
                address={address}
                stateName={stateName}
                lga={lga}
                landmark={landmark}
                onSaveAddress={handleSaveAddress}
              />
            )}

            {/* =====================================================
                SECTION: COUNTRY & LANGUAGE
            ===================================================== */}
            {activeSection === 'country' && <CountryLanguageView />}

            {/* =====================================================
                SECTION: ACCOUNT SECURITY
            ===================================================== */}
            {(activeSection === 'security' || activeSection === 'delete-account') && (
              <SecurityView
                onUpdatePassword={handleUpdatePassword}
                onDeleteAccount={handleDeleteAccount}
              />
            )}

            {/* =====================================================
                SECTION: NOTIFICATIONS
            ===================================================== */}
            {activeSection === 'notifications' && <NotificationsView />}
          </div>
        </div>
      </div>

      {/* =========================================================
          INTERACTIVE MODALS
      ========================================================= */}
      <OrderTrackingModal
        order={trackingOrder}
        isOpen={Boolean(trackingOrder)}
        onClose={() => setTrackingOrder(null)}
      />

      <OrderDetailsModal
        order={detailsOrder}
        productsMap={productsMap}
        isOpen={Boolean(detailsOrder)}
        onClose={() => setDetailsOrder(null)}
      />

      <ProduceReviewModal
        order={reviewOrder}
        isOpen={Boolean(reviewOrder)}
        onClose={() => setReviewOrder(null)}
      />

      <ReturnRefundModal
        order={refundOrder}
        isOpen={Boolean(refundOrder)}
        onClose={() => setRefundOrder(null)}
      />

      <FarmGuaranteeModal
        isOpen={isGuaranteeOpen}
        onClose={() => setIsGuaranteeOpen(false)}
      />
    </main>
  );
}
