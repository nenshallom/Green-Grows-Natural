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
    };
    getUser();
  }, [router]);

  // --- THE NEW SYNCHRONIZED DATABASE ENGINE ---
  const saveOrderToDatabase = async (paymentStatus: string, method: string) => {
    setIsProcessing(true);
    try {
      if (!userId) throw new Error("Authentication error. Please log in again.");

      const trackingNumber = `GGN-${new Date().getTime().toString().slice(-8)}`;

      // 1. Save the Main Order (Now includes delivery_status!)
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: userId,
          email: email,
          tracking_number: trackingNumber,
          total_amount: cartTotal, 
          payment_method: method,
          payment_status: paymentStatus,
          first_name: firstName,
          last_name: lastName,
          contact_phone: phone,
          additional_phone: additionalPhone,
          shipping_address: address,
          landmark: landmark,
          state: state,
          lga: lga,
          delivery_status: 'Pending Delivery' // New tracking default
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Save the Order Items
      const orderItems = cartItems.map(item => ({
        order_id: orderData.id,
        product_id: item.productId,
        product_name: item.name,
        quantity: item.quantity,
        price_at_purchase: item.priceAtAddition, 
        purchase_type: item.purchaseType
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      // 3. INVENTORY & CAMPAIGN MATHEMATICS
      for (const item of cartItems) {
        // Fetch current product state to do safe math
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('stock_quantity, current_group_buyers, group_threshold, name')
          .eq('id', item.productId)
          .single();

        if (!productError && productData) {
          // A: Deduct Stock
          const newStock = Math.max(0, productData.stock_quantity - item.quantity);
          let updatePayload: any = { stock_quantity: newStock };

          let notificationTitle = '🛒 New Product Sale';
          let notificationType = 'new_order';

          // B: Increment Group Campaign Tally
          if (item.purchaseType === 'group') {
            const newGroupCount = productData.current_group_buyers + 1;
            updatePayload.current_group_buyers = newGroupCount;
            
            notificationTitle = '🤝 New Group Buy Participant';
            notificationType = 'group_join';

            // Check if this purchase completed the campaign!
            if (newGroupCount === productData.group_threshold) {
              await supabase.from('admin_notifications').insert({
                title: '✅ Group Campaign Completed!',
                message: `The campaign for ${productData.name} has hit its target of ${productData.group_threshold} buyers! Time to fulfill.`,
                type: 'group_complete'
              });
            }
          }

          if (item.purchaseType === 'bulk') {
            notificationTitle = '📦 Wholesale Bulk Order';
            notificationType = 'bulk_order';
          }

          // C: Save the updated stock and group counts to the database
          await supabase.from('products').update(updatePayload).eq('id', item.productId);

          // D: Push a standard notification to the Admin
          await supabase.from('admin_notifications').insert({
            title: notificationTitle,
            message: `${firstName} bought ${item.quantity}x ${productData.name} via ${item.purchaseType.toUpperCase()} pricing.`,
            type: notificationType
          });
        }
      }

      clearCart();
      alert(`Order Successful! Your Tracking Number is: ${trackingNumber}`);
      router.push('/dashboard');

    } catch (error: any) {
      alert(`Error saving order: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const paystackConfig = {
    reference: `TXN_${new Date().getTime()}`,
    email: email,
    amount: cartTotal * 100, 
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY as string,
  };

  const initializePayment = usePaystackPayment(paystackConfig);

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (itemCount === 0) return alert("Your cart is empty!");
    
    if (paymentMethod === 'paystack') {
      initializePayment({ 
        onSuccess: () => saveOrderToDatabase('paid', 'paystack'), 
        onClose: () => alert("Payment window closed.") 
      });
    } else {
      saveOrderToDatabase('pending', 'offline');
    }
  };

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
                  <label className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-colors ${paymentMethod === 'paystack' ? 'border-green-500 bg-green-50' : 'hover:bg-gray-50'}`}>
                    <input type="radio" name="payment" checked={paymentMethod === 'paystack'} onChange={() => setPaymentMethod('paystack')} className="text-green-600 focus:ring-green-500 w-4 h-4" />
                    <div>
                      <span className="font-bold text-gray-900 block">Pay Online via Paystack</span>
                      <span className="text-sm text-gray-500">Instant confirmation via Card, USSD, or Bank App.</span>
                    </div>
                  </label>
                  
                  <label className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-colors ${paymentMethod === 'offline' ? 'border-green-500 bg-green-50' : 'hover:bg-gray-50'}`}>
                    <input type="radio" name="payment" checked={paymentMethod === 'offline'} onChange={() => setPaymentMethod('offline')} className="text-green-600 focus:ring-green-500 w-4 h-4" />
                    <div>
                      <span className="font-bold text-gray-900 block">Offline (Bank Transfer)</span>
                      <span className="text-sm text-gray-500">Order will be processed after manual admin verification.</span>
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