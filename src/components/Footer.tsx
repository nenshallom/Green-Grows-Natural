'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();

  // THE SMART HIDE LOGIC:
  // If the URL contains '/admin' or '/login', do not render the footer!
  if (pathname.startsWith('/admin') || pathname.includes('login')) {
    return null;
  }

  return (
    <footer id="footer" className="bg-[#286266] text-white pt-16 pb-8 mt-12">
      <div className="max-w-[90%] mx-auto">
        
        {/* TOP SECTION: Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-8 mb-16">
          
          {/* 1. Brand & About */}
          <div className="flex flex-col gap-4">
            <Link href="/" className="text-2xl font-black tracking-tighter text-white">
              Green <span className="text-green-500">Grows Natural</span>
            </Link>
            <p className="text-gray-300 text-sm leading-relaxed pr-4">
              Your trusted bridge between local farmers and your kitchen. We deliver 100% organic, farm-fresh produce directly to your doorstep with unbeatable bulk and group-buy discounts.
            </p>
            {/* Social Icons (Placeholders) */}
            <div className="flex gap-4 mt-2">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#D93F3F] transition-colors cursor-pointer">
                <span className="text-xs font-bold">IG</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#D93F3F] transition-colors cursor-pointer">
                <span className="text-xs font-bold">FB</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#D93F3F] transition-colors cursor-pointer">
                <span className="text-xs font-bold">X</span>
              </div>
            </div>
          </div>

          {/* 2. Quick Links */}
          <div>
            <h4 className="text-lg font-bold mb-4 border-b border-white/10 pb-2 inline-block">Quick Links</h4>
            <ul className="space-y-3 text-sm text-gray-300">
              <li><Link href="/products" className="hover:text-white hover:underline transition-colors">Shop All Products</Link></li>
              <li><Link href="/bulk" className="hover:text-white hover:underline transition-colors">Bulk Purchases</Link></li>
              <li><Link href="/group-deals" className="hover:text-white hover:underline transition-colors">Active Group Deals</Link></li>
              <li><Link href="/categories" className="hover:text-white hover:underline transition-colors">Browse Categories</Link></li>
            </ul>
          </div>

          {/* 3. Customer Support */}
          <div>
            <h4 className="text-lg font-bold mb-4 border-b border-white/10 pb-2 inline-block">Customer Support</h4>
            <ul className="space-y-3 text-sm text-gray-300">
              <li><Link href="/faq" className="hover:text-white hover:underline transition-colors">Help & FAQs</Link></li>
              <li><Link href="/shipping" className="hover:text-white hover:underline transition-colors">Shipping & Delivery</Link></li>
              <li><Link href="/returns" className="hover:text-white hover:underline transition-colors">Returns Policy</Link></li>
              <li><Link href="/contact" className="hover:text-white hover:underline transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          {/* 4. Newsletter */}
          <div>
            <h4 className="text-lg font-bold mb-4 border-b border-white/10 pb-2 inline-block">Stay Fresh</h4>
            <p className="text-gray-300 text-sm mb-4">
              Subscribe to our newsletter to get alerts on new group deals and seasonal harvests!
            </p>
            <form className="flex flex-col gap-2" onSubmit={(e) => e.preventDefault()}>
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-white transition-colors text-sm"
                required
              />
              <button 
                type="submit" 
                className="w-full bg-[#872022] hover:bg-[#872022]/80 text-white font-bold py-2.5 rounded-lg transition-colors text-sm"
              >
                Subscribe
              </button>
            </form>
          </div>

        </div>

        {/* BOTTOM SECTION: Copyright & Legal */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 text-xs text-center md:text-left">
            &copy; {new Date().getFullYear()} FarmFresh Network. All rights reserved.
          </p>
          <div className="flex gap-4 text-xs text-gray-400">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}