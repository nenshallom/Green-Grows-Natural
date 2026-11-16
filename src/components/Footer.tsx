'use client';
import Image from 'next/image';
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
    <footer id="footer" className="bg-[#0F3024] text-white pt-16 pb-10 mt-20 border-t border-[#0b241b]">
      <div className="max-w-[90%] lg:max-w-7xl mx-auto">
        
        {/* TOP SECTION: Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-8 mb-16">
          
          {/* 1. Brand & About */}
          <div className="flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-white group font-display">
              <div className="relative w-8 h-8 flex-shrink-0">
                <Image
                  src="/images/ggnlogo-mark.webp"
                  alt="Green Grows Natural"
                  fill
                  sizes="32px"
                  className="object-contain"
                />
              </div>
              <span>
                Green <span className="text-emerald-300">Grows Natural</span>
              </span>
            </Link>
            <p className="text-emerald-100/80 text-sm leading-relaxed pr-4 font-sans">
              Your direct farm bridge between verified growers and your kitchen. Fresh organic produce, staple grains, and wholesome farm batches delivered with guaranteed quality.
            </p>
            {/* Social Icons */}
            <div className="flex gap-3 mt-2">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#C05E44] transition-colors cursor-pointer text-xs font-bold font-sans">
                IG
              </div>
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#C05E44] transition-colors cursor-pointer text-xs font-bold font-sans">
                FB
              </div>
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#C05E44] transition-colors cursor-pointer text-xs font-bold font-sans">
                X
              </div>
            </div>
          </div>

          {/* 2. Quick Links */}
          <div>
            <h4 className="text-base font-bold mb-4 border-b border-white/15 pb-2 inline-block font-display tracking-wide">
              Quick Links
            </h4>
            <ul className="space-y-2.5 text-sm text-emerald-100/80 font-sans">
              <li><Link href="/products" className="hover:text-white transition-colors">Shop All Products</Link></li>
              <li><Link href="/products?filter=Bulk+Buy" className="hover:text-white transition-colors">Bulk Purchases</Link></li>
              <li><Link href="/products?filter=Group+Buy" className="hover:text-white transition-colors">Active Group Deals</Link></li>
              <li><Link href="/products" className="hover:text-white transition-colors">Browse Categories</Link></li>
            </ul>
          </div>

          {/* 3. Customer Support */}
          <div>
            <h4 className="text-base font-bold mb-4 border-b border-white/15 pb-2 inline-block font-display tracking-wide">
              Customer Support
            </h4>
            <ul className="space-y-2.5 text-sm text-emerald-100/80 font-sans">
              <li><Link href="/#faq" className="hover:text-white transition-colors">Help & FAQs</Link></li>
              <li><Link href="/#faq" className="hover:text-white transition-colors">Shipping & Delivery</Link></li>
              <li><Link href="/#faq" className="hover:text-white transition-colors">Returns & Refunds</Link></li>
              <li><a href="mailto:greengrowsnatural@gmail.com" className="hover:text-white transition-colors">Contact Us</a></li>
            </ul>
          </div>

          {/* 4. Newsletter */}
          <div>
            <h4 className="text-base font-bold mb-4 border-b border-white/15 pb-2 inline-block font-display tracking-wide">
              Stay Fresh
            </h4>
            <p className="text-emerald-100/80 text-sm mb-4 font-sans leading-relaxed">
              Subscribe to harvest alerts and seasonal discounts straight from local farm gates.
            </p>
            <form className="flex flex-col gap-2.5" onSubmit={(e) => e.preventDefault()}>
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="w-full px-4 py-2.5 rounded-full bg-white/10 border border-white/20 text-white placeholder-emerald-200/60 focus:outline-none focus:border-white transition-colors text-xs font-sans"
                required
              />
              <button 
                type="submit" 
                className="w-full bg-[#C05E44] hover:bg-[#a84e36] text-white font-bold py-2.5 rounded-full transition-colors text-xs font-sans tracking-wide cursor-pointer shadow-xs"
              >
                Subscribe
              </button>
            </form>
          </div>

        </div>

        {/* BOTTOM SECTION: Copyright & Legal */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-emerald-200/60 font-sans">
          <p className="text-center md:text-left">
            &copy; {new Date().getFullYear()} Green Grows Natural (GGN). All rights reserved.
          </p>
          <div className="flex gap-5">
            <Link href="/#faq" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/#faq" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
