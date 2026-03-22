'use client';
import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';

export default function AdminDashboardOverview() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- NEW: FILTER STATES ---
  // Controls the KPI Cards, Payment Pie Chart, and Logistics Bar Chart
  const [globalTimeframe, setGlobalTimeframe] = useState<'today' | '7d' | '30d' | '90d' | 'year' | 'all'>('30d');
  
  // Controls ONLY the Revenue Area Chart so you can compare long-term trends while looking at short-term KPIs
  const [trendTimeframe, setTrendTimeframe] = useState<'7d' | '30d' | 'year'>('30d');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('created_at, total_amount, payment_method, delivery_status')
          .eq('payment_status', 'paid');
          
        if (error) throw error;
        setOrders(data || []);
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // --- FILTER ENGINE: Apply Global Timeframe ---
  const filteredGlobalOrders = useMemo(() => {
    if (globalTimeframe === 'all') return orders;
    
    const now = new Date().getTime();
    const day = 24 * 60 * 60 * 1000;
    
    return orders.filter(order => {
      const orderDate = new Date(order.created_at).getTime();
      const diff = now - orderDate;
      
      if (globalTimeframe === 'today') return diff <= day;
      if (globalTimeframe === '7d') return diff <= 7 * day;
      if (globalTimeframe === '30d') return diff <= 30 * day;
      if (globalTimeframe === '90d') return diff <= 90 * day;
      if (globalTimeframe === 'year') return diff <= 365 * day;
      return true;
    });
  }, [orders, globalTimeframe]);

  // --- 1. REVENUE TRENDS (Smart Grouping Engine) ---
  const revenueData = useMemo(() => {
    // First, filter orders based on the Trend Timeframe
    const now = new Date().getTime();
    const day = 24 * 60 * 60 * 1000;
    const trendOrders = orders.filter(order => {
      const diff = now - new Date(order.created_at).getTime();
      if (trendTimeframe === '7d') return diff <= 7 * day;
      if (trendTimeframe === '30d') return diff <= 30 * day;
      if (trendTimeframe === 'year') return diff <= 365 * day;
      return true;
    });

    const grouped: Record<string, number> = {};
    
    trendOrders.forEach(order => {
      const dateObj = new Date(order.created_at);
      let dateKey = '';

      // SMART GROUPING: If looking at a whole year, group by Month. Otherwise, group by Day.
      if (trendTimeframe === 'year') {
        dateKey = dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }); // e.g., "Mar 2026"
      } else {
        dateKey = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); // e.g., "Mar 12"
      }

      grouped[dateKey] = (grouped[dateKey] || 0) + order.total_amount;
    });

    // Convert object to sorted array
    return Object.keys(grouped)
      .map(date => ({ date, revenue: grouped[date] }))
      // Ensure the chart reads left-to-right chronologically
      .reverse(); 
  }, [orders, trendTimeframe]);

  // --- 2. PAYMENT METHOD BREAKDOWN ---
  const paymentMethodData = useMemo(() => {
    let paystack = 0;
    let offline = 0;
    filteredGlobalOrders.forEach(order => {
      // Force lowercase to ensure we don't miss capitalized test data
      const method = String(order.payment_method).toLowerCase(); 
      if (method === 'paystack') paystack += order.total_amount;
      else if (method === 'offline') offline += order.total_amount;
    });
    return [
      { name: 'Paystack (Online)', value: paystack, color: '#0ea5e9' },
      { name: 'Offline Transfer', value: offline, color: '#8b5cf6' }
    ];
  }, [filteredGlobalOrders]);

  // --- 3. LOGISTICS STATUS ---
  const logisticsData = useMemo(() => {
    const grouped: Record<string, number> = {};
    // Uses the Globally Filtered Orders
    filteredGlobalOrders.forEach(order => {
      const status = order.delivery_status || 'Pending Delivery';
      grouped[status] = (grouped[status] || 0) + 1;
    });
    return Object.keys(grouped).map(status => ({
      name: status,
      count: grouped[status],
      color: status === 'Delivered' ? '#22c55e' : status === 'Delayed' ? '#ef4444' : '#f59e0b'
    }));
  }, [filteredGlobalOrders]);

  // --- KPI MATH ---
  const totalRevenue = filteredGlobalOrders.reduce((sum, order) => sum + order.total_amount, 0);
  const totalPaidOrders = filteredGlobalOrders.length;
  const averageOrderValue = totalPaidOrders > 0 ? totalRevenue / totalPaidOrders : 0;

  if (loading) return <div className="p-12 text-center text-gray-500 animate-pulse font-medium">Crunching your numbers...</div>;

  return (
    <div className="space-y-8">
      
      {/* HEADER & GLOBAL FILTER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Executive Overview</h1>
          <p className="text-gray-600 mt-1">Real-time insights into your revenue, payment methods, and logistics.</p>
        </div>
        
        <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-2">
          <span className="text-sm font-bold text-gray-500 px-2 uppercase tracking-wider">Metrics:</span>
          <select 
            value={globalTimeframe} 
            onChange={(e) => setGlobalTimeframe(e.target.value as any)}
            className="bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block p-2.5 outline-none font-bold cursor-pointer"
          >
            <option value="today">Today</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="year">Past Year</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* --- KPI METRIC CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-green-500 transition-transform hover:-translate-y-1">
          <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Verified Revenue</p>
          <p className="text-3xl font-black text-gray-900">₦{totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-blue-500 transition-transform hover:-translate-y-1">
          <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Paid Orders</p>
          <p className="text-3xl font-black text-gray-900">{totalPaidOrders.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-purple-500 transition-transform hover:-translate-y-1">
          <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Average Order Value</p>
          <p className="text-3xl font-black text-gray-900">₦{Math.round(averageOrderValue).toLocaleString()}</p>
        </div>
      </div>

      {/* --- CHART ROW 1: REVENUE TRENDS --- */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h3 className="text-lg font-bold text-gray-900">Revenue Velocity</h3>
          
          {/* INDEPENDENT TREND FILTER */}
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button onClick={() => setTrendTimeframe('7d')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${trendTimeframe === '7d' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>7 Days</button>
            <button onClick={() => setTrendTimeframe('30d')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${trendTimeframe === '30d' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>30 Days</button>
            <button onClick={() => setTrendTimeframe('year')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${trendTimeframe === 'year' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>This Year</button>
          </div>
        </div>

        <div className="h-80 w-full">
          {revenueData.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center text-gray-400 italic bg-gray-50 rounded-lg border border-dashed border-gray-200">No revenue data for this period.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} minTickGap={20} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} tickFormatter={(value) => `₦${(value/1000).toFixed(0)}k`} />
                <RechartsTooltip 
                  formatter={(value: any) => [`₦${Number(value || 0).toLocaleString()}`, 'Revenue']}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" activeDot={{ r: 6, fill: '#16a34a', stroke: '#fff', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* --- CHART ROW 2: SPLIT METRICS --- */}
{/* --- CHART ROW 2: SPLIT METRICS --- */}
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* PAYMENT METHOD DOUGHNUT CHART */}
        {/* FIX: Removed 'flex flex-col' from the parent div */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-1">Revenue by Payment Method</h3>
          <p className="text-sm text-gray-500 mb-6">Currently showing data for: <span className="font-bold text-gray-700">{globalTimeframe.toUpperCase()}</span></p>
          
          {/* FIX: Removed 'flex-1' from this container so it strictly obeys h-64 */}
          <div className="h-64 w-full">
            {paymentMethodData.every(d => d.value === 0) ? (
              <div className="w-full h-full flex items-center justify-center text-gray-400 italic bg-gray-50 rounded-lg border border-dashed border-gray-200">No payment data in this timeframe.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={paymentMethodData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {paymentMethodData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value: any) => `₦${Number(value || 0).toLocaleString()}`} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* LOGISTICS BAR CHART */}
        {/* FIX: Removed 'flex flex-col' from the parent div */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-1">Fulfillment & Logistics</h3>
          <p className="text-sm text-gray-500 mb-6">Currently showing data for: <span className="font-bold text-gray-700">{globalTimeframe.toUpperCase()}</span></p>
          
          {/* FIX: Removed 'flex-1' from this container */}
          <div className="h-64 w-full">
             {logisticsData.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-gray-400 italic bg-gray-50 rounded-lg border border-dashed border-gray-200">No logistics data in this timeframe.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={logisticsData} layout="vertical" margin={{ top: 0, right: 30, left: 30, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#4b5563', fontSize: 12, fontWeight: 'bold'}} width={90} />
                  <RechartsTooltip cursor={{fill: '#f3f4f6'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={24}>
                    {logisticsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}