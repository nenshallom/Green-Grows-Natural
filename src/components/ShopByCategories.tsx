import Link from 'next/link';

interface ShopByCategoriesProps {
  activeCategories: string[];
}

// 1. THE DICTIONARY
const categoryStyles: Record<string, { subtitle: string; imgSrc: string }> = {
  "Fruits": {
    subtitle: "Local Yield",
    // BUG FIX: Added the leading '/' so Next.js doesn't crash!
    imgSrc: "/images/fruitsCateg.png",
  },
  "Vegetables": {
    subtitle: "Farm Fresh",
    imgSrc: "/images/vegetableCateg.png",
  },
  "Grains": {
    subtitle: "100% Organic",
    imgSrc: "/images/grainsCateg.png",
  },
  "Tubers": {
    subtitle: "Rich Harvest",
    imgSrc: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=600&q=80", 
  },
  "Livestock": {
    subtitle: "Healthy Breeds",
    imgSrc: "https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=600&q=80",
  }
};

// 2. THE FALLBACK
const fallbackStyle = {
  subtitle: "Premium Quality",
  imgSrc: "/images/kunuCateg.png", // Added the leading slash here too!
};

export default function ShopByCategories({ activeCategories }: ShopByCategoriesProps) {
  if (!activeCategories || activeCategories.length === 0) return null;

  return (
    <section className="w-full mt-12 mb-8">
      {/* HEADER */}
      <div className="flex justify-between items-end mb-6">
        <h2 className="text-2xl md:text-3xl font-black text-[#1A4331] tracking-tight">
          Shop by Categories
        </h2>
        <Link 
          href="/categories" 
          className="text-xs md:text-sm font-bold text-gray-700 border border-gray-300 rounded-md px-3 py-1.5 hover:bg-gray-50 transition-colors flex items-center gap-1"
        >
          View All <span className="text-lg leading-none">›</span>
        </Link>
      </div>

      {/* PREMIUM DYNAMIC GRID / SLIDER
        Mobile: Flexbox horizontal scroll, hides scrollbars, snaps children to center.
        Desktop (md+): Standard 4-column grid.
      */}
      <div className="flex overflow-x-auto md:grid md:grid-cols-4 gap-4 md:gap-6 pb-4 md:pb-0 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {activeCategories.map((categoryName, index) => {
          const style = categoryStyles[categoryName] || fallbackStyle;

          return (
            <Link 
              key={index} 
              href={`/category/${categoryName.toLowerCase().replace(/\s+/g, '-')}`}
              // Mobile: w-[85%] so the next card peeks out. Desktop: w-full for the grid.
              className="flex-none w-[85%] sm:w-[45%] md:w-auto snap-center rounded-2xl md:rounded-[24px] p-5 md:p-6 h-[350px] relative overflow-hidden group hover:shadow-md transition-all block bg-cover bg-center"
              style={{ backgroundImage: `url('${style.imgSrc}')` }}
            >
              {/* Added a very subtle dark gradient at the top just to ensure the white text always pops, even on bright images */}
              <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-black/40 to-transparent pointer-events-none"></div>

              {/* TEXT CONTENT */}
              <div className="relative z-10 max-w-[90%] pt-2">
                <h3 className="text-white font-black text-xl md:text-2xl leading-tight mb-1 drop-shadow-md">
                  {categoryName === 'Fruits' || categoryName === 'Vegetables' ? `Fresh ${categoryName}` : categoryName}
                </h3>
                <p className="text-white/90 text-[10px] md:text-xs font-bold tracking-wide uppercase drop-shadow-md">
                  {style.subtitle}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}