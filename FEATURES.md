# APlus Cafe - Feature Tracker

## Current Status Overview

| Category       | Completion | Notes                          |
|----------------|------------|--------------------------------|
| Authentication | 100%       | Fully implemented              |
| Menu           | 100%       | Fully implemented              |
| Orders         | 100%       | Cancellation, re-order added   |
| Reservations   | 95%        | Minor enhancements possible    |
| Payments       | 100%       | PDF receipts added             |
| Delivery       | 95%        | Instructions added             |
| Admin          | 100%       | Analytics & reviews added      |
| Notifications  | 30%        | Email only, no push/SMS        |

---

## Completed Features

### Authentication & Security
- [x] User registration with email verification
- [x] Login with JWT tokens & refresh tokens
- [x] Two-Factor Authentication (2FA/TOTP) with QR codes
- [x] Password reset via email
- [x] Role-based access (USER, ADMIN)

### User Management
- [x] User profile (view/edit name, phone)
- [x] Save delivery address with GPS coordinates
- [x] Multiple saved addresses
- [x] Admin: toggle user active/inactive

### Menu Management
- [x] Browse menu items by category
- [x] Search functionality
- [x] Item availability status
- [x] Admin: full CRUD for menu items
- [x] **Favorites/Wishlist** - Save and manage favorite items

### Orders & Checkout
- [x] Three order types: Delivery, Pickup, Dine-In
- [x] Cart management with quantities
- [x] Auto-calculated pricing (subtotal, 6% SST, delivery fee)
- [x] Map-based location picker with 20km radius validation
- [x] Save address to profile option
- [x] Stripe payment integration (embedded checkout)
- [x] Order status tracking with timestamps
- [x] Order confirmation after payment
- [x] **Order Cancellation** - Cancel pending/confirmed orders
- [x] **Re-order** - Quick re-order from order history
- [x] **Order Rating/Review** - Rate delivered orders (1-5 stars)
- [x] **Promo Codes/Discounts** - Apply discount codes at checkout
- [x] **PDF Receipt Download** - Download order receipts as PDF
- [x] **Delivery Instructions** - Add special instructions for riders

### Table Reservations
- [x] Book tables by date/time/party size
- [x] Special requests field
- [x] View & cancel reservations
- [x] Conflict detection (prevent double-booking)
- [x] Admin: manage all reservations

### Delivery System
- [x] Auto-rider assignment based on availability
- [x] Delivery status tracking
- [x] Estimated delivery time (45 min default)
- [x] GPS coordinates for delivery
- [x] **Delivery Instructions** - Floor/unit/gate codes, special requests

### Announcements
- [x] Time-based announcements on homepage
- [x] Admin: full CRUD with publish dates

### Admin Dashboard
- [x] Overview statistics (orders, reservations, users, menu items)
- [x] Menu management
- [x] Order status updates
- [x] Reservation management
- [x] User management
- [x] **Sales Reports/Analytics** - Revenue charts, popular items, order stats
- [x] **Review Management** - View all reviews, respond to reviews, review statistics

### UI/UX
- [x] Responsive design (mobile-friendly)
- [x] Animations on Order page
- [x] Cart animations
- [x] APlus logo on all pages linking to home
- [x] **Dark Mode Toggle** - User-controlled theme switching with persistence

---

## Proposed Features

### High Priority (Core Features)

| Feature                  | Description                                      | Status    |
|--------------------------|--------------------------------------------------|-----------|
| Order Cancellation       | Allow users to cancel orders (within time limit) | ✅ Done   |
    
| Order History Export     | Download receipts/invoices as PDF                | ✅ Done   |
| Promo Codes/Discounts    | Apply discount codes at checkout                 | ✅ Done   |

### Medium Priority (Enhanced Experience)

| Feature                | Description                                | Status    |
|------------------------|--------------------------------------------|-----------|
| Favorites/Wishlist     | Save favorite menu items                   | ✅ Done   |
| Re-order               | Quick re-order from order history          | ✅ Done   |
| Order Rating/Review    | Rate orders and menu items                 | ✅ Done   |
| Estimated Prep Time    | Show estimated preparation time per item   | Pending   |
| Order Scheduling       | Schedule orders for future pickup/delivery | Pending   |
| Multi-language Support | Malay, English, Chinese                    | Pending   |
| Dark Mode Toggle       | User-controlled theme switching            | ✅ Done   |

### Business Features

| Feature               | Description                               | Status    |
|-----------------------|-------------------------------------------|-----------|
| Sales Reports         | Admin dashboard with revenue analytics    | ✅ Done   |
| Inventory Management  | Track stock levels, auto-disable when out | Pending   |
| Peak Hours Management | Adjust delivery times based on load       | Pending   |
| Loyalty Points        | Reward program for repeat customers       | Pending   |
| Gift Cards            | Purchase and redeem gift cards            | Pending   |

### Technical Improvements

| Feature           | Description                                        | Status    |
|-------------------|----------------------------------------------------|-----------|
| Email Receipts    | Send order confirmation emails                     | Partial   |
| SMS Notifications | Text updates for order status                      | Pending   |
| Rate Limiting     | Protect APIs from abuse                            | Pending   |
| Audit Logging     | Track admin actions                                | Pending   |
| Image Upload      | Direct image upload for menu items (not just URLs) | Pending   |
| Search History    | Remember recent searches                           | Pending   |

### Delivery Enhancements

| Feature               | Description                      | Status    |
|-----------------------|----------------------------------|-----------|
| Live Rider Tracking   | Show rider location on map       | Pending   |
| Delivery Time Slots   | Choose preferred delivery window | Pending   |
| Contactless Delivery  | Option for no-contact drop-off   | Pending   |
| Delivery Instructions | Floor/unit/gate codes            | ✅ Done   |

---

## Recently Implemented (April 2026)

### Promo Codes System
- Backend: `PromoCode` entity with PERCENTAGE/FIXED_AMOUNT types
- Validation: minimum order, usage limits, date ranges
- Frontend: Apply promo in checkout with discount display

### Favorites System
- Backend: `Favorite` entity linking users to menu items
- Toggle favorite status with heart icon
- View favorites list in profile

### Order Rating/Review System
- Backend: `Review` entity with 1-5 star rating
- Users can review delivered orders once
- Admin can respond to reviews
- Review statistics dashboard for admin

### Re-order Feature
- Copy items from previous order to cart
- Navigate to delivery page after adding

### PDF Receipt Download
- Apache PDFBox integration
- Professional receipt format with:
  - Order details and items
  - Pricing breakdown
  - Customer information

### Dark Mode Toggle
- Theme context with localStorage persistence
- Toggle button in header
- Respects system preference initially

### Delivery Instructions
- Enhanced checkout form for delivery orders
- Display instructions in order history
- Helpful placeholder text for common instructions

---

## Known Issues / Bugs Fixed

| Date       | Issue                                      | Resolution                                      |
|------------|--------------------------------------------|-------------------------------------------------|
| 2026-04-18 | Orders not created after payment           | Fixed CheckoutReturn to call confirm API        |
| 2026-04-18 | Address not showing in Profile             | Added delivery address section to Profile       |
| 2026-04-18 | Lombok not compiling in Docker             | Updated Lombok version and Dockerfile           |
| 2026-04-18 | Duplicate @Transactional annotation        | Removed duplicate in PaymentService             |
| 2026-04-18 | User ID null when JWT expired              | Added fallback user lookup by email in payment  |

---

## Tech Stack

### Backend
- Java 17
- Spring Boot 3.2.5
- Spring Security with JWT
- Spring Data JPA
- PostgreSQL 16
- Stripe API for payments
- TOTP for 2FA
- Apache PDFBox for PDF generation

### Frontend
- React 18
- TypeScript
- Vite
- TailwindCSS
- Shadcn/UI components
- React Router
- Sonner (toast notifications)

### Infrastructure
- Docker & Docker Compose
- Nginx (production web server)

---

## API Endpoints Summary

### Public
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `GET /api/menu` - Get all menu items
- `GET /api/categories` - Get all categories
- `POST /api/checkout/create-session` - Create Stripe checkout
- `POST /api/checkout/confirm` - Confirm payment

### Authenticated (User)
- `GET /api/auth/me` - Get current user
- `GET /api/orders` - Get user orders
- `POST /api/orders` - Create order
- `PUT /api/orders/:id/cancel` - Cancel order
- `GET /api/orders/:id/receipt` - Download PDF receipt
- `GET /api/reservations` - Get user reservations
- `POST /api/reservations` - Create reservation
- `DELETE /api/reservations/:id` - Cancel reservation
- `GET /api/users/profile` - Get profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users/addresses` - Get saved addresses
- `POST /api/users/addresses` - Add address
- `PUT /api/users/delivery-address` - Save delivery address
- `GET /api/users/favorites` - Get favorite items
- `POST /api/users/favorites/:menuId` - Toggle favorite
- `GET /api/users/reviews` - Get user reviews
- `POST /api/users/reviews` - Create review
- `POST /api/promo/validate` - Validate promo code

### Admin Only
- `GET /api/admin/analytics` - Dashboard analytics with charts
- `GET /api/admin/orders` - All orders
- `PATCH /api/admin/orders/:id/status` - Update order status
- `GET /api/admin/reservations` - All reservations
- `PATCH /api/admin/reservations/:id/status` - Update reservation status
- `GET /api/admin/users` - All users
- `PATCH /api/admin/users/:id/active` - Toggle user active
- `POST /api/admin/menu` - Create menu item
- `PUT /api/admin/menu/:id` - Update menu item
- `DELETE /api/admin/menu/:id` - Delete menu item
- `GET /api/admin/reviews` - All reviews
- `GET /api/admin/reviews/stats` - Review statistics
- `POST /api/admin/reviews/:id/respond` - Respond to review
