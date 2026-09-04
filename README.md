# ⚡ 1Fi EMI Platform — Electronics & Smart Financing E-Commerce

A modern, high-performance E-Commerce platform built with **Next.js 16 (Turbopack)**, **React 19**, **MongoDB**, **Redis**, and **Razorpay**. The platform combines a catalog for consumer electronics and lifestyle products with a **flexible No-Cost & Low-Interest EMI Financing Engine** backed by financial/mutual fund partners.

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [💳 EMI & Financing Engine](#-emi--financing-engine)
  - [Fixed EMI Plans & Tenures](#fixed-emi-plans--tenures)
  - [EMI Calculation Logic](#emi-calculation-logic)
  - [Instant EMI Quote API](#instant-emi-quote-api)
- [Tech Stack](#-tech-stack)
- [Architecture & Folder Structure](#-architecture--folder-structure)
- [Environment Variables](#-environment-variables)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Database Scripts & Seeding](#database-scripts--seeding)
  - [Running the Application](#running-the-application)
- [API Reference](#-api-reference)
- [Admin Management](#-admin-management)
- [Performance & Optimization](#-performance--optimization)

---

## 🌟 Overview

The **1Fi EMI Platform** enables customers to purchase electronics (Laptops, Smartphones, Audio, Cameras, Gaming, Tablets, and Accessories) with instant EMI breakdown and financial transparency. Customers can customize tenures, view real-time monthly installments, calculate total payables, and claim cashback rewards at checkout.

---

## ✨ Key Features

- 📱 **Dynamic Electronics Catalog**: Multi-variant products supporting SKU-level pricing, storage options, colors, and stock tracking.
- 🖼️ **Multi-Image Aggregation**: Complete retrieval and display of both top-level product images and variant-specific galleries.
- 🎯 **Advanced Shop UI**: Top category filter pill bar, responsive electronics price ranges, live search, and sorting.
- 💳 **Integrated EMI Financing Engine**: 0% No-Cost EMI and extended low-interest plans with instant quotes and partner cashback.
- 🔒 **Secure Payments**: Razorpay integration with server-side order generation and signature verification.
- 📦 **Order Management & Tracking**: Real-time order status tracking with automated email confirmations (Nodemailer).
- 🛠️ **Admin Management Suite**: Full control over products, variants, Cloudinary image uploads, bulk imports, and newsletters.
- ⚡ **Ultra-Fast Performance**: Multi-tier caching with Upstash Redis / Memory cache, optimized MongoDB indexes, and Next.js Turbopack.

---

## 💳 EMI & Financing Engine

The platform features an automated EMI calculation engine that dynamically computes monthly installments, interest rates, and total payable amounts for every variant based on principal price and tenure.

### Fixed EMI Plans & Tenures

| Tenure | Interest Rate | Plan Type | Cashback Benefit | Partner / Provider |
| :--- | :---: | :--- | :--- | :--- |
| **3 Months** | **0%** | No-Cost EMI | ₹7,500 Cashback | Mutual Funds Partner |
| **6 Months** | **0%** | No-Cost EMI | ₹7,500 Cashback | Mutual Funds Partner |
| **12 Months** | **0%** | No-Cost EMI | ₹7,500 Cashback | Mutual Funds Partner |
| **24 Months** | **0%** | No-Cost EMI | ₹7,500 Cashback | Mutual Funds Partner |
| **36 Months** | **10.5%** | Flexible Low-Interest | ₹5,000 Cashback | Mutual Funds Partner |
| **48 Months** | **10.5%** | Flexible Low-Interest | ₹5,000 Cashback | Mutual Funds Partner |
| **60 Months** | **10.5%** | Long-Term Flexible | ₹5,000 Cashback | Mutual Funds Partner |

> **Note**: Products can also override system defaults with custom per-variant EMI rules configured in MongoDB.

### EMI Calculation Logic

1. **Total Payable Calculation**:
   $$\text{Total Payable} = \begin{cases} \text{Principal} & \text{if Interest Rate} = 0\% \\ \text{round}\left(\text{Principal} \times \left(1 + \frac{\text{Rate}}{100}\right)\right) & \text{if Interest Rate} > 0\% \end{cases}$$

2. **Monthly Installment (EMI)**:
   $$\text{Monthly Installment} = \left\lceil \frac{\text{Total Payable}}{\text{Tenure (Months)}} \right\rceil$$

### Instant EMI Quote API

Generate instant EMI breakdowns for any product variant:

- **Endpoint**: `POST /api/electronics/emi/quote`
- **Request Body**:
  ```json
  {
    "productId": "66d8e20f1234567890abcdef",
    "variantSku": "LAP-MAC-M3-16-512-SG",
    "tenureMonths": 12
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "quote": {
      "productId": "66d8e20f1234567890abcdef",
      "productSlug": "macbook-pro-14-m3",
      "productName": "MacBook Pro 14 M3",
      "variantSku": "LAP-MAC-M3-16-512-SG",
      "variant": "16GB / 512GB SSD - Space Gray",
      "tenureMonths": 12,
      "monthlyAmount": 14167,
      "interestRate": 0,
      "cashbackAmount": 7500,
      "provider": "Mutual Funds Partner",
      "totalPayable": 169999
    }
  }
  ```

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16 (App Router + Turbopack)](https://nextjs.org/)
- **Frontend**: [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/), [Lucide React](https://lucide.dev/)
- **Database**: [MongoDB](https://www.mongodb.com/) with [Mongoose 8](https://mongoosejs.com/)
- **Caching**: [Upstash Redis](https://upstash.com/) & [IORedis](https://github.com/redis/ioredis)
- **Payment Gateway**: [Razorpay](https://razorpay.com/)
- **Media Storage**: [Cloudinary](https://cloudinary.com/) (`next-cloudinary`)
- **Email Service**: [Nodemailer](https://nodemailer.com/) (SMTP / Gmail)

---

## 📁 Architecture & Folder Structure

```
emi-platform/
├── app/                              # Next.js 16 App Router
│   ├── (auth)/                       # Authentication views
│   ├── about/                        # About page
│   ├── admin/                        # Admin Dashboard & product managers
│   │   ├── dashboard/                # Analytics & Metrics
│   │   ├── products/                 # Product CRUD, new, edit, bulk upload
│   │   └── cache/                    # Redis cache manager
│   ├── api/                          # Serverless Route Handlers
│   │   ├── admin/                    # Admin API endpoints
│   │   ├── electronics/              # Electronics & EMI Quote APIs
│   │   │   ├── emi/quote/            # Real-time EMI Quote endpoint
│   │   │   └── products/             # Category & Slug-based electronics endpoints
│   │   ├── orders/                   # Order placement & lookup
│   │   ├── payment/                  # Razorpay order & signature verification
│   │   └── products/                 # Core product list & detail endpoints
│   ├── product/[id]/                 # Product detail page & interactive EMI selector
│   ├── shop/                         # Catalog page with filters & search
│   ├── cart/ & checkout/             # Shopping cart & payment flow
│   └── my-orders/ & track/           # Customer order tracking
├── components/                       # Reusable UI components
│   ├── emi-calculator.tsx            # Interactive EMI tenure & savings calculator
│   ├── product-card.tsx              # Product display card with badges & pricing
│   ├── navbar.tsx & footer.tsx       # Header, mobile navigation & footer
│   └── ui/                           # Base UI components (Radix + Tailwind)
├── lib/                              # Core utilities & connectors
│   ├── emi.ts                        # EMI rules, monthly amount & total payable math
│   ├── mongodb.ts                    # Cached MongoDB connection pool
│   ├── razorpay.ts                   # Razorpay client & order creator
│   ├── redis.ts & cache.ts           # Redis caching & fallback mechanism
│   ├── email.ts                      # Nodemailer templates & dispatchers
│   └── cloudinary.ts                 # Cloudinary image upload config
├── models/                           # Mongoose schema definitions
│   ├── ElectronicsProduct.ts         # Electronics model with multi-variant & EMI rules
│   ├── Product.ts                    # Base product model
│   └── Order.ts                      # Order schema with EMI payment details
└── scripts/                          # DB migrations & seeding scripts
```

---

## 🔐 Environment Variables

Create a `.env` or `.env.local` file in the project root:

```env
# MongoDB Database
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/emiplatform?retryWrites=true&w=majority
MONGODB_DATABASE=emiplatform

# Razorpay Payments
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxx

# Redis / Upstash Cache (Optional for distributed caching)
UPSTASH_REDIS_REST_URL=https://xxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxxxxxxxxxxx
REDIS_URL=redis://default:xxxx@xxxx.upstash.io:6379

# Cloudinary (Product & Variant Image Uploads)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Nodemailer / Email Notifications
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=your-app-password
EMAIL_FROM=orders@wearon.com

# Admin Authentication
ADMIN_EMAIL=admin@wearon.com
ADMIN_PASSWORD=your_secure_password
JWT_SECRET=your_jwt_secret_key
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `v18.18.0` or higher (Node `v20+` recommended)
- **npm** or **pnpm** / **yarn**
- **MongoDB**: Local MongoDB instance or MongoDB Atlas URI

### Installation

```bash
# 1. Clone repository
git clone https://github.com/mohansiva58/1Fi_task.git
cd 1Fi_task

# 2. Install dependencies
npm install
```

### Database Scripts & Seeding

```bash
# Seed electronics catalog with variants and EMI plans
npm run db:seed-electronics

# Create optimized MongoDB indexes (name, category, price, slug)
npm run db:indexes

# Generate slugs for all products
npm run db:slugs
```

### Running the Application

```bash
# Start development server
npm run dev

# Run full production build
npm run build

# Start production server
npm run start
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📡 API Reference

### Products & Catalog

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/products` | Retrieve catalog products with filtering, search, pagination, and aggregated images |
| `GET` | `/api/products/:id` | Get product details by ID or Slug with variant and EMI data |
| `GET` | `/api/electronics/products` | Query electronics products by category, price, and specs |
| `GET` | `/api/electronics/products/:slug`| Lookup electronics product by unique SEO slug |

### EMI & Financing

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/electronics/emi/quote` | Generate an instant EMI quote with tenure, installment, and cashback breakdown |

### Orders & Payments

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/payment/create-order` | Create a Razorpay payment order for upfront or down-payment checkout |
| `POST` | `/api/payment/verify` | Verify Razorpay HMAC SHA256 payment signature and finalize order |
| `POST` | `/api/orders` | Record new order in database and dispatch confirmation emails |
| `GET` | `/api/orders/:id` | Retrieve customer order tracking details |

---

## 🛡️ Admin Management

Access the admin dashboard at `/admin/dashboard`:

- **Product Management** (`/admin/products`): Add new products, configure color and storage variants, upload images directly to Cloudinary, and adjust stock quantities.
- **Bulk Product Import** (`/admin/products/bulk`): Bulk CSV/JSON import for inventory batches.
- **Cache Management** (`/admin/cache`): Real-time Redis cache inspection and manual invalidation.
- **Newsletter Engine** (`/admin/newsletter`): Manage subscribers, export subscriber lists, and dispatch campaign emails.

---

## ⚡ Performance & Optimization

- **Turbopack Build Engine**: Extremely fast incremental builds and HMR.
- **Zero-Redundant Image Loading**: Aggregates and serves only valid, deduplicated image URLs across product listings.
- **Database Indexing**: Compound indexes on `(category, price, isActive)` and `slug` ensuring `< 15ms` query response times.
- **TTL Cache Layer**: Read endpoints automatically cached with 60s - 120s TTL to prevent database load spikes.

---

## 📄 License

This project is licensed under the MIT License.
