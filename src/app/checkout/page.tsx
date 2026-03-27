'use client';
import dynamic from 'next/dynamic';

// We dynamically import the checkout logic and explicitly disable Server-Side Rendering (SSR)
// This guarantees that react-paystack will only ever run in the browser where 'window' exists!
const CheckoutClient = dynamic(() => import('./CheckoutClient'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
    </div>
  ),
});

export default function CheckoutPage() {
  return <CheckoutClient />;
}