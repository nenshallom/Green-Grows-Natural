'use client';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const { cartItems, removeFromCart, updateQuantity, cartTotal, clearCart } = useCart();
  const router = useRouter();

  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    // For now, we will alert. Next sprint: The actual Checkout page!
    // alert(`Proceeding to checkout! Grand Total: ₦${cartTotal.toLocaleString()}`);
    router.push('/checkout'); 
  };

  // --- EMPTY CART STATE ---
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-6xl mb-6">🛒</div>
        <h2 className="text-3xl font-black text-gray-900 mb-4">Your cart is empty</h2>
        <p className="text-gray-500 mb-8 text-center max-w-md">
          Looks like you haven't added any fresh produce to your basket yet. Let's fix that!
        </p>
        <Link href="/" className="bg-green-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-green-700 transition-colors shadow-md hover:shadow-lg">
          Start Shopping
        </Link>
      </div>
    );
  }

  // --- ACTIVE CART STATE ---
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        <h1 className="text-3xl font-black text-gray-900 mb-8">Review Your Cart</h1>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* LEFT: CART ITEMS LIST */}
          <div className="lg:w-2/3 space-y-4">
            {cartItems.map((item) => (
              <div key={`${item.productId}-${item.purchaseType}`} className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 relative group">
                
                {/* Product Image */}
                <div className="w-24 h-24 flex-shrink-0 bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Img</div>
                  )}
                </div>

                {/* Product Details */}
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1">{item.name}</h3>
                  
                  {/* Purchase Type Badge */}
                  <div className="mb-3">
                    {item.purchaseType === 'standard' && <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded">Standard Purchase</span>}
                    {item.purchaseType === 'bulk' && <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded">📦 Bulk Wholesale</span>}
                    {item.purchaseType === 'group' && <span className="bg-green-50 text-green-700 text-xs font-bold px-2 py-1 rounded">🤝 Group Buy Campaign</span>}
                  </div>

                  <div className="font-medium text-gray-500 text-sm">
                    ₦{item.priceAtAddition.toLocaleString()} / unit
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex flex-col items-end gap-3 w-full sm:w-auto mt-4 sm:mt-0">
                  <div className="text-xl w-28 font-black text-gray-900">
                    ₦{(item.priceAtAddition * item.quantity).toLocaleString()}
                  </div>

                  <div className={`flex items-center border rounded-lg overflow-hidden w-max ${item.purchaseType === 'group' ? 'bg-gray-100 border-gray-200' : 'bg-white border-gray-300'}`}>
                    <button 
                      onClick={() => updateQuantity(item.productId, item.purchaseType, item.quantity - 1)} 
                      disabled={item.purchaseType === 'group' || item.quantity <= 1} 
                      className="px-3 py-1 text-gray-600 hover:bg-gray-100 font-bold transition-colors disabled:opacity-30"
                    >
                      −
                    </button>
                    <span className="w-10 text-center font-bold text-sm text-gray-900">
                      {item.quantity}
                    </span>
                    <button 
                      onClick={() => updateQuantity(item.productId, item.purchaseType, item.quantity + 1)} 
                      disabled={item.purchaseType === 'group'} 
                      className="px-3 py-1 text-gray-600 hover:bg-gray-100 font-bold transition-colors disabled:opacity-30"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Remove Button (Trash Icon) */}
                <button 
                  onClick={() => removeFromCart(item.productId, item.purchaseType)}
                  className=" right-2 sm:top-auto sm:bottom-6 sm:right-6 text-red-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors "
                  title="Remove item"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>

              </div>
            ))}

            <div className="flex justify-between items-center pt-4">
              <Link href="/" className="text-green-600 font-bold hover:text-green-700 transition-colors">
                ← Continue Shopping
              </Link>
              <button onClick={clearCart} className="text-sm text-gray-500 hover:text-red-600 transition-colors">
                Clear entire cart
              </button>
            </div>
          </div>

          {/* RIGHT: ORDER SUMMARY */}
          <div className="lg:w-1/3">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-24">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h3>
              
              <div className="space-y-4 text-sm text-gray-600 mb-6 pb-6 border-b border-gray-100">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium text-gray-900">₦{cartTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping Estimation</span>
                  <span className="text-gray-400 italic text-xs text-justify w-40">Due to economic factors you'll be contacted with a precise shipping fee</span>
                </div>
              </div>

              <div className="flex justify-between items-end mb-8">
                <span className="text-gray-900 font-bold text-lg">Estimated Total</span>
                <span className="text-3xl font-black text-green-700">₦{cartTotal.toLocaleString()}</span>
              </div>

              <button 
                onClick={handleCheckout}
                className="w-full bg-gray-900 text-white font-black text-lg py-4 rounded-xl hover:bg-black transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
              >
                Proceed to Checkout
              </button>

              <div className="mt-4 text-center flex items-center justify-center gap-2 text-gray-400 text-xs">
                <span>🔒</span> Secure encrypted checkout
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}