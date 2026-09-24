import { Order } from './order';

export interface CustomerProfile {
  is_registered: boolean;
  account_created_at: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  shipping_address: string;
  state: string;
  lga: string;
  total_orders: number;
  lifetime_value: number;
  last_active_date: string;
  order_history: Order[];
}

