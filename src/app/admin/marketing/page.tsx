'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';
import { StoreAnnouncement, AnnouncementTheme } from '@/types';
import { DEFAULT_ANNOUNCEMENTS } from '@/config/defaultAnnouncements';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiClock,
  FiCheck,
  FiX,
  FiCopy,
  FiExternalLink,
  FiEye,
  FiArrowRight,
  FiHelpCircle,
  FiCheckCircle,
} from 'react-icons/fi';

const THEME_OPTIONS: { id: AnnouncementTheme; label: string; desc: string; badgeClass: string }[] = [
  { id: 'orange', label: 'Terracotta (Sale/Discounts)', desc: 'Best for Flash Sales & Urgent Discounts', badgeClass: 'bg-[#C05E44] text-white' },
  { id: 'emerald', label: 'Midnight Pine', desc: 'Best for Fresh Harvests & Organic Produce', badgeClass: 'bg-[#0F3024] text-white' },
  { id: 'amber', label: 'Harvest Amber', desc: 'Best for Seasonal Drops & Tuber Batches', badgeClass: 'bg-amber-700 text-white' },
  { id: 'blue', label: 'Cool Blue', desc: 'Best for Logistics, Delivery & Support Perks', badgeClass: 'bg-sky-700 text-white' },
];

const SQL_SETUP_SCRIPT = `-- 1. Create the store_announcements table
CREATE TABLE IF NOT EXISTS public.store_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  badge_text TEXT NOT NULL DEFAULT 'FLASH SALE',
  headline TEXT NOT NULL,
  subtext TEXT,
  cta_label TEXT NOT NULL DEFAULT 'Shop Deal',
  cta_url TEXT NOT NULL DEFAULT '/products',
  theme_color TEXT NOT NULL DEFAULT 'emerald',
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 1,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.store_announcements ENABLE ROW LEVEL SECURITY;

-- 3. Allow public read access for storefront visitors
CREATE POLICY "Allow public read access to announcements"
ON public.store_announcements FOR SELECT
USING (true);

-- 4. Allow authenticated admins full management access
CREATE POLICY "Allow authenticated users full access to announcements"
ON public.store_announcements FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');`;

export default function AdminMarketingPage() {
  const { toast } = useToast();

  const [announcements, setAnnouncements] = useState<StoreAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Form Fields
  const [badgeText, setBadgeText] = useState('FLASH SALE');
  const [headline, setHeadline] = useState('');
  const [subtext, setSubtext] = useState('');
  const [ctaLabel, setCtaLabel] = useState('Shop Deal');
  const [ctaUrl, setCtaUrl] = useState('/products');
  const [themeColor, setThemeColor] = useState<AnnouncementTheme>('orange');
  const [hasCountdown, setHasCountdown] = useState(false);
  const [expiresAt, setExpiresAt] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [displayOrder, setDisplayOrder] = useState(1);
  const [saving, setSaving] = useState(false);

  // Fetch Announcements
  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('store_announcements')
        .select('*')
        .order('display_order', { ascending: true });

      if (data && data.length > 0 && !error) {
        setAnnouncements(data as StoreAnnouncement[]);
      } else {
        // Fallback to local storage or defaults
        const saved = localStorage.getItem('ggn_admin_announcements');
        if (saved) {
          try {
            setAnnouncements(JSON.parse(saved));
          } catch {
            setAnnouncements(DEFAULT_ANNOUNCEMENTS);
          }
        } else {
          setAnnouncements(DEFAULT_ANNOUNCEMENTS);
        }
      }
    } catch {
      setAnnouncements(DEFAULT_ANNOUNCEMENTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  // Open Form for New Announcement
  const handleOpenNew = () => {
    setEditingId(null);
    setBadgeText('FLASH SALE');
    setHeadline('');
    setSubtext('');
    setCtaLabel('Shop Deal');
    setCtaUrl('/products');
    setThemeColor('orange');
    setHasCountdown(false);
    setExpiresAt('');
    setIsActive(true);
    setDisplayOrder(announcements.length + 1);
    setIsFormOpen(true);
  };

  // Open Form for Editing Existing Announcement
  const handleEdit = (item: StoreAnnouncement) => {
    setEditingId(item.id);
    setBadgeText(item.badge_text);
    setHeadline(item.headline);
    setSubtext(item.subtext || '');
    setCtaLabel(item.cta_label);
    setCtaUrl(item.cta_url);
    setThemeColor(item.theme_color);
    setHasCountdown(Boolean(item.expires_at));
    setExpiresAt(item.expires_at ? new Date(item.expires_at).toISOString().slice(0, 16) : '');
    setIsActive(item.is_active);
    setDisplayOrder(item.display_order);
    setIsFormOpen(true);
  };

  // Toggle Active directly from table
  const handleToggleActive = async (item: StoreAnnouncement) => {
    const updated = !item.is_active;
    const updatedList = announcements.map((a) => (a.id === item.id ? { ...a, is_active: updated } : a));
    setAnnouncements(updatedList);
    localStorage.setItem('ggn_admin_announcements', JSON.stringify(updatedList));

    try {
      await supabase.from('store_announcements').update({ is_active: updated }).eq('id', item.id);
      toast.success(`Announcement ${updated ? 'activated' : 'deactivated'} on storefront!`);
    } catch {
      toast.info(`Updated status in local preview`);
    }
  };

  // Delete Announcement
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this announcement banner?')) return;

    const filtered = announcements.filter((a) => a.id !== id);
    setAnnouncements(filtered);
    localStorage.setItem('ggn_admin_announcements', JSON.stringify(filtered));

    try {
      await supabase.from('store_announcements').delete().eq('id', id);
      toast.success('Announcement removed.');
    } catch {
      toast.info('Removed from local list.');
    }
  };

  // Save / Update Announcement
  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!headline.trim()) {
      toast.error('Please enter a promotion headline.');
      return;
    }

    setSaving(true);
    const finalExpiresAt = hasCountdown && expiresAt ? new Date(expiresAt).toISOString() : null;

    const payload: Partial<StoreAnnouncement> = {
      badge_text: badgeText.trim().toUpperCase(),
      headline: headline.trim(),
      subtext: subtext.trim() || null,
      cta_label: ctaLabel.trim(),
      cta_url: ctaUrl.trim(),
      theme_color: themeColor,
      is_active: isActive,
      display_order: Number(displayOrder) || 1,
      expires_at: finalExpiresAt,
    };

    try {
      if (editingId && !editingId.startsWith('default-')) {
        // Update in Supabase
        const { error } = await supabase
          .from('store_announcements')
          .update(payload)
          .eq('id', editingId);

        if (error) throw error;
        toast.success('Announcement updated in database!');
      } else {
        // Create in Supabase
        const { data, error } = await supabase
          .from('store_announcements')
          .insert([payload])
          .select()
          .single();

        if (error) throw error;
        toast.success('New announcement published to storefront!');
      }
      setIsFormOpen(false);
      fetchAnnouncements();
    } catch (err) {
      console.warn('Supabase store_announcements write failed, saving locally:', err);
      // Fallback local update
      if (editingId) {
        const updated = announcements.map((a) =>
          a.id === editingId ? ({ ...a, ...payload } as StoreAnnouncement) : a
        );
        setAnnouncements(updated);
        localStorage.setItem('ggn_admin_announcements', JSON.stringify(updated));
      } else {
        const newItem: StoreAnnouncement = {
          id: `local-${Date.now()}`,
          ...(payload as Omit<StoreAnnouncement, 'id'>),
        };
        const updated = [...announcements, newItem];
        setAnnouncements(updated);
        localStorage.setItem('ggn_admin_announcements', JSON.stringify(updated));
      }
      setIsFormOpen(false);
      toast.success('Saved to local storefront preview!');
    } finally {
      setSaving(false);
    }
  };

  // Copy SQL script to clipboard
  const handleCopySql = () => {
    navigator.clipboard.writeText(SQL_SETUP_SCRIPT);
    setCopiedSql(true);
    toast.success('SQL migration script copied to clipboard!');
    setTimeout(() => setCopiedSql(false), 3000);
  };

  // Preset Date Helper Buttons
  const setCountdownPreset = (hours: number) => {
    const d = new Date(Date.now() + hours * 60 * 60 * 1000);
    setExpiresAt(d.toISOString().slice(0, 16));
    setHasCountdown(true);
  };

  return (
    <div className="space-y-6">
      {/* =========================================================
          1. HEADER & TOP ACTIONS
      ========================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <span>📢 Storefront Marketing & Banners</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Control the dynamic promotional bar, flash deals, seasonal crop drops, and live countdown timers on the homepage navbar.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsSqlModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition-colors cursor-pointer"
          >
            <FiHelpCircle className="w-3.5 h-3.5" />
            <span>Database Setup (SQL)</span>
          </button>

          <button
            type="button"
            onClick={handleOpenNew}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold text-xs transition-colors shadow-sm cursor-pointer"
          >
            <FiPlus className="w-4 h-4" />
            <span>New Promotion</span>
          </button>
        </div>
      </div>

      {/* =========================================================
          2. SUMMARY METRICS CARDS
      ========================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Campaigns</p>
          <p className="text-2xl font-black text-gray-900 mt-1">{announcements.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Active on Homepage</p>
          <p className="text-2xl font-black text-emerald-700 mt-1">
            {announcements.filter((a) => a.is_active).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <p className="text-xs font-bold text-[#C05E44] uppercase tracking-wider">Countdowns Running</p>
          <p className="text-2xl font-black text-[#C05E44] mt-1">
            {announcements.filter((a) => a.is_active && a.expires_at && new Date(a.expires_at).getTime() > Date.now()).length}
          </p>
        </div>
      </div>

      {/* =========================================================
          3. PROMOTIONS TABLE
      ========================================================= */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900">Current Promotions Ticker Queue</h2>
          <span className="text-xs text-gray-400">Rotates every 4.5s on the Homepage</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading promotions...</div>
        ) : announcements.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500 font-medium text-sm">No promotions created yet.</p>
            <button
              onClick={handleOpenNew}
              className="mt-3 text-xs font-bold text-green-600 hover:underline"
            >
              + Create your first promotional announcement
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-700">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Order</th>
                  <th className="py-3 px-4">Badge & Theme</th>
                  <th className="py-3 px-4">Headline / Message</th>
                  <th className="py-3 px-4">Action Button</th>
                  <th className="py-3 px-4">Timer Status</th>
                  <th className="py-3 px-4">Active</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {announcements.map((item) => {
                  const hasTimer = Boolean(item.expires_at);
                  const isExpired = hasTimer && new Date(item.expires_at!).getTime() <= Date.now();

                  return (
                    <tr key={item.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-gray-500">{item.display_order}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            item.theme_color === 'orange'
                              ? 'bg-[#C05E44] text-white'
                              : item.theme_color === 'emerald'
                              ? 'bg-[#0F3024] text-white'
                              : item.theme_color === 'amber'
                              ? 'bg-amber-700 text-white'
                              : 'bg-sky-700 text-white'
                          }`}
                        >
                          {item.badge_text}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="font-bold text-gray-900 truncate">{item.headline}</p>
                        {item.subtext && <p className="text-[11px] text-gray-400 truncate">{item.subtext}</p>}
                      </td>
                      <td className="py-3.5 px-4">
                        <Link
                          href={item.cta_url}
                          target="_blank"
                          className="inline-flex items-center gap-1 font-bold text-green-700 hover:underline"
                        >
                          <span>{item.cta_label}</span>
                          <FiExternalLink className="w-3 h-3 text-gray-400" />
                        </Link>
                      </td>
                      <td className="py-3.5 px-4">
                        {hasTimer ? (
                          isExpired ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full font-bold">
                              ⚠️ Expired
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-orange-800 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full font-bold">
                              <FiClock className="w-3 h-3" /> Running
                            </span>
                          )
                        ) : (
                          <span className="text-[11px] text-gray-400">Evergreen</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(item)}
                          className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                            item.is_active ? 'bg-green-600' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.75 transition-transform ${
                              item.is_active ? 'left-4.5' : 'left-1'
                            }`}
                          />
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(item)}
                            className="p-1.5 text-gray-500 hover:text-green-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                            title="Edit Promotion"
                          >
                            <FiEdit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Promotion"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =========================================================
          4. FORM MODAL (CREATE / EDIT)
      ========================================================= */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div
            className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-100 relative max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* CLOSE BUTTON */}
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors cursor-pointer"
            >
              <FiX className="w-4 h-4" />
            </button>

            <h2 className="text-xl font-black text-gray-900 mb-1">
              {editingId ? 'Edit Announcement Banner' : 'Create New Announcement Banner'}
            </h2>
            <p className="text-xs text-gray-500 mb-5">
              Configure the promotional copy, CTA link, theme color, and optional countdown timer.
            </p>

            <form onSubmit={handleSaveForm} className="space-y-4">
              {/* BADGE TEXT & DISPLAY ORDER */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Badge Title <span className="text-gray-400 font-normal">(e.g. FLASH SALE, NEW HARVEST)</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={badgeText}
                    onChange={(e) => setBadgeText(e.target.value)}
                    placeholder="FLASH SALE"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-bold uppercase tracking-wider text-gray-900 focus:border-green-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Display Order</label>
                  <input
                    type="number"
                    min="1"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-bold text-gray-900 focus:border-green-600 outline-none"
                  />
                </div>
              </div>

              {/* HEADLINE */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Main Headline / Promotion Copy <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="e.g. Mid-Week Farm Restock: 15% off fresh peppers & tomatoes!"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs text-gray-900 font-semibold focus:border-green-600 outline-none"
                />
              </div>

              {/* SUBTEXT (OPTIONAL) */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Subtext <span className="text-gray-400 font-normal">(Optional secondary description)</span>
                </label>
                <input
                  type="text"
                  value={subtext}
                  onChange={(e) => setSubtext(e.target.value)}
                  placeholder="e.g. Limited harvest batch picked fresh this morning"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs text-gray-700 focus:border-green-600 outline-none"
                />
              </div>

              {/* CTA LABEL & URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Action Button Text</label>
                  <input
                    type="text"
                    required
                    value={ctaLabel}
                    onChange={(e) => setCtaLabel(e.target.value)}
                    placeholder="Shop Deal"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-bold text-gray-900 focus:border-green-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Target Page URL</label>
                  <input
                    type="text"
                    required
                    value={ctaUrl}
                    onChange={(e) => setCtaUrl(e.target.value)}
                    placeholder="/products?category=Vegetables"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs text-gray-900 focus:border-green-600 outline-none"
                  />
                </div>
              </div>

              {/* THEME COLOR SELECTOR */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">Color Palette & Vibe</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {THEME_OPTIONS.map((theme) => (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setThemeColor(theme.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        themeColor === theme.id
                          ? 'border-green-600 bg-green-50/60 ring-2 ring-green-100'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider mb-1 ${theme.badgeClass}`}>
                        {theme.label}
                      </span>
                      <p className="text-[10px] text-gray-500 leading-tight">{theme.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* COUNTDOWN TIMER SECTION */}
              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200">
                <label className="flex items-center gap-2 cursor-pointer mb-2">
                  <input
                    type="checkbox"
                    checked={hasCountdown}
                    onChange={(e) => setHasCountdown(e.target.checked)}
                    className="rounded text-green-600 focus:ring-green-500 w-4 h-4 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                    <FiClock className="w-3.5 h-3.5 text-orange-600" />
                    <span>Attach Live Countdown Timer</span>
                  </span>
                </label>

                {hasCountdown && (
                  <div className="space-y-2 pt-2 border-t border-gray-200">
                    <label className="block text-xs font-medium text-gray-600">
                      Offer End Date & Time:
                    </label>
                    <input
                      type="datetime-local"
                      required={hasCountdown}
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono font-bold text-gray-800 focus:border-green-600 outline-none bg-white"
                    />

                    {/* QUICK PRESET BUTTONS */}
                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      <span className="text-[11px] text-gray-500 font-medium">Quick presets:</span>
                      <button
                        type="button"
                        onClick={() => setCountdownPreset(24)}
                        className="text-[10px] font-bold text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 px-2 py-0.5 rounded cursor-pointer"
                      >
                        +24 Hours
                      </button>
                      <button
                        type="button"
                        onClick={() => setCountdownPreset(48)}
                        className="text-[10px] font-bold text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 px-2 py-0.5 rounded cursor-pointer"
                      >
                        +48 Hours
                      </button>
                      <button
                        type="button"
                        onClick={() => setCountdownPreset(72)}
                        className="text-[10px] font-bold text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 px-2 py-0.5 rounded cursor-pointer"
                      >
                        +3 Days
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* ACTIVE TOGGLE */}
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded text-green-600 focus:ring-green-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs font-bold text-gray-900">
                  Publish and activate on Homepage Navbar
                </span>
              </label>

              {/* ===================================================
                  LIVE INTERACTIVE PREVIEW BOX
              =================================================== */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1">
                    <FiEye className="w-3.5 h-3.5 text-green-700" />
                    <span>Live Storefront Preview</span>
                  </span>
                  <span className="text-[10px] text-gray-400">Updates as you type</span>
                </div>

                <div
                  className={`p-3 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left relative overflow-hidden ${
                    themeColor === 'orange'
                      ? 'bg-orange-50 border-orange-200 text-orange-950'
                      : themeColor === 'emerald'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                      : themeColor === 'amber'
                      ? 'bg-amber-50 border-amber-200 text-amber-950'
                      : 'bg-sky-50 border-sky-200 text-sky-950'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        themeColor === 'orange'
                          ? 'bg-[#C05E44] text-white'
                          : themeColor === 'emerald'
                          ? 'bg-[#0F3024] text-white'
                          : themeColor === 'amber'
                          ? 'bg-amber-700 text-white'
                          : 'bg-sky-700 text-white'
                      }`}
                    >
                      {badgeText || 'BADGE'}
                    </span>
                    <span className="text-xs font-extrabold truncate max-w-xs">
                      {headline || 'Your promotion headline will appear here'}
                    </span>
                    {hasCountdown && (
                      <span className="text-[10px] font-mono font-bold bg-black/80 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                        <FiClock className="w-2.5 h-2.5 text-[#C05E44]" /> 02d : 14h : 36m : 45s
                      </span>
                    )}
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-[11px] font-bold text-white flex items-center gap-1 shadow-2xs whitespace-nowrap ${
                      themeColor === 'orange'
                        ? 'bg-[#C05E44]'
                        : themeColor === 'emerald'
                        ? 'bg-[#0F3024]'
                        : themeColor === 'amber'
                        ? 'bg-amber-800'
                        : 'bg-sky-700'
                    }`}
                  >
                    <span>{ctaLabel || 'Shop Deal'}</span>
                    <FiArrowRight className="w-3 h-3" />
                  </span>

                  {/* PREVIEW BOTTOM PROGRESS BAR */}
                  <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-black/10">
                    <div
                      className={`h-full ${
                        themeColor === 'orange'
                          ? 'bg-[#C05E44]'
                          : themeColor === 'emerald'
                          ? 'bg-[#0F3024]'
                          : themeColor === 'amber'
                          ? 'bg-amber-700'
                          : 'bg-sky-700'
                      }`}
                      style={{ width: '60%' }}
                    />
                  </div>
                </div>
              </div>

              {/* FORM SUBMISSION BUTTONS */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-gray-500 hover:text-gray-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-lg text-xs font-bold bg-green-600 hover:bg-green-700 text-white shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Publishing...' : editingId ? 'Update Promotion' : 'Publish to Storefront'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          5. SQL SETUP HELPER MODAL
      ========================================================= */}
      {isSqlModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div
            className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-gray-100 relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsSqlModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors cursor-pointer"
            >
              <FiX className="w-4 h-4" />
            </button>

            <h2 className="text-lg font-black text-gray-900 mb-1">
              Supabase SQL Table Setup
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              To store announcements directly in PostgreSQL, copy and run this script in your Supabase SQL Editor.
            </p>

            <div className="relative mb-4">
              <pre className="p-3 bg-gray-900 text-green-400 font-mono text-[11px] rounded-xl overflow-x-auto max-h-60 leading-relaxed border border-gray-800">
                {SQL_SETUP_SCRIPT}
              </pre>

              <button
                type="button"
                onClick={handleCopySql}
                className="absolute top-2 right-2 px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                {copiedSql ? <FiCheckCircle className="w-3.5 h-3.5" /> : <FiCopy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? 'Copied!' : 'Copy SQL'}</span>
              </button>
            </div>

            <p className="text-[11px] text-gray-400 leading-relaxed mb-4">
              Note: Even without running the SQL script, the banner system automatically works using built-in default templates and client synchronization!
            </p>

            <button
              type="button"
              onClick={() => setIsSqlModalOpen(false)}
              className="w-full py-2.5 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
