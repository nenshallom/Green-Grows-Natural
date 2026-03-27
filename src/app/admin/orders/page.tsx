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
  delivery_status: string; 
  first_name: string;
  last_name: string;
  email: string | null;
  contact_phone: string;
  additional_phone: string | null;
  shipping_address: string;
  landmark: string | null;
  state: string;
  lga: string;
  // --- NEW: Added order_items to the main interface for filtering ---
  order_items?: { product_name: string; purchase_type: string }[];
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
  const [deliveryFilter, setDeliveryFilter] = useState<'all' | 'Pending Delivery' | 'Processing' | 'Delayed' | 'Delivered' | 'Cancelled'>('all');
  
  // --- NEW: PURCHASE TYPE FILTER & BULK SELECTION STATE ---
  const [purchaseFilter, setPurchaseFilter] = useState<'all' | 'standard' | 'bulk' | 'group'>('all');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // UPGRADED QUERY: We now fetch the product names and purchase types directly with the order!
      const { data, error } = await supabase.from('orders').select('*, order_items(product_name, purchase_type)');
      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      console.error("Error fetching orders:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  // Clear selections when filters change
  useEffect(() => { setSelectedOrders([]); setCurrentPage(1); }, [searchTerm, sortConfig, paymentFilter, deliveryFilter, dateFilter, purchaseFilter]);

  // --- UPGRADED DATA PIPELINE ---
  const processedOrders = useMemo(() => {
    let result = orders.filter(order => {
      // 1. Upgraded Text Search (Now searches inside the products purchased!)
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        order.tracking_number.toLowerCase().includes(searchLower) ||
        order.first_name.toLowerCase().includes(searchLower) ||
        order.last_name.toLowerCase().includes(searchLower) ||
        order.contact_phone.includes(searchTerm) ||
        (order.email && order.email.toLowerCase().includes(searchLower)) ||
        order.order_items?.some(item => item.product_name.toLowerCase().includes(searchLower));

      // 2. Exact Match Filters
      const matchesPayment = paymentFilter === 'all' || order.payment_method === paymentFilter;
      const matchesDelivery = deliveryFilter === 'all' || order.delivery_status === deliveryFilter;
      
      // 3. Purchase Type Match (Checks if any item in the order matches the filter)
      const matchesPurchase = purchaseFilter === 'all' || order.order_items?.some(item => item.purchase_type === purchaseFilter);

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

      return matchesSearch && matchesPayment && matchesDelivery && matchesPurchase && matchesDate;
    });

    result.sort((a, b) => {
      if (sortConfig === 'date-desc') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortConfig === 'date-asc') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortConfig === 'amount-desc') return b.total_amount - a.total_amount;
      if (sortConfig === 'amount-asc') return a.total_amount - b.total_amount;
      return 0;
    });

    return result;
  }, [orders, searchTerm, sortConfig, paymentFilter, deliveryFilter, dateFilter, purchaseFilter]);

  const totalPages = Math.ceil(processedOrders.length / itemsPerPage);
  const currentOrders = processedOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // --- UPGRADED CSV EXPORT (Now includes products list!) ---
  const exportToCSV = () => {
    if (processedOrders.length === 0) return alert("No orders to export!");

    const headers = [
      "Tracking Number", "Date Placed", "Customer First Name", "Customer Last Name", 
      "Email", "Primary Phone", "State", "LGA", "Full Address",
      "Payment Method", "Payment Status", "Delivery Status", "Total Amount (NGN)", "Products Ordered"
    ];

    const csvRows = processedOrders.map(order => {
      const cleanString = (str: string | null | undefined) => `"${(str || '').replace(/"/g, '""')}"`;
      return [
        cleanString(order.tracking_number),
        cleanString(new Date(order.created_at).toLocaleDateString()),
        cleanString(order.first_name),
        cleanString(order.last_name),
        cleanString(order.email),
        cleanString(order.contact_phone),
        cleanString(order.state),
        cleanString(order.lga),
        cleanString(order.shipping_address),
        cleanString(order.payment_method.toUpperCase()),
        cleanString(order.payment_status.toUpperCase()),
        cleanString(order.delivery_status.toUpperCase()), 
        order.total_amount,
        cleanString(order.order_items?.map(i => i.product_name).join(' | '))
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

  // --- NEW: BULK ACTION ENGINE ---
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedOrders(currentOrders.map(o => o.id));
    else setSelectedOrders([]);
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) setSelectedOrders(prev => [...prev, id]);
    else setSelectedOrders(prev => prev.filter(orderId => orderId !== id));
  };

  const handleBulkUpdateDelivery = async (newStatus: string) => {
    if (!window.confirm(`Are you sure you want to mark ${selectedOrders.length} selected orders as ${newStatus.toUpperCase()}?`)) return;
    setUpdating(true);
    try {
      const { error } = await supabase.from('orders').update({ delivery_status: newStatus }).in('id', selectedOrders);
      if (error) throw error;
      setOrders(prev => prev.map(o => selectedOrders.includes(o.id) ? { ...o, delivery_status: newStatus } : o));
      setSelectedOrders([]);
      alert(`Successfully updated ${selectedOrders.length} orders!`);
    } catch (error: any) {
      alert(`Bulk update error: ${error.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const getDeliveryBadgeStyle = (status: string) => {
    switch (status) {
      case 'Delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'Delayed': return 'bg-red-100 text-red-800 border-red-200 animate-pulse';
      case 'Cancelled': return 'bg-gray-100 text-gray-500 border-gray-300 line-through';
      default: return 'bg-blue-50 text-blue-800 border-blue-200'; 
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
          <input type="text" placeholder="Search by Product Name, Tracking ID, Customer..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm bg-gray-50 text-gray-900" />
          <span className="absolute left-3 top-3.5 text-gray-400">🔍</span>
        </div>
        
        <div className="flex flex-col xl:flex-row gap-4 justify-between items-center border-t border-gray-100 pt-4">
          <div className="flex flex-wrap gap-4 w-full xl:w-auto">
            
            {/* --- NEW: PURCHASE TYPE FILTER --- */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-500 font-medium">Type:</label>
              <select value={purchaseFilter} onChange={(e) => setPurchaseFilter(e.target.value as any)} className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none bg-white font-medium">
                <option value="all">All Orders</option>
                <option value="group">🤝 Group Buys</option>
                <option value="bulk">📦 Bulk Buys</option>
                <option value="standard">Standard</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-500 font-medium">Payment:</label>
              <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value as any)} className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none bg-white">
                <option value="all">All</option>
                <option value="paystack">Paystack</option>
                <option value="offline">Offline</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-500 font-medium">Delivery:</label>
              <select value={deliveryFilter} onChange={(e) => setDeliveryFilter(e.target.value as any)} className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none bg-white">
                <option value="all">All Statuses</option>
                <option value="Pending Delivery">Pending</option>
                <option value="Processing">Processing</option>
                <option value="Delayed">Delayed</option>
                <option value="Delivered">Delivered</option>
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

      {/* --- NEW: BULK ACTIONS BAR --- */}
      {selectedOrders.length > 0 && (
        <div className="bg-[#1A4331] text-white p-4 rounded-xl mb-6 shadow-md flex flex-col sm:flex-row justify-between items-center gap-4 animate-fade-in">
          <span className="font-bold">{selectedOrders.length} Order(s) Selected</span>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-green-200 mr-2">Bulk Delivery Update:</span>
            <button onClick={() => handleBulkUpdateDelivery('Processing')} disabled={updating} className="bg-blue-600 hover:bg-blue-700 text-xs font-bold px-3 py-2 rounded transition-colors shadow-sm disabled:opacity-50">Processing</button>
            <button onClick={() => handleBulkUpdateDelivery('Delivered')} disabled={updating} className="bg-green-500 hover:bg-green-600 text-xs font-bold px-3 py-2 rounded transition-colors shadow-sm disabled:opacity-50">Mark Delivered</button>
            <button onClick={() => handleBulkUpdateDelivery('Cancelled')} disabled={updating} className="bg-red-500 hover:bg-red-600 text-xs font-bold px-3 py-2 rounded transition-colors shadow-sm disabled:opacity-50">Cancel</button>
          </div>
        </div>
      )}

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
                  <th className="p-4 w-12 text-center">
                    {/* MASTER CHECKBOX */}
                    <input type="checkbox" onChange={handleSelectAll} checked={currentOrders.length > 0 && selectedOrders.length === currentOrders.length} className="w-4 h-4 text-green-600 rounded cursor-pointer" />
                  </th>
                  <th className="p-4 font-medium">Date & ID</th>
                  <th className="p-4 font-medium">Customer</th>
                  <th className="p-4 font-medium">Total Value</th>
                  <th className="p-4 font-medium">Logistics</th>
                  <th className="p-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentOrders.map(order => (
                  <tr key={order.id} className={`transition-colors ${selectedOrders.includes(order.id) ? 'bg-green-50/50' : 'hover:bg-gray-50'}`}>
                    <td className="p-4 text-center">
                      {/* INDIVIDUAL CHECKBOX */}
                      <input type="checkbox" checked={selectedOrders.includes(order.id)} onChange={(e) => handleSelectOne(order.id, e.target.checked)} className="w-4 h-4 text-green-600 rounded cursor-pointer" />
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-gray-900">{order.tracking_number}</p>
                      <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-medium text-gray-900">{order.first_name} {order.last_name}</p>
                      <p className="text-xs text-blue-600">{order.email || 'No email'}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-gray-900 mb-1">₦{order.total_amount.toLocaleString()}</p>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${order.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {order.payment_status}
                      </span>
                    </td>
                    <td className="p-4">
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

      {/* --- ORDER DETAILS MODAL --- */}
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
              
              <div className="space-y-6">
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

                <div>
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Logistics Control</h3>
                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                     <p className="text-sm text-gray-600 mb-3">Current Status: <span className={`font-bold px-2 py-0.5 rounded-full text-xs ${getDeliveryBadgeStyle(selectedOrder.delivery_status || 'Pending Delivery')}`}>{selectedOrder.delivery_status || 'Pending Delivery'}</span></p>
                     
                     <div className="grid grid-cols-2 gap-2">
                       <button onClick={() => handleUpdateDeliveryStatus(selectedOrder.id, 'Processing')} disabled={updating || selectedOrder.delivery_status === 'Processing'} className="px-2 py-2 text-xs font-bold rounded-lg border border-blue-300 text-blue-700 hover:bg-blue-50 disabled:opacity-50 transition-colors">
                         Processing
                       </button>
                       <button onClick={() => handleUpdateDeliveryStatus(selectedOrder.id, 'Delivered')} disabled={updating || selectedOrder.delivery_status === 'Delivered'} className="px-2 py-2 text-xs font-bold rounded-lg border border-green-300 text-green-700 hover:bg-green-50 disabled:opacity-50 transition-colors">
                         Delivered ✓
                       </button>
                       <button onClick={() => handleUpdateDeliveryStatus(selectedOrder.id, 'Delayed')} disabled={updating || selectedOrder.delivery_status === 'Delayed'} className="px-2 py-2 text-xs font-bold rounded-lg border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50 transition-colors">
                         Mark Delayed
                       </button>
                       <button onClick={() => handleUpdateDeliveryStatus(selectedOrder.id, 'Cancelled')} disabled={updating || selectedOrder.delivery_status === 'Cancelled'} className="px-2 py-2 text-xs font-bold rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors">
                         Cancel Order
                       </button>
                     </div>
                  </div>
                </div>

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