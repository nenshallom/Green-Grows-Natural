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

  // 2. Pass the data to the interactive Client Component
  return <ProductsClient initialProducts={products || []} />;
}