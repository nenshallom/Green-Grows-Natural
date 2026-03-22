'use client';
import { useState, useMemo } from 'react';
import { useCart } from '@/context/CartContext';
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price_per_unit: number;
  original_price?: number; 
  unit: string;
  image_url: string;
  is_bulk_buy_enabled: boolean;
  is_group_buy_enabled: boolean;
}

interface BestDealsProps {
  products: Product[];
}

export default function BestDeals({ products }: BestDealsProps) {
  const { addToCart } = useCart();
  const [activeTab, setActiveTab] = useState<string>('All Products');

  // --- NEW: ONLY KEEP PRODUCTS WITH A DISCOUNT ---
  const discountedProducts = useMemo(() => {
    return products.filter(p => p.original_price && p.original_price > p.price_per_unit);
  }, [products]);

  // 1. DYNAMIC TABS: Extract unique categories from the DISCOUNTED products only
  const categories = useMemo(() => {
    const uniqueCats = Array.from(new Set(discountedProducts.map(p => p.category)));
    return ['All Products', ...uniqueCats];
  }, [discountedProducts]);

  // 2. FILTER LOGIC: Show products based on the clicked tab
  const filteredProducts = useMemo(() => {
    if (activeTab === 'All Products') return discountedProducts;
    return discountedProducts.filter(p => p.category === activeTab);
  }, [discountedProducts, activeTab]);

  // 3. QUICK ADD TO CART
  const handleQuickAdd = (product: Product) => {
    addToCart({
      productId: product.id,
      name: product.name,
      priceAtAddition: product.price_per_unit,
      quantity: 1,
      purchaseType: 'standard',
      image: product.image_url,
    });
    alert(`Added ${product.name} to your cart!`);
  };

  // If there are absolutely no discounted products in the database, we hide the whole section (or show a message)
  if (discountedProducts.length === 0) {
    return null; 
  }

  return (
    <section className="w-full mt-12 mb-16">
      {/* HEADER */}
      <h2 className="text-2xl md:text-3xl font-black text-[#1A4331] tracking-tight mb-6">
        Today's Best Deals for You!
      </h2>

      {/* FILTER TABS (Scrollable on mobile) */}
      <div className="flex overflow-x-auto gap-3 pb-4 mb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {categories.map((cat, index) => (
          <button
            key={index}
            onClick={() => setActiveTab(cat)}
            className={`whitespace-nowrap px-5 py-2 rounded-lg text-sm font-bold transition-colors ${
              activeTab === cat 
                ? 'bg-[#1A4331] text-white shadow-md' 
                : 'bg-[#C2A5A0] text-white hover:bg-[#b0928d]'
            }`}
          >
            {cat.toUpperCase()}
          </button>
        ))}
      </div>

      {/* PRODUCT GRID */}
      {filteredProducts.length === 0 ? (
        <p className="text-gray-500 italic py-8">No deals found for this category.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-6">
          {filteredProducts.map((product) => {
            // We know it has a discount because of our pre-filter, but we still calculate the exact %
            const discountPercent = Math.round((((product.original_price || 0) - product.price_per_unit) / (product.original_price || 1)) * 100);

            return (
              <div key={product.id} className="relative rounded-2xl overflow-hidden group h-[220px] md:h-[260px] shadow-sm hover:shadow-lg transition-shadow bg-gray-100">
                
                {/* PRODUCT IMAGE */}
                <img 
                  src={product.image_url || 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=400&q=80'} 
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />

                {/* DISCOUNT BADGE */}
                {discountPercent > 0 && (
                  <div className="absolute top-3 left-3 bg-[#D93F3F] text-white text-[10px] md:text-xs font-black px-2 py-1 rounded shadow-sm z-10">
                    -{discountPercent}%
                  </div>
                )}

                {/* BOTTOM OVERLAY */}
                <div className="absolute bottom-0 left-0 w-full py-4 px-2 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex justify-between items-end">
                  
                  {/* TEXT DETAILS */}
                  <div className="text-white w-[60%]">
                    <h3 className="font-bold text-sm md:text-base leading-tight mb-0.5 drop-shadow-md">
                      {product.name}
                    </h3>
                    
                    {/* DYNAMIC PURCHASE OPTION TEXT */}
                    {(product.is_bulk_buy_enabled || product.is_group_buy_enabled) && (
                      <p className="text-gray-300 text-[8px] uppercase tracking-wider font-semibold mb-1">
                        {product.is_bulk_buy_enabled && product.is_group_buy_enabled 
                          ? "Bulk & Group Buy Available" 
                          : product.is_bulk_buy_enabled 
                            ? "Bulk Buy Available" 
                            : "Group Buy Available"}
                      </p>
                    )}

                    <div className="flex flex-col w-fit">
                      <span className="font-black text-sm md:text-base text-white drop-shadow-md">
                        ₦{product.price_per_unit.toLocaleString()}
                        <span className="text-[10px] font-medium text-gray-300">/{product.unit || 'kg'}</span>
                      </span>
                      {product.original_price && (
                         <span className="text-[10px] text-gray-400 line-through">
                           ₦{product.original_price.toLocaleString()}
                         </span>
                      )}
                    </div>
                  </div>

                  {/* QUICK ADD BUTTON */}
                  <button 
                    onClick={(e) => {
                      e.preventDefault(); 
                      handleQuickAdd(product);
                    }}
                    className="bg-[#286266] hover:bg-[#1A4331] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md transition-colors border border-white/20"
                  >
                    Add +
                  </button>
                  
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- NEW: VIEW ALL PRODUCTS BUTTON --- */}
      <div className="mt-10 flex justify-center">
        <Link 
          href="/products" 
          className="border-2 border-[#1A4331] text-[#1A4331] hover:bg-[#1A4331] hover:text-white font-bold py-3 px-8 rounded-lg transition-colors duration-300 shadow-sm"
        >
          View All Products
        </Link>
      </div>

    </section>
  );
}