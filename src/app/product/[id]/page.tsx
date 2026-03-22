'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price_per_unit: number;
  unit: string; // <-- NEW: Unit of Measurement
  stock_quantity: number;
  image_url: string;
  additional_images: string[];
  is_bulk_buy_enabled: boolean;
  bulk_buy_price: number;
  bulk_threshold: number;
  is_group_buy_enabled: boolean;
  group_buy_price: number;
  group_threshold: number;
  current_group_buyers: number;
  group_buy_deadline: string;
}

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { addToCart } = useCart();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Interactive UI States
  const [activeImage, setActiveImage] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [purchaseMode, setPurchaseMode] = useState<'standard' | 'group'>('standard');
  const [computedPriceType, setComputedPriceType] = useState<'standard' | 'bulk' | 'group'>('standard');

  useEffect(() => {
    const fetchProductAndRelated = async () => {
      try {
        // 1. Fetch Main Product
        const { data, error } = await supabase.from('products').select('*').eq('id', params.id).single();
        if (error) throw error;
        
        if (data) {
          setProduct(data);
          setActiveImage(data.image_url);

          // 2. Fetch Related Products (Same category, excluding current product)
          const { data: relatedData } = await supabase
            .from('products')
            .select('*')
            .eq('category', data.category)
            .neq('id', data.id)
            .limit(4);
            
          if (relatedData) setRelatedProducts(relatedData);
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };
    if (params.id) fetchProductAndRelated();
  }, [params.id]);

  // --- SMART PRICING & QUANTITY LOGIC ---
  useEffect(() => {
    if (!product) return;
    if (purchaseMode === 'group') {
      setComputedPriceType('group');
      setQuantity(1); 
    } else {
      if (product.is_bulk_buy_enabled && quantity >= product.bulk_threshold) {
        setComputedPriceType('bulk');
      } else {
        setComputedPriceType('standard');
      }
    }
  }, [quantity, purchaseMode, product]);

  const handleQuantityChange = (newQty: number) => {
    if (!product || purchaseMode === 'group') return; 
    if (newQty < 1) newQty = 1;
    if (newQty > product.stock_quantity) newQty = product.stock_quantity;
    setQuantity(newQty);
  };

  const handleAddToCart = () => {
    if (!product) return;
    const price = computedPriceType === 'bulk' ? product.bulk_buy_price : computedPriceType === 'group' ? product.group_buy_price : product.price_per_unit;
    addToCart({
      productId: product.id,
      name: product.name,
      image: product.image_url || '',
      quantity: quantity,
      purchaseType: computedPriceType,
      priceAtAddition: price
    });
    alert(`Added to Cart! ${quantity}x ${product.name} ready for checkout.`);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><p className="animate-pulse text-lg font-bold text-gray-500">Loading Product...</p></div>;
  if (!product) return <div className="min-h-screen flex items-center justify-center"><p>Product not found.</p></div>;

  const allImages = [product.image_url, ...(product.additional_images || [])].filter(Boolean);

  return (
    <div className="min-h-screen bg-white py-8 px-4 sm:px-6 lg:px-12">
      <div className="max-w-6xl mx-auto">
        
        {/* =========================================
            TOP SECTION: IMAGES & DETAILS
        ========================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16 mb-16">
          
          {/* LEFT: MATCHING THE UI IMAGE GALLERY */}
          <div className="relative w-full aspect-[4/5] md:aspect-square rounded-3xl overflow-hidden bg-gray-100 shadow-sm group">
            <img src={activeImage} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            
            {/* The Overlay Thumbnails */}
            {allImages.length > 1 && (
              <div className="absolute bottom-4 left-4 flex gap-2 bg-black/20 p-2 rounded-xl backdrop-blur-sm">
                {allImages.slice(0, 4).map((img, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => setActiveImage(img)} 
                    className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${activeImage === img ? 'border-white scale-110 shadow-md' : 'border-white/60 hover:border-white opacity-80 hover:opacity-100'}`}
                  >
                    <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: MATCHING THE UI DETAILS PANEL */}
          <div className="flex flex-col pt-2">
            
            {/* Category Tag */}
            <span className="bg-[#872022] text-white text-[10px] font-bold px-3 py-1 rounded uppercase tracking-wider w-max mb-3">
              {product.category}
            </span>
            
            {/* Title & Description */}
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-3 leading-tight">{product.name}</h1>
            <p className="text-sm text-gray-600 leading-relaxed mb-6">
              {product.description || "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut."}
            </p>

            {/* PURCHASE MODE TOGGLES (Matched to UI Colors) */}
            <div className="flex gap-2 mb-6">
              <button 
                onClick={() => setPurchaseMode('standard')} 
                className={`flex-1 py-2.5 px-2 rounded-md font-bold text-xs transition-colors ${purchaseMode === 'standard' ? 'bg-[#872022] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              >
                Standard & Bulk Buy
              </button>
              {product.is_group_buy_enabled && (
                <button 
                  onClick={() => setPurchaseMode('group')} 
                  className={`flex-1 py-2.5 px-2 rounded-md font-bold text-xs transition-colors ${purchaseMode === 'group' ? 'bg-[#7BA69D] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                >
                  Join Group Buy
                </button>
              )}
            </div>

            {/* PRICE & STOCK */}
            <div className="mb-6">
              <div className="flex items-end gap-1 mb-1">
                <span className="text-2xl font-black text-gray-900">
                  {computedPriceType === 'bulk' ? product.bulk_buy_price?.toLocaleString() : computedPriceType === 'group' ? product.group_buy_price?.toLocaleString() : product.price_per_unit.toLocaleString()}
                </span>
                <span className="text-sm font-bold text-gray-900 mb-1">
                  / {product.unit || 'kg'} {/* <-- DYNAMIC UNIT IMPLEMENTED */}
                </span>
              </div>
              <p className="text-[#00C261] text-xs font-bold">{product.stock_quantity} units left in stock</p>
            </div>

            {/* QUANTITY SELECTOR (Matched to UI Teal Box) */}
            <div className="mb-6">
              <p className="text-xs font-bold text-[#872022] mb-2">Select Quantity</p>
              <div className={`flex items-center rounded-md overflow-hidden w-max shadow-sm ${purchaseMode === 'group' ? 'bg-gray-300' : 'bg-[#286266]'}`}>
                <button onClick={() => handleQuantityChange(quantity - 1)} disabled={purchaseMode === 'group'} className="px-4 py-2 text-white hover:bg-white/20 font-bold transition-colors disabled:opacity-50">−</button>
                <span className="w-10 text-center font-bold text-sm text-white">{quantity}</span>
                <button onClick={() => handleQuantityChange(quantity + 1)} disabled={purchaseMode === 'group'} className="px-4 py-2 text-white hover:bg-white/20 font-bold transition-colors disabled:opacity-50">+</button>
              </div>
            </div>

            {/* DYNAMIC NOTICES */}
            {purchaseMode === 'standard' && product.is_bulk_buy_enabled && quantity < product.bulk_threshold && (
              <p className="text-xs font-bold text-blue-600 mb-6">
                Add {product.bulk_threshold - quantity} more items to unlock bulk price at ₦{product.bulk_buy_price.toLocaleString()}
              </p>
            )}
            {purchaseMode === 'group' && (
              <div className="mb-6 bg-[#7BA69D]/10 p-3 rounded-lg border border-[#7BA69D]/30">
                <p className="text-xs font-bold text-[#7BA69D] flex justify-between">
                  <span>Campaign Progress</span>
                  <span>{product.current_group_buyers} / {product.group_threshold} Joined</span>
                </p>
                <div className="w-full bg-white rounded-full h-1.5 mt-2 overflow-hidden">
                  <div className="bg-[#7BA69D] h-1.5 rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (product.current_group_buyers / product.group_threshold) * 100)}%` }}></div>
                </div>
              </div>
            )}

            {/* ADD TO CART BUTTON (Matched to Bright Green) */}
            <button 
              onClick={handleAddToCart}
              disabled={product.stock_quantity < 1}
              className="w-full bg-[#00C261] text-white font-bold text-sm py-4 rounded-lg hover:bg-green-600 transition-colors shadow-md disabled:bg-gray-300"
            >
              {product.stock_quantity < 1 ? 'Out of Stock' : 'Add to Cart'}
            </button>
            
          </div>
        </div>

        {/* =========================================
            MIDDLE SECTION: REVIEWS (From UI)
        ========================================= */}
        <div className="mb-16">
          <h2 className="text-2xl font-black text-gray-900 mb-6">Reviews</h2>
          <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {[1, 2, 3].map((num) => (
              <div key={num} className="flex-none w-[85%] md:w-[32%] snap-center bg-gray-50 p-6 rounded-2xl">
                <div className="flex gap-1 mb-3 text-yellow-400">
                  <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed mb-4">
                  "The freshness is absolutely unbelievable. I ordered a basket of tomatoes and peppers yesterday, and they arrived this morning looking like they were just plucked from the farm!"
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#286266] text-white flex items-center justify-center text-xs font-bold">SO</div>
                  <div>
                    <p className="text-xs font-bold text-[#286266]">Sarah O.</p>
                    <p className="text-[9px] text-gray-400">Home Chef</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* =========================================
            BOTTOM SECTION: RELATED PRODUCTS
        ========================================= */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 className="text-2xl font-black text-gray-900 mb-6 text-center">You might also like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.map(related => (
                <Link key={related.id} href={`/product/${related.id}`} className="group cursor-pointer">
                  <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-gray-100 mb-3 shadow-sm">
                    <img src={related.image_url} alt={related.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    
                    {/* The Dark Overlay at the bottom */}
                    <div className="absolute bottom-0 left-0 w-full p-3 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end">
                       <p className="text-white font-bold text-xs truncate drop-shadow-md">{related.name}</p>
                       <p className="text-white font-black text-sm drop-shadow-md">₦{related.price_per_unit.toLocaleString()}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}