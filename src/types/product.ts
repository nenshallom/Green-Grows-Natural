export type PurchaseType = 'standard' | 'bulk' | 'group';

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price_per_unit: number;
  original_price?: number | null;
  unit: string;
  stock_quantity: number;
  image_url: string | null;
  additional_images?: string[];
  // Bulk buy properties
  is_bulk_buy_enabled: boolean;
  bulk_buy_price?: number | null;
  bulk_threshold?: number | null;
  // Group buy properties
  is_group_buy_enabled: boolean;
  group_buy_price?: number | null;
  group_threshold?: number | null;
  current_group_buyers?: number;
  group_buy_deadline?: string | null;
}

export interface Participant {
  order_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  quantity: number;
  payment_status: string;
  date_joined: string;
}

