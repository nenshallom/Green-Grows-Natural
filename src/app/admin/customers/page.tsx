'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';

interface Order {
  id: string;
  created_at: string;
  tracking_number: string;
  total_amount: number;
  payment_status: string;
  payment_method: string;
}

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  price_at_purchase: number;
  purchase_type: string;
}

interface CustomerProfile {
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

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  
  // UI Controls
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<'newest-account' | 'ltv-desc' | 'orders-desc' | 'recent-active'>('newest-account');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'year'>('all');
  
  // --- NEW: ORDER VOLUME FILTER ---
  const [orderFilter, setOrderFilter] = useState<'all' | 'leads' | 'first-timers' | 'regulars' | 'vips'>('all');
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Modal State
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'paystack' | 'offline'>('all');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [expandedOrderItems, setExpandedOrderItems] = useState<OrderItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  useEffect(() => {
    setHistoryFilter('all');
    setExpandedOrderId(null);
    setExpandedOrderItems([]);
  }, [selectedCustomer]);

  const fetchAndProcessCustomers = async () => {
    setLoading(true);
    try {
      const { data: authUsers, error: usersError } = await supabase.rpc('get_all_users_for_admin');
      if (usersError) throw usersError;

      const { data: allOrders, error: ordersError } = await supabase.from('orders').select('*');
      if (ordersError) throw ordersError;

      const profileMap = new Map<string, CustomerProfile>();

      (authUsers || []).forEach((u: any) => {
        const meta = u.raw_meta || {};
        profileMap.set(u.email, {
          is_registered: true,
          account_created_at: u.created_at,
          email: u.email,
          first_name: meta.first_name || meta.full_name?.split(' ')[0] || 'Guest',
          last_name: meta.last_name || meta.full_name?.split(' ')[1] || 'User',
          phone: meta.phone_number || 'No Phone',
          shipping_address: 'No Default Address',
          state: 'N/A',
          lga: 'N/A',
          total_orders: 0,
          lifetime_value: 0,
          last_active_date: u.created_at,
          order_history: [],
        });
      });

      (allOrders || []).forEach((order: any) => {
        const email = order.email || `guest-${order.id}`;

        if (profileMap.has(email)) {
          const cust = profileMap.get(email)!;
          cust.total_orders += 1;
          if (order.payment_status === 'paid') cust.lifetime_value += order.total_amount;
          cust.order_history.push(order);
          if (new Date(order.created_at) >= new Date(cust.last_active_date)) {
            cust.last_active_date = order.created_at;
            cust.shipping_address = order.shipping_address || cust.shipping_address;
            cust.state = order.state || cust.state;
            cust.lga = order.lga || cust.lga;
          }
        } else {
          profileMap.set(email, {
            is_registered: false,
            account_created_at: order.created_at,
            email: order.email || 'No Email',
            first_name: order.first_name || 'Guest',
            last_name: order.last_name || 'User',
            phone: order.contact_phone || 'No Phone',
            shipping_address: order.shipping_address || 'No Address',
            state: order.state || 'N/A',
            lga: order.lga || 'N/A',
            total_orders: 1,
            lifetime_value: order.payment_status === 'paid' ? order.total_amount : 0,
            last_active_date: order.created_at,
            order_history: [order],
          });
        }
      });

      profileMap.forEach(cust => {
        cust.order_history.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      });

      setCustomers(Array.from(profileMap.values()));
    } catch (error: any) {
      console.error("Error processing CRM:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAndProcessCustomers(); }, []);

  // --- DATA PIPELINE ---
  const processedCustomers = useMemo(() => {
    let result = customers.filter(cust => {
      // 1. Search
      const searchLower = searchTerm.toLowerCase();
      const fName = String(cust.first_name).toLowerCase();
      const lName = String(cust.last_name).toLowerCase();
      const cEmail = String(cust.email).toLowerCase();
      const cPhone = String(cust.phone);
      const matchesSearch = fName.includes(searchLower) || lName.includes(searchLower) || cEmail.includes(searchLower) || cPhone.includes(searchTerm);

      // 2. Date Filter
      let matchesDate = true;
      if (dateFilter !== 'all') {
        const createdDate = new Date(cust.account_created_at).getTime();
        const now = new Date().getTime();
        const oneDay = 24 * 60 * 60 * 1000;

        if (dateFilter === 'today') matchesDate = (now - createdDate) <= oneDay;
        if (dateFilter === 'week') matchesDate = (now - createdDate) <= (7 * oneDay);
        if (dateFilter === 'month') matchesDate = (now - createdDate) <= (30 * oneDay);
        if (dateFilter === 'year') matchesDate = (now - createdDate) <= (365 * oneDay);
      }

      // 3. NEW: Order Volume Filter (Lead Targeting)
      let matchesVolume = true;
      if (orderFilter === 'leads') matchesVolume = cust.total_orders === 0;
      if (orderFilter === 'first-timers') matchesVolume = cust.total_orders === 1;
      if (orderFilter === 'regulars') matchesVolume = cust.total_orders >= 2 && cust.total_orders <= 5;
      if (orderFilter === 'vips') matchesVolume = cust.total_orders >= 6;

      return matchesSearch && matchesDate && matchesVolume;
    });

    result.sort((a, b) => {
      if (sortConfig === 'ltv-desc') return b.lifetime_value - a.lifetime_value;
      if (sortConfig === 'orders-desc') return b.total_orders - a.total_orders;
      if (sortConfig === 'recent-active') return new Date(b.last_active_date).getTime() - new Date(a.last_active_date).getTime();
      if (sortConfig === 'newest-account') return new Date(b.account_created_at).getTime() - new Date(a.account_created_at).getTime();
      return 0;
    });

    return result;
  }, [customers, searchTerm, dateFilter, sortConfig, orderFilter]); // Added orderFilter to dependencies

  const totalPages = Math.ceil(processedCustomers.length / itemsPerPage);
  const currentCustomers = processedCustomers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, dateFilter, sortConfig, orderFilter]);

  const handleToggleOrderDetails = async (orderId: string) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
      return;
    }
    setExpandedOrderId(orderId);
    setLoadingItems(true);
    try {
      const { data, error } = await supabase.from('order_items').select('*').eq('order_id', orderId);
      if (error) throw error;
      setExpandedOrderItems(data || []);
    } catch (error: any) {
      console.error("Error fetching items:", error.message);
    } finally {
      setLoadingItems(false);
    }
  };

  const filteredOrderHistory = selectedCustomer?.order_history.filter(order => 
    historyFilter === 'all' || order.payment_method === historyFilter
  ) || [];

  // --- NEW: THE SPREADSHEET EXPORT ENGINE ---
  const exportToCSV = () => {
    if (processedCustomers.length === 0) return alert("No data to export!");

    // 1. Create the Column Headers
    const headers = [
      "First Name", "Last Name", "Email", "Phone", "Account Status", 
      "Total Orders", "Lifetime Value (NGN)", "Account Created", "Last Active", "State", "LGA"
    ];

    // 2. Map the dynamically filtered data into rows
    const csvRows = processedCustomers.map(cust => {
      // Clean up strings to prevent commas in the data from breaking the CSV layout
      const cleanString = (str: string) => `"${str.replace(/"/g, '""')}"`;

      return [
        cleanString(cust.first_name),
        cleanString(cust.last_name),
        cleanString(cust.email),
        cleanString(cust.phone),
        cust.is_registered ? "Registered" : "Guest",
        cust.total_orders,
        cust.lifetime_value,
        cleanString(new Date(cust.account_created_at).toLocaleDateString()),
        cleanString(new Date(cust.last_active_date).toLocaleDateString()),
        cleanString(cust.state),
        cleanString(cust.lga)
      ].join(","); // Join each item in the row with a comma
    });

    // 3. Combine Headers and Rows
    const csvContent = [headers.join(","), ...csvRows].join("\n");

    // 4. Create a hidden download link and trigger the browser download
    const BOM = '\uFEFF'; 
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `ggn_customers_${orderFilter}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customer CRM</h1>
          <p className="text-gray-600 mt-1">Target specific audiences and export lists for your marketing campaigns.</p>
        </div>
        
        {/* EXPORT BUTTON */}
        <button 
          onClick={exportToCSV}
          disabled={loading || processedCustomers.length === 0}
          className="bg-blue-600 text-white font-bold py-2.5 px-5 rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:bg-gray-400 flex items-center gap-2 w-full md:w-auto justify-center"
        >
          <span>📊</span> Export to Google Sheets (CSV)
        </button>
      </div>

      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col gap-4">
        <div className="w-full relative">
          <input type="text" placeholder="Search by Name, Email, or Phone..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm bg-gray-50" />
          <span className="absolute left-3 top-3.5 text-gray-400">🔍</span>
        </div>
        
        <div className="flex flex-wrap gap-4 justify-between border-t border-gray-100 pt-4">
          
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-500 font-medium">Joined:</label>
              <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value as any)} className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none bg-white">
                <option value="all">All Time</option>
                <option value="today">Last 24 Hours</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="year">This Year</option>
              </select>
            </div>

            {/* NEW: AUDIENCE SEGMENTATION FILTER */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-500 font-medium">Audience:</label>
              <select value={orderFilter} onChange={(e) => setOrderFilter(e.target.value as any)} className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-blue-50 text-blue-900 font-medium border-blue-200">
                <option value="all">Everyone</option>
                <option value="leads">Leads (0 Orders)</option>
                <option value="first-timers">First Timers (1 Order)</option>
                <option value="regulars">Regulars (2 - 5 Orders)</option>
                <option value="vips">VIPs (6+ Orders)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500 font-medium">Sort Strategy:</label>
            <select value={sortConfig} onChange={(e) => setSortConfig(e.target.value as any)} className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none bg-white">
              <option value="newest-account">Newest Accounts First</option>
              <option value="recent-active">Most Recently Active</option>
              <option value="ltv-desc">Highest Lifetime Value</option>
              <option value="orders-desc">Most Orders Placed</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        {loading ? (
          <div className="p-12 text-center text-gray-500 animate-pulse font-medium">Syncing comprehensive CRM...</div>
        ) : currentCustomers.length === 0 ? (
          <div className="p-12 text-center text-gray-500 border border-dashed border-gray-200 m-4 rounded-lg bg-gray-50">
             No accounts found matching your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-sm text-gray-500">
                  <th className="p-4 font-medium">Customer Info</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Joined On</th>
                  <th className="p-4 font-medium">Total Orders</th>
                  <th className="p-4 font-medium">LTV (Paid)</th>
                  <th className="p-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentCustomers.map((cust, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-gray-900">{cust.first_name} {cust.last_name}</p>
                      <p className="text-xs text-blue-600">{cust.email}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{cust.phone}</p>
                    </td>
                    <td className="p-4">
                      {cust.is_registered 
                        ? <span className="text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider bg-green-100 text-green-800">Registered</span>
                        : <span className="text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider bg-gray-200 text-gray-700">Guest Buyer</span>
                      }
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {new Date(cust.account_created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      {cust.total_orders === 0 ? (
                         <span className="text-red-500 font-bold text-xs bg-red-50 px-2 py-1 rounded border border-red-100">0 Orders (Lead)</span>
                      ) : cust.total_orders >= 6 ? (
                         <span className="text-purple-700 font-bold text-xs bg-purple-50 px-2 py-1 rounded border border-purple-100">★ VIP ({cust.total_orders})</span>
                      ) : (
                         <span className="text-gray-900 font-bold text-sm">{cust.total_orders}</span>
                      )}
                    </td>
                    <td className="p-4 font-black text-green-700">
                      ₦{cust.lifetime_value.toLocaleString()}
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => setSelectedCustomer(cust)} className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-black transition-colors shadow-sm">
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && totalPages > 1 && (
        <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">
            Showing <span className="font-bold">{processedCustomers.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold">{Math.min(currentPage * itemsPerPage, processedCustomers.length)}</span> of <span className="font-bold">{processedCustomers.length}</span> accounts
          </p>
          <div className="flex gap-2">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50">Previous</button>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50">Next</button>
          </div>
        </div>
      )}

      {/* --- CUSTOMER PROFILE MODAL (Remains unchanged from the previous deep-dive version) --- */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col border border-gray-100">
            
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-2xl font-black border-2 border-green-200 uppercase">
                  {selectedCustomer.first_name[0]}{selectedCustomer.last_name[0]}
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900">{selectedCustomer.first_name} {selectedCustomer.last_name}</h2>
                  <p className="text-gray-500 text-sm">Customer since {new Date(selectedCustomer.account_created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="text-gray-400 hover:text-gray-700 bg-white p-2 rounded-full shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto bg-gray-50/30">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Lifetime Value</p>
                  <p className="text-2xl font-black text-green-700 mt-1">₦{selectedCustomer.lifetime_value.toLocaleString()}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Total Orders</p>
                  <p className="text-2xl font-black text-gray-900 mt-1">{selectedCustomer.total_orders}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm md:col-span-2">
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Contact Info</p>
                  <div className="mt-1 flex flex-col sm:flex-row sm:gap-4 text-sm font-medium text-gray-800">
                    <a href={`mailto:${selectedCustomer.email}`} className="text-blue-600 hover:underline flex items-center gap-1">✉️ {selectedCustomer.email}</a>
                    <span className="flex items-center gap-1 mt-1 sm:mt-0">📞 {selectedCustomer.phone}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-gray-200 bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Complete Order History</h3>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-500 font-bold uppercase tracking-wider">Filter Payment:</label>
                    <select value={historyFilter} onChange={(e) => setHistoryFilter(e.target.value as any)} className="border rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-green-500 outline-none bg-gray-50 text-gray-700 font-medium">
                      <option value="all">All Methods</option>
                      <option value="paystack">Paystack Online</option>
                      <option value="offline">Offline Transfer</option>
                    </select>
                  </div>
                </div>

                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="p-4 font-medium text-gray-500">Tracking ID & Date</th>
                      <th className="p-4 font-medium text-gray-500">Payment</th>
                      <th className="p-4 font-medium text-gray-500 text-right">Amount</th>
                      <th className="p-4 font-medium text-gray-500 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredOrderHistory.length === 0 ? (
                       <tr><td colSpan={4} className="p-8 text-center text-gray-400 italic">No orders match this payment filter.</td></tr>
                    ) : (
                      filteredOrderHistory.map((order) => (
                        <React.Fragment key={order.id}>
                          <tr className={`hover:bg-gray-50 transition-colors ${expandedOrderId === order.id ? 'bg-green-50/30' : ''}`}>
                            <td className="p-4">
                               <p className="font-bold text-gray-900">{order.tracking_number}</p>
                               <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
                            </td>
                            <td className="p-4">
                              <div className="flex flex-col gap-1 items-start">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${order.payment_method === 'paystack' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>{order.payment_method}</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${order.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{order.payment_status}</span>
                              </div>
                            </td>
                            <td className="p-4 font-black text-gray-900 text-right">₦{order.total_amount.toLocaleString()}</td>
                            <td className="p-4 text-right">
                              <button onClick={() => handleToggleOrderDetails(order.id)} className="text-green-600 font-bold text-xs hover:bg-green-50 px-3 py-2 rounded-lg transition-colors border border-green-200">
                                {expandedOrderId === order.id ? 'Hide Items ↑' : 'View Items ↓'}
                              </button>
                            </td>
                          </tr>
                          {expandedOrderId === order.id && (
                            <tr className="bg-gray-50 border-b-2 border-green-200 shadow-inner">
                              <td colSpan={4} className="p-0">
                                <div className="p-6">
                                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Items in Order {order.tracking_number}</h4>
                                  {loadingItems ? (
                                    <div className="text-gray-400 text-sm animate-pulse">Loading items...</div>
                                  ) : expandedOrderItems.length === 0 ? (
                                    <div className="text-gray-400 text-sm">No items found for this order.</div>
                                  ) : (
                                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                      <ul className="divide-y divide-gray-100">
                                        {expandedOrderItems.map(item => (
                                          <li key={item.id} className="p-3 flex justify-between items-center text-sm">
                                            <div>
                                              <p className="font-bold text-gray-900">{item.product_name}</p>
                                              <div className="flex items-center gap-2 mt-1">
                                                <span className="text-gray-500">{item.quantity} units @ ₦{item.price_at_purchase.toLocaleString()}/ea</span>
                                                <span className="text-[10px] font-bold uppercase bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{item.purchase_type}</span>
                                              </div>
                                            </div>
                                            <p className="font-bold text-gray-900">₦{(item.quantity * item.price_at_purchase).toLocaleString()}</p>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}