'use client'; // Required for the sliding state and timer
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);

  // --- NEW: TOUCH & GESTURE STATES ---
  const [isPaused, setIsPaused] = useState(false);
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchEndX, setTouchEndX] = useState(0);

  // --- UPGRADED AUTOMATIC SLIDER ENGINE ---
  useEffect(() => {
    // If the user is holding their finger down (paused), don't run the timer!
    if (isPaused) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === 0 ? 1 : 0));
    }, 2000);

    return () => clearInterval(timer);
  }, [isPaused]); // Timer re-runs if isPaused changes

  // --- GESTURE HANDLERS ---
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true); // Pause auto-slider
    setTouchStartX(e.targetTouches[0].clientX); // Record where finger landed
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX); // Track finger movement
  };

  const handleTouchEnd = () => {
    setIsPaused(false); // Unpause auto-slider when finger lifts
    
    if (!touchStartX || !touchEndX) return;

    // Calculate how far they swiped
    const distance = touchStartX - touchEndX;
    const minSwipeDistance = 50; // Require at least 50px of movement to count as a swipe

    if (distance > minSwipeDistance) {
      // Swiped Left ⬅️ (Go to Slide 1)
      setCurrentSlide(1);
    } else if (distance < -minSwipeDistance) {
      // Swiped Right ➡️ (Go to Slide 0)
      setCurrentSlide(0);
    }

    // Reset touch coordinates for the next swipe
    setTouchStartX(0);
    setTouchEndX(0);
  };

  return (
    // The main container hides the overflow on mobile, but allows it on desktop
    <section 
      className="relative w-full h-[450px] lg:h-[420px] overflow-hidden lg:overflow-visible rounded-3xl lg:rounded-none group"
      // Attach the touch listeners to the main container
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      // Also pause on desktop hover for a better mouse experience!
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      
      {/* THE RESPONSIVE SLIDER TRACK:
        Mobile: 200% width, uses flexbox, slides left and right using translate-x.
        Desktop (lg): 100% width, snaps to a 3-column grid, disables sliding.
      */}
      <div 
        className={`flex lg:grid lg:grid-cols-3 gap-4 lg:gap-6 h-full w-[200%] lg:w-full transition-transform duration-700 ease-in-out lg:translate-x-0 ${
          currentSlide === 0 ? 'translate-x-0' : '-translate-x-1/2'
        }`}
      >
        
        {/* --- SLIDE 1: Main Left Banner --- */}
        <div 
          className="w-1/2 lg:w-full lg:col-span-2 bg-cover bg-center bg-no-repeat rounded-3xl p-8 md:p-12 relative overflow-hidden flex flex-col justify-center shadow-sm"
          style={{ backgroundImage: "url('/images/banner1.png')" }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/70 to-transparent"></div>
          <div className="z-10 relative max-w-lg">
            <h1 className="text-4xl md:text-5xl font-black text-[#1A4331] leading-[1.15] mb-4">
              Your Farm Produce<br/>Just a Click Away
            </h1>
            <div className="flex items-center gap-2 mb-8">
              <span className="bg-green-600 text-white rounded-full p-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" /></svg>
              </span>
              <p className="text-[#1A4331] font-bold text-sm tracking-wide">
                100% FRESH PRODUCTS GUARANTEED
              </p>
            </div>
            <Link href="#deals" className="bg-[#1A4331] text-white font-bold py-3.5 px-8 rounded-lg hover:bg-green-900 transition-colors inline-flex items-center gap-2 shadow-lg w-fit">
              Shop Now 
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
            </Link>
          </div>
        </div>

        {/* --- SLIDE 2: Right Split Banners --- */}
        <div className="w-1/2 lg:w-full flex flex-col gap-4 lg:gap-6 h-full">
          
          {/* Top Right: Bulk Purchase */}
          <Link href="/bulk" 
            className="flex-1 rounded-3xl relative overflow-hidden group cursor-pointer shadow-sm block bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url('/images/banner2.png')" }}
          >
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors"></div>
            <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-center text-white">
              <h3 className="text-2xl font-black mb-1 drop-shadow-md">Bulk Purchase</h3>
              <p className="text-sm text-gray-200 mb-3 font-medium drop-shadow-md">Shop Smart, Save Big</p>
              <div><span className="text-xs font-bold uppercase tracking-widest text-white border-b-2 border-white pb-1 inline-block">Explore Bulk →</span></div>
            </div>
          </Link>

          {/* Bottom Right: Group Purchase */}
          <Link href="/group-deals" 
            className="flex-1 rounded-3xl relative overflow-hidden group cursor-pointer shadow-sm block bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url('/images/banner3.png')" }}
          >
            <div className="absolute inset-0 bg-[#1A4331]/60 group-hover:bg-[#1A4331]/70 transition-colors mix-blend-multiply"></div>
            <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-center text-white">
              <h3 className="text-2xl font-black mb-1 drop-shadow-md">Group Purchase</h3>
              <p className="text-sm text-gray-200 mb-3 font-medium drop-shadow-md">Buy together, pay less</p>
              <div><span className="text-xs font-bold uppercase tracking-widest text-white border-b-2 border-white pb-1 inline-block">Join a Group →</span></div>
            </div>
          </Link>

        </div>
      </div>

      {/* --- MOBILE PAGINATION DOTS (Hidden on Desktop) --- */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex lg:hidden gap-2 z-20">
        <button 
          onClick={() => setCurrentSlide(0)} 
          className={`h-2 rounded-full transition-all duration-300 ${currentSlide === 0 ? 'w-6 bg-[#1A4331]' : 'w-2 bg-gray-400/50 hover:bg-gray-400'}`} 
          aria-label="Show Main Banner" 
        />
        <button 
          onClick={() => setCurrentSlide(1)} 
          className={`h-2 rounded-full transition-all duration-300 ${currentSlide === 1 ? 'w-6 bg-[#1A4331]' : 'w-2 bg-gray-400/50 hover:bg-gray-400'}`} 
          aria-label="Show Split Banners" 
        />
      </div>

    </section>
  );
}