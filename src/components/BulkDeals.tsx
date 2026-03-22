'use client';
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price_per_unit: number;
  unit: string;
  image_url: string;
  is_bulk_buy_enabled: boolean;
  bulk_buy_price: number | null;
  bulk_threshold: number | null;
}

export default function BulkDeals({ products }: { products: Product[] }) {
  // 1. ONLY fetch products that have Bulk Buying turned on in your Admin Panel
  const bulkProducts = products.filter(p => p.is_bulk_buy_enabled);

  // If there are no bulk products, hide the section gracefully
  if (bulkProducts.length === 0) return null;

  return (
    <section className="w-full mt-16 mb-12">
      
      {/* HEADER & VIEW ALL BUTTON */}
      <div className="flex justify-between items-end mb-6">
        <h2 className="text-xl md:text-3xl font-black text-[#1A4331] tracking-tight">
          Bulk Purchase Deals for You!
        </h2>
        <Link 
          href="/bulk" 
          className="text-xs md:text-sm font-bold text-gray-700 bg-white border border-gray-200 rounded-full px-4 py-2 hover:bg-gray-50 transition-colors flex items-center gap-1 shadow-sm"
        >
          View All <span className="text-lg leading-none">↗</span>
        </Link>
      </div>

      {/* 2-COLUMN MOBILE GRID / 3-COLUMN DESKTOP GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
        
        {bulkProducts.slice(0, 6).map((product) => (
          <Link 
            key={product.id}
            href={`/product/${product.id}`}
            // Mobile: flex-col (Vertical stacking). Desktop: flex-row (Horizontal ticket)
            className="bg-[#F9EAE8] rounded-2xl md:rounded-[20px] p-3 flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all border border-transparent hover:border-[#D93F3F]/20"
          >
            
            {/* IMAGE & BADGE */}
            {/* Mobile: Full width image. Desktop: Fixed 28x28 square */}
            <div className="relative w-full md:w-28 h-28 rounded-xl overflow-hidden flex-shrink-0 bg-white shadow-sm">
              <img 
                src={product.image_url || 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=200&q=80'} 
                alt={product.name} 
                className="w-full h-full object-cover" 
              />
              
              {/* THE FIRE BADGE (Min Threshold) */}
              <div className="absolute top-1.5 left-1.5 bg-white/90 backdrop-blur-sm text-orange-600 text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm flex items-center gap-1">
                🔥 Min {product.bulk_threshold}
              </div>
            </div>

            {/* TEXT & PRICING */}
            <div className="flex flex-col justify-center w-full">
              <h3 className="font-bold text-[#1A4331] text-sm md:text-lg leading-tight mb-0.5 line-clamp-1">
                {product.name}
              </h3>
              
              <p className="text-[#1A4331]/60 text-[9px] md:text-[10px] uppercase tracking-widest font-bold mb-2 md:mb-3">
                Farm Fresh
              </p>
              
              {/* BOLD RED BULK PRICE */}
              <p className="font-black text-[#D93F3F] text-lg md:text-2xl leading-none">
                ₦{product.bulk_buy_price?.toLocaleString()}
                <span className="text-[10px] md:text-xs text-[#D93F3F]/70 font-bold ml-0.5">/{product.unit || 'kg'}</span>
              </p>
              
              {/* Original Price Crossout */}
              <p className="text-[9px] md:text-[10px] text-gray-400 line-through mt-1 font-medium">
                Standard: ₦{product.price_per_unit.toLocaleString()}
              </p>
            </div>
            
          </Link>
        ))}
      </div>
      
    </section>
  );
}