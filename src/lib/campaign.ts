import { supabase } from '@/lib/supabase';
import { CartItem } from '@/types/cart';

export interface CampaignValidationResult {
  valid: boolean;
  error?: string;
}

interface JoinedOrder {
  user_id?: string;
  created_at?: string;
}

interface GroupOrderItemRow {
  order_id: string;
  product_name: string;
  orders: JoinedOrder | JoinedOrder[] | null;
}

function extractJoinedOrderDate(orders: JoinedOrder | JoinedOrder[] | null): number {
  if (!orders) return 0;
  if (Array.isArray(orders)) {
    const first = orders[0];
    return first?.created_at ? new Date(first.created_at).getTime() : 0;
  }
  return orders.created_at ? new Date(orders.created_at).getTime() : 0;
}

function extractJoinedUserId(orders: JoinedOrder | JoinedOrder[] | null): string | null {
  if (!orders) return null;
  if (Array.isArray(orders)) {
    const first = orders[0];
    return first?.user_id ?? null;
  }
  return orders.user_id ?? null;
}

/**
 * Pre-flight validation for group buy items in the user's cart:
 * 1. Checks if the campaign has already reached its threshold.
 * 2. Checks if the current user already occupies a slot in the current active campaign cycle.
 */
export async function validateGroupBuyCart(
  cartItems: CartItem[],
  userId: string | null
): Promise<CampaignValidationResult> {
  const groupBuyItems = cartItems.filter((item) => item.purchaseType === 'group');

  if (groupBuyItems.length === 0) {
    return { valid: true };
  }

  if (!userId) {
    return {
      valid: false,
      error: 'Please log in to proceed with a Group Buy purchase.',
    };
  }

  const groupProductIds = groupBuyItems.map((item) => item.productId);

  // Fetch live product campaign counters
  const { data: productsData, error: productsError } = await supabase
    .from('products')
    .select('id, name, current_group_buyers, group_threshold')
    .in('id', groupProductIds);

  if (productsError) {
    throw productsError;
  }

  if (productsData) {
    for (const product of productsData) {
      const threshold = product.group_threshold || 1;
      const currentBuyers = product.current_group_buyers || 0;

      // 1. OVER-SUBSCRIPTION DEFENSE
      if (currentBuyers >= threshold) {
        return {
          valid: false,
          error: `The campaign for "${product.name}" is already full (${threshold}/${threshold}). Please remove it from your cart to continue.`,
        };
      }

      // 2. CURRENT CAMPAIGN BATCH DEFENSE (Limit: 1 slot per user per campaign cycle)
      if (currentBuyers > 0) {
        const { data: allGroupItems, error: itemsError } = await supabase
          .from('order_items')
          .select('order_id, product_name, orders(user_id, created_at)')
          .eq('product_id', product.id)
          .eq('purchase_type', 'group');

        if (itemsError) {
          throw itemsError;
        }

        if (allGroupItems && allGroupItems.length > 0) {
          const typedItems = allGroupItems as unknown as GroupOrderItemRow[];

          // Sort descending by order creation time
          const sortedItems = [...typedItems].sort((a, b) => {
            return extractJoinedOrderDate(b.orders) - extractJoinedOrderDate(a.orders);
          });

          // Slice precisely to the active campaign batch size
          const currentBatchItems = sortedItems.slice(0, currentBuyers);

          // Check if this user owns any slot in this active cycle
          const userInCurrentCampaign = currentBatchItems.some((item) => {
            return extractJoinedUserId(item.orders) === userId;
          });

          if (userInCurrentCampaign) {
            return {
              valid: false,
              error: `You are already a participant in the current active campaign for "${product.name}". The limit is 1 slot per customer until the campaign completes and restarts.`,
            };
          }
        }
      }
    }
  }

  return { valid: true };
}

