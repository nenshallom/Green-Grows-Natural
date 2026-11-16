export type AnnouncementTheme = 'emerald' | 'orange' | 'amber' | 'blue';

export interface StoreAnnouncement {
  id: string;
  badge_text: string;
  headline: string;
  subtext?: string | null;
  cta_label: string;
  cta_url: string;
  theme_color: AnnouncementTheme;
  is_active: boolean;
  display_order: number;
  expires_at?: string | null;
  created_at?: string;
  updated_at?: string;
}
