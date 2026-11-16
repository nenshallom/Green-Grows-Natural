import { StoreAnnouncement } from '@/types';

// Default initial promotions (used as graceful fallback and seed templates)
export const DEFAULT_ANNOUNCEMENTS: StoreAnnouncement[] = [
  {
    id: 'default-1',
    badge_text: 'FLASH SALE',
    headline: 'Mid-Week Farm Restock: 15% off fresh peppers, tomatoes & onions!',
    subtext: 'Direct harvest picked this morning from Jos and Niger farms',
    cta_label: 'Shop Vegetables',
    cta_url: '/products?category=Vegetables',
    theme_color: 'orange',
    is_active: true,
    display_order: 1,
    // Default expiry 48 hours in future for live countdown demonstration
    expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'default-2',
    badge_text: 'NEW HARVEST',
    headline: 'New Benue Yam & Cassava Tubers just arrived at our hub!',
    subtext: 'Freshly harvested large tubers at direct farm wholesale prices',
    cta_label: 'Shop Tubers',
    cta_url: '/products?category=Tubers',
    theme_color: 'emerald',
    is_active: true,
    display_order: 2,
    expires_at: null,
  },
  {
    id: 'default-3',
    badge_text: 'FARM LOGISTICS',
    headline: 'Free temperature-controlled cold packing on all orders above ₦25,000',
    subtext: 'Perishable freshness guarantee with direct courier dispatch',
    cta_label: 'Explore Catalog',
    cta_url: '/products',
    theme_color: 'blue',
    is_active: true,
    display_order: 3,
    expires_at: null,
  },
];
