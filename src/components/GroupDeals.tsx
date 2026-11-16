import Link from 'next/link';
import Image from 'next/image'; // <-- NEW: Imported Next.js Image Optimizer
import { useCart } from '@/context/CartContext';
import { Product } from '@/types';
import { formatNaira } from '@/utils/format';
import { FEATURES } from '@/config/features';

export default function GroupDeals({ products }: { products: Product[] }) {
  // If group buy feature is globally disabled, hide section completely
  if (!FEATURES.ENABLE_GROUP_BUY) return null;

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
        image: product.image_url || '',
      });
    }
  };

  return (
    <section className="w-full my-20 md:my-24">
      
      {/* HEADER */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-medium text-[#0F3024] tracking-[-0.5px] font-display">
            Best Group Deals for You
          </h2>
          <p className="text-xs md:text-sm text-[#718096] font-normal mt-1 font-sans">
            Team up with neighbors to unlock lowest farm-gate wholesale prices
          </p>
        </div>
      </div>

      {/* GRID (24PX TO 32PX GAPS) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
        
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
                {/* --- UPGRADED: Next.js Image Component --- */}
                {product.image_url ? (
                  <Image 
                    src={product.image_url} 
                    alt={product.name} 
                    fill
                    sizes="(max-width: 1024px) 50vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-700" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Img</div>
                )}
                <div className="absolute top-3 left-3 bg-[#0F3024] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs z-10 font-sans tracking-wide">
                  Group Buy
                </div>
              </Link>

              {/* BOTTOM HALF: DETAILS & PROGRESS */}
              <div className="p-4 sm:p-5 flex flex-col flex-1">
                
                <Link href={`/product/${product.id}`} className="block flex-1">
                  <h3 className="font-medium text-[#2D3748] text-sm md:text-base leading-tight mb-1.5 line-clamp-1 hover:text-[#0F3024] transition-colors font-display">
                    {product.name}
                  </h3>
                  
                  {/* PRICING */}
                  <div className="flex items-center gap-2 mb-3 font-sans">
                    <span className="font-semibold text-[#C05E44] text-lg md:text-xl">
                      {formatNaira(product.group_buy_price)}
                      <span className="text-[10px] text-[#718096] font-normal ml-1">/ Slot</span>
                    </span>
                  </div>

                  {/* PROGRESS BAR UI */}
                  <div className="w-full mb-4">
                    <div className="flex justify-between items-end mb-1.5 font-sans">
                      <span className="text-[10px] md:text-xs font-medium text-[#718096]">
                        {current} / {target} Joined
                      </span>
                      {isCompleted && (
                        <span className="text-[9px] font-bold text-[#0F3024] uppercase tracking-wider bg-emerald-50 px-1.5 py-0.5 rounded-full">
                          Goal Reached
                        </span>
                      )}
                    </div>
                    
                    {/* The Track */}
                    <div className="w-full h-1.5 md:h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
                      {/* The Fill */}
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ease-out ${isCompleted ? 'bg-[#0F3024]' : 'bg-[#C05E44]'}`}
                        style={{ width: `${progressPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                </Link>

                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    handleToggleJoin(product, isAlreadyJoined);
                  }}
                  className={`w-full border font-bold py-2.5 rounded-full transition-colors text-xs md:text-sm font-sans cursor-pointer ${
                    isAlreadyJoined 
                      ? 'bg-emerald-50 border-[#0F3024] text-[#0F3024] hover:bg-rose-50 hover:border-[#C05E44] hover:text-[#C05E44] group/btn' 
                      : 'bg-white border-[#0F3024] text-[#0F3024] hover:bg-[#0F3024] hover:text-white' 
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