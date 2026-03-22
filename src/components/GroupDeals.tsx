'use client';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';

interface Product {
  id: string;
  name: string;
  image_url: string;
  price_per_unit: number;
  is_group_buy_enabled: boolean;
  group_buy_price: number | null;
  group_threshold: number | null;
  current_group_buyers?: number; 
}

export default function GroupDeals({ products }: { products: Product[] }) {
  // 1. Extract BOTH addToCart and removeFromCart from the global context
  const { addToCart, removeFromCart, cartItems } = useCart();

  const groupProducts = products.filter(p => p.is_group_buy_enabled);

  if (groupProducts.length === 0) return null;

  // 2. NEW: The Toggle Function
  const handleToggleJoin = (product: Product, isJoined: boolean) => {
    if (isJoined) {
      // If they are already in the group, remove them from the cart
      removeFromCart(product.id, 'group');
    } else {
      // If they are not in the group, add them to the cart
      addToCart({
        productId: product.id,
        name: product.name,
        priceAtAddition: product.group_buy_price || product.price_per_unit,
        quantity: 1, 
        purchaseType: 'group',
        image: product.image_url,
      });
    }
  };

  return (
    <section className="w-full mt-16 mb-20">
      
      {/* HEADER */}
      <div className="flex justify-between items-end mb-6">
        <h2 className="text-2xl md:text-3xl font-black text-[#1A4331] tracking-tight">
          Best Group Deals for You!
        </h2>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        
        {groupProducts.slice(0, 8).map((product) => {
          const target = product.group_threshold || 1;
          const current = product.current_group_buyers || 0;
          const progressPercentage = Math.min(100, (current / target) * 100);
          const isCompleted = current >= target;

          // Check if this exact product is in the cart as a group purchase
          const isAlreadyJoined = cartItems.some(
            (item) => item.productId === product.id && item.purchaseType === 'group'
          );

          return (
            <div 
              key={product.id}
              className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow border border-gray-100 flex flex-col h-full group"
            >
              
              {/* TOP HALF: IMAGE */}
              <Link href={`/product/${product.id}`} className="relative h-36 md:h-48 w-full overflow-hidden block bg-gray-50">
                <img 
                  src={product.image_url || 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=400&q=80'} 
                  alt={product.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                />
                <div className="absolute top-3 left-3 bg-[#1A4331] text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">
                  Group Buy
                </div>
              </Link>

              {/* BOTTOM HALF: DETAILS & PROGRESS */}
              <div className="p-4 md:p-5 flex flex-col flex-1">
                
                <Link href={`/product/${product.id}`} className="block flex-1">
                  <h3 className="font-bold text-[#1A4331] text-sm md:text-base leading-tight mb-1 line-clamp-1 hover:text-green-700 transition-colors">
                    {product.name}
                  </h3>
                  
                  {/* PRICING */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-black text-[#D93F3F] text-lg md:text-xl">
                      ₦{product.group_buy_price?.toLocaleString()}
                      <span className="text-[10px] text-gray-500 font-bold ml-1 uppercase">/ Slot</span>
                    </span>
                  </div>

                  {/* PROGRESS BAR UI */}
                  <div className="w-full mb-4">
                    <div className="flex justify-between items-end mb-1.5">
                      <span className="text-[10px] md:text-xs font-bold text-gray-500">
                        {current} / {target} Joined
                      </span>
                      {isCompleted && (
                        <span className="text-[9px] font-black text-green-600 uppercase tracking-wider bg-green-50 px-1 py-0.5 rounded">
                          Goal Reached
                        </span>
                      )}
                    </div>
                    
                    {/* The Track */}
                    <div className="w-full h-1.5 md:h-2 bg-gray-100 rounded-full overflow-hidden">
                      {/* The Fill */}
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ease-out ${isCompleted ? 'bg-green-500' : 'bg-[#1A4331]'}`}
                        style={{ width: `${progressPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                </Link>

                {/* --- SMART TOGGLE BUTTON --- */}
                {/* We removed 'disabled={isAlreadyJoined}' so it can be clicked again.
                    We added a hover effect to the joined state so they know they can click it to leave.
                */}
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    handleToggleJoin(product, isAlreadyJoined);
                  }}
                  className={`w-full border-2 font-bold py-2 rounded-lg transition-colors text-xs md:text-sm ${
                    isAlreadyJoined 
                      ? 'bg-green-50 border-green-500 text-green-700 hover:bg-red-50 hover:border-red-500 hover:text-red-700 group/btn' 
                      : 'bg-white border-[#1A4331] text-[#1A4331] hover:bg-[#1A4331] hover:text-white' 
                  }`}
                >
                  {/* Text dynamically changes to "Leave Group" when hovering over a joined button! */}
                  {isAlreadyJoined ? (
                    <span className="group-hover/btn:hidden">✓ Joined</span>
                  ) : 'Join Group'}
                  {isAlreadyJoined ? (
                    <span className="hidden group-hover/btn:inline">Leave Group</span>
                  ) : ''}
                </button>
                
              </div>
            </div>
          );
        })}
      </div>
      
    </section>
  );
}