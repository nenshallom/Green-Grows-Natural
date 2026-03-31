'use client';
import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';

// Helper function for the Activity Feed
const timeAgo = (dateString: string) => {
  const now = new Date();
  const past = new Date(dateString);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.round(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays}d ago`;
};

export default function AdminDashboardOverview() {
  const [orders, setOrders] = useState<any[]>([]);
  // --- NEW STATES FOR TRACKERS ---
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- FILTER STATES ---
  const [globalTimeframe, setGlobalTimeframe] = useState<'today' | '7d' | '30d' | '90d' | 'year' | 'all'>('30d');
  const [trendTimeframe, setTrendTimeframe] = useState<'7d' | '30d' | 'year'>('30d');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // 1. Fetch Orders (Existing)
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('created_at, total_amount, payment_method, delivery_status')
          .eq('payment_status', 'paid');
        if (ordersError) throw ordersError;
        setOrders(ordersData || []);

        // 2. Fetch Active Group Buy Campaigns (NEW)
        const { data: campaignsData, error: campaignsError } = await supabase
          .from('products')
          .select('id, name, current_group_buyers, group_threshold, image_url')
          .eq('is_group_buy_enabled', true)
          .order('current_group_buyers', { ascending: false })
          .limit(5); // Show top 5 most active campaigns
        if (campaignsError) throw campaignsError;
        setCampaigns(campaignsData || []);

        // 3. Fetch Live Activity Feed (NEW)
        const { data: notifData, error: notifError } = await supabase
          .from('admin_notifications')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(8); // Show latest 8 events
        if (notifError) throw notifError;
        setNotifications(notifData || []);

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
      if (trendTimeframe === 'year') {
        dateKey = dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      } else {
        dateKey = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
      grouped[dateKey] = (grouped[dateKey] || 0) + order.total_amount;
    });

    return Object.keys(grouped)
      .map(date => ({ date, revenue: grouped[date] }))
      .reverse(); 
  }, [orders, trendTimeframe]);

  // --- 2. PAYMENT METHOD BREAKDOWN ---
  const paymentMethodData = useMemo(() => {
    let paystack = 0;
    let offline = 0;
    filteredGlobalOrders.forEach(order => {
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* PAYMENT METHOD DOUGHNUT CHART */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-1">Revenue by Payment Method</h3>
          <p className="text-sm text-gray-500 mb-6">Currently showing data for: <span className="font-bold text-gray-700">{globalTimeframe.toUpperCase()}</span></p>
          
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
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-1">Fulfillment & Logistics</h3>
          <p className="text-sm text-gray-500 mb-6">Currently showing data for: <span className="font-bold text-gray-700">{globalTimeframe.toUpperCase()}</span></p>
          
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

      {/* --- ROW 3: NEW LIVE TRACKERS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COL: LIVE ACTIVITY FEED */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-96">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            Live Operations Feed
          </h3>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {notifications.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-gray-400 italic">No recent activity detected.</div>
            ) : (
              notifications.map((notif) => (
                <div key={notif.id} className="flex gap-4 items-start pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                  <div className={`p-2 rounded-lg mt-1 ${
                    notif.type === 'group_complete' ? 'bg-green-100 text-green-600' :
                    notif.type === 'group_join' ? 'bg-teal-100 text-teal-600' :
                    notif.type === 'bulk_order' ? 'bg-blue-100 text-blue-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {notif.type === 'group_complete' ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> :
                     notif.type === 'group_join' ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg> :
                     notif.type === 'bulk_order' ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg> :
                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-bold text-gray-900">{notif.title}</p>
                      <span className="text-xs font-medium text-gray-400 whitespace-nowrap">{timeAgo(notif.created_at)}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-0.5 leading-relaxed">{notif.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT COL: ACTIVE CAMPAIGN RADAR */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-96">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Active Campaign Radar</h3>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-5">
            {campaigns.length === 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-center">
                <span className="text-3xl mb-2">📡</span>
                <p className="text-gray-400 italic text-sm">No active group buys running right now.</p>
              </div>
            ) : (
              campaigns.map((camp) => {
                const isComplete = camp.current_group_buyers >= camp.group_threshold;
                const progress = Math.min(100, (camp.current_group_buyers / camp.group_threshold) * 100);
                
                return (
                  <div key={camp.id} className="relative">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden border border-gray-200 shrink-0">
                        {camp.image_url ? <img src={camp.image_url} alt={camp.name} className="w-full h-full object-cover" /> : null}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <p className="text-sm font-bold text-gray-900 truncate">{camp.name}</p>
                          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded uppercase ${isComplete ? 'bg-green-100 text-green-700' : 'text-gray-500'}`}>
                            {isComplete ? 'Target Hit' : `${camp.current_group_buyers}/${camp.group_threshold}`}
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div 
                            className={`h-2 rounded-full transition-all duration-1000 ${isComplete ? 'bg-green-500' : 'bg-teal-500'}`} 
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
}