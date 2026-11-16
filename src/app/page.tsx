'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
// import Hero from '@/components/Hero';
import BestDeals from '@/components/BestDeals';
import BulkDeals from '@/components/BulkDeals';
import GroupDeals from '@/components/GroupDeals';
import FAQ from '@/components/FAQ';
import Testimonials from '@/components/Testimonials';
import { Product } from '@/types';
import { getErrorMessage } from '@/utils/format';
import { FEATURES } from '@/config/features';

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('name');
        
        if (error) throw error;
        setProducts(data || []);
      } catch (err: unknown) {
        console.error('Failed to load products:', getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <main className="max-w-[95%] lg:max-w-7xl mx-auto py-10 lg:py-0   md:space-y-6">
        {/* --- HERO SECTION --- */}
        {/* <div id="home">
          <Hero />
        </div> */}

        {/* --- UNIFIED DEALS & CATEGORY DISCOVERY FEED --- */}
        <div id="categories" className="scroll-mt-24" />
        <div id="deals" className="scroll-mt-24">
          {loading ? (
            <div className="py-12 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0F3024]"></div>
            </div>
          ) : (
            <>
              <BestDeals products={products} />
              <BulkDeals products={products} />
              {FEATURES.ENABLE_GROUP_BUY && <GroupDeals products={products} />}
            </>
          )}
        </div>

        
        <Testimonials />
        <div id="faq">
          <FAQ />
        </div>
      </main>
    </div>
  );
}
