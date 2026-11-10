# Group Campaign Mode — Pause & Resume Guide

This document records all changes made to put the **Group Campaign (Group Buy)** feature on hold, along with step-by-step instructions for resuming the feature whenever you are ready.

---

## Table of Contents
1. [Overview & Architecture](#1-overview--architecture)
2. [Files Created & Modified](#2-files-created--modified)
   - [Central Configuration](#21-central-configuration)
   - [Customer Storefront Files](#22-customer-storefront-files)
   - [Admin Command Center Files](#23-admin-command-center-files)
   - [Cart & Campaign Security](#24-cart--campaign-security)
3. [Summary of Behavioral Changes](#3-summary-of-behavioral-changes)
4. [How to Resume the Feature (Step-by-Step)](#4-how-to-resume-the-feature-step-by-step)
5. [Post-Resume Verification Checklist](#5-post-resume-verification-checklist)

---

## 1. Overview & Architecture

To avoid corrupting existing database tables or breaking past orders, the feature was paused using a **Centralized Feature Flag** architecture.

```
                    ┌────────────────────────────┐
                    │  src/config/features.ts    │
                    │   ENABLE_GROUP_BUY = false │
                    └─────────────┬──────────────┘
                                  │
         ┌────────────────────────┴────────────────────────┐
         ▼                                                 ▼
[ Admin Panel Updates ]                           [ Storefront Updates ]
• Product Form: Hide "Enable Group Campaign"     • Homepage: Hide GroupDeals section
• Dashboard: Hide Active Campaign Radar          • Catalog: Hide "Group Buy" filter
• Table: Show "Group Buy (Paused)" badge         • Product Page: Hide "Join Group" tab
• Orders: Preserve past group order history      • Mobile Drawer: Hide Group Purchase link
                                                 • Cart: Block legacy/stale group items
```

* **Zero Data Loss**: Database columns (`is_group_buy_enabled`, `group_buy_price`, `group_threshold`, etc.) remain intact.
* **Historical Integrity**: Past group buy orders remain visible in both the customer dashboard and the admin order management panel for fulfillment.
* **Instant Reversibility**: Re-enabling the feature requires changing a single boolean flag from `false` to `true`.

---

## 2. Files Created & Modified

### 2.1 Central Configuration

#### `src/config/features.ts` *(New File)*
Contains the master switch for application features:
```typescript
export const FEATURES = {
  /**
   * Group Buy Campaigns
   * Set to `true` to re-enable Group Buying across the storefront and admin panel.
   * Set to `false` to put the feature on hold.
   */
  ENABLE_GROUP_BUY: false,
} as const;
```

---

### 2.2 Customer Storefront Files

#### 1. `src/components/GroupDeals.tsx`
* **Change**: Added import of `FEATURES` and an early return guard:
  ```typescript
  if (!FEATURES.ENABLE_GROUP_BUY) return null;
  ```
* **Effect**: The "Best Group Deals for You!" section on the homepage is completely unmounted.

#### 2. `src/app/page.tsx`
* **Change**: Wrapped the `<GroupDeals />` component invocation:
  ```tsx
  {FEATURES.ENABLE_GROUP_BUY && <GroupDeals products={products} />}
  ```
* **Effect**: Prevents unnecessary data passing and rendering on the main landing page.

#### 3. `src/components/Navbar.tsx`
* **Change**: Wrapped the "Group Purchase" navigation link inside the mobile drawer:
  ```tsx
  {FEATURES.ENABLE_GROUP_BUY && (
    <Link href="/products?filter=Group+Buy" onClick={() => setIsMobileMenuOpen(false)} className="text-gray-600 font-medium">Group Purchase</Link>
  )}
  ```
* **Effect**: Mobile shoppers only see *Bulk Purchase* under the "Best Deals & Offers" menu.

#### 4. `src/app/products/ProductsClient.tsx`
* **Change 1 (URL Filter)**:
  ```typescript
  if (lower.includes('group') && FEATURES.ENABLE_GROUP_BUY) return 'Group Buy';
  ```
* **Change 2 (Product Filter)**:
  ```typescript
  if (activeFilter === 'Group Buy') return FEATURES.ENABLE_GROUP_BUY && product.is_group_buy_enabled;
  ```
* **Change 3 (Sidebar List)**:
  ```tsx
  {(FEATURES.ENABLE_GROUP_BUY ? ['Group Buy', 'Bulk Buy', 'Discount Offers'] : ['Bulk Buy', 'Discount Offers']).map((offer) => (...))}
  ```
* **Effect**: Removes "Group Buy" from the catalog sidebar and ignores direct URL queries (`?filter=Group+Buy`).

#### 5. `src/app/product/[id]/ProductClient.tsx`
* **Change 1 (Price Calculation)**:
  ```typescript
  if (FEATURES.ENABLE_GROUP_BUY && purchaseMode === 'group') return 'group';
  ```
* **Change 2 (Mode Switcher Tabs)**:
  ```tsx
  {FEATURES.ENABLE_GROUP_BUY && product.is_group_buy_enabled && (
    <div className="flex gap-2 mb-6">
      ...
      <button ...>Join Group Buy</button>
    </div>
  )}
  ```
* **Change 3 (Progress Tracker)**:
  ```tsx
  {purchaseMode === 'group' && FEATURES.ENABLE_GROUP_BUY && (
    <div className="mb-6 bg-[#7BA69D]/10 ...">...</div>
  )}
  ```
* **Effect**: Customers can only purchase produce in Standard or Bulk Wholesale mode.

#### 6. `src/components/BestDeals.tsx`
* **Change**: Updated promotional deal badges on strikethrough sale items:
  ```tsx
  {(product.is_bulk_buy_enabled || (FEATURES.ENABLE_GROUP_BUY && product.is_group_buy_enabled)) && (
    <p ...>
      {product.is_bulk_buy_enabled && (FEATURES.ENABLE_GROUP_BUY && product.is_group_buy_enabled)
        ? "Bulk & Group Buy Available"
        : product.is_bulk_buy_enabled
          ? "Bulk Buy Available"
          : "Group Buy Available"}
    </p>
  )}
  ```
* **Effect**: Sale items only advertise "Bulk Buy Available" while group buying is paused.

---

### 2.3 Admin Command Center Files

#### 1. `src/app/admin/products/page.tsx`
* **Change 1 (Product Creation/Edit Form)**:
  Wrapped the entire group campaign configuration block with `{FEATURES.ENABLE_GROUP_BUY && (...)}`:
  * Group share price input.
  * Target buyers needed input.
  * Campaign deadline datetime picker.
* **Change 2 (Inventory Table)**:
  Replaced the active campaign progress bar and participant modal button with a clean badge:
  ```tsx
  {!FEATURES.ENABLE_GROUP_BUY && isGroupActive && (
    <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-[10px] font-bold">
      Group Buy (Paused)
    </span>
  )}
  ```
* **Effect**: Prevents administrators from launching new campaigns while keeping saved configurations visible as paused.

#### 2. `src/app/admin/AdminDashboardClient.tsx`
* **Change**: Wrapped the "Active Campaign Radar" widget in `{FEATURES.ENABLE_GROUP_BUY && (...)}` and expanded the "Live Operations Feed" to full grid width:
  ```tsx
  <div className={`grid grid-cols-1 ${FEATURES.ENABLE_GROUP_BUY ? 'lg:grid-cols-3' : 'lg:grid-cols-1'} gap-6`}>
    <div className={`${FEATURES.ENABLE_GROUP_BUY ? 'lg:col-span-2' : 'lg:col-span-1'} bg-white ...`}>
      {/* Live Operations Feed */}
    </div>
    {FEATURES.ENABLE_GROUP_BUY && (
      <div className="bg-white ...">
        {/* Active Campaign Radar */}
      </div>
    )}
  </div>
  ```
* **Effect**: Removes the empty campaign radar from the admin dashboard and neatly expands the operations log.

---

### 2.4 Cart & Campaign Security

#### `src/lib/campaign.ts`
* **Change**: Added a pre-flight cart guard in `validateGroupBuyCart`:
  ```typescript
  // If group buy is globally disabled, block legacy or cached cart items
  if (!FEATURES.ENABLE_GROUP_BUY) {
    return {
      valid: false,
      error: 'Group buying is temporarily on hold. Please remove group items from your cart to continue.',
    };
  }
  ```
* **Effect**: If a customer has a stale group item stored in their browser's `localStorage` from an earlier visit, the system blocks checkout and displays a friendly notice.

---

## 3. Summary of Behavioral Changes

| Area | When `ENABLE_GROUP_BUY: false` (Current) | When `ENABLE_GROUP_BUY: true` (Resumed) |
|---|---|---|
| **Landing Page** | Group deals section is hidden | Group deals section displays live campaign progress |
| **Mobile Drawer** | "Group Purchase" link is hidden | "Group Purchase" link is visible |
| **Catalog Sidebar** | Only "Bulk Buy" & "Discount Offers" are shown | "Group Buy" filter button is visible |
| **Product Detail** | Only Standard & Bulk quantity modes | Dual switcher with "Join Group Buy" tab |
| **Cart & Checkout** | Stale group items are rejected | Group buys allowed with Paystack-only enforcement |
| **Admin Product Form** | "Enable Group Campaign" block is hidden | "Enable Group Campaign" block is visible |
| **Admin Product Table** | Shows `Group Buy (Paused)` tag | Shows live progress bar, participants button & restart trigger |
| **Admin Dashboard** | Operations feed is full width; Radar hidden | 2-column layout with Active Campaign Radar |
| **Admin Orders** | Past group orders remain fully accessible | Full group order filtering and management |

---

## 4. How to Resume the Feature (Step-by-Step)

When you are ready to re-activate Group Campaign Mode, follow these steps:

### Step 1: Open the Feature Flag File
Open `src/config/features.ts` in your code editor.

### Step 2: Flip the Flag to `true`
Change line 11 from `false` to `true`:

```typescript
// src/config/features.ts

export const FEATURES = {
  /**
   * Group Buy Campaigns
   * Set to `true` to re-enable Group Buying across the storefront and admin panel.
   * Set to `false` to put the feature on hold.
   */
  ENABLE_GROUP_BUY: true, // <-- CHANGE THIS TO TRUE
} as const;
```

### Step 3: Deploy or Restart the Application
* If running locally: Next.js will hot-reload automatically.
* If in production: Deploy the commit to your hosting platform (e.g., Vercel, Railway, etc.).

---

## 5. Post-Resume Verification Checklist

After flipping the flag to `true`, verify the following:

- [ ] **Homepage**: Scroll down and confirm the **"Best Group Deals for You!"** section appears.
- [ ] **Mobile Drawer**: Open the menu on mobile and confirm **"Group Purchase"** is present under *Best Deals & Offers*.
- [ ] **Catalog Page (`/products`)**: Confirm **"Group Buy"** appears in the *Special Offers* sidebar.
- [ ] **Product Page (`/product/[id]`)**: View a product with group buy enabled and confirm the **"Join Group Buy"** mode tab is active.
- [ ] **Admin Products (`/admin/products`)**: Click "+ Add New Product" and confirm the **"Enable Group Campaign"** section is present.
- [ ] **Admin Dashboard (`/admin`)**: Confirm the **"Active Campaign Radar"** widget is visible next to the Live Operations Feed.
- [ ] **Cart & Checkout**: Add a group buy item to cart and confirm it transitions smoothly to Paystack payment.

---

*Document created for the Green Grown Natural (GGN) Agro Platform.*

