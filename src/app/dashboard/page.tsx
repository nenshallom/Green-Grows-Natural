'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// --- NEW: Icons for a premium feel ---
import { FiPackage, FiUser, FiShield, FiLogOut, FiClock, FiCheckCircle } from 'react-icons/fi';

interface OrderItem { id: string; product_name: string; quantity: number; price_at_purchase: number; purchase_type: string; }
interface Order { id: string; tracking_number: string; total_amount: number; payment_method: string; payment_status: string; order_status: string; created_at: string; order_items: OrderItem[]; delivery_status?: string; }

export default function DashboardPage() {
  const router = useRouter();
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'orders' | 'profile' | 'security'>('orders');
  
  // Data State
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  
  // Profile Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [stateName, setStateName] = useState('');
  const [lga, setLga] = useState('');
  const [landmark, setLandmark] = useState('');
  const [profileMessage, setProfileMessage] = useState<{type: 'success'|'error', text: string} | null>(null);
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Security Form State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityMessage, setSecurityMessage] = useState<{type: 'success'|'error', text: string} | null>(null);
  const [updatingSecurity, setUpdatingSecurity] = useState(false);

  useEffect(() => {
    const fetchUserDataAndOrders = async () => {
      try {
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        if (authError || !session?.user) { router.push('/login'); return; }

        const user = session.user;
        const meta = user.user_metadata;
        
        setUserEmail(user.email || '');
        setFirstName(meta?.first_name || meta?.full_name?.split(' ')[0] || '');
        setLastName(meta?.last_name || meta?.full_name?.split(' ')[1] || '');
        setPhone(meta?.phone_number || '');
        setAddress(meta?.default_address || '');
        setStateName(meta?.default_state || '');
        setLga(meta?.default_lga || '');
        setLandmark(meta?.default_landmark || '');

        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select(`*, order_items (*)`)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (ordersError) throw ordersError;
        setOrders(ordersData as Order[]);
      } catch (error: any) {
        console.error("Error:", error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchUserDataAndOrders();
  }, [router]);

  // --- HANDLERS ---
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingProfile(true);
    setProfileMessage(null);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          first_name: firstName,
          last_name: lastName,
          phone_number: phone,
          default_address: address,
          default_state: stateName,
          default_lga: lga,
          default_landmark: landmark,
        }
      });
      if (error) throw error;
      setProfileMessage({ type: 'success', text: 'Profile and default address updated successfully!' });
    } catch (error: any) {
      setProfileMessage({ type: 'error', text: error.message });
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingSecurity(true);
    setSecurityMessage(null);
    if (newPassword !== confirmPassword) {
      setSecurityMessage({ type: 'error', text: 'Passwords do not match.' });
      setUpdatingSecurity(false);
      return;
    }
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setSecurityMessage({ type: 'success', text: 'Password updated successfully!' });
      setNewPassword(''); setConfirmPassword('');
    } catch (error: any) {
      setSecurityMessage({ type: 'error', text: error.message });
    } finally {
      setUpdatingSecurity(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm("Are you sure you want to delete your account? This action cannot be undone and you will lose your order history.");
    if (confirmed) {
      await supabase.auth.updateUser({ data: { is_deleted: true } });
      await supabase.auth.signOut();
      alert("Your account has been deactivated.");
      router.push('/');
    }
  };

  // --- NEW: LOGOUT HANDLER ---
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  if (loading) return <main className="min-h-screen bg-[#FDFDFD] p-8 flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1A4331]"></div></main>;

  return (
    <main className="min-h-screen bg-[#FDFDFD] py-10 px-4 md:px-8 lg:px-16">
      <div className="max-w-5xl mx-auto">
        
        {/* --- UPGRADED HEADER & LOGOUT --- */}
        <header className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-[#1A4331] tracking-tight">Welcome back, {firstName || 'User'}!</h1>
            <p className="text-gray-500 mt-2 font-medium">Manage your orders, tracking, and account settings.</p>
          </div>
          
          <button 
            onClick={handleLogout}
            aria-label="Log out of your account"
            className="flex items-center justify-center gap-2 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 font-bold py-2.5 px-5 rounded-lg transition-colors border border-red-100 shadow-sm w-full sm:w-auto"
          >
            <FiLogOut className="text-lg" /> Log Out
          </button>
        </header>

        {/* --- ACCESSIBLE TAB NAVIGATION --- */}
        <div className="flex border-b border-gray-200 mb-8 overflow-x-auto scrollbar-hide" role="tablist" aria-label="Dashboard Tabs">
          <button
            role="tab"
            aria-selected={activeTab === 'orders'}
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-6 py-4 font-bold text-sm transition-all whitespace-nowrap border-b-2 ${
              activeTab === 'orders' ? 'border-[#1A4331] text-[#1A4331]' : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <FiPackage className="text-lg" /> Order History
          </button>
          
          <button
            role="tab"
            aria-selected={activeTab === 'profile'}
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-6 py-4 font-bold text-sm transition-all whitespace-nowrap border-b-2 ${
              activeTab === 'profile' ? 'border-[#1A4331] text-[#1A4331]' : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <FiUser className="text-lg" /> Profile Details
          </button>
          
          <button
            role="tab"
            aria-selected={activeTab === 'security'}
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 px-6 py-4 font-bold text-sm transition-all whitespace-nowrap border-b-2 ${
              activeTab === 'security' ? 'border-[#1A4331] text-[#1A4331]' : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <FiShield className="text-lg" /> Security
          </button>
        </div>

        {/* --- TAB CONTENT: ORDERS --- */}
        {activeTab === 'orders' && (
          <div role="tabpanel" aria-labelledby="orders-tab" className="animate-fade-in">
            {orders.length === 0 ? (
              <div className="bg-white p-16 rounded-2xl text-center border border-gray-100 shadow-sm flex flex-col items-center justify-center">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-4">
                  <FiPackage className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No orders yet</h3>
                <p className="text-gray-500 mb-6">Looks like you haven't placed any orders. Let's get some fresh produce!</p>
                <Link href="/products" className="bg-[#1A4331] text-white font-bold py-3 px-8 rounded-lg hover:bg-[#123122] transition-colors shadow-md">
                  Start Shopping
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map((order) => {
                  const isDelivered = order.delivery_status === 'Delivered';
                  return (
                    <div key={order.id} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 overflow-hidden">
                      
                      {/* Order Header */}
                      <div className="bg-gray-50/50 p-5 md:p-6 border-b border-gray-100 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Order Placed</p>
                          <p className="text-sm font-medium text-gray-800 flex items-center gap-2">
                            <FiClock className="text-gray-400" /> {formatDate(order.created_at)}
                          </p>
                        </div>
                        <div className="md:text-right">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Tracking ID</p>
                          <p className="font-mono font-bold text-[#1A4331]">{order.tracking_number}</p>
                        </div>
                      </div>

                      {/* Order Items */}
                      <div className="p-5 md:p-6">
                        <div className="flex flex-col gap-3">
                          {order.order_items.map((item) => (
                            <div key={item.id} className="flex justify-between items-center text-sm py-2 border-b border-gray-50 last:border-0 last:pb-0">
                              <div className="flex items-center gap-3">
                                <span className="bg-gray-100 text-gray-600 font-bold px-2 py-1 rounded text-xs">{item.quantity}x</span>
                                <span className="font-bold text-gray-800">{item.product_name}</span>
                                <span className="text-[10px] font-bold uppercase bg-green-50 text-green-700 px-1.5 py-0.5 rounded hidden sm:inline-block">
                                  {item.purchase_type}
                                </span>
                              </div>
                              <span className="font-bold text-gray-900">₦{(item.price_at_purchase * item.quantity).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Order Footer */}
                      <div className="bg-gray-50/50 p-5 md:p-6 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                          <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide border ${
                            isDelivered ? 'bg-green-50 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}>
                            {isDelivered ? <FiCheckCircle className="text-sm" /> : <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>}
                            {order.delivery_status || 'Processing'}
                          </span>
                          <span className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide border ${
                            order.payment_status === 'paid' ? 'bg-gray-100 text-gray-700 border-gray-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                          }`}>
                            {order.payment_status}
                          </span>
                        </div>
                        <div className="w-full sm:w-auto text-right flex justify-between sm:block items-center">
                          <span className="text-gray-500 text-sm font-medium sm:hidden">Total</span>
                          <span className="text-xl font-black text-gray-900">₦{order.total_amount.toLocaleString()}</span>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* --- TAB CONTENT: PROFILE & DELIVERY --- */}
        {activeTab === 'profile' && (
          <div role="tabpanel" aria-labelledby="profile-tab" className="bg-white p-6 md:p-10 rounded-2xl shadow-sm border border-gray-100 animate-fade-in">
            <h2 className="text-2xl font-black text-gray-900 mb-6">Personal Information</h2>
            
            {profileMessage && (
              <div className={`p-4 mb-8 rounded-lg text-sm font-medium flex items-center gap-2 ${profileMessage.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
                {profileMessage.type === 'success' && <FiCheckCircle className="text-lg" />}
                {profileMessage.text}
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-6 text-black">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-bold text-gray-700 mb-2">First Name</label>
                  <input id="firstName" type="text" value={firstName} onChange={(e)=>setFirstName(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-[#1A4331] focus:ring-1 focus:ring-[#1A4331] outline-none transition-shadow" />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-bold text-gray-700 mb-2">Last Name</label>
                  <input id="lastName" type="text" value={lastName} onChange={(e)=>setLastName(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-[#1A4331] focus:ring-1 focus:ring-[#1A4331] outline-none transition-shadow" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                  <input id="email" type="email" value={userEmail} readOnly aria-readonly="true" className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 outline-none cursor-not-allowed" />
                  <p className="text-xs text-gray-400 mt-2 font-medium flex items-center gap-1"><FiShield /> Secured. Cannot be changed.</p>
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-bold text-gray-700 mb-2">Phone Number</label>
                  <input id="phone" type="tel" value={phone} onChange={(e)=>setPhone(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-[#1A4331] focus:ring-1 focus:ring-[#1A4331] outline-none transition-shadow" />
                </div>
              </div>

              <div className="pt-8 mt-8 border-t border-gray-100">
                <h3 className="text-xl font-black text-gray-900 mb-6">Default Delivery Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label htmlFor="state" className="block text-sm font-bold text-gray-700 mb-2">State</label>
                    <input id="state" type="text" value={stateName} onChange={(e)=>setStateName(e.target.value)} className="w-full px-4 py-3 border text-black border-gray-300 rounded-xl focus:border-[#1A4331] focus:ring-1 focus:ring-[#1A4331] outline-none transition-shadow" />
                  </div>
                  <div>
                    <label htmlFor="lga" className="block text-sm font-bold text-gray-700 mb-2">LGA</label>
                    <input id="lga" type="text" value={lga} onChange={(e)=>setLga(e.target.value)} className="w-full px-4 py-3 border text-black border-gray-300 rounded-xl focus:border-[#1A4331] focus:ring-1 focus:ring-[#1A4331] outline-none transition-shadow" />
                  </div>
                </div>
                <div className="mb-6">
                  <label htmlFor="address" className="block text-sm font-bold text-gray-700 mb-2">Street Address</label>
                  <textarea id="address" rows={3} value={address} onChange={(e)=>setAddress(e.target.value)} className="w-full px-4 py-3 border text-black border-gray-300 rounded-xl focus:border-[#1A4331] focus:ring-1 focus:ring-[#1A4331] outline-none transition-shadow resize-none"></textarea>
                </div>
                <div>
                  <label htmlFor="landmark" className="block text-sm font-bold text-gray-700 mb-2">Closest Landmark</label>
                  <input id="landmark" type="text" value={landmark} onChange={(e)=>setLandmark(e.target.value)} className="w-full px-4 py-3 border text-black border-gray-300 rounded-xl focus:border-[#1A4331] focus:ring-1 focus:ring-[#1A4331] outline-none transition-shadow" />
                </div>
              </div>

              <div className="pt-4">
                <button type="submit" disabled={updatingProfile} className="w-full md:w-auto bg-[#1A4331] text-white font-bold py-3.5 px-8 rounded-xl hover:bg-[#123122] transition-colors disabled:bg-gray-400 shadow-md">
                  {updatingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* --- TAB CONTENT: SECURITY --- */}
        {activeTab === 'security' && (
          <div role="tabpanel" aria-labelledby="security-tab" className="space-y-8 animate-fade-in">
            
            {/* Change Password */}
            <div className="bg-white p-6 md:p-10 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-2xl font-black text-gray-900 mb-2">Change Password</h2>
              <p className="text-gray-500 mb-8 font-medium">Ensure your account is using a long, random password to stay secure.</p>
              
              {securityMessage && (
                <div className={`p-4 mb-6 rounded-lg text-sm font-medium flex items-center gap-2 ${securityMessage.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
                  {securityMessage.type === 'success' && <FiCheckCircle className="text-lg" />}
                  {securityMessage.text}
                </div>
              )}

              <form onSubmit={handleUpdatePassword} className="space-y-6 max-w-md">
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-bold text-gray-700 mb-2">New Password</label>
                  <input id="newPassword" type="password" required minLength={6} value={newPassword} onChange={(e)=>setNewPassword(e.target.value)} className="w-full px-4 py-3 border text-black border-gray-300 rounded-xl focus:border-[#1A4331] focus:ring-1 focus:ring-[#1A4331] outline-none transition-shadow" placeholder="••••••••" />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-bold text-gray-700 mb-2">Confirm New Password</label>
                  <input id="confirmPassword" type="password" required minLength={6} value={confirmPassword} onChange={(e)=>setConfirmPassword(e.target.value)} className="w-full px-4 py-3 border text-black border-gray-300 rounded-xl focus:border-[#1A4331] focus:ring-1 focus:ring-[#1A4331] outline-none transition-shadow" placeholder="••••••••" />
                </div>
                <button type="submit" disabled={updatingSecurity} className="w-full bg-[#1A4331] text-white font-bold py-3.5 px-8 rounded-xl hover:bg-[#123122] transition-colors disabled:bg-gray-400 shadow-md">
                  {updatingSecurity ? 'Updating Password...' : 'Update Password'}
                </button>
              </form>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-50 p-6 md:p-10 rounded-2xl border border-red-200 shadow-sm">
              <h2 className="text-2xl font-black text-red-800 mb-3">Danger Zone</h2>
              <p className="text-red-700 text-sm mb-6 font-medium max-w-2xl leading-relaxed">
                Deleting your account will remove your access to the platform immediately. 
                Your past order history will be retained internally strictly for business compliance and accounting purposes.
              </p>
              <button 
                onClick={handleDeleteAccount} 
                className="bg-red-600 text-white font-bold py-3.5 px-8 rounded-xl hover:bg-red-700 transition-colors shadow-md border border-red-700"
              >
                Deactivate My Account
              </button>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}