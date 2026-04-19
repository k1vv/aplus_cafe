# APlus Cafe - Feature Tracker

## Current Status Overview

| Category       | Completion | Notes                                    |
|----------------|------------|------------------------------------------|
| Authentication | 100%       | JWT, 2FA, email verification             |
| Menu           | 100%       | CRUD, categories, favorites, search      |
| Orders         | 100%       | All types, cancel, re-order, receipts    |
| Reservations   | 95%        | Booking, conflict detection              |
| Payments       | 100%       | Stripe, promo codes, PDF receipts        |
| Delivery       | 100%       | Manual assignment, SimBot, live tracking |
| Admin          | 100%       | Analytics, reviews, rider management     |
| Notifications  | 30%        | Email only, no push/SMS                  |
| Security       | 100%       | All SR1-SR10 requirements implemented    |
| UI/UX          | 100%       | Dark mode, animations, loading states    |

**Overall Progress: 85% Complete (Production Ready)**

---

## Completed Features

### Authentication & Security
- [x] User registration with email verification
- [x] Login with JWT tokens & refresh tokens
- [x] Two-Factor Authentication (2FA/TOTP) with QR codes
- [x] Password reset via email
- [x] Role-based access (USER, ADMIN, RIDER)
- [x] Rate limiting (100/min general, 10/min auth, 5/min payment)
- [x] Input validation (frontend maxLength + backend @Size/@Pattern)
- [x] XSS protection (security headers + CSP)
- [x] SQL injection prevention (JPA/Hibernate ORM)
- [x] BCrypt password hashing
- [x] Activity logging (@Slf4j throughout codebase)
- [x] Global exception handling (sanitized error messages)

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
- [x] Favorites/Wishlist - Save and manage favorite items

### Orders & Checkout
- [x] Three order types: Delivery, Pickup, Dine-In
- [x] Cart management with quantities
- [x] Auto-calculated pricing (subtotal, 6% SST, delivery fee)
- [x] Map-based location picker with 20km radius validation
- [x] Cafe location pin on map with delivery area circle
- [x] Save address to profile option
- [x] Stripe payment integration (embedded checkout)
- [x] Order status tracking with timestamps
- [x] Order confirmation after payment
- [x] Order Cancellation - Cancel pending/confirmed orders with reason
- [x] Re-order - Quick re-order from order history
- [x] Order Rating/Review - Rate delivered orders (1-5 stars)
- [x] Promo Codes/Discounts - Apply discount codes at checkout
- [x] PDF Receipt Download - Download order receipts as PDF
- [x] Delivery Instructions - Add special instructions for riders
- [x] Contactless Delivery - Option for no-contact drop-off

### Table Reservations
- [x] Book tables by date/time/party size
- [x] Special requests field
- [x] View & cancel reservations
- [x] Conflict detection (prevent double-booking)
- [x] Admin: manage all reservations

### Delivery System
- [x] Manual rider assignment by admin
- [x] Three rider accounts (Ahmad, Mei Ling, SimBot)
- [x] SimBot auto-delivery simulation
- [x] Real-time rider tracking via SSE (Server-Sent Events)
- [x] Delivery status tracking (Pending → Assigned → In Transit → Delivered)
- [x] GPS coordinates for delivery
- [x] Delivery Instructions - Floor/unit/gate codes, special requests
- [x] Contactless delivery option
- [x] Order status progression system (admin)

### Announcements
- [x] Time-based announcements on homepage
- [x] Admin: full CRUD with publish dates

### Admin Dashboard
- [x] Overview statistics (orders, reservations, users, menu items)
- [x] Menu management
- [x] Order status updates with progression system
- [x] Reservation management
- [x] User management
- [x] Sales Reports/Analytics - Revenue charts, popular items, order stats
- [x] Review Management - View all reviews, respond to reviews, statistics
- [x] Rider Management - View available riders, assign to orders
- [x] Order cancellation with reason

### UI/UX
- [x] Responsive design (mobile-friendly)
- [x] Animations on Order page
- [x] Cart animations
- [x] APlus logo on all pages linking to home
- [x] Dark Mode Toggle - User-controlled theme switching with persistence
- [x] Loading overlays on all API operations
- [x] Consistent shop location throughout app (UNITEN MZ D Tasek Hall)
- [x] Map legend showing cafe and delivery area

---

## Pending Features

### Medium Priority (Enhanced Experience)

| Feature                | Description                                | Status    |
|------------------------|--------------------------------------------|-----------|
| Estimated Prep Time    | Show estimated preparation time per item   | Pending   |
| Order Scheduling       | Schedule orders for future pickup/delivery | Pending   |
| Multi-language Support | Malay, English, Chinese                    | Pending   |

### Business Features

| Feature               | Description                               | Status    |
|-----------------------|-------------------------------------------|-----------|
| Inventory Management  | Track stock levels, auto-disable when out | Pending   |
| Peak Hours Management | Adjust delivery times based on load       | Pending   |
| Loyalty Points        | Reward program for repeat customers       | Pending   |
| Gift Cards            | Purchase and redeem gift cards            | Pending   |

### Technical Improvements

| Feature           | Description                                        | Status    |
|-------------------|----------------------------------------------------|-----------|
| SMS Notifications | Text updates for order status                      | Pending   |
| Push Notifications| Browser/mobile push notifications                  | Pending   |
| Image Upload      | Direct image upload for menu items (not just URLs) | Pending   |
| Search History    | Remember recent searches                           | Pending   |

### Delivery Enhancements

| Feature               | Description                      | Status    |
|-----------------------|----------------------------------|-----------|
| Delivery Time Slots   | Choose preferred delivery window | Pending   |

---

## Recently Implemented (April 2026)

### Manual Rider Assignment System
- Removed auto-assign logic
- Admin dropdown to select rider when order is READY_FOR_PICKUP
- Three rider accounts created (Ahmad, Mei Ling, SimBot)
- SimBot auto-completes delivery with simulated tracking

### Real-time Rider Tracking
- SSE (Server-Sent Events) for live location updates
- RiderSimulationService for SimBot demo
- Map shows rider movement from shop to customer
- Automatic status updates (In Transit → Delivered)

### Order Status Progression
- Changed from arbitrary status selection to linear progression
- Separate cancel button with reason field
- Rider assignment required before OUT_FOR_DELIVERY

### Security Enhancements
- Added security headers (X-XSS-Protection, X-Frame-Options, CSP)
- Input validation on all frontend fields (maxLength)
- Backend DTO validation (@Size, @Pattern, @Valid)
- Rate limiting with Bucket4j

### UI/UX Improvements
- Loading overlays on all pages during API calls
- Cafe pin marker on delivery map
- Delivery radius circle (20km)
- Map legend for markers
- Consistent shop location (UNITEN MZ D Tasek Hall)

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
- Professional receipt format with order details and pricing

### Dark Mode Toggle
- Theme context with localStorage persistence
- Toggle button in header
- Respects system preference initially

---

## Security Implementation (SR1-SR10)

| Requirement | Feature | Status |
|-------------|---------|--------|
| SR1 | JWT Authentication | ✅ Implemented |
| SR2 | 2FA/TOTP | ✅ Implemented |
| SR3 | RBAC (User, Admin, Rider) | ✅ Implemented |
| SR4 | Input Validation | ✅ Implemented |
| SR5 | SQL Injection Prevention | ✅ Implemented (JPA/ORM) |
| SR6 | Exception Handling | ✅ Implemented |
| SR7 | Stripe Payment Security | ✅ Implemented |
| SR8 | Rate Limiting | ✅ Implemented (Bucket4j) |
| SR9 | Password Hashing | ✅ Implemented (BCrypt) |
| SR10 | HTTPS/Security Headers | ✅ Implemented |
| Extra | XSS Protection | ✅ Implemented (CSP + Headers) |
| Extra | Buffer Overflow Prevention | ✅ Implemented (maxLength) |

---

## Known Issues / Bugs Fixed

| Date       | Issue                                      | Resolution                                      |
|------------|--------------------------------------------|-------------------------------------------------|
| 2026-04-19 | Empty JSON response error on rider assign  | Fixed handleResponse in api.ts for empty bodies |
| 2026-04-19 | setDeliveredAt method not found            | Changed to setActualDeliveryTime in OrderService|
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
- TOTP for 2FA (dev.samstevens.totp)
- Apache PDFBox for PDF generation
- Bucket4j for rate limiting

### Frontend
- React 18
- TypeScript
- Vite
- TailwindCSS
- Shadcn/UI components
- React Router
- Sonner (toast notifications)
- Leaflet (maps)

### Infrastructure
- Docker & Docker Compose
- Nginx (production web server)
- Render (backend hosting)
- Vercel (frontend hosting)

---

## API Endpoints Summary

### Public
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/verify-email` - Verify email token
- `GET /api/menu` - Get all menu items
- `GET /api/categories` - Get all categories
- `POST /api/checkout/create-session` - Create Stripe checkout
- `POST /api/checkout/confirm` - Confirm payment

### Authenticated (User)
- `GET /api/auth/me` - Get current user
- `POST /api/auth/2fa/setup` - Setup 2FA
- `POST /api/auth/2fa/enable` - Enable 2FA
- `POST /api/auth/2fa/disable` - Disable 2FA
- `POST /api/auth/2fa/verify` - Verify 2FA code
- `GET /api/orders` - Get user orders
- `POST /api/orders` - Create order
- `PUT /api/orders/:id/cancel` - Cancel order
- `GET /api/orders/:id/receipt` - Download PDF receipt
- `GET /api/orders/:id/track` - SSE endpoint for rider tracking
- `GET /api/reservations` - Get user reservations
- `POST /api/reservations` - Create reservation
- `DELETE /api/reservations/:id` - Cancel reservation
- `GET /api/users/profile` - Get profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users/addresses` - Get saved addresses
- `POST /api/users/addresses` - Add address
- `PUT /api/users/delivery-address` - Save delivery address
- `GET /api/users/delivery-address` - Get saved delivery address
- `GET /api/users/favorites` - Get favorite items
- `POST /api/users/favorites/:menuId` - Toggle favorite
- `GET /api/users/reviews` - Get user reviews
- `POST /api/users/reviews` - Create review
- `POST /api/promo/validate` - Validate promo code

### Admin Only
- `GET /api/admin/analytics` - Dashboard analytics with charts
- `GET /api/admin/orders` - All orders
- `PATCH /api/admin/orders/:id/status` - Update order status
- `GET /api/admin/riders` - Get available riders
- `POST /api/admin/orders/:id/assign-rider` - Assign rider to order
- `DELETE /api/admin/orders/:id/assign-rider` - Unassign rider
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
- `GET /api/admin/announcements` - All announcements
- `POST /api/admin/announcements` - Create announcement
- `PUT /api/admin/announcements/:id` - Update announcement
- `DELETE /api/admin/announcements/:id` - Delete announcement

### Rider Only
- `GET /api/rider/deliveries` - Get assigned deliveries
- `PATCH /api/rider/deliveries/:id/status` - Update delivery status
- `PUT /api/rider/location` - Update rider location

---

## Completion Summary

| Priority | Completed | Pending | % Done |
|----------|-----------|---------|--------|
| High (Core) | 14/14 | 0 | **100%** |
| Medium | 8/13 | 5 | **62%** |
| Low | 6/12 | 6 | **50%** |
| Security | 13/13 | 0 | **100%** |
| **Total** | **41/52** | **11** | **79%** |

**Production Readiness: 85%** - All core features complete. Remaining items are enhancements.
