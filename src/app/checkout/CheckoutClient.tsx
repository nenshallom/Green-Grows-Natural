'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { usePaystackPayment } from 'react-paystack';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { supabase } from '@/lib/supabase';
import { validateGroupBuyCart } from '@/lib/campaign';
import { formatNaira, getErrorMessage } from '@/utils/format';
import { Product } from '@/types';
import QuickAddModal from '@/components/QuickAddModal';
import {
  FiCheckCircle,
  FiLock,
  FiShield,
  FiTruck,
  FiMapPin,
  FiUser,
  FiPhone,
  FiMail,
  FiArrowLeft,
  FiPackage,
  FiCreditCard,
  FiAlertCircle,
  FiPlus,
  FiCheck,
  FiShoppingCart,
} from 'react-icons/fi';

export default function CheckoutPage() {
  const { cartItems, addToCart, clearCart, removeFromCart } = useCart();
  const { toast } = useToast();
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);

  // Selected items passed from Cart page
  const [selectedKeys, setSelectedKeys] = useState<string[] | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('ggn_selected_cart_keys');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSelectedKeys(parsed);
          }
        } catch {
          // ignore parsing error
        }
      }
    }
  }, []);

  // Automatically sync newly added items to selectedKeys so they are immediately included in the checkout summary & payment
  useEffect(() => {
    if (selectedKeys) {
      const allItemKeys = cartItems.map((item) => `${item.productId}-${item.purchaseType}`);
      const hasNewItem = allItemKeys.some((key) => !selectedKeys.includes(key));
      if (hasNewItem) {
        const merged = Array.from(new Set([...selectedKeys, ...allItemKeys]));
        setSelectedKeys(merged);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('ggn_selected_cart_keys', JSON.stringify(merged));
        }
      }
    }
  }, [cartItems, selectedKeys]);

  const activeCartItems = useMemo(() => {
    if (!selectedKeys) return cartItems;
    const filtered = cartItems.filter((item) =>
      selectedKeys.includes(`${item.productId}-${item.purchaseType}`)
    );
    return filtered.length > 0 ? filtered : cartItems;
  }, [cartItems, selectedKeys]);

  const activeCartTotal = useMemo(() => {
    return activeCartItems.reduce(
      (acc, item) => acc + item.priceAtAddition * item.quantity,
      0
    );
  }, [activeCartItems]);

  const activeItemCount = useMemo(() => {
    return activeCartItems.reduce((acc, item) => acc + item.quantity, 0);
  }, [activeCartItems]);

  // Form Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [additionalPhone, setAdditionalPhone] = useState('');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [state, setState] = useState('');
  const [lga, setLga] = useState('');

  // Default Address State & Intelligence
  const [hasSavedDefaultAddress, setHasSavedDefaultAddress] = useState(false);
  const [saveAsDefault, setSaveAsDefault] = useState(true);
  const [updateDefaultAddress, setUpdateDefaultAddress] = useState(false);
  const [initialAddressData, setInitialAddressData] = useState<{
    address: string;
    state: string;
    lga: string;
    landmark: string;
    phone: string;
  } | null>(null);

  // Recommendations / More Products state
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(true);
  const [quickAddProduct, setQuickAddProduct] = useState<Product | null>(null);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Load User & Pre-fill Default Address
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        router.push('/login');
        return;
      }

      const user = session.user;
      const meta = user.user_metadata || {};

      setUserId(user.id);
      setEmail(user.email || '');
      setFirstName(meta.first_name || meta.full_name?.split(' ')[0] || '');
      setLastName(meta.last_name || meta.full_name?.split(' ')[1] || '');

      const hasDefault = Boolean(meta.default_address);
      setHasSavedDefaultAddress(hasDefault);

      if (hasDefault) {
        // Pre-fill existing default delivery address automatically
        const savedAddress = meta.default_address || '';
        const savedState = meta.default_state || '';
        const savedLga = meta.default_lga || '';
        const savedLandmark = meta.default_landmark || '';
        const savedPhone = meta.phone_number || '';
        const savedAltPhone = meta.additional_phone || '';

        setAddress(savedAddress);
        setState(savedState);
        setLga(savedLga);
        setLandmark(savedLandmark);
        setPhone(savedPhone);
        setAdditionalPhone(savedAltPhone);

        setInitialAddressData({
          address: savedAddress,
          state: savedState,
          lga: savedLga,
          landmark: savedLandmark,
          phone: savedPhone,
        });
        setSaveAsDefault(false);
      } else {
        // First-time customer: prefill phone from auth if available, and default opt-in to save
        setPhone(meta.phone_number || '');
        setAdditionalPhone(meta.additional_phone || '');
        setSaveAsDefault(true);
      }

      setIsAuthChecking(false);
    };

    getUser();
  }, [router]);

  // Fetch Recommended / Cross-sell Products for Last-Minute Checkout Additions
  useEffect(() => {
    const fetchMoreProducts = async () => {
      setIsLoadingRecommendations(true);
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(12);

        if (data && !error) {
          setRecommendedProducts(data as Product[]);
        }
      } catch (err) {
        console.error('Failed to load recommended checkout products:', err);
      } finally {
        setIsLoadingRecommendations(false);
      }
    };

    fetchMoreProducts();
  }, []);

  // Filter & prioritize products not yet in the active cart
  const displayedMoreProducts = useMemo(() => {
    if (!recommendedProducts || recommendedProducts.length === 0) return [];
    const inCartIds = new Set(activeCartItems.map((item) => item.productId));
    const notInCart = recommendedProducts.filter((p) => !inCartIds.has(p.id));
    const inCart = recommendedProducts.filter((p) => inCartIds.has(p.id));
    return [...notInCart, ...inCart].slice(0, 8);
  }, [recommendedProducts, activeCartItems]);

  // Quick 1-click add to cart from checkout recommendation list
  const handleQuickAddProduct = (product: Product, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    addToCart({
      productId: product.id,
      name: product.name,
      image: product.image_url || '',
      quantity: 1,
      purchaseType: 'standard',
      priceAtAddition: product.price_per_unit,
      originalPrice: product.original_price,
      discountPercent:
        product.original_price && product.original_price > product.price_per_unit
          ? Math.round(
              ((product.original_price - product.price_per_unit) / product.original_price) * 100
            )
          : null,
    });

    const key = `${product.id}-standard`;
    setSelectedKeys((prev) => {
      if (!prev) return null;
      const updated = Array.from(new Set([...prev, key]));
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('ggn_selected_cart_keys', JSON.stringify(updated));
      }
      return updated;
    });

    toast.success(`Added ${product.name} to your checkout order!`);
  };

  // Check if a returning user modified their saved default address
  const isAddressModified = useMemo(() => {
    if (!hasSavedDefaultAddress || !initialAddressData) return false;
    return (
      address.trim() !== initialAddressData.address.trim() ||
      state.trim() !== initialAddressData.state.trim() ||
      lga.trim() !== initialAddressData.lga.trim() ||
      landmark.trim() !== initialAddressData.landmark.trim() ||
      phone.trim() !== initialAddressData.phone.trim()
    );
  }, [hasSavedDefaultAddress, initialAddressData, address, state, lga, landmark, phone]);

  // Generate stable Tracking Number / Reference for this session
  const [checkoutReference, setCheckoutReference] = useState('');
  useEffect(() => {
    if (userId) {
      setCheckoutReference(`GGN-${new Date().getTime().toString().slice(-8)}`);
    }
  }, [userId, activeCartTotal]);

  // Save Order to Supabase RPC & Synchronize User Default Address
  const saveOrderToDatabase = async (paymentStatus: string, method: string) => {
    setIsProcessing(true);
    try {
      if (!userId) throw new Error('Authentication error. Please log in again.');

      const rpcCartItems = activeCartItems.map((item) => ({
        product_id: item.productId,
        quantity: item.quantity,
        purchase_type: item.purchaseType,
      }));

      // Execute RPC Order Placement
      const { error } = await supabase.rpc('process_checkout', {
        p_user_id: userId,
        p_email: email,
        p_first_name: firstName,
        p_last_name: lastName,
        p_phone: phone,
        p_additional_phone: additionalPhone,
        p_address: address,
        p_landmark: landmark,
        p_state: state,
        p_lga: lga,
        p_payment_method: method,
        p_payment_status: paymentStatus,
        p_tracking_number: checkoutReference,
        p_cart_items: rpcCartItems,
      });

      if (error && !error.message.includes('unique constraint')) {
        throw error;
      }

      // Synchronize Default Address if confirmed by user
      const shouldSaveAsNewDefault = !hasSavedDefaultAddress && saveAsDefault;
      const shouldUpdateExistingDefault = hasSavedDefaultAddress && updateDefaultAddress;

      if (shouldSaveAsNewDefault || shouldUpdateExistingDefault) {
        try {
          await supabase.auth.updateUser({
            data: {
              default_address: address,
              default_state: state,
              default_lga: lga,
              default_landmark: landmark,
              phone_number: phone,
              additional_phone: additionalPhone,
            },
          });
        } catch (metaErr) {
          console.warn('Could not update user metadata address:', metaErr);
        }
      }

      // Clear purchased items from cart
      if (selectedKeys && selectedKeys.length < cartItems.length) {
        selectedKeys.forEach((key) => {
          const [productId, purchaseType] = key.split('-');
          removeFromCart(productId, purchaseType);
        });
        sessionStorage.removeItem('ggn_selected_cart_keys');
      } else {
        clearCart();
        sessionStorage.removeItem('ggn_selected_cart_keys');
      }

      toast.success(`Order Successful! Tracking Number: ${checkoutReference}`);
      router.push('/dashboard');
    } catch (error) {
      console.error('RPC Checkout Error:', error);
      toast.error(`Transaction Failed: ${getErrorMessage(error)}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Paystack Configuration
  const paystackConfig = {
    reference: checkoutReference,
    email: email,
    amount: activeCartTotal * 100,
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY as string,
    metadata: {
      custom_fields: [
        { display_name: 'User ID', variable_name: 'user_id', value: userId },
        {
          display_name: 'Checkout Data',
          variable_name: 'checkout_data',
          value: JSON.stringify({
            firstName,
            lastName,
            phone,
            additionalPhone,
            address,
            landmark,
            state,
            lga,
          }),
        },
        {
          display_name: 'Cart Payload',
          variable_name: 'cart_payload',
          value: JSON.stringify(
            activeCartItems.map((item) => ({
              product_id: item.productId,
              quantity: item.quantity,
              purchase_type: item.purchaseType,
            }))
          ),
        },
      ],
    },
  };

  const initializePayment = usePaystackPayment(paystackConfig);

  // Submit Handler
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    if (activeItemCount === 0) {
      toast.warning('Your cart is empty!');
      return;
    }

    if (!address.trim() || !state.trim() || !lga.trim() || !phone.trim()) {
      toast.error('Please complete all required delivery details.');
      return;
    }

    setIsProcessing(true);

    try {
      const validation = await validateGroupBuyCart(activeCartItems, userId);
      if (!validation.valid) {
        toast.error(`Payment Blocked: ${validation.error}`);
        setIsProcessing(false);
        return;
      }

      setIsProcessing(false);
      initializePayment({
        onSuccess: () => saveOrderToDatabase('paid', 'paystack'),
        onClose: () => toast.info('Payment window closed.'),
      });
    } catch (error) {
      toast.error(`Checkout Verification Error: ${getErrorMessage(error)}`);
      setIsProcessing(false);
    }
  };

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-3 border-emerald-700 border-t-transparent mb-4"></div>
        <p className="text-gray-600 font-semibold text-sm">Securing farm checkout session...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#FDFBF7] py-6 md:py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* =========================================================
            BREADCRUMB & BACK LINK
        ========================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <Link
              href="/cart"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-emerald-800 transition-colors mb-2 group"
            >
              <FiArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span>Return to Shopping Basket</span>
            </Link>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
              Secure Farm Checkout
            </h1>
          </div>

          {/* CHECKOUT PROGRESS PILL */}
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="text-gray-400">1. Cart</span>
            <span className="text-gray-300">›</span>
            <span className="bg-emerald-100 text-emerald-900 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
              2. Delivery & Payment
            </span>
            <span className="text-gray-300">›</span>
            <span className="text-gray-400">3. Confirmation</span>
          </div>
        </div>

        {/* =========================================================
            CHECKOUT MAIN GRID (2 COLUMNS)
        ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* =======================================================
              LEFT COLUMN (7 COLS): CUSTOMER & DELIVERY FORMS
          ======================================================= */}
          <div className="lg:col-span-7 space-y-6">
            <form id="checkout-form" onSubmit={handleCheckout} className="space-y-6">
              {/* 1. CUSTOMER CONTACT INFORMATION CARD */}
              <div className="bg-white rounded-2xl border border-gray-200/80 p-5 md:p-7 shadow-2xs">
                <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-gray-100">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">
                    <FiUser />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-gray-900">1. Customer Information</h2>
                    <p className="text-xs text-gray-500">Contact details for order dispatch notifications</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="e.g. Samuel"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-900 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-50 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="e.g. Adebayo"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-900 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-50 transition-all"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Account Email <span className="text-xs font-normal text-gray-400">(Receipt & Tracking)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      readOnly
                      value={email}
                      className="w-full px-3.5 py-2.5 pl-9 rounded-xl border border-gray-200 bg-gray-50/70 text-xs text-gray-600 outline-none cursor-not-allowed"
                    />
                    <FiMail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Primary Phone Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. 08012345678"
                        className="w-full px-3.5 py-2.5 pl-9 rounded-xl border border-gray-200 text-xs text-gray-900 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-50 transition-all"
                      />
                      <FiPhone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Alternative Phone <span className="text-xs font-normal text-gray-400">(Optional)</span>
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        value={additionalPhone}
                        onChange={(e) => setAdditionalPhone(e.target.value)}
                        placeholder="e.g. 09087654321"
                        className="w-full px-3.5 py-2.5 pl-9 rounded-xl border border-gray-200 text-xs text-gray-900 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-50 transition-all"
                      />
                      <FiPhone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. SHIPPING & DELIVERY DESTINATION CARD */}
              <div className="bg-white rounded-2xl border border-gray-200/80 p-5 md:p-7 shadow-2xs">
                <div className="flex items-center justify-between gap-3 mb-5 pb-3 border-b border-gray-100 flex-wrap">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">
                      <FiMapPin />
                    </div>
                    <div>
                      <h2 className="text-base font-extrabold text-gray-900">2. Delivery Destination</h2>
                      <p className="text-xs text-gray-500">Where should our farm courier bring your produce?</p>
                    </div>
                  </div>

                  {/* SAVED ADDRESS STATUS BADGE */}
                  {hasSavedDefaultAddress && !isAddressModified && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
                      <FiCheckCircle className="w-3 h-3 text-emerald-600" /> Default Address Loaded
                    </span>
                  )}
                  {hasSavedDefaultAddress && isAddressModified && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold">
                      <FiAlertCircle className="w-3 h-3 text-amber-600" /> Modified for this order
                    </span>
                  )}
                </div>

                <div className="space-y-4">
                  {/* STREET ADDRESS */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Detailed Street Address <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="House/Plot number, building name, street or avenue..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-900 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-50 transition-all resize-none"
                    />
                  </div>

                  {/* CLOSEST LANDMARK */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Closest Landmark <span className="text-xs font-normal text-gray-400">(Helps delivery riders arrive faster)</span>
                    </label>
                    <input
                      type="text"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      placeholder="e.g. Opposite Zenith Bank / Beside Mobil Filling Station"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-900 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-50 transition-all"
                    />
                  </div>

                  {/* STATE & LGA GRID */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">
                        State <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        placeholder="e.g. Lagos, Abuja, Oyo, Rivers..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-900 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-50 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">
                        Local Government Area (LGA) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={lga}
                        onChange={(e) => setLga(e.target.value)}
                        placeholder="e.g. Ikeja, Eti-Osa, Ibadan North..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-900 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-50 transition-all"
                      />
                    </div>
                  </div>

                  {/* ===================================================
                      ADDRESS PERSISTENCE / CONFIRMATION CONTROLS
                  =================================================== */}
                  {!hasSavedDefaultAddress && (
                    <label className="mt-2 flex items-start gap-3 p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 cursor-pointer transition-colors group">
                      <input
                        type="checkbox"
                        checked={saveAsDefault}
                        onChange={(e) => setSaveAsDefault(e.target.checked)}
                        className="mt-0.5 rounded text-emerald-700 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                      />
                      <div className="text-xs">
                        <span className="font-bold text-emerald-950 block">
                          Save as my default delivery address
                        </span>
                        <span className="text-emerald-800 text-[11px] leading-relaxed">
                          Remember this address and phone number on your profile so you won&apos;t have to re-enter them on your next order.
                        </span>
                      </div>
                    </label>
                  )}

                  {hasSavedDefaultAddress && isAddressModified && (
                    <label className="mt-2 flex items-start gap-3 p-3.5 rounded-xl bg-orange-50/70 border border-orange-200 cursor-pointer transition-colors group">
                      <input
                        type="checkbox"
                        checked={updateDefaultAddress}
                        onChange={(e) => setUpdateDefaultAddress(e.target.checked)}
                        className="mt-0.5 rounded text-[#FA5400] focus:ring-orange-500 w-4 h-4 cursor-pointer"
                      />
                      <div className="text-xs">
                        <span className="font-bold text-orange-950 block">
                          Update my saved default delivery address
                        </span>
                        <span className="text-orange-800 text-[11px] leading-relaxed">
                          Save these modified details as your new default delivery address for future farm orders.
                        </span>
                      </div>
                    </label>
                  )}
                </div>
              </div>

              {/* 3. PAYMENT METHOD CARD (PAYSTACK GATEWAY ONLY) */}
              <div className="bg-white rounded-2xl border border-gray-200/80 p-5 md:p-7 shadow-2xs">
                <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-gray-100">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">
                    <FiLock />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-gray-900">3. Payment Method</h2>
                    <p className="text-xs text-gray-500">Direct, encrypted payment gateway with instant dispatch</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl border-2 border-emerald-600 bg-emerald-50/40 relative">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-4 h-4 rounded-full bg-emerald-600 flex items-center justify-center text-white text-[10px]">
                        ✓
                      </div>
                      <span className="font-extrabold text-sm text-gray-900">
                        Pay Online via Paystack
                      </span>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      Instant Confirmation
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 mb-3 leading-relaxed">
                    Supports <strong>Debit/Credit Cards</strong> (Mastercard, Visa, Verve), <strong>Direct Bank Transfer</strong> (dedicated instant virtual account), and <strong>USSD</strong>.
                  </p>

                  {/* SECURITY & BADGES BAR */}
                  <div className="pt-3 border-t border-emerald-100 flex items-center justify-between flex-wrap gap-2 text-[11px] text-gray-500 font-medium">
                    <div className="flex items-center gap-1.5 text-emerald-900 font-semibold">
                      <FiShield className="w-3.5 h-3.5 text-emerald-700" />
                      <span>256-bit Bank-Grade SSL Encryption</span>
                    </div>
                    <span className="text-gray-400">•</span>
                    <span>PCI-DSS Level 1 Certified</span>
                    <span className="text-gray-400">•</span>
                    <span>CBN Licensed Gateway</span>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* =======================================================
              RIGHT COLUMN (5 COLS): STICKY ORDER SUMMARY
          ======================================================= */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200/80 p-5 md:p-6 shadow-2xs">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <FiPackage className="w-4 h-4 text-emerald-700" />
                  <h2 className="text-base font-extrabold text-gray-900">
                    Order Summary ({activeItemCount} {activeItemCount === 1 ? 'item' : 'items'})
                  </h2>
                </div>
                <Link
                  href="/cart"
                  className="text-xs font-bold text-orange-600 hover:text-orange-700 transition-colors"
                >
                  Edit Cart
                </Link>
              </div>

              {/* PRODUCE ITEMS SCROLLABLE LIST */}
              <div className="space-y-3 mb-5 max-h-72 overflow-y-auto pr-1 divide-y divide-gray-100">
                {activeCartItems.map((item) => (
                  <div
                    key={`${item.productId}-${item.purchaseType}`}
                    className="pt-3 first:pt-0 flex items-center gap-3"
                  >
                    {/* PRODUCE THUMBNAIL */}
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0 border border-gray-100">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400 font-bold bg-gray-100">
                          Produce
                        </div>
                      )}
                      <span className="absolute top-0.5 left-0.5 bg-black/75 text-white text-[9px] font-black px-1 rounded">
                        {item.quantity}x
                      </span>
                    </div>

                    {/* ITEM DETAILS */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">{item.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 bg-gray-100 px-1.5 py-0.2 rounded">
                          {item.purchaseType === 'group'
                            ? 'Group Deal'
                            : item.purchaseType === 'bulk'
                            ? 'Bulk Harvest'
                            : 'Solo Harvest'}
                        </span>
                        <span className="text-[11px] text-gray-500">
                          {formatNaira(item.priceAtAddition)} each
                        </span>
                      </div>
                    </div>

                    {/* ITEM TOTAL */}
                    <span className="text-xs font-bold text-gray-900 whitespace-nowrap">
                      {formatNaira(item.priceAtAddition * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* COST BREAKDOWN */}
              <div className="border-t border-gray-200/80 pt-4 space-y-2.5 text-xs text-gray-600">
                <div className="flex justify-between items-center">
                  <span>Produce Subtotal</span>
                  <span className="font-semibold text-gray-900">{formatNaira(activeCartTotal)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1">
                    <span>Farm Cold Packaging</span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-bold">
                      Ventilated
                    </span>
                  </span>
                  <span className="font-bold text-emerald-700 uppercase text-[11px]">Free</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Logistics & Doorstep Delivery</span>
                  <span className="text-gray-500 text-[11px]">Standard dispatch</span>
                </div>

                {/* GRAND TOTAL */}
                <div className="border-t border-gray-200 pt-3 flex justify-between items-baseline">
                  <div>
                    <span className="text-sm font-black text-gray-900 block">Total Due</span>
                    <span className="text-[10px] text-gray-400">All taxes included</span>
                  </div>
                  <span className="text-2xl font-black text-emerald-800">
                    {formatNaira(activeCartTotal)}
                  </span>
                </div>
              </div>

              {/* PRIMARY SUBMIT / PAY BUTTON */}
              <div className="mt-6">
                <button
                  type="submit"
                  form="checkout-form"
                  disabled={isProcessing || activeItemCount === 0}
                  className="w-full bg-[#1A4331] hover:bg-[#123122] disabled:bg-gray-300 text-white font-extrabold py-3.5 px-6 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-98 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Connecting to Paystack...</span>
                    </>
                  ) : (
                    <>
                      <FiLock className="w-4 h-4" />
                      <span>Pay {formatNaira(activeCartTotal)} with Paystack</span>
                    </>
                  )}
                </button>
              </div>

              {/* GUARANTEE TRUST FOOTER */}
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-[11px] text-gray-500">
                <div className="flex items-center gap-2 text-emerald-800 font-semibold">
                  <FiTruck className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0" />
                  <span>Harvest-to-door temperature controlled transit</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <FiShield className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0" />
                  <span>24-Hour Perishable Replacement Guarantee</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500 pt-1">
                  <span>Courier Dispatch Hotline:</span>
                  <a
                    href="tel:+2348004463276"
                    className="font-bold text-orange-600 hover:underline"
                  >
                    0800-GGN-FARM
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================
            LAST-MINUTE HARVEST ADDITIONS (ADD MORE BEFORE CHECKOUT)
        ========================================================= */}
        <section className="mt-12 pt-10 border-t border-gray-200/80">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-[#FA5400] text-[11px] font-black uppercase tracking-wider mb-2">
                <span>🌾 Last-Minute Harvest Additions</span>
              </div>
              <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
                Complete Your Farm Basket Before Paying
              </h2>
              <p className="text-xs md:text-sm text-gray-500 mt-1 max-w-xl leading-relaxed">
                Picked fresh daily from our partner farms. Add complementary vegetables, tubers, fruits, or grains to your dispatch with a single tap before completing your order.
              </p>
            </div>

            <Link
              href="/products"
              className="text-xs font-bold text-emerald-800 hover:text-emerald-900 hover:underline flex items-center gap-1 self-start sm:self-auto"
            >
              <span>Explore full catalog</span>
              <span>›</span>
            </Link>
          </div>

          {/* SKELETON LOADING STATE */}
          {isLoadingRecommendations ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-3 border border-gray-100 shadow-2xs animate-pulse">
                  <div className="w-full h-36 bg-gray-100 rounded-xl mb-3"></div>
                  <div className="h-3 bg-gray-100 rounded w-1/3 mb-2"></div>
                  <div className="h-4 bg-gray-100 rounded w-3/4 mb-3"></div>
                  <div className="h-8 bg-gray-100 rounded-xl"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
              {displayedMoreProducts.map((p) => {
                const inCartItem = activeCartItems.find(
                  (item) => item.productId === p.id && item.purchaseType === 'standard'
                );
                const inCartQty = inCartItem ? inCartItem.quantity : 0;
                const discount =
                  p.original_price && p.original_price > p.price_per_unit
                    ? Math.round(((p.original_price - p.price_per_unit) / p.original_price) * 100)
                    : 0;

                return (
                  <div
                    key={p.id}
                    className="bg-white rounded-2xl border border-gray-200/80 p-3 hover:border-emerald-300 hover:shadow-sm transition-all group flex flex-col justify-between"
                  >
                    <div>
                      {/* PRODUCT THUMBNAIL WITH QUICK-VIEW TRIGGER */}
                      <div
                        onClick={() => {
                          setQuickAddProduct(p);
                          setIsQuickAddOpen(true);
                        }}
                        className="relative w-full h-36 rounded-xl overflow-hidden bg-gray-50 mb-2.5 cursor-pointer"
                      >
                        {p.image_url ? (
                          <Image
                            src={p.image_url}
                            alt={p.name}
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-gray-400 font-bold bg-gray-100">
                            Farm Produce
                          </div>
                        )}

                        {/* DISCOUNT TAG */}
                        {discount > 0 && (
                          <div className="absolute top-2 left-2 bg-[#D93F3F] text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-2xs">
                            -{discount}%
                          </div>
                        )}

                        {/* IN-CART BADGE */}
                        {inCartQty > 0 && (
                          <div className="absolute bottom-2 right-2 bg-emerald-800/90 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-2xs backdrop-blur-xs flex items-center gap-1">
                            <FiCheck className="w-3 h-3 text-emerald-300" />
                            <span>{inCartQty} in order</span>
                          </div>
                        )}
                      </div>

                      {/* CATEGORY & TITLE */}
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5 truncate">
                        {p.category}
                      </span>
                      <h3
                        onClick={() => {
                          setQuickAddProduct(p);
                          setIsQuickAddOpen(true);
                        }}
                        className="text-xs md:text-sm font-bold text-gray-900 truncate mb-1 hover:text-emerald-800 cursor-pointer"
                        title={p.name}
                      >
                        {p.name}
                      </h3>

                      {/* PRICING */}
                      <div className="flex items-baseline gap-1.5 mb-3">
                        <span className="text-xs md:text-sm font-extrabold text-[#1A4331]">
                          {formatNaira(p.price_per_unit)}
                        </span>
                        {p.original_price && p.original_price > p.price_per_unit && (
                          <span className="text-[11px] text-gray-400 line-through">
                            {formatNaira(p.original_price)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* ADD ACTION BUTTONS */}
                    <div className="space-y-1.5 pt-1">
                      {inCartQty === 0 ? (
                        <button
                          type="button"
                          onClick={(e) => handleQuickAddProduct(p, e)}
                          className="w-full bg-[#1A4331] hover:bg-[#123122] text-white text-xs font-bold py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-2xs active:scale-98 cursor-pointer"
                        >
                          <FiPlus className="w-3.5 h-3.5" />
                          <span>Add to Order</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => handleQuickAddProduct(p, e)}
                          className="w-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-2xs active:scale-98 cursor-pointer"
                        >
                          <FiCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Added ({inCartQty}x) · +1 More</span>
                        </button>
                      )}

                      {/* BULK / MORE OPTIONS LINK */}
                      {p.is_bulk_buy_enabled && (
                        <button
                          type="button"
                          onClick={() => {
                            setQuickAddProduct(p);
                            setIsQuickAddOpen(true);
                          }}
                          className="w-full text-center text-[10px] text-orange-600 hover:text-orange-700 font-bold hover:underline py-0.5 cursor-pointer"
                        >
                          Bulk harvest available ›
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* BOTTOM QUICK JUMP-TO-PAYMENT SUMMARY CARD */}
          <div className="mt-8 p-4 md:p-5 rounded-2xl bg-white border border-gray-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-lg flex-shrink-0">
                <FiPackage />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">
                  Current Order Total ({activeItemCount} {activeItemCount === 1 ? 'item' : 'items'}):
                </p>
                <p className="text-xl font-black text-emerald-800">
                  {formatNaira(activeCartTotal)}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const formElement = document.getElementById('checkout-form');
                if (formElement) {
                  formElement.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="w-full sm:w-auto bg-[#FA5400] hover:bg-[#E04B00] text-white text-xs font-bold py-3 px-6 rounded-full transition-all shadow-sm hover:shadow active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Review Details & Pay Now</span>
              <span>↑</span>
            </button>
          </div>
        </section>

        {/* QUICK ADD / BULK OPTIONS MODAL */}
        <QuickAddModal
          product={quickAddProduct}
          isOpen={isQuickAddOpen}
          onClose={() => {
            setIsQuickAddOpen(false);
            setQuickAddProduct(null);
          }}
        />
      </div>
    </main>
  );
}
