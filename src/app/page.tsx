'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Hero from '@/components/Hero';
import ShopByCategories from '@/components/ShopByCategories';
import BestDeals from '@/components/BestDeals';
import BulkDeals from '@/components/BulkDeals';
import GroupDeals from '@/components/GroupDeals';
import FAQ from '@/components/FAQ';
import Testimonials from '@/components/Testimonials';
import { Product } from '@/types';
import { getErrorMessage } from '@/utils/format';

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const { data, error: fetchError } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;
        if (data) setProducts(data as Product[]);
      } catch (err) {
        console.error('Failed to load products:', getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen bg-[#fafffa]">

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