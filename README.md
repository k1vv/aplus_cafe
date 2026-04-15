# APlus Cafe

A full-stack cafe ordering and table reservation system built with React and Spring Boot.

## Project Structure

```
aplus_cafe/
├── apps/
│   ├── web/          # React frontend (Vite + TypeScript)
│   └── api/          # Spring Boot backend (Java 17)
├── package.json      # Root package.json with scripts
└── README.md
```

## Tech Stack

### Frontend (`apps/web`)
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS + shadcn/ui
- React Router DOM
- React Query (TanStack Query)
- Stripe.js for payments

### Backend (`apps/api`)
- Spring Boot 3.2
- Spring Security + JWT Authentication
- Spring Data JPA
- PostgreSQL
- Stripe Java SDK

## Prerequisites

- Node.js 18+
- Java 17+
- PostgreSQL 14+
- Maven (or use included wrapper)

## Getting Started

### 1. Database Setup

Create a PostgreSQL database:

```sql
CREATE DATABASE aplus_cafe;
```

### 2. Backend Setup

```bash
cd apps/api

# Update database credentials in src/main/resources/application.yml
# Then run:
./mvnw spring-boot:run
```

The API will start on `http://localhost:8080`

### 3. Frontend Setup

```bash
cd apps/web
npm install
npm run dev
```

The frontend will start on `http://localhost:5173`

## Environment Variables

### Backend (`apps/api/src/main/resources/application.yml`)

| Variable | Description |
|----------|-------------|
| `spring.datasource.url` | PostgreSQL connection URL |
| `spring.datasource.username` | Database username |
| `spring.datasource.password` | Database password |
| `JWT_SECRET_KEY` | Secret key for JWT tokens (256-bit) |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `FRONTEND_URL` | Frontend URL for CORS |

### Frontend (`apps/web/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API URL |
| `VITE_PAYMENTS_CLIENT_TOKEN` | Stripe publishable key |

## Database Schema

### Tables

| Table | Description |
|-------|-------------|
| `users` | User accounts (USER, ADMIN, RIDER roles) |
| `addresses` | User delivery addresses |
| `categories` | Menu categories (Coffee, Pastry, etc.) |
| `menu` | Menu items |
| `orders` | Customer orders |
| `order_items` | Items within orders |
| `payments` | Stripe payment records |
| `rider_details` | Delivery rider information |
| `deliveries` | Delivery tracking |
| `completed_orders` | Archived orders for analytics |
| `cafe_tables` | Table layout for reservations |
| `reservation_slots` | Available booking time slots |
| `reservations` | Table reservations |
| `announcements` | Admin announcements |
| `refresh_tokens` | JWT refresh tokens |

## API Endpoints

### Public Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/menu` - Get menu items
- `GET /api/categories` - Get categories
- `GET /api/tables` - Get table layout
- `GET /api/announcements` - Get announcements

### Authenticated Endpoints
- `GET /api/auth/me` - Get current user
- `POST /api/orders` - Create order
- `GET /api/orders` - Get user orders
- `POST /api/reservations` - Create reservation
- `GET /api/reservations` - Get user reservations
- `POST /api/checkout/{orderId}` - Create Stripe checkout

### Admin Endpoints (`/api/admin/*`)
- Menu management (CRUD)
- Order management
- Reservation management
- User management
- Announcement management

## Features

- **Menu Browsing** - Browse coffee and pastry items by category
- **Order Ahead** - Place delivery, pickup, or dine-in orders
- **Table Reservations** - Book tables with interactive cafe layout
- **Stripe Payments** - Secure payment processing
- **Auto Rider Assignment** - Automatic rider assignment for deliveries
- **Admin Dashboard** - Manage menu, orders, users, and announcements

## User Roles

| Role | Permissions |
|------|-------------|
| USER | Browse menu, place orders, make reservations |
| ADMIN | All user permissions + manage menu, users, orders, announcements |
| RIDER | View and manage assigned deliveries |
