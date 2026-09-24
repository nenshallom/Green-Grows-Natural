'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FiX, FiTrash2, FiShoppingBag, FiArrowRight } from 'react-icons/fi';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { supabase } from '@/lib/supabase';
import { validateGroupBuyCart } from '@/lib/campaign';
import { formatNaira, getErrorMessage } from '@/utils/format';

export default function CartModal() {
  const {
    isCartModalOpen,
    closeCartModal,
    cartItems,
    cartTotal,
    itemCount,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  const { toast } = useToast();
  const router = useRouter();

  const [isClosing, setIsClosing] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Playful despawn animation handler before unmounting
  const handleDismiss = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      closeCartModal();
      setIsClosing(false);
    }, 220);
  }, [closeCartModal, isClosing]);

  // Navigate to /cart from the bottom-center link
  const handleNavigateToCart = useCallback(() => {
    handleDismiss();
    router.push('/cart');
  }, [handleDismiss, router]);

  // Keyboard Escape listener
  useEffect(() => {
    if (!isCartModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCartModalOpen, handleDismiss]);

  // Lock body scroll while modal is active
  useEffect(() => {
    if (isCartModalOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isCartModalOpen]);

  // Proceed to Checkout with campaign validation
  const handleProceedCheckout = async () => {
    if (cartItems.length === 0) return;
    setIsCheckingOut(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const hasGroupBuy = cartItems.some((item) => item.purchaseType === 'group');

      if (hasGroupBuy && !session?.user) {
        toast.warning('Please log in to proceed with a Group Buy purchase.');
        handleDismiss();
        router.push('/login');
        return;
      }

      // Pre-flight campaign check
      const validation = await validateGroupBuyCart(cartItems, session?.user?.id ?? null);
      if (!validation.valid) {
        toast.error(validation.error || 'Campaign validation failed. Please review your cart.');
        return;
      }

      handleDismiss();
      router.push('/checkout');
    } catch (error) {
      console.error('Checkout preflight error from cart modal:', error);
      toast.error(`Checkout error: ${getErrorMessage(error)}`);
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (!isCartModalOpen && !isClosing) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-modal-title"
      className="fixed inset-0 z-[100] flex flex-col items-center md:items-end justify-start pt-16 sm:pt-20 px-3 sm:px-6 md:px-10 lg:px-16 pointer-events-auto"
    >
      {/* Semi-transparent backdrop with click-to-dismiss */}
      <div
        onClick={handleDismiss}
        className={`fixed inset-0 bg-black/45 backdrop-blur-[2px] transition-opacity ${
          isClosing ? 'animate-cart-overlay-out' : 'animate-cart-overlay-in'
        }`}
        aria-hidden="true"
      />

      {/* Floating Modal Card / Desktop Dropdown */}
      <div
        className={`relative z-10 w-full max-w-[390px] sm:max-w-[420px] bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.25)] border border-gray-100 flex flex-col max-h-[82vh] overflow-hidden ${
          isClosing ? 'animate-cart-despawn' : 'animate-cart-spawn'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-[#1A4331] to-[#286266] text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
              <FiShoppingBag className="w-4 h-4 text-green-200" />
            </div>
            <div>
              <h2 id="cart-modal-title" className="font-extrabold text-base leading-tight">
                Your Basket
              </h2>
              <p className="text-[11px] text-green-100 font-medium">
                {itemCount} {itemCount === 1 ? 'item' : 'items'} selected
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {cartItems.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="text-[11px] text-green-100 hover:text-white underline underline-offset-2 transition-colors px-1"
                title="Empty basket"
              >
                Clear all
              </button>
            )}
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Close cart"
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-transform active:scale-90"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body: Empty State or Cart Items */}
        {cartItems.length === 0 ? (
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-4 my-auto">
            {/* Playful Animated Empty Basket Graphic */}
            <div className="relative w-28 h-28 flex items-center justify-center">
              {/* Floating Produce (Tomato & Leaf) */}
              <div className="absolute top-1 left-7 text-2xl animate-float-produce select-none">
                🍅
              </div>
              <div
                className="absolute top-3 right-5 text-xl animate-float-produce select-none"
                style={{ animationDelay: '0.8s' }}
              >
                🥬
              </div>
              <div
                className="absolute -top-1 right-10 text-lg animate-float-produce select-none"
                style={{ animationDelay: '1.4s' }}
              >
                🥕
              </div>

              {/* Bouncing Shopping Cart SVG */}
              <div className="animate-basket-bounce">
                <svg
                  width="76"
                  height="76"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#286266"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="drop-shadow-md"
                >
                  <circle cx="9" cy="21" r="1.5" fill="#1A4331" />
                  <circle cx="19" cy="21" r="1.5" fill="#1A4331" />
                  <path d="M2.5 3h3l2.6 12.3a2 2 0 0 0 2 1.7h9.8a2 2 0 0 0 2-1.6l1.6-7.4H6.5" />
                </svg>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 text-lg">Your basket is empty!</h3>
              <p className="text-gray-500 text-xs mt-1 max-w-[240px] leading-relaxed">
                Add fresh produce or join an active group-buy campaign to get started.
              </p>
            </div>

            <button
              type="button"
              onClick={handleDismiss}
              className="bg-[#1A4331] hover:bg-[#123023] text-white text-xs font-bold py-2.5 px-6 rounded-full shadow-md hover:shadow-lg transition-all active:scale-95"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-4 py-3 divide-y divide-gray-100">
            {cartItems.map((item) => (
              <div
                key={`${item.productId}-${item.purchaseType}`}
                className="py-3 flex items-center gap-3 group"
              >
                {/* Product Thumbnail */}
                <div className="relative w-16 h-16 flex-shrink-0 bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-[10px]">
                      No img
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className="font-bold text-gray-900 text-sm truncate max-w-[170px]">
                      {item.name}
                    </h4>
                    {item.purchaseType === 'bulk' && (
                      <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.5 rounded">
                        Bulk
                      </span>
                    )}
                    {item.purchaseType === 'group' && (
                      <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.5 rounded">
                        Group Buy
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-500 font-medium mt-0.5">
                    {formatNaira(item.priceAtAddition)}
                  </p>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.productId, item.purchaseType, item.quantity - 1)
                        }
                        disabled={item.purchaseType === 'group' || item.quantity <= 1}
                        className="px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-30 disabled:hover:bg-transparent font-bold"
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="px-2 text-xs font-bold text-gray-800 min-w-[20px] text-center">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.productId, item.purchaseType, item.quantity + 1)
                        }
                        disabled={item.purchaseType === 'group'}
                        className="px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-30 disabled:hover:bg-transparent font-bold"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>

                    <span className="text-xs font-black text-gray-900 ml-auto">
                      {formatNaira(item.priceAtAddition * item.quantity)}
                    </span>
                  </div>
                </div>

                {/* Remove Trash Button */}
                <button
                  type="button"
                  onClick={() => removeFromCart(item.productId, item.purchaseType)}
                  className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors self-center"
                  title="Remove item"
                  aria-label={`Remove ${item.name}`}
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Footer Area */}
        {cartItems.length > 0 && (
          <div className="p-4 bg-gray-50/80 border-t border-gray-100 flex flex-col gap-3">
            {/* Subtotal */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">Subtotal</span>
              <span className="text-lg font-black text-[#1A4331]">{formatNaira(cartTotal)}</span>
            </div>

            {/* Primary Action: Proceed to Checkout */}
            <button
              type="button"
              onClick={handleProceedCheckout}
              disabled={isCheckingOut}
              className="w-full bg-[#1A4331] hover:bg-[#123023] text-white font-extrabold text-sm py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-75 disabled:cursor-wait flex items-center justify-center gap-2"
            >
              {isCheckingOut ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <span>Proceed to Checkout</span>
                  <FiArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Bottom-Center Option: View Cart Page */}
            <div className="flex justify-center pt-1">
              <button
                type="button"
                onClick={handleNavigateToCart}
                className="group inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-[#1A4331] transition-colors py-1 px-3 rounded-md hover:bg-gray-100"
              >
                <span>View Cart Page</span>
                <FiArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#1A4331] group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

