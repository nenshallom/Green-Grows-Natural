'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { StoreAnnouncement, AnnouncementTheme } from '@/types';
import { DEFAULT_ANNOUNCEMENTS } from '@/config/defaultAnnouncements';
import { FiClock, FiArrowRight } from 'react-icons/fi';

// Slide duration in milliseconds
const SLIDE_DURATION_MS = 4500;
const PROGRESS_STEP_INTERVAL_MS = 45; // updates progress smoothly ~22 times per sec

// Color styles mapping based on theme
const THEME_STYLES: Record<
  AnnouncementTheme,
  {
    wrapper: string;
    badge: string;
    badgeDot: string;
    timer: string;
    button: string;
    accentText: string;
    progressBar: string;
  }
> = {
  orange: {
    wrapper: 'bg-[#C05E44] text-white border-b border-[#ad5138]',
    badge: 'bg-white/20 text-white border border-white/25',
    badgeDot: 'bg-white',
    timer: 'bg-black/25 text-white border border-white/20',
    button: 'bg-white text-[#C05E44] hover:bg-white/95 font-bold shadow-xs',
    accentText: 'text-white font-display tracking-[0.03em]',
    progressBar: 'bg-white/90',
  },
  emerald: {
    wrapper: 'bg-[#0F3024] text-white border-b border-[#0b241b]',
    badge: 'bg-white/20 text-white border border-white/25',
    badgeDot: 'bg-emerald-300',
    timer: 'bg-black/25 text-emerald-100 border border-white/20',
    button: 'bg-white text-[#0F3024] hover:bg-white/95 font-bold shadow-xs',
    accentText: 'text-white font-display tracking-[0.03em]',
    progressBar: 'bg-emerald-400',
  },
  amber: {
    wrapper: 'bg-[#8F5B2E] text-white border-b border-[#7b4d24]',
    badge: 'bg-white/20 text-white border border-white/25',
    badgeDot: 'bg-amber-200',
    timer: 'bg-black/25 text-amber-100 border border-white/20',
    button: 'bg-white text-[#8F5B2E] hover:bg-white/95 font-bold shadow-xs',
    accentText: 'text-white font-display tracking-[0.03em]',
    progressBar: 'bg-amber-300',
  },
  blue: {
    wrapper: 'bg-[#2A4D69] text-white border-b border-[#213d54]',
    badge: 'bg-white/20 text-white border border-white/25',
    badgeDot: 'bg-sky-200',
    timer: 'bg-black/25 text-sky-100 border border-white/20',
    button: 'bg-white text-[#2A4D69] hover:bg-white/95 font-bold shadow-xs',
    accentText: 'text-white font-display tracking-[0.03em]',
    progressBar: 'bg-sky-300',
  },
};

// Countdown Helper Component
function LiveCountdownBadge({ expiresAt, theme }: { expiresAt: string; theme: AnnouncementTheme }) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  } | null>(null);

  useEffect(() => {
    const calculateTime = () => {
      const target = new Date(expiresAt).getTime();
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isExpired: false });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  if (!timeLeft || timeLeft.isExpired) return null;

  const pad = (n: number) => n.toString().padStart(2, '0');
  const themeStyle = THEME_STYLES[theme] || THEME_STYLES.emerald;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold tracking-tight shadow-xs select-none ${themeStyle.timer}`}
      title="Offer Countdown"
    >
      <FiClock className="w-3 h-3 animate-pulse" />
      <span>
        {timeLeft.days > 0 ? `${timeLeft.days}d : ` : ''}
        {pad(timeLeft.hours)}h : {pad(timeLeft.minutes)}m : {pad(timeLeft.seconds)}s
      </span>
    </div>
  );
}

export default function MarketingNavbarBanner() {
  const pathname = usePathname();
  const [announcements, setAnnouncements] = useState<StoreAnnouncement[]>(DEFAULT_ANNOUNCEMENTS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0); // 0% to 100%
  const [isHovered, setIsHovered] = useState(false);

  // Swipe & Drag Gesture Tracking
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const mouseStartX = useRef<number | null>(null);
  const isMouseDown = useRef(false);

  // STRICT RULE: Only render on the Homepage ('/')
  const isHomepage = pathname === '/';

  // Fetch announcements from Supabase with graceful fallback
  useEffect(() => {
    if (!isHomepage) return;

    const fetchAnnouncements = async () => {
      try {
        const { data, error } = await supabase
          .from('store_announcements')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (data && data.length > 0 && !error) {
          setAnnouncements(data as StoreAnnouncement[]);
        } else {
          // Check local storage fallback
          const localSaved = localStorage.getItem('ggn_admin_announcements');
          if (localSaved) {
            try {
              const parsed = JSON.parse(localSaved);
              if (Array.isArray(parsed) && parsed.length > 0) {
                const activeOnes = parsed.filter((a: StoreAnnouncement) => a.is_active);
                if (activeOnes.length > 0) {
                  setAnnouncements(activeOnes);
                }
              }
            } catch {
              // fallback
            }
          }
        }
      } catch (err) {
        console.warn('Store announcements table not queried, using default templates:', err);
      }
    };

    fetchAnnouncements();
  }, [isHomepage]);

  // Active items filter (exclude expired countdowns if past due)
  const activeItems = useMemo(() => {
    if (announcements.length === 0) return DEFAULT_ANNOUNCEMENTS;
    return announcements.filter((item) => {
      if (!item.is_active) return false;
      if (item.expires_at) {
        return new Date(item.expires_at).getTime() > Date.now();
      }
      return true;
    });
  }, [announcements]);

  // Keep currentIndex bounded
  useEffect(() => {
    if (currentIndex >= activeItems.length) {
      setCurrentIndex(0);
      setProgress(0);
    }
  }, [activeItems.length, currentIndex]);

  // Slide navigation helpers (reset progress immediately)
  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % activeItems.length);
    setProgress(0);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + activeItems.length) % activeItems.length);
    setProgress(0);
  };

  // Continuous Progress Bar & Auto-Slide Timer
  useEffect(() => {
    if (!isHomepage || activeItems.length <= 1 || isHovered) return;

    const increment = (PROGRESS_STEP_INTERVAL_MS / SLIDE_DURATION_MS) * 100;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setCurrentIndex((idx) => (idx + 1) % activeItems.length);
          return 0;
        }
        return prev + increment;
      });
    }, PROGRESS_STEP_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isHomepage, activeItems.length, isHovered]);

  // =========================================================
  // TOUCH SWIPE HANDLERS (MOBILE)
  // =========================================================
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 45; // minimum px for gesture

    if (distance > minSwipeDistance) {
      // Swiped Left -> Next Slide
      goToNext();
    } else if (distance < -minSwipeDistance) {
      // Swiped Right -> Previous Slide
      goToPrev();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  // =========================================================
  // MOUSE DRAG / SWIPE HANDLERS (DESKTOP)
  // =========================================================
  const handleMouseDown = (e: React.MouseEvent) => {
    // Ignore drags that start on links/buttons
    if ((e.target as HTMLElement).closest('a, button')) return;
    mouseStartX.current = e.clientX;
    isMouseDown.current = true;
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isMouseDown.current || mouseStartX.current === null) return;
    const distance = mouseStartX.current - e.clientX;
    const minSwipeDistance = 45;

    if (distance > minSwipeDistance) {
      goToNext();
    } else if (distance < -minSwipeDistance) {
      goToPrev();
    }

    mouseStartX.current = null;
    isMouseDown.current = false;
  };

  // If not homepage or no announcements, render nothing
  if (!isHomepage || activeItems.length === 0) {
    return null;
  }

  const current = activeItems[currentIndex] || activeItems[0];
  const theme = THEME_STYLES[current.theme_color] || THEME_STYLES.emerald;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        isMouseDown.current = false;
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      className={`w-full py-3 sm:py-3.5 px-4 sm:px-6 lg:px-12 transition-colors duration-500 relative select-none overflow-hidden ${
        activeItems.length > 1 ? 'cursor-grab active:cursor-grabbing' : ''
      } ${theme.wrapper}`}
      title={activeItems.length > 1 ? 'Swipe left or right to change slide' : undefined}
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* =========================================================
            SLIDE CONTENT (ANIMATED ON INDEX CHANGE)
        ========================================================= */}
        <div
          key={current.id || currentIndex}
          className="flex-1 flex flex-wrap items-center justify-center md:justify-start gap-2.5 min-w-0 text-center md:text-left animate-fade-in"
        >
          {/* CAMPAIGN BADGE AND TIMER*/}
          <span className=' flex gap-5'>
            <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-2xs flex-shrink-0 ${theme.badge}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${theme.badgeDot} animate-ping`}></span>
            {current.badge_text || 'PROMOTION'}
          </span>

          {/* OPTIONAL LIVE COUNTDOWN TIMER */}
          {current.expires_at && (
            <LiveCountdownBadge expiresAt={current.expires_at} theme={current.theme_color} />
          )}
          </span>
          

          {/* HEADLINE */}
          <span className={`text-xs md:text-sm font-extrabold truncate max-w-xl ${theme.accentText}`}>
            {current.headline}
          </span>

          
        </div>

        {/* =========================================================
            RIGHT: ACTION CTA BUTTON (MINIMAL & ARROWLESS)
        ========================================================= */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <Link
            href={current.cta_url || '/products'}
            className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-xs hover:shadow-sm active:scale-95 ${theme.button}`}
          >
            <span>{current.cta_label || 'Shop Deal'}</span>
            <FiArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* =========================================================
          SLEEK FILLING PROGRESS LINE (BOTTOM BORDER)
      ========================================================= */}
      {activeItems.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-black/10 overflow-hidden">
          <div
            className={`h-full transition-all ease-linear ${theme.progressBar}`}
            style={{
              width: `${progress}%`,
              transitionDuration: isHovered ? '0ms' : `${PROGRESS_STEP_INTERVAL_MS}ms`,
            }}
          />
        </div>
      )}
    </div>
  );
}
