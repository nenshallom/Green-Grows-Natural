'use client';
import { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import Link from 'next/link';
import Image from 'next/image';

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price_per_unit: number;
  unit: string; 
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

interface ProductClientProps {
  product: Product;
  relatedProducts: Product[];
}

export default function ProductClient({ product, relatedProducts }: ProductClientProps) {
  const { addToCart } = useCart();
  
  // Initialize state directly from the instantly available props
  const [activeImage, setActiveImage] = useState<string>(product.image_url);
  const [quantity, setQuantity] = useState(1);
  const [purchaseMode, setPurchaseMode] = useState<'standard' | 'group'>('standard');
  const [computedPriceType, setComputedPriceType] = useState<'standard' | 'bulk' | 'group'>('standard');

  useEffect(() => {
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
    if (purchaseMode === 'group') return; 
    if (newQty < 1) newQty = 1;
    if (newQty > product.stock_quantity) newQty = product.stock_quantity;
    setQuantity(newQty);
  };

  const handleAddToCart = () => {
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

  const allImages = [product.image_url, ...(product.additional_images || [])].filter(Boolean);
  const isGroupFull = product.current_group_buyers >= (product.group_threshold || 1);

  return (
    <div className="min-h-screen bg-white py-8 px-4 sm:px-6 lg:px-12">
      <div className="max-w-6xl mx-auto">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16 mb-16">
          
          <div className="relative w-full aspect-[4/5] md:aspect-square rounded-3xl overflow-hidden bg-gray-100 shadow-sm group">
            {activeImage && (
              <Image 
                src={activeImage} 
                alt={product.name} 
                fill 
                priority 
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105" 
              />
            )}
            
            {allImages.length > 1 && (
              <div className="absolute bottom-4 left-4 flex gap-2 bg-black/20 p-2 rounded-xl backdrop-blur-sm">
                {allImages.slice(0, 4).map((img, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => setActiveImage(img)} 
                    className={`relative w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${activeImage === img ? 'border-white scale-110 shadow-md' : 'border-white/60 hover:border-white opacity-80 hover:opacity-100'}`}
                  >
                    <Image src={img} alt={`Thumbnail ${idx}`} fill sizes="56px" className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col pt-2">
            <span className="bg-[#872022] text-white text-[10px] font-bold px-3 py-1 rounded uppercase tracking-wider w-max mb-3">
              {product.category}
            </span>
            
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-3 leading-tight">{product.name}</h1>
            <p className="text-sm text-gray-600 leading-relaxed mb-6">
              {product.description || "Fresh and highly nutritious."}
            </p>

            <div className="flex gap-2 mb-6">
              <button 
                onClick={() => setPurchaseMode('standard')} 
                className={`flex-1 py-2.5 px-2 rounded-md font-bold text-xs transition-colors ${purchaseMode === 'standard' ? 'bg-[#872022] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              >
                Standard & Bulk Buy
              </button>
              
              {product.is_group_buy_enabled && (
                <button 
                  onClick={() => !isGroupFull && setPurchaseMode('group')} 
                  disabled={isGroupFull}
                  className={`flex-1 py-2.5 px-2 rounded-md font-bold text-xs transition-colors 
                    ${purchaseMode === 'group' ? 'bg-[#7BA69D] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'} 
                    ${isGroupFull ? 'opacity-50 cursor-not-allowed border border-gray-300' : ''}`
                  }
                >
                  {isGroupFull ? 'Campaign Full' : 'Join Group Buy'}
                </button>
              )}
            </div>

            <div className="mb-6">
              <div className="flex items-end gap-1 mb-1">
                <span className="text-2xl font-black text-gray-900">
                  {computedPriceType === 'bulk' ? product.bulk_buy_price?.toLocaleString() : computedPriceType === 'group' ? product.group_buy_price?.toLocaleString() : product.price_per_unit.toLocaleString()}
                </span>
                <span className="text-sm font-bold text-gray-900 mb-1">
                  / {product.unit || 'kg'}
                </span>
              </div>
              <p className="text-[#00C261] text-xs font-bold">{product.stock_quantity} units left in stock</p>
            </div>

            <div className="mb-6">
              <p className="text-xs font-bold text-[#872022] mb-2">Select Quantity</p>
              <div className={`flex items-center rounded-md overflow-hidden w-max shadow-sm ${purchaseMode === 'group' ? 'bg-gray-300' : 'bg-[#286266]'}`}>
                <button onClick={() => handleQuantityChange(quantity - 1)} disabled={purchaseMode === 'group'} className="px-4 py-2 text-white hover:bg-white/20 font-bold transition-colors disabled:opacity-50">−</button>
                <span className="w-10 text-center font-bold text-sm text-white">{quantity}</span>
                <button onClick={() => handleQuantityChange(quantity + 1)} disabled={purchaseMode === 'group'} className="px-4 py-2 text-white hover:bg-white/20 font-bold transition-colors disabled:opacity-50">+</button>
              </div>
            </div>

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

            <button 
              onClick={handleAddToCart}
              disabled={product.stock_quantity < 1 || (purchaseMode === 'group' && isGroupFull)}
              className="w-full bg-[#00C261] text-white font-bold text-sm py-4 rounded-lg hover:bg-green-600 transition-colors shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {product.stock_quantity < 1 ? 'Out of Stock' : (purchaseMode === 'group' && isGroupFull) ? 'Campaign Full' : 'Add to Cart'}
            </button>
            
          </div>
        </div>

        {/* RELATED PRODUCTS */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 className="text-2xl font-black text-gray-900 mb-6 text-center">You might also like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.map(related => (
                <Link key={related.id} href={`/product/${related.id}`} className="group cursor-pointer">
                  <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-gray-100 mb-3 shadow-sm">
                    {related.image_url && (
                      <Image 
                        src={related.image_url} 
                        alt={related.name} 
                        fill 
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                    )}
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