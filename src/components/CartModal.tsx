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

  // Dynamic fallback cache for items missing discount data
  const [cachedDiscounts, setCachedDiscounts] = useState<
    Record<string, { originalPrice: number; discountPercent: number }>
  >({});

  useEffect(() => {
    if (!isCartModalOpen || cartItems.length === 0) return;

    const missingIds = cartItems
      .filter((item) => item.discountPercent === undefined && item.originalPrice === undefined)
      .map((item) => item.productId);

    if (missingIds.length === 0) return;

    supabase
      .from('products')
      .select('id, price_per_unit, original_price')
      .in('id', missingIds)
      .then(({ data }) => {
        if (data) {
          const map: Record<string, { originalPrice: number; discountPercent: number }> = {};
          data.forEach((p) => {
            if (p.original_price && p.original_price > p.price_per_unit) {
              map[p.id] = {
                originalPrice: p.original_price,
                discountPercent: Math.round(
                  ((p.original_price - p.price_per_unit) / p.original_price) * 100
                ),
              };
            }
          });
          setCachedDiscounts((prev) => ({ ...prev, ...map }));
        }
      });
  }, [isCartModalOpen, cartItems]);

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
        className={`relative z-10 w-full max-w-[390px] sm:max-w-[420px] bg-white rounded-3xl shadow-xl border border-[#E2E8F0] flex flex-col max-h-[82vh] overflow-hidden ${
          isClosing ? 'animate-cart-despawn' : 'animate-cart-spawn'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-[#0b241b] via-[#0F3024] to-[#1c4737] text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
              <FiShoppingBag className="w-4 h-4 text-emerald-200" />
            </div>
            <div>
              <h2 id="cart-modal-title" className="font-medium font-display text-base leading-tight">
                Your Basket
              </h2>
              <p className="text-[11px] text-emerald-100/90 font-normal font-sans">
                {itemCount} {itemCount === 1 ? 'item' : 'items'} selected
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {cartItems.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="text-[11px] text-emerald-100 hover:text-white underline underline-offset-2 transition-colors px-1 font-sans"
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
                  stroke="#0F3024"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="drop-shadow-sm"
                >
                  <circle cx="9" cy="21" r="1.5" fill="#0F3024" />
                  <circle cx="19" cy="21" r="1.5" fill="#0F3024" />
                  <path d="M2.5 3h3l2.6 12.3a2 2 0 0 0 2 1.7h9.8a2 2 0 0 0 2-1.6l1.6-7.4H6.5" />
                </svg>
              </div>
            </div>

            <div>
              <h3 className="font-medium font-display text-[#2D3748] text-lg">Your basket is empty!</h3>
              <p className="text-[#718096] text-xs mt-1 max-w-[240px] leading-relaxed font-sans">
                Add fresh produce or join an active group-buy campaign to get started.
              </p>
            </div>

            <button
              type="button"
              onClick={handleDismiss}
              className="bg-[#0F3024] hover:bg-[#153426] text-white text-xs font-medium py-2.5 px-6 rounded-full shadow-xs transition-all active:scale-95 font-sans"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-4 py-3 divide-y divide-[#E2E8F0]">
            {cartItems.map((item) => (
              <div
                key={`${item.productId}-${item.purchaseType}`}
                className="py-3 flex items-center gap-3 group"
              >
                {/* Product Thumbnail */}
                <div className="relative w-16 h-16 flex-shrink-0 bg-[#FAFAFA] rounded-xl overflow-hidden border border-[#E2E8F0]">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#718096] text-[10px]">
                      No img
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className="font-medium font-display text-[#2D3748] text-sm truncate max-w-[170px]">
                      {item.name}
                    </h4>
                    {item.purchaseType === 'bulk' && (
                      <span className="bg-[#0F3024] text-white text-[9px] font-medium px-1.5 py-0.5 rounded-full font-display">
                        Bulk
                      </span>
                    )}
                    {item.purchaseType === 'group' && (
                      <span className="bg-[#C05E44] text-white text-[9px] font-medium px-1.5 py-0.5 rounded-full font-display">
                        Group Buy
                      </span>
                    )}
                  </div>

                  {/* Item Unit Price & Percentage Discount Tag */}
                  {(() => {
                    const fallback = cachedDiscounts[item.productId];
                    const originalPrice = item.originalPrice ?? fallback?.originalPrice;
                    const discountPercent =
                      item.discountPercent ??
                      (originalPrice && originalPrice > item.priceAtAddition
                        ? Math.round(((originalPrice - item.priceAtAddition) / originalPrice) * 100)
                        : fallback?.discountPercent ?? 0);

                    return (
                      <div className="flex items-center gap-1.5 flex-wrap mt-0.5 font-sans">
                        <span className="text-xs font-semibold text-[#C05E44]">
                          {formatNaira(item.priceAtAddition)}
                        </span>

                        {originalPrice && originalPrice > item.priceAtAddition && (
                          <span className="text-[10px] text-[#718096] line-through">
                            {formatNaira(originalPrice)}
                          </span>
                        )}

                        {discountPercent > 0 && (
                          <span className="text-[9px] font-semibold text-[#C05E44] bg-[#C05E44]/10 border border-[#C05E44]/30 px-1.5 py-0.5 rounded-full">
                            -{discountPercent}%
                          </span>
                        )}
                      </div>
                    );
                  })()}

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex items-center border border-[#E2E8F0] rounded-lg overflow-hidden bg-white">
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.productId, item.purchaseType, item.quantity - 1)
                        }
                        disabled={item.purchaseType === 'group' || item.quantity <= 1}
                        className="px-2 py-0.5 text-xs text-[#718096] hover:bg-[#FAFAFA] hover:text-[#2D3748] transition-colors disabled:opacity-30 disabled:hover:bg-transparent font-medium"
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="px-2 text-xs font-semibold text-[#2D3748] min-w-[20px] text-center font-sans">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.productId, item.purchaseType, item.quantity + 1)
                        }
                        disabled={item.purchaseType === 'group'}
                        className="px-2 py-0.5 text-xs text-[#718096] hover:bg-[#FAFAFA] hover:text-[#2D3748] transition-colors disabled:opacity-30 disabled:hover:bg-transparent font-medium"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>

                    <span className="text-xs font-semibold text-[#2D3748] ml-auto font-sans">
                      {formatNaira(item.priceAtAddition * item.quantity)}
                    </span>
                  </div>
                </div>

                {/* Remove Trash Button */}
                <button
                  type="button"
                  onClick={() => removeFromCart(item.productId, item.purchaseType)}
                  className="text-[#718096] hover:text-[#C05E44] p-1.5 rounded-lg hover:bg-red-50/50 transition-colors self-center"
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
          <div className="p-4 bg-[#FAFAFA] border-t border-[#E2E8F0] flex flex-col gap-3">
            {/* Subtotal */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-normal text-[#718096]">Subtotal</span>
              <span className="text-lg font-semibold text-[#C05E44] font-sans">{formatNaira(cartTotal)}</span>
            </div>

            {/* Primary Action: Proceed to Checkout */}
            <button
              type="button"
              onClick={handleProceedCheckout}
              disabled={isCheckingOut}
              className="w-full bg-[#0F3024] hover:bg-[#153426] text-white font-medium text-sm py-3.5 px-4 rounded-full shadow-xs hover:shadow-md transition-all active:scale-[0.98] disabled:opacity-75 disabled:cursor-wait flex items-center justify-center gap-2 font-sans"
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
                className="group inline-flex items-center gap-1.5 text-xs font-medium text-[#718096] hover:text-[#0F3024] transition-colors py-1 px-3 rounded-md hover:bg-white"
              >
                <span>View Cart Page</span>
                <FiArrowRight className="w-3.5 h-3.5 text-[#718096] group-hover:text-[#0F3024] group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

