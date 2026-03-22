'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/context/CartContext';
import Hero from '@/components/Hero';
import ShopByCategories from '@/components/ShopByCategories';
import BestDeals from '@/components/BestDeals';
import BulkDeals from '@/components/BulkDeals';
import GroupDeals from '@/components/GroupDeals';
import FAQ from '@/components/FAQ';
import Testimonials from '@/components/Testimonials';

// ... (keep your Product interface here)
interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price_per_unit: number;
  original_price?: number;
  unit: string;
  is_group_buy_enabled: boolean;
  group_buy_price: number;
  group_threshold: number;
  is_bulk_buy_enabled: boolean;
  bulk_buy_price: number;
  bulk_threshold: number;
  stock_quantity: number;
  image_url: string;
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { addToCart } = useCart();

  useEffect(() => {
    async function fetchProducts() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (data) setProducts(data as Product[]);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  const handleAddToCart = (product: Product, type: 'standard' | 'bulk' | 'group') => {
    let price = product.price_per_unit;
    let quantity = 1;
    if (type === 'bulk') {
      price = product.bulk_buy_price;
      quantity = product.bulk_threshold;
    } else if (type === 'group') {
      price = product.group_buy_price;
    }

    addToCart({
      productId: product.id,
      name: product.name,
      priceAtAddition: price, 
      quantity: quantity,
      purchaseType: type,
      image: product.image_url
    });
    alert(`Added ${product.name} (${type} purchase) to your cart!`);
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD]">

      <main className="max-w-[90%] mx-auto py-8 space-y-16">
      
        {/* --- HERO SECTION --- */}
        <div id="home">
          <Hero />
        </div>
        <div id="categories">
          <ShopByCategories 
            activeCategories={Array.from(new Set(products.map(p => p.category))).slice(0, 4)} 
          />
        </div>

        <div id="deals">
          {loading ? (
            <div className="py-12 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A4331]"></div></div>
          ) : (
            <>
              <BestDeals products={products} />
              <BulkDeals products={products} />
              <GroupDeals products={products} />
            </>
          )}
        </div>

        <div id="faq">
          <FAQ />
        </div>
        <Testimonials />


      </main>
    </div>
  );
}