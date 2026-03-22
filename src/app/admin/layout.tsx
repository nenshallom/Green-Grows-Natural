'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAdminAccess = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Rule 1: No session at all? Send them to the dedicated Admin Login backdoor.
      if (!session) {
        router.push('/admin-login');
        return;
      }

      // Rule 2: Logged in, but NOT an admin? Kick them to the customer storefront.
      const role = session.user.user_metadata?.role;
      if (role !== 'admin') {
        router.push('/');
        return;
      }

      // Rule 3: You are an admin. Unlocking the doors!
      setIsAuthorized(true);
    };
    
    checkAdminAccess();
  }, [router]);

  // Handle Logout natively from the Admin Dashboard
  const handleAdminLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin-login');
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-green-500">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-bold tracking-widest uppercase text-sm">Verifying Credentials...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col shadow-xl z-10 hidden md:flex">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-2xl font-black text-green-500 tracking-tighter">
            GGN<span className="text-white">Admin</span>
          </h2>
          <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">Command Center</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/admin/products" className="block px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors font-medium">
            📦 Manage Products
          </Link>
          <Link href="/admin/orders" className="block px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors font-medium">
            🛒 Orders & Fulfillments
          </Link>
          <Link href="/admin/customers" className="block px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors font-medium">
            👥 Customer CRM
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button 
            onClick={handleAdminLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-900/30 text-red-400 rounded-lg hover:bg-red-900/50 hover:text-red-300 transition-colors font-bold text-sm"
          >
            Log Out Securely
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto">
        {/* Mobile Header (Shows only on small screens) */}
        <div className="md:hidden bg-gray-900 text-white p-4 flex justify-between items-center shadow-md">
           <h2 className="font-black text-green-500 tracking-tighter">GGN<span className="text-white">Admin</span></h2>
           <button onClick={handleAdminLogout} className="text-xs font-bold text-red-400">Logout</button>
        </div>

        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>

    </div>
  );
}