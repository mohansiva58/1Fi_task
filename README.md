# 1Fi EMI Platform

A full-stack electronics e-commerce application built for the 1Fi SDE1 assignment.

The application allows users to browse electronics, select product variants, view available EMI plans, confirm an EMI tenure, and complete payment through Razorpay. Product, variant, pricing, inventory, and EMI data are managed through backend APIs and MongoDB.

## Features

- Dynamic electronics product catalog
- Product variants with individual pricing, SKU, color, storage, and inventory
- Product detail pages with unique URLs
- Multiple EMI plans with different tenures and interest rates
- Dynamic EMI calculation based on the selected variant price
- EMI plan selection and confirmation before checkout
- Cashback information for applicable EMI plans
- Razorpay payment integration
- Server-side Razorpay order creation and payment verification
- Firebase authentication
- Redis caching for frequently accessed data
- MongoDB indexes for faster product retrieval
- API rate limiting
- Cloudinary CDN for product and variant images
- Admin product and inventory management
- Order creation and order tracking
- Responsive interface for desktop and mobile

---

## Tech Stack

### Frontend

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Framer Motion
- Lucide React

### Backend

- Next.js App Router
- Next.js Route Handlers
- REST APIs
- Node.js

### Database

- MongoDB
- Mongoose

### Authentication

- Firebase Authentication

### Caching

- Redis / Upstash Redis
- In-memory fallback where applicable

### Payments

- Razorpay

### Media

- Cloudinary CDN

### Email

- Nodemailer / SMTP

---

## Application Flow

```text
User
 │
 ├── Browse Products
 │
 ├── Select Product
 │
 ├── Select Variant
 │
 ├── View EMI Plans
 │
 ├── Select EMI Tenure
 │
 ├── Confirm EMI Plan
 │
 ├── Proceed to Payment
 │
 ├── Razorpay Checkout
 │
 └── Order Created
