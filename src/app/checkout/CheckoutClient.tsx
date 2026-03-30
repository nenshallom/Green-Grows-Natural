'use client';
import { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import { usePaystackPayment } from 'react-paystack';
import { supabase } from '@/lib/supabase';

export default function CheckoutPage() {
  const { cartItems, itemCount, cartTotal, clearCart } = useCart(); 
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [additionalPhone, setAdditionalPhone] = useState('');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [state, setState] = useState('');
  const [lga, setLga] = useState('');

  const [paymentMethod, setPaymentMethod] = useState<'paystack' | 'offline'>('paystack');
  const [isProcessing, setIsProcessing] = useState(false);
  // --- NEW: Authentication Loading State ---
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  // --- NEW: PAYSTACK ENFORCEMENT STATE ---
  const hasGroupBuy = cartItems.some(item => item.purchaseType === 'group');

  useEffect(() => {
    // If cart has a group buy, strictly force Paystack online payment
    if (hasGroupBuy) {
      setPaymentMethod('paystack');
    }
  }, [hasGroupBuy]);

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/login');
        return;
      }
      const user = session.user;
      const meta = user.user_metadata;
      setUserId(user.id);
      setEmail(user.email || '');
      setFirstName(meta?.first_name || meta?.full_name?.split(' ')[0] || '');
      setLastName(meta?.last_name || meta?.full_name?.split(' ')[1] || '');
      setPhone(meta?.phone_number || '');
      
      // Auth is confirmed! Reveal the checkout page.
      setIsAuthChecking(false); 
    };
    getUser();
  }, [router]);

// --- NEW: Generate a stable Tracking Number / Reference for this session ---
const [checkoutReference, setCheckoutReference] = useState('');
useEffect(() => {
  if (userId) setCheckoutReference(`GGN-${new Date().getTime().toString().slice(-8)}`);
}, [userId, cartTotal]);

// ====================================================================
// 🚨 THE ENTERPRISE DATABASE ENGINE (Uses Supabase RPC Transaction) 🚨
// ====================================================================
const saveOrderToDatabase = async (paymentStatus: string, method: string) => {
  setIsProcessing(true);
  try {
    if (!userId) throw new Error("Authentication error. Please log in again.");

    const rpcCartItems = cartItems.map(item => ({
      product_id: item.productId, quantity: item.quantity, purchaseType: item.purchaseType
    }));

    // We use the synchronized checkoutReference here!
    const { error } = await supabase.rpc('process_checkout', {
      p_user_id: userId, p_email: email, p_first_name: firstName, p_last_name: lastName,
      p_phone: phone, p_additional_phone: additionalPhone, p_address: address,
      p_landmark: landmark, p_state: state, p_lga: lga,
      p_payment_method: method, p_payment_status: paymentStatus,
      p_tracking_number: checkoutReference, 
      p_cart_items: rpcCartItems
    });

    // If the webhook already inserted it, the UNIQUE constraint will throw an error. 
    // We can safely ignore that specific error because it means the order is already safe!
    if (error && !error.message.includes('unique constraint')) throw error;

    clearCart();
    alert(`Order Successful! Your Tracking Number is: ${checkoutReference}`);
    router.push('/dashboard');

  } catch (error: any) {
    console.error("RPC Checkout Error:", error);
    alert(`Transaction Failed: ${error.message}`);
  } finally {
    setIsProcessing(false);
  }
};

const paystackConfig = {
  reference: checkoutReference, // Synchronized reference!
  email: email,
  amount: cartTotal * 100, 
  publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY as string,
  // --- NEW: Embed the cart data into the payment so the Webhook can read it ---
  metadata: {
    custom_fields: [
      { display_name: "User ID", variable_name: "user_id", value: userId },
      { 
        display_name: "Checkout Data", 
        variable_name: "checkout_data", 
        value: JSON.stringify({ firstName, lastName, phone, additionalPhone, address, landmark, state, lga }) 
      },
      { 
        display_name: "Cart Payload", 
        variable_name: "cart_payload", 
        value: JSON.stringify(cartItems.map(item => ({ product_id: item.productId, quantity: item.quantity, purchase_type: item.purchaseType }))) 
      }
    ]
  }
};

const initializePayment = usePaystackPayment(paystackConfig);

  // --- UPGRADED ASYNC GATEKEEPER FUNCTION ---
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (itemCount === 0) return alert("Your cart is empty!");

    setIsProcessing(true); // Lock the button while we verify with the DB

    try {
      // ====================================================================
      // 🚨 UI PRE-FLIGHT CHECK (Over-Subscription & Active Batch Defense) 🚨
      // ====================================================================
      const groupBuyItems = cartItems.filter(item => item.purchaseType === 'group');
      
      if (groupBuyItems.length > 0) {
        if (!userId) throw new Error("Authentication error. Please log in again.");

        const groupProductIds = groupBuyItems.map(item => item.productId);
        
        // Fetch live product data for the group buys
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('id, name, current_group_buyers, group_threshold')
          .in('id', groupProductIds);

        if (productsError) throw productsError;
          
        if (productsData) {
          for (const product of productsData) {
            
            // 1. OVER-SUBSCRIPTION DEFENSE
            if (product.current_group_buyers >= (product.group_threshold || 1)) {
               alert(`Payment Blocked: The campaign for "${product.name}" is already full (${product.group_threshold}/${product.group_threshold}). Please remove it from your cart to continue.`);
               setIsProcessing(false);
               return; 
            }

            // 2. THE CURRENT CAMPAIGN BATCH DEFENSE 
            if (product.current_group_buyers > 0) {
               const { data: allGroupItems, error: itemsError } = await supabase
                  .from('order_items')
                  .select('order_id, product_name, orders(user_id, created_at)')
                  .eq('product_id', product.id)
                  .eq('purchase_type', 'group');

               if (itemsError) throw itemsError;

               if (allGroupItems && allGroupItems.length > 0) {
                  // Sort them all by Date Descending
                  const sortedItems = allGroupItems.sort((a, b) => {
                      const dateA = a.orders ? (Array.isArray(a.orders) ? new Date(a.orders[0]?.created_at).getTime() : new Date((a.orders as any).created_at).getTime()) : 0;
                      const dateB = b.orders ? (Array.isArray(b.orders) ? new Date(b.orders[0]?.created_at).getTime() : new Date((b.orders as any).created_at).getTime()) : 0;
                      return dateB - dateA; 
                  });

                  // Slice precisely to the size of the CURRENT active campaign
                  const currentCampaignItems = sortedItems.slice(0, product.current_group_buyers);
                  
                  // Check if this user owns one of these recent slots
                  const userInCurrentCampaign = currentCampaignItems.some(item => {
                      const itemUserId = item.orders ? (Array.isArray(item.orders) ? item.orders[0]?.user_id : (item.orders as any).user_id) : null;
                      return itemUserId === userId;
                  });

                  if (userInCurrentCampaign) {
                      alert(`Payment Blocked: You are already a participant in the active campaign for "${product.name}". The limit is 1 slot per customer until the campaign is completed and restarted.`);
                      setIsProcessing(false);
                      return;
                  }
               }
            }
          }
        }
      }
      // ====================================================================

      // If we pass the UI check, allow the checkout to proceed!
      if (paymentMethod === 'paystack') {
        setIsProcessing(false); // Let Paystack's UI take over loading state
        initializePayment({ 
          onSuccess: () => saveOrderToDatabase('paid', 'paystack'), 
          onClose: () => alert("Payment window closed.") 
        });
      } else {
        saveOrderToDatabase('pending', 'offline');
      }

    } catch (error: any) {
      alert(`Checkout Verification Error: ${error.message}`);
      setIsProcessing(false);
    }
  };

  // --- NEW: Block the UI from flashing ---
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
        <p className="text-gray-500 font-medium">Securing your session...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8 lg:p-16">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Secure Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Delivery Details</h2>
            
            <form id="checkout-form" onSubmit={handleCheckout} className="space-y-6 text-black">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full px-4 py-2 border text-black rounded-lg focus:border-green-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full px-4 py-2 border text-black rounded-lg focus:border-green-500 outline-none" />
                </div>
              </div>

              <div className="mt-4 mb-4 ">
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:border-green-500 outline-none bg-gray-50 text-gray-600" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Primary Phone</label>
                  <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-2 border text-black rounded-lg focus:border-green-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Additional Phone (Optional)</label>
                  <input type="tel" value={additionalPhone} onChange={(e) => setAdditionalPhone(e.target.value)} className="w-full px-4 py-2 border text-black rounded-lg focus:border-green-500 outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input type="text" required placeholder="e.g., Lagos" value={state} onChange={(e) => setState(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:border-green-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">LGA</label>
                  <input type="text" required placeholder="e.g., Ikeja" value={lga} onChange={(e) => setLga(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:border-green-500 outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Detailed Delivery Address</label>
                <textarea required rows={3} placeholder="Street name, house number..." value={address} onChange={(e) => setAddress(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:border-green-500 outline-none"></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Closest Landmark</label>
                <input type="text" placeholder="e.g., Opposite Zenith Bank" value={landmark} onChange={(e) => setLandmark(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:border-green-500 outline-none" />
              </div>

              <div className="pt-6 border-t border-gray-200">
                <h3 className="font-bold text-gray-900 mb-3">Payment Method</h3>
                <div className="space-y-3">
                  <label className={`flex items-center gap-3 p-4 border rounded-xl transition-colors ${paymentMethod === 'paystack' ? 'border-green-500 bg-green-50' : 'hover:bg-gray-50'} cursor-pointer`}>
                    <input type="radio" name="payment" checked={paymentMethod === 'paystack'} onChange={() => setPaymentMethod('paystack')} className="text-green-600 focus:ring-green-500 w-4 h-4" />
                    <div>
                      <span className="font-bold text-gray-900 block">Pay Online via Paystack</span>
                      <span className="text-sm text-gray-500">Instant confirmation via Card, USSD, or Bank App.</span>
                    </div>
                  </label>
                  
                  {/* --- UPGRADED: Offline Payment is Disabled for Group Buys --- */}
                  <label className={`flex items-center gap-3 p-4 border rounded-xl transition-colors ${paymentMethod === 'offline' ? 'border-green-500 bg-green-50' : 'hover:bg-gray-50'} ${hasGroupBuy ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
                    <input type="radio" name="payment" checked={paymentMethod === 'offline'} onChange={() => !hasGroupBuy && setPaymentMethod('offline')} disabled={hasGroupBuy} className="text-green-600 focus:ring-green-500 w-4 h-4" />
                    <div>
                      <span className="font-bold text-gray-900 block">Offline (Bank Transfer)</span>
                      <span className="text-sm text-gray-500">Order will be processed after manual admin verification.</span>
                      {hasGroupBuy && <span className="block text-xs font-bold text-red-500 mt-1">Not available for Group Buys. Online payment required.</span>}
                    </div>
                  </label>
                </div>
              </div>
            </form>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit sticky top-24">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
            
            <div className="space-y-3 mb-6 max-h-64 overflow-y-auto pr-2">
              {cartItems.map((item) => (
                <div key={`${item.productId}-${item.purchaseType}`} className="flex justify-between text-sm text-gray-600 pb-2 border-b border-gray-50 last:border-0">
                  <span className="flex-1 pr-2">
                    <span className="font-medium text-gray-800">{item.quantity}x</span> {item.name} 
                    <span className="text-[10px] font-bold uppercase bg-gray-100 px-1.5 py-0.5 rounded ml-2 text-gray-600">
                      {item.purchaseType}
                    </span>
                  </span>
                  <span className="font-medium text-gray-900 whitespace-nowrap">₦{(item.priceAtAddition * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 pt-4 mb-6 space-y-2">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Subtotal</span>
                <span>₦{cartTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-lg font-bold text-gray-900">Total</span>
                <span className="text-2xl font-bold text-green-700">₦{cartTotal.toLocaleString()}</span>
              </div>
            </div>

            <button type="submit" form="checkout-form" disabled={isProcessing} className="w-full bg-green-600 text-white font-bold py-4 rounded-xl hover:bg-green-700 transition-colors shadow-sm disabled:bg-green-400 text-lg flex justify-center items-center gap-2">
              {isProcessing ? 'Processing...' : (
                <>
                  {paymentMethod === 'paystack' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
                  ) : null}
                  {paymentMethod === 'paystack' ? 'Pay Securely' : 'Place Offline Order'}
                </>
              )}
            </button>
            <p className="text-center text-xs text-gray-400 mt-4 flex items-center justify-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" /></svg>
              Your data is encrypted and secure
            </p>
          </div>

        </div>
      </div>
    </main>
  );
}