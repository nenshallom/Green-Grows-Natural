'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem, CartContextType, PurchaseType } from '@/types';

// Re-export for backward-compatibility with existing imports
export type { CartItem, CartContextType };

const CartContext = createContext<CartContextType | undefined>(undefined);

function isValidCartItem(item: unknown): item is CartItem {
  if (typeof item !== 'object' || item === null) return false;
  const candidate = item as Record<string, unknown>;
  const validPurchaseTypes: PurchaseType[] = ['standard', 'bulk', 'group'];

  return (
    typeof candidate.productId === 'string' &&
    candidate.productId.trim().length > 0 &&
    typeof candidate.name === 'string' &&
    typeof candidate.quantity === 'number' &&
    candidate.quantity > 0 &&
    typeof candidate.priceAtAddition === 'number' &&
    candidate.priceAtAddition >= 0 &&
    typeof candidate.purchaseType === 'string' &&
    validPurchaseTypes.includes(candidate.purchaseType as PurchaseType)
  );
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);

  const openCartModal = () => setIsCartModalOpen(true);
  const closeCartModal = () => setIsCartModalOpen(false);

  // WHEN APP LOADS: Check browser memory (localStorage) for saved cart with schema validation
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('ggn_cart');
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed)) {
          const validatedItems = parsed.filter(isValidCartItem);
          setCartItems(validatedItems);
        }
      }
    } catch (e) {
      console.error('Failed to parse cart from memory:', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // WHENEVER CART CHANGES: Save it to browser memory
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem('ggn_cart', JSON.stringify(cartItems));
      } catch (e) {
        console.error('Failed to persist cart to storage:', e);
      }
    }
  }, [cartItems, isLoaded]);

  // --- CART CONTROLS ---

  const addToCart = (newItem: CartItem) => {
    const sanitizedItem: CartItem = {
      ...newItem,
      quantity: Math.max(1, Math.floor(newItem.quantity || 1)),
      priceAtAddition: Math.max(0, newItem.priceAtAddition || 0),
    };

    setCartItems((prevItems) => {
      const existingItemIndex = prevItems.findIndex(
        (item) => item.productId === sanitizedItem.productId && item.purchaseType === sanitizedItem.purchaseType
      );

      if (existingItemIndex > -1) {
        const updatedItems = [...prevItems];
        // Note: Group buys stay strictly at 1 slot.
        if (sanitizedItem.purchaseType !== 'group') {
          updatedItems[existingItemIndex].quantity += sanitizedItem.quantity;
        }
        return updatedItems;
      } else {
        return [...prevItems, sanitizedItem];
      }
    });
  };

  const removeFromCart = (productId: string, purchaseType: string) => {
    setCartItems((prev) =>
      prev.filter((item) => !(item.productId === productId && item.purchaseType === purchaseType))
    );
  };

  const updateQuantity = (productId: string, purchaseType: string, quantity: number) => {
    const targetQty = Math.max(1, Math.floor(quantity));
    if (purchaseType === 'group') return; // Enforce group buy single-slot restriction

    setCartItems((prev) =>
      prev.map((item) =>
        item.productId === productId && item.purchaseType === purchaseType
          ? { ...item, quantity: targetQty }
          : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  // --- SAFE CART MATH ---
  const cartTotal = cartItems.reduce((total, item) => {
    const itemSubtotal = (Number(item.priceAtAddition) || 0) * (Number(item.quantity) || 0);
    return total + Math.max(0, itemSubtotal);
  }, 0);

  const itemCount = cartItems.reduce((count, item) => count + Math.max(0, Number(item.quantity) || 0), 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        itemCount,
        isCartModalOpen,
        openCartModal,
        closeCartModal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}