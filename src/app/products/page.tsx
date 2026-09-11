import { Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import ProductsClient from './ProductsClient';

// This runs entirely on the server BEFORE sending HTML to the browser!
export default async function ProductsCatalogPage() {
  
  // 1. Fetch all products instantly
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching products on server:", error);
  }

  // 2. Pass the data to the interactive Client Component wrapped in Suspense
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1A4331]"></div>
        </div>
      }
    >
      <ProductsClient initialProducts={products || []} />
    </Suspense>
  );
}