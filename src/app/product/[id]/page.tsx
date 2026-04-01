import { supabase } from '@/lib/supabase';
import ProductClient from './ProductClient';
import { notFound } from 'next/navigation';

// UPDATED: Tell TypeScript that params is a Promise
export default async function ProductDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  
  // 1. UNWRAP THE PARAMS PROMISE (Next.js 15+ requirement)
  const resolvedParams = await params;
  const productId = resolvedParams.id;

  // 2. Fetch the main product on the server
  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single();

  // If there's an error or no product, automatically show Next.js 404 page
  if (error || !product) {
    return notFound();
  }

  // 3. Fetch related products on the server
  const { data: relatedProducts } = await supabase
    .from('products')
    .select('*')
    .eq('category', product.category)
    .neq('id', product.id)
    .limit(4);

  // 4. Pass the raw data down to the Client Component to render the interactive UI instantly!
  return <ProductClient product={product} relatedProducts={relatedProducts || []} />;
}