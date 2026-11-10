# GGN Agro Platform — Comprehensive Feature Specification

An enterprise-grade agricultural e-commerce platform built with Next.js (App Router), Supabase (PostgreSQL, Auth, Storage, RPC), Paystack, and Tailwind CSS. The platform offers multi-tiered purchasing models—including **Retail (Standard)**, **Bulk Wholesale**, and **Collaborative Group Buys**.

> [!NOTE]
> **Group Campaign Mode Status**: Temporarily on hold via application feature flag `FEATURES.ENABLE_GROUP_BUY = false` in [`src/config/features.ts`](src/config/features.ts). To resume the feature across the entire platform, flip the flag back to `true`.

---

## Table of Contents
1. [Admin Portal (Command Center & Back-Office)](#1-admin-portal-command-center--back-office)
   - [Security & Role-Based Access Control (RBAC)](#11-security--role-based-access-control-rbac)
   - [Executive Overview & Analytics Dashboard](#12-executive-overview--analytics-dashboard)
   - [Product & Inventory Manager](#13-product--inventory-manager)
   - [Orders & Logistics Fulfillment Center](#14-orders--logistics-fulfillment-center)
   - [Customer Relationship Management (CRM)](#15-customer-relationship-management-crm)
2. [Customer Storefront & User Experience](#2-customer-storefront--user-experience)
   - [Interactive Navigation & Header](#21-interactive-navigation--header)
   - [Landing Page & Merchandising Showcase](#22-landing-page--merchandising-showcase)
   - [Product Catalog & Search System](#23-product-catalog--search-system)
   - [Product Details & Purchase Modes](#24-product-details--purchase-modes)
   - [Shopping Cart & Anti-Fraud Engine](#25-shopping-cart--anti-fraud-engine)
   - [Checkout & Payment Infrastructure](#26-checkout--payment-infrastructure)
   - [Resilient Paystack Webhook Handler](#27-resilient-paystack-webhook-handler)
   - [Customer Dashboard & Order Tracking](#28-customer-dashboard--order-tracking)
   - [Customer Authentication & Account Recovery](#29-customer-authentication--account-recovery)
3. [Technology Stack & Architectural Highlights](#3-technology-stack--architectural-highlights)

---

## 1. Admin Portal (Command Center & Back-Office)

The administrative control center is located under `/admin` and provides complete visibility and management over operations, finance, inventory, logistics, and customer retention.

```
/admin
├── layout.tsx                # Security guard & persistent sidebar navigation
├── page.tsx                  # Server-side parallel metrics fetcher
├── AdminDashboardClient.tsx  # Executive charts, KPIs & live feed
├── products/page.tsx         # Product CRUD, tiered pricing & image management
├── orders/page.tsx           # Order fulfillment, filters & bulk status updates
└── customers/page.tsx        # CRM, customer lifetime value & audience exports
/admin-login/page.tsx         # Isolated admin authentication backdoor
```

---

### 1.1 Security & Role-Based Access Control (RBAC)

* **Dedicated Admin Backdoor (`/admin-login`)**:
  * Isolated login screen reserved for authorized personnel only.
  * Direct authentication check verifying either `app_metadata.role === 'admin'` or `user_metadata.role === 'admin'`.
  * If a non-admin signs in through this backdoor, the session is immediately invalidated (`signOut()`) and access is blocked with a security warning.
* **Layout-Level Security Guard (`src/app/admin/layout.tsx`)**:
  * Protects every sub-route under `/admin/*`.
  * **Rule 1 (Unauthenticated)**: Users without an active session are instantly redirected to `/admin-login`.
  * **Rule 2 (Unauthorized)**: Authenticated users lacking admin roles are redirected back to the customer storefront (`/`).
  * **Rule 3 (Authorized)**: Renders the command center sidebar and content area.
* **Secure Session Termination**: Dedicated "Log Out Securely" button directly inside the admin sidebar.

---

### 1.2 Executive Overview & Analytics Dashboard

* **Parallel Server-Side Data Fetching (`src/app/admin/page.tsx`)**:
  * Utilizes `Promise.all` to query `orders`, `products`, and `admin_notifications` concurrently.
  * Marked with `export const dynamic = 'force-dynamic'` to ensure analytics are always fresh and un-cached.
* **Executive KPI Metric Cards**:
  * **Verified Revenue (₦)**: Total amount collected exclusively from verified `paid` orders.
  * **Paid Orders Count**: Total volume of successfully completed purchases.
  * **Average Order Value (AOV)**: Revenue divided by paid order count, formatted in Nigerian Naira.
* **Global Timeframe Filter**:
  * Top-level selector filtering data across: **Today**, **Last 7 Days**, **Last 30 Days**, **Last 90 Days**, **Past Year**, and **All Time**.
* **Interactive Data Visualizations (Powered by Recharts)**:
  * **Revenue Velocity (Area Chart)**:
    * Displays revenue growth over time with gradient fill and tooltips.
    * Independent period toggles (**7 Days**, **30 Days**, **This Year**) with intelligent calendar grouping.
  * **Revenue by Payment Method (Donut Chart)**:
    * Compares volume and value between **Paystack (Online)** and **Offline Bank Transfer**.
  * **Fulfillment & Logistics Status (Horizontal Bar Chart)**:
    * Color-coded progress distribution across shipment stages (*Delivered*, *Delayed*, *Pending Delivery*, *Processing*, *Cancelled*).
* **Live Operations Activity Feed**:
  * Real-time stream with relative time badges (`Just now`, `5m ago`, `2h ago`) tracking system events:
    * 🤝 Group buy slot joins.
    * ✅ Group buy campaign completions.
    * 📦 Large bulk orders.
* **Active Campaign Radar**:
  * Live monitoring of running group buys displaying product image, target threshold, joined buyers count, and a dynamic progress bar highlighting campaigns that reached target.

---

### 1.3 Product & Inventory Manager

* **Complete Inventory CRUD Operations (`src/app/admin/products/page.tsx`)**:
  * Create, edit, and permanently delete produce listings.
  * Collapsible in-page sliding form with validation.
* **Granular Multi-Tiered Pricing Engine**:
  * **Standard Pricing**: Base retail price, unit of measurement (*kg*, *bag*, *pack*, *bunch*, *crate*, *unit/item*), and available inventory stock count.
  * **Promotional Discount (Original Price)**: Optional strikethrough price that automatically calculates discount percentages and triggers the red `SALE` badge across the storefront.
  * **Bulk Purchase Mode**:
    * Checkbox toggle to activate wholesale pricing.
    * Configurable discounted bulk unit price.
    * Minimum order quantity (threshold) required to unlock the bulk price.
  * **Group Buy Campaign Mode**:
    * Checkbox toggle to activate collaborative group buying.
    * Fractional slot share price.
    * Target number of buyers needed to confirm the bulk harvest.
    * Campaign deadline date & time picker.
* **Image Management & Storage Rollback Mechanism**:
  * Uploads to Supabase Storage bucket (`product-images`).
  * Supports 1 primary product image plus multiple gallery images.
  * Interactive previews with single-click remove buttons.
  * **Storage Cleanup on Delete**: Deleting a product automatically purges its primary image and all gallery images from Supabase Storage.
  * **Transaction Rollback Protection**: If a database write fails during product creation or update, any newly uploaded files are automatically deleted from storage to eliminate orphaned assets.
* **Active Campaign Management**:
  * Group buy progress indicator on each product row.
  * **Campaign Restart Trigger**: One-click action to reset buyer count to `0` and clear the deadline to initiate a fresh campaign cycle once the previous goal was satisfied.
  * **Campaign CRM Participant Modal**:
    * Inspect all buyers in an active group campaign.
    * Displays participant name, email link, phone number, joined date, order ID, and payment status.
    * Fast action button to contact or notify participants.

---

### 1.4 Orders & Logistics Fulfillment Center

* **Advanced Multi-Field Search Engine (`src/app/admin/orders/page.tsx`)**:
  * Real-time searching across tracking numbers, customer names, contact phone numbers, emails, and individual produce items contained within each order.
* **Multi-Dimensional Filtering**:
  * **Purchase Type**: *All Orders*, *Group Buys*, *Bulk Buys*, *Standard*.
  * **Payment Method**: *All*, *Paystack*, *Offline*.
  * **Delivery Status**: *All*, *Pending*, *Processing*, *Delayed*, *Delivered*.
  * **Date Range**: *All Dates*, *Today*, *Past Week*, *Past Month*, *Past 6 Months*, *Past Year*.
  * **Sorting**: *Newest First*, *Oldest First*, *Highest Value*, *Lowest Value*.
* **Batch / Bulk Actions Engine**:
  * Master and individual row checkboxes for multi-order selection.
  * Floating command bar allowing 1-click status updates across all selected orders (*Processing*, *Mark Delivered*, *Cancel*).
* **Order Management & Logistics Modal**:
  * **Financial Status Toggle**: Verify manual offline bank transfers (*Mark PAID*) or revert back to *Pending*.
  * **Fulfillment State Machine**: One-click updates to transition orders between *Processing*, *Delivered ✓*, *Delayed*, and *Cancelled*.
  * **Customer Manifest**: Full delivery address, landmark, state, LGA, primary phone, and alternate emergency phone number.
  * **Line-Item Cargo Breakdown**: Itemized list displaying product title, unit price, quantity, purchase model badge, and computed totals.
* **Export Orders to CSV**:
  * Exports currently filtered order views with UTF-8 BOM encoding for clean rendering in Microsoft Excel and Google Sheets.
  * Includes customer contact info, complete shipping addresses, tracking numbers, and concatenated lists of purchased products.

---

### 1.5 Customer Relationship Management (CRM)

* **Unified Account Aggregation (`src/app/admin/customers/page.tsx`)**:
  * Executes Supabase RPC (`get_all_users_for_admin`) to combine registered authentication users with guest checkout records into a consolidated CRM directory.
* **Audience Segmentation**:
  * 🎯 **Leads**: Registered users who have placed 0 orders.
  * 🛍️ **First-Timers**: Customers with exactly 1 order.
  * 🔄 **Regulars**: Returning customers with 2 to 5 orders.
  * ⭐ **VIPs**: High-volume shoppers with 6 or more orders.
* **Customer Value Metrics**:
  * Computes individual **Lifetime Value (LTV)** from verified paid transactions.
  * Tracks total order count, account creation date, and last active date.
* **Customer Profile Deep-Dive Modal**:
  * Customer initial avatar, account tenure, LTV, and direct communication links (`mailto:` and `tel:`).
  * Filterable purchase history (*All*, *Paystack*, *Offline*).
  * Expandable line-item accordion allowing administrators to inspect the exact cargo/produce items ordered in each past transaction.
* **Spreadsheet Audience Export (CSV)**:
  * One-click CSV export tagged by audience segment (e.g., `ggn_customers_vips_2026-11-04.csv`), enabling immediate upload to email and SMS marketing platforms.

---

## 2. Customer Storefront & User Experience

The customer storefront is optimized for rapid produce discovery, multiple buying models, responsive mobile browsing, and secure payment processing.

---

### 2.1 Interactive Navigation & Header

* **Permanent Stagnant Search Bar & Anchored Brand Logo (`src/components/Navbar.tsx`)**:
  * Clean, 3-zone desktop layout featuring permanently visible brand identity (logo mark and title text), a centered stagnant search input bar with active query clearing (`✕`), and a dedicated actions cluster (cart & account).
* **Scroll-Spy Navigation**:
  * Automatically tracks the customer's viewport and highlights navigation items (*Home*, *Offers & Deals*, *Categories*, *FAQ*, *Contact*) as they scroll down the page.
* **Live Dynamic Cart Trigger**:
  * Displays a live badge with the total item count.
  * Triggers a spring-animated slide-over cart modal.
* **Auth-Aware Navigation**:
  * Automatically detects login state and switches navigation routes: logged-in customers are directed to `/dashboard`, while guests are directed to `/login`.
* **Off-Canvas Mobile Navigation Drawer**:
  * Left-sliding full drawer on mobile devices with quick access to top categories, deals, order history, and direct phone/email customer support links.
* **Smart Route Visibility**:
  * Automatically unmounts navigation during checkout, authentication, and administrative views to maximize focus and conversion.

---

### 2.2 Landing Page & Merchandising Showcase

* **Hero Carousel (`src/components/Hero.tsx`)**:
  * Touch-gesture engine supporting natural touch swipes (left/right with a 50px threshold) on mobile devices.
  * Auto-sliding timer (2-second rotation) that automatically pauses on touch or desktop mouse hover.
  * Guarantee badges (*"100% Fresh Products Guaranteed"*).
* **Horizontal Category Pill Bar (`src/components/ShopByCategories.tsx`)**:
  * Minimalist, thin-bordered category chips displaying all active database categories (no 4-item cap).
  * Continuous horizontal scroll track (left-to-right swipe on mobile and smooth desktop arrow scroll controls).
  * Direct route links filtering the catalog by category.
* **Today's Best Deals (`src/components/BestDeals.tsx`)**:
  * Automatically scans the inventory and surfaces only products with active price discounts (`original_price > price_per_unit`).
  * Category filter tabs and dynamic percentage discount badges.
  * One-click "Quick Add" to cart with instant toast notification.
* **Bulk Purchase Deals (`src/components/BulkDeals.tsx`)**:
  * Merchandises items configured for wholesale buying.
  * Fire badge (`🔥 Min X`) displaying the required threshold volume.
  * Strikethrough price comparison demonstrating retail vs. wholesale unit savings.
* **Group Buy Deals (`src/components/GroupDeals.tsx`)**:
  * Merchandises active collective buying campaigns.
  * Visual progress tracker showing slots filled vs. campaign threshold.
  * Interactive "Join Group / Leave Group" toggle button that updates the cart directly.
* **Frequently Asked Questions Accordion (`src/components/FAQ.tsx`)**:
  * Interactive accordion detailing group buy mechanics, organic farm sourcing, wholesale volume requirements, delivery timelines, and the Freshness Guarantee.
* **Customer Testimonials (`src/components/Testimonials.tsx`)**:
  * Social proof carousel highlighting reviews from home cooks, restaurant owners, and group buyers.
* **Footer (`src/components/Footer.tsx`)**:
  * Brand summary, quick links, category navigation, social links, and customer support channels.

---

### 2.3 Product Catalog & Search System

* **Hero Video Header (`src/app/products/page.tsx`, `ProductsClient.tsx`)**:
  * Ambient HTML5 video header (`hero-vid.mp4`) showcasing farm produce.
* **Real-Time Keyword Search**:
  * Searches product names and categories simultaneously with instant updates.
* **Sidebar Filter Navigation**:
  * Filter by category (*All Products*, *Fruits*, *Grains*, *Vegetables*, *Tubers*, etc.).
  * Filter by deal type (*Group Buy*, *Bulk Buy*, *Discount Offers*).
* **Pagination & Navigation State Persistence**:
  * 12 products per page pagination.
  * Saves active category filters and page number into `sessionStorage`. When a user navigates to inspect a product and clicks "back", their exact page and filter state is restored.
* **Product Catalog Cards**:
  * Visual badges: Discount percentages, "Bulk Buy", "Group Buy", and "Out of Stock".
  * Quick-add buttons and direct links to product detail pages.

---

### 2.4 Product Details & Purchase Modes

* **Server-Rendered Pre-fetching (`src/app/product/[id]/page.tsx`, `ProductClient.tsx`)**:
  * Product and related items are fetched on the server before rendering; non-existent IDs automatically trigger Next.js 404 pages.
* **Multi-Image Gallery**:
  * Large image preview with thumbnail selector for viewing additional gallery photos.
* **Interactive Purchase Mode Switcher**:
  * **Standard & Bulk Buy Mode**: Incremental quantity selector with dynamic savings prompt (e.g., *"Add 3 more items to unlock bulk price at ₦X"*).
  * **Join Group Buy Mode**: Locks quantity strictly to 1 slot per user, displays active campaign progress, and disables selection if the campaign threshold is reached (*"Campaign Full"*).
* **Live Stock Count & Price Formatting**:
  * Color-coded stock availability indicators.
  * Instant recalculation of line totals based on selected quantity and purchase mode.
* **Related Products Section**: Automatically recommends other produce items belonging to the same category.

---

### 2.5 Shopping Cart & Anti-Fraud Engine

* **Persistent Global Cart Context (`src/context/CartContext.tsx`)**:
  * Synchronized with `localStorage` and protected by schema validation to prevent corrupt data.
  * Supports concurrent standard, bulk, and group buy line items in a single basket.
* **Interactive Cart Slide-Over Modal (`src/components/CartModal.tsx`)**:
  * Spring-animated entry and exit animations.
  * Real-time item count, quantity increment/decrement, and trash icon removal.
  * Pre-flight campaign check before routing to checkout.
* **Dedicated Full Cart Page (`src/app/cart/page.tsx`)**:
  * Full-width cart review with empty state animations, continue shopping link, and clear cart trigger.
* **Group Buy Anti-Fraud & Validation Engine (`src/lib/campaign.ts`)**:
  * **Authentication Gate**: Group buys strictly require a logged-in user account.
  * **Over-Subscription Defense**: Blocks checkout if the campaign reached its threshold between cart addition and payment.
  * **Single-Slot-Per-User Rule**: Inspects past orders in the active batch to ensure a user cannot purchase more than 1 slot in the same campaign cycle.

---

### 2.6 Checkout & Payment Infrastructure

* **Protected Checkout Flow (`src/app/checkout/CheckoutClient.tsx`)**:
  * Unauthenticated guests are automatically redirected to login before accessing the checkout form.
* **Customer Profile Auto-Fill**:
  * Automatically populates form fields with the user's saved defaults (names, email, phone, state, LGA, street address, and landmark).
* **Dual Payment Processing**:
  * **Paystack Online Payment**: Embedded payment popup (`react-paystack`) supporting debit cards, bank transfers, and USSD. Generates synchronized unique tracking references (`GGN-XXXXXXXX`).
  * **Offline Bank Transfer**: Allows direct bank transfer for standard and bulk orders with manual verification.
  * **Group Buy Enforcement**: Automatically disables offline bank transfer if any group buy item is present in the cart, enforcing instant online payment.
* **Atomic Database RPC Transaction (`process_checkout`)**:
  * Creates order record, inserts order items, decrements product stock quantities, increments group buy campaign counters, and triggers admin notifications in a single transaction.

---

### 2.7 Resilient Paystack Webhook Handler

* **Webhook Endpoint (`src/app/api/webhooks/paystack/route.ts`)**:
  * **HMAC-SHA512 Cryptographic Signature Verification**: Validates incoming payloads against `PAYSTACK_SECRET_KEY` to reject unauthorized requests.
  * **Idempotency Protection**: Checks if the order was already saved by the frontend to prevent duplicate processing.
  * **Browser-Crash Recovery**: If a customer's browser crashes or disconnects after payment, the webhook reads the metadata payload embedded in the Paystack transaction and automatically creates the order via `supabaseAdmin` service role.

---

### 2.8 Customer Dashboard & Order Tracking

* **Customer Portal (`src/app/dashboard/page.tsx`)**:
  * **Order History & Real-Time Logistics**:
    * Lists all past orders with tracking numbers, date timestamps, cargo items, total costs, and payment status badges.
    * Live delivery status indicators (*Pending Delivery*, *Processing*, *Delivered*).
  * **Delivery Address & Profile Management**:
    * Editable form allowing customers to update first name, last name, phone number, and default delivery address (street, state, LGA, landmark) for fast checkout.
  * **Security & Password Management**:
    * Update account password directly within the dashboard.
    * Account deactivation request option.
  * **Secure Logout**: Clears authentication tokens and redirects to the login screen.

---

### 2.9 Customer Authentication & Account Recovery

* **Authentication Portal (`src/app/login/page.tsx`)**:
  * **Multi-Provider Support**: Email & Password sign-in/sign-up and Google OAuth single sign-on (`signInWithOAuth`).
  * **Registration Profile Capture**: Collects full name, phone number, and date of birth during sign up.
  * **Password Visibility Toggles**: Interactive show/hide password buttons.
* **Self-Service Password Recovery (`src/app/update-password/page.tsx`)**:
  * Password reset link sent via Supabase Auth email service.
  * Dedicated password update interface allowing users to securely set new credentials.

---

## 3. Technology Stack & Architectural Highlights

| Layer | Technologies Used | Key Purpose |
|---|---|---|
| **Framework** | Next.js 16 (App Router), React 19, TypeScript | Server Components, dynamic SSR, nested layouts, Suspense |
| **Styling** | Tailwind CSS v4, Custom CSS Animations | Responsive design, cart bounce animations, morphing search |
| **Database & Auth** | Supabase (PostgreSQL, Auth, Storage, Edge RPC) | Real-time sessions, atomic checkout RPC, image storage |
| **Payment Gateway** | Paystack (`react-paystack`), Webhooks | Card, USSD, bank transfer, and automatic crash recovery |
| **Analytics & UI** | Recharts, React Icons, Context API | Interactive revenue charts, global cart & toast notifications |
| **Architecture** | Hybrid SSR/Client, Atomic DB Transactions | Speed, SEO, data integrity, anti-fraud campaign enforcement |

---

*Document generated for Green Grown Natural (GGN) Agro Platform.*

