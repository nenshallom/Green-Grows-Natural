import { PurchaseType } from './product';

export type PaymentStatus = 'paid' | 'pending' | 'failed' | 'refunded' | string;
export type DeliveryStatus = 'pending' | 'processing' | 'in_transit' | 'delivered' | 'cancelled' | string;
export type PaymentMethod = 'paystack' | 'offline' | string;

export interface OrderItem {
  id: string;
  order_id?: string;
  product_id?: string;
  product_name: string;
  quantity: number;
  price_at_purchase: number;
  purchase_type: PurchaseType | string;
}

export interface Order {
  id: string;
  created_at: string;
  tracking_number: string;
  total_amount: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  delivery_status: DeliveryStatus;
  order_status?: string;
  first_name?: string;
  last_name?: string;
  email?: string | null;
  contact_phone?: string;
  additional_phone?: string | null;
  shipping_address?: string;
  landmark?: string | null;
  state?: string;
  lga?: string;
  order_items?: OrderItem[];
}

