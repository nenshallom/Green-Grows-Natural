'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// 1. Define what a single item in the cart looks like
export interface CartItem {
  productId: string;
  name: string;
  image: string;
  quantity: number;
  purchaseType: 'standard' | 'bulk' | 'group';
  priceAtAddition: number;
}

// 2. Define the remote control buttons for the cart
interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string, purchaseType: string) => void;
  updateQuantity: (productId: string, purchaseType: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  itemCount: number;
}

// 3. Create the empty broadcasting station
const CartContext = createContext<CartContextType | undefined>(undefined);

// 4. Build the actual station
export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false); // Prevents hydration errors in Next.js

  // WHEN APP LOADS: Check browser memory (localStorage) for an old cart
  useEffect(() => {
    const savedCart = localStorage.getItem('ggn_cart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to parse cart from memory.");
      }
    }
    setIsLoaded(true);
  }, []);

  // WHENEVER CART CHANGES: Save it to browser memory
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('ggn_cart', JSON.stringify(cartItems));
    }
  }, [cartItems, isLoaded]);

  // --- CART CONTROLS ---

  const addToCart = (newItem: CartItem) => {
    setCartItems((prevItems) => {
      // Check if they already have this exact product AND purchase type in the cart
      const existingItemIndex = prevItems.findIndex(
        (item) => item.productId === newItem.productId && item.purchaseType === newItem.purchaseType
      );

      if (existingItemIndex > -1) {
        // If yes, just increase the quantity
        const updatedItems = [...prevItems];
        // Note: Group buys stay strictly at 1. We don't increase it.
        if (newItem.purchaseType !== 'group') {
          updatedItems[existingItemIndex].quantity += newItem.quantity;
        }
        return updatedItems;
      } else {
        // If no, add it as a brand new line item
        return [...prevItems, newItem];
      }
    });
  };

  const removeFromCart = (productId: string, purchaseType: string) => {
    setCartItems((prev) => prev.filter(item => !(item.productId === productId && item.purchaseType === purchaseType)));
  };

  const updateQuantity = (productId: string, purchaseType: string, quantity: number) => {
    if (quantity < 1) return;
    if (purchaseType === 'group') return; // Enforce group buy restriction globally

    setCartItems((prev) =>
      prev.map((item) =>
        item.productId === productId && item.purchaseType === purchaseType
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  // --- CART MATH ---
  const cartTotal = cartItems.reduce((total, item) => total + (item.priceAtAddition * item.quantity), 0);
  const itemCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, itemCount }}>
      {children}
    </CartContext.Provider>
  );
}

// 5. The custom hook you will use in your pages!
export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}