import { supabase } from '@/lib/supabase';
import AdminDashboardClient from './AdminDashboardClient';

// Force the page to always fetch fresh data, so the admin doesn't see cached orders
export const dynamic = 'force-dynamic';

export default async function AdminDashboardOverview() {
  
  // PARALLEL DATA FETCHING: Run all 3 queries at the exact same time
  const [
    { data: ordersData, error: ordersError },
    { data: campaignsData, error: campaignsError },
    { data: notifData, error: notifError }
  ] = await Promise.all([
    supabase
      .from('orders')
      .select('created_at, total_amount, payment_method, delivery_status')
      .eq('payment_status', 'paid'),
    
    supabase
      .from('products')
      .select('id, name, current_group_buyers, group_threshold, image_url')
      .eq('is_group_buy_enabled', true)
      .order('current_group_buyers', { ascending: false })
      .limit(5),
      
    supabase
      .from('admin_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(8)
  ]);

  if (ordersError) console.error("Error fetching orders:", ordersError);
  if (campaignsError) console.error("Error fetching campaigns:", campaignsError);
  if (notifError) console.error("Error fetching notifications:", notifError);

  // Pass the instantly fetched data down to the interactive charts component
  return (
    <AdminDashboardClient 
      initialOrders={ordersData || []} 
      initialCampaigns={campaignsData || []} 
      initialNotifications={notifData || []} 
    />
  );
}