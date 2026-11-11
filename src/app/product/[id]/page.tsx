import { supabase } from '@/lib/supabase';
import ProductClient from './ProductClient';
import { notFound } from 'next/navigation';

// Next.js 15+: params is a Promise
export default async function ProductDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  // 1. Unwrap params Promise
  const resolvedParams = await params;
  const productId = resolvedParams.id;

  // 2. Fetch the main product on the server
  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single();

  // If there's an error or no product, automatically show 404
  if (error || !product) {
    return notFound();
  }

  // 3. Fetch richer, cross-category recommendations:
  // - Up to 8 products from the same category
  // - Up to 12 products from other diverse categories (Fruits, Grains, Vegetables, Tubers, etc.)
  const [sameCategoryRes, otherCategoryRes] = await Promise.all([
    supabase
      .from('products')
      .select('*')
      .eq('category', product.category)
      .neq('id', productId)
      .limit(8),
    supabase
      .from('products')
      .select('*')
      .neq('category', product.category)
      .neq('id', productId)
      .limit(12),
  ]);

  const sameCategoryProducts = sameCategoryRes.data || [];
  const otherCategoryProducts = otherCategoryRes.data || [];

  // Blend same category with cross-category recommendations
  const relatedProducts = [
    ...sameCategoryProducts,
    ...otherCategoryProducts,
  ];

  // 4. Pass data to client component
  return <ProductClient product={product} relatedProducts={relatedProducts} />;
}
