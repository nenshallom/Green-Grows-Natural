import { PurchaseType } from './product';

export interface CartItem {
  productId: string;
  name: string;
  image: string;
  quantity: number;
  purchaseType: PurchaseType;
  priceAtAddition: number;
}

export interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string, purchaseType: string) => void;
  updateQuantity: (productId: string, purchaseType: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  itemCount: number;
  isCartModalOpen: boolean;
  openCartModal: () => void;
  closeCartModal: () => void;
}

