'use client';
import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';

interface Order {
  id: string;
  created_at: string;
  tracking_number: string;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  delivery_status: string; // <-- NEW: Tracking delivery state
  first_name: string;
  last_name: string;
  email: string | null;
  contact_phone: string;
  additional_phone: string | null;
  shipping_address: string;
  landmark: string | null;
  state: string;
  lga: string;
}

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  price_at_purchase: number;
  purchase_type: string;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [updating, setUpdating] = useState(false);

  // --- UI CONTROLS STATE ---
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'paystack' | 'offline'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month' | '6-months' | 'year'>('all');
  
  // --- NEW: DELIVERY FILTER STATE ---
  const [deliveryFilter, setDeliveryFilter] = useState<'all' | 'Pending Delivery' | 'Delayed' | 'Delivered'>('all');
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('orders').select('*');
      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      console.error("Error fetching orders:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  // --- UPGRADED DATA PIPELINE ---
  const processedOrders = useMemo(() => {
    let result = orders.filter(order => {
      // 1. Text Search
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        order.tracking_number.toLowerCase().includes(searchLower) ||
        order.first_name.toLowerCase().includes(searchLower) ||
        order.last_name.toLowerCase().includes(searchLower) ||
        order.contact_phone.includes(searchTerm) ||
        (order.email && order.email.toLowerCase().includes(searchLower));

      // 2. Payment Match
      const matchesPayment = paymentFilter === 'all' || order.payment_method === paymentFilter;

      // 3. NEW: Delivery Match
      const matchesDelivery = deliveryFilter === 'all' || order.delivery_status === deliveryFilter;

      // 4. Date Match
      let matchesDate = true;
      if (dateFilter !== 'all') {
        const orderDate = new Date(order.created_at).getTime();
        const now = new Date().getTime();
        const oneDay = 24 * 60 * 60 * 1000;

        if (dateFilter === 'today') matchesDate = (now - orderDate) <= oneDay;
        if (dateFilter === 'week') matchesDate = (now - orderDate) <= (7 * oneDay);
        if (dateFilter === 'month') matchesDate = (now - orderDate) <= (30 * oneDay);
        if (dateFilter === '6-months') matchesDate = (now - orderDate) <= (180 * oneDay);
        if (dateFilter === 'year') matchesDate = (now - orderDate) <= (365 * oneDay);
      }

      return matchesSearch && matchesPayment && matchesDelivery && matchesDate;
    });

    result.sort((a, b) => {
      if (sortConfig === 'date-desc') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortConfig === 'date-asc') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortConfig === 'amount-desc') return b.total_amount - a.total_amount;
      if (sortConfig === 'amount-asc') return a.total_amount - b.total_amount;
      return 0;
    });

    return result;
  }, [orders, searchTerm, sortConfig, paymentFilter, deliveryFilter, dateFilter]);

  const totalPages = Math.ceil(processedOrders.length / itemsPerPage);
  const currentOrders = processedOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, sortConfig, paymentFilter, deliveryFilter, dateFilter]);

  // --- UPGRADED CSV EXPORT ---
  const exportToCSV = () => {
    if (processedOrders.length === 0) return alert("No orders to export!");

    const headers = [
      "Tracking Number", "Date Placed", "Customer First Name", "Customer Last Name", 
      "Email", "Primary Phone", "Additional Phone", "State", "LGA", "Full Address", "Landmark",
      "Payment Method", "Payment Status", "Delivery Status", "Total Amount (NGN)" // Added Delivery Status
    ];

    const csvRows = processedOrders.map(order => {
      const cleanString = (str: string | null) => `"${(str || '').replace(/"/g, '""')}"`;
      return [
        cleanString(order.tracking_number),
        cleanString(new Date(order.created_at).toLocaleDateString()),
        cleanString(order.first_name),
        cleanString(order.last_name),
        cleanString(order.email),
        cleanString(order.contact_phone),
        cleanString(order.additional_phone),
        cleanString(order.state),
        cleanString(order.lga),
        cleanString(order.shipping_address),
        cleanString(order.landmark),
        cleanString(order.payment_method.toUpperCase()),
        cleanString(order.payment_status.toUpperCase()),
        cleanString(order.delivery_status.toUpperCase()), // Added Delivery Status
        order.total_amount
      ].join(",");
    });

    const csvContent = [headers.join(","), ...csvRows].join("\n");
    const BOM = '\uFEFF'; 
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `ggn_orders_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- DATABASE INTERACTIONS ---
  const handleViewDetails = async (order: Order) => {
    setSelectedOrder(order);
    setLoadingItems(true);
    try {
      const { data, error } = await supabase.from('order_items').select('*').eq('order_id', order.id);
      if (error) throw error;
      setOrderItems(data || []);
    } catch (error: any) {
      console.error("Error fetching items:", error.message);
    } finally {
      setLoadingItems(false);
    }
  };

  const handleUpdatePaymentStatus = async (orderId: string, newStatus: string) => {
    if (!window.confirm(`Mark payment as ${newStatus.toUpperCase()}?`)) return;
    setUpdating(true);
    try {
      const { error } = await supabase.from('orders').update({ payment_status: newStatus }).eq('id', orderId);
      if (error) throw error;
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, payment_status: newStatus } : o));
      if (selectedOrder?.id === orderId) setSelectedOrder({ ...selectedOrder, payment_status: newStatus });
    } catch (error: any) {
      alert(`Error updating payment: ${error.message}`);
    } finally {
      setUpdating(false);
    }
  };

  // --- NEW: DELIVERY STATUS UPDATER ---
  const handleUpdateDeliveryStatus = async (orderId: string, newStatus: string) => {
    if (!window.confirm(`Update delivery status to: ${newStatus}?`)) return;
    setUpdating(true);
    try {
      const { error } = await supabase.from('orders').update({ delivery_status: newStatus }).eq('id', orderId);
      if (error) throw error;
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, delivery_status: newStatus } : o));
      if (selectedOrder?.id === orderId) setSelectedOrder({ ...selectedOrder, delivery_status: newStatus });
    } catch (error: any) {
      alert(`Error updating delivery: ${error.message}`);
    } finally {
      setUpdating(false);
    }
  };

  // Helper function to color-code the delivery badge
  const getDeliveryBadgeStyle = (status: string) => {
    switch (status) {
      case 'Delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'Delayed': return 'bg-red-100 text-red-800 border-red-200 animate-pulse';
      default: return 'bg-gray-100 text-gray-800 border-gray-200'; // Pending
    }
  };

  return (
    <div>
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
          <p className="text-gray-600 mt-1">Verify payments, track logistics, and fulfill customer orders.</p>
        </div>
        <button onClick={exportToCSV} disabled={loading || processedOrders.length === 0} className="bg-blue-600 text-white font-bold py-2.5 px-5 rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:bg-gray-400 flex items-center gap-2 w-full md:w-auto justify-center">
          <span>📊</span> Export Orders (CSV)
        </button>
      </div>

      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col gap-4">
        <div className="w-full relative">
          <input type="text" placeholder="Search by ID, Name, Phone, or Email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm bg-gray-50" />
          <span className="absolute left-3 top-3.5 text-gray-400">🔍</span>
        </div>
        
        <div className="flex flex-col xl:flex-row gap-4 justify-between items-center border-t border-gray-100 pt-4">
          <div className="flex flex-wrap gap-4 w-full xl:w-auto">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-500 font-medium">Payment:</label>
              <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value as any)} className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none bg-white">
                <option value="all">All</option>
                <option value="paystack">Paystack</option>
                <option value="offline">Offline</option>
              </select>
            </div>
            
            {/* --- NEW: DELIVERY FILTER DROPDOWN --- */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-500 font-medium">Delivery:</label>
              <select value={deliveryFilter} onChange={(e) => setDeliveryFilter(e.target.value as any)} className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none bg-white">
                <option value="all">All Statuses</option>
                <option value="Pending Delivery">Pending</option>
                <option value="Delayed">Delayed</option>
                <option value="Delivered">Delivered</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-500 font-medium">Timeframe:</label>
              <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value as any)} className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none bg-white">
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center gap-2 w-full xl:w-auto mt-2 xl:mt-0">
            <label className="text-sm text-gray-500 font-medium">Sort:</label>
            <select value={sortConfig} onChange={(e) => setSortConfig(e.target.value as any)} className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none bg-white w-full md:w-auto">
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="amount-desc">Highest Value</option>
              <option value="amount-asc">Lowest Value</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        {loading ? (
          <div className="p-12 text-center text-gray-500 animate-pulse font-medium">Loading orders...</div>
        ) : currentOrders.length === 0 ? (
          <div className="p-12 text-center text-gray-500 border border-dashed border-gray-200 m-4 rounded-lg bg-gray-50">
             No orders match your current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-sm text-gray-500">
                  <th className="p-4 font-medium">Date & ID</th>
                  <th className="p-4 font-medium">Customer</th>
                  <th className="p-4 font-medium">Total Value</th>
                  <th className="p-4 font-medium">Payment</th>
                  <th className="p-4 font-medium">Logistics</th>
                  <th className="p-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentOrders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-gray-900">{order.tracking_number}</p>
                      <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-medium text-gray-900">{order.first_name} {order.last_name}</p>
                      <p className="text-xs text-blue-600">{order.email || 'No email provided'}</p>
                    </td>
                    <td className="p-4 font-bold text-gray-900">
                      ₦{order.total_amount.toLocaleString()}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1 items-start">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${order.payment_method === 'paystack' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                          {order.payment_method}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${order.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {order.payment_status}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      {/* --- NEW: DELIVERY BADGE --- */}
                      <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${getDeliveryBadgeStyle(order.delivery_status)}`}>
                        {order.delivery_status || 'Pending Delivery'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => handleViewDetails(order)} className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-black transition-colors shadow-sm">
                        Manage
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
            Showing <span className="font-bold">{processedOrders.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold">{Math.min(currentPage * itemsPerPage, processedOrders.length)}</span> of <span className="font-bold">{processedOrders.length}</span> orders
          </p>
          <div className="flex gap-2">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50">Previous</button>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50">Next</button>
          </div>
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto border border-gray-100">
            <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50 rounded-t-2xl">
              <div>
                <p className="text-sm font-bold text-green-600 uppercase tracking-wider mb-1">Order Logistics Panel</p>
                <h2 className="text-2xl font-black text-gray-900">{selectedOrder.tracking_number}</h2>
                <p className="text-gray-500 text-sm mt-1">Placed on {new Date(selectedOrder.created_at).toLocaleString()}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-700 bg-white p-2 rounded-full shadow-sm border border-gray-200">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* LEFT COLUMN: Controls & Delivery Info */}
              <div className="space-y-6">
                
                {/* 1. Payment Control */}
                <div>
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Finance Status</h3>
                  <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between shadow-sm">
                    <div>
                      <span className={`text-xs font-bold px-2 py-1 rounded uppercase inline-block ${selectedOrder.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {selectedOrder.payment_status}
                      </span>
                      <p className="text-xs text-gray-500 mt-1 uppercase font-bold">{selectedOrder.payment_method}</p>
                    </div>
                    {selectedOrder.payment_status === 'pending' ? (
                      <button onClick={() => handleUpdatePaymentStatus(selectedOrder.id, 'paid')} disabled={updating} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-700 shadow-sm disabled:opacity-50">
                        Mark PAID
                      </button>
                    ) : (
                      <button onClick={() => handleUpdatePaymentStatus(selectedOrder.id, 'pending')} disabled={updating} className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-200 border border-gray-300 disabled:opacity-50">
                        Revert to Pending
                      </button>
                    )}
                  </div>
                </div>

                {/* 2. Logistics Control (NEW) */}
                <div>
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Logistics Control</h3>
                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                     <p className="text-sm text-gray-600 mb-3">Current Status: <span className={`font-bold px-2 py-0.5 rounded-full text-xs ${getDeliveryBadgeStyle(selectedOrder.delivery_status || 'Pending Delivery')}`}>{selectedOrder.delivery_status || 'Pending Delivery'}</span></p>
                     
                     <div className="grid grid-cols-3 gap-2">
                       <button 
                         onClick={() => handleUpdateDeliveryStatus(selectedOrder.id, 'Pending Delivery')} 
                         disabled={updating || selectedOrder.delivery_status === 'Pending Delivery'}
                         className="px-2 py-2 text-xs font-bold rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:bg-gray-100 transition-colors text-gray-700"
                       >
                         Pending
                       </button>
                       <button 
                         onClick={() => handleUpdateDeliveryStatus(selectedOrder.id, 'Delayed')} 
                         disabled={updating || selectedOrder.delivery_status === 'Delayed'}
                         className="px-2 py-2 text-xs font-bold rounded-lg border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:bg-red-100 transition-colors"
                       >
                         Mark Delayed
                       </button>
                       <button 
                         onClick={() => handleUpdateDeliveryStatus(selectedOrder.id, 'Delivered')} 
                         disabled={updating || selectedOrder.delivery_status === 'Delivered'}
                         className="px-2 py-2 text-xs font-bold rounded-lg border border-green-300 text-green-700 hover:bg-green-50 disabled:opacity-50 disabled:bg-green-100 transition-colors"
                       >
                         Delivered ✓
                       </button>
                     </div>
                  </div>
                </div>

                {/* 3. Delivery Manifest */}
                <div>
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Delivery Manifest</h3>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <p className="font-bold text-gray-900">{selectedOrder.first_name} {selectedOrder.last_name}</p>
                    <p className="text-blue-600 font-medium text-sm mt-1">✉️ {selectedOrder.email || 'No email'}</p>
                    <p className="text-gray-600 mt-1 text-sm">📞 {selectedOrder.contact_phone} {selectedOrder.additional_phone && `| Alt: ${selectedOrder.additional_phone}`}</p>
                    
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-gray-900 font-medium text-sm">{selectedOrder.shipping_address}</p>
                      {selectedOrder.landmark && <p className="text-gray-600 text-xs mt-1 italic">Landmark: {selectedOrder.landmark}</p>}
                      <p className="text-gray-800 font-bold mt-2 text-sm">{selectedOrder.lga}, {selectedOrder.state}</p>
                    </div>
                  </div>
                </div>

              </div>
              
              {/* RIGHT COLUMN: Items List */}
              <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Order Contents</h3>
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  {loadingItems ? (
                    <div className="p-8 text-center text-gray-400 animate-pulse">Loading cargo...</div>
                  ) : (
                    <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
                      {orderItems.map((item) => (
                        <div key={item.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                          <div>
                            <p className="font-bold text-gray-900">{item.product_name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-sm text-gray-500">{item.quantity}x @ ₦{item.price_at_purchase.toLocaleString()}</span>
                              <span className="text-[10px] font-bold uppercase bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 border border-gray-200">{item.purchase_type}</span>
                            </div>
                          </div>
                          <p className="font-black text-gray-900">₦{(item.quantity * item.price_at_purchase).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="bg-gray-900 p-4 flex justify-between items-center text-white border-t border-gray-800">
                    <span className="font-medium text-gray-300">Total Value</span>
                    <span className="text-2xl font-black text-green-400">₦{selectedOrder.total_amount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}