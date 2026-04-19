# APlus Cafe Deployment Guide

This guide covers deploying the APlus Cafe application using **Render** (Backend API + PostgreSQL) and **Vercel** (Frontend).

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│     Vercel      │────▶│     Render      │────▶│  Neon/Render    │
│   (Frontend)    │     │   (Spring API)  │     │  (PostgreSQL)   │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
   React + Vite          Java Spring Boot         PostgreSQL DB
```

---

## Part 1: Database Setup (Neon PostgreSQL - Free)

Neon offers a generous free tier for PostgreSQL, better than Render's free database.

### Step 1.1: Create Neon Account
1. Go to [https://neon.tech](https://neon.tech)
2. Sign up with GitHub or email
3. Create a new project named `aplus-cafe`

### Step 1.2: Get Connection Details
After creating the project, you'll get a connection string like:
```
postgresql://username:password@ep-xxx.region.aws.neon.tech/aplus_cafe?sslmode=require
```

Save these values:
- **Host**: `ep-xxx.region.aws.neon.tech`
- **Database**: `neondb` (or create `aplus_cafe`)
- **Username**: Your Neon username
- **Password**: Your Neon password

---

## Part 2: Backend Deployment (Render)

### Step 2.1: Create Render Account
1. Go to [https://render.com](https://render.com)
2. Sign up with GitHub (recommended for easy repo connection)

### Step 2.2: Create Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure the service:

| Setting | Value |
|---------|-------|
| **Name** | `aplus-cafe-api` |
| **Region** | Oregon (US West) or Singapore |
| **Branch** | `main` |
| **Root Directory** | `apps/api` |
| **Runtime** | Docker |
| **Instance Type** | Free |

### Step 2.3: Set Environment Variables

In Render dashboard, go to **Environment** tab and add:

| Key | Value | Notes |
|-----|-------|-------|
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://ep-xxx.neon.tech/aplus_cafe?sslmode=require` | From Neon |
| `SPRING_DATASOURCE_USERNAME` | Your Neon username | From Neon |
| `SPRING_DATASOURCE_PASSWORD` | Your Neon password | From Neon |
| `JWT_SECRET_KEY` | (generate random 64-char hex) | Use: `openssl rand -hex 32` |
| `FRONTEND_URL` | `https://your-app.vercel.app` | Your Vercel URL (add after Vercel deploy) |
| `STRIPE_SECRET_KEY` | `sk_test_...` | From Stripe Dashboard (optional) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | From Stripe Dashboard (optional) |
| `MAIL_HOST` | `sandbox.smtp.mailtrap.io` | Or `smtp.gmail.com` |
| `MAIL_PORT` | `2525` | Or `587` for Gmail |
| `MAIL_USERNAME` | Your mail username | From Mailtrap or Gmail |
| `MAIL_PASSWORD` | Your mail password | App password for Gmail |
| `MAIL_FROM` | `noreply@aplus.cafe` | Sender email |

### Step 2.4: Deploy
1. Click **"Create Web Service"**
2. Wait for the build to complete (5-10 minutes first time)
3. Your API will be available at: `https://aplus-cafe-api.onrender.com`

### Step 2.5: Verify Deployment
Test the health endpoint:
```bash
curl https://aplus-cafe-api.onrender.com/actuator/health
```
Expected response: `{"status":"UP"}`

---

## Part 3: Frontend Deployment (Vercel)

### Step 3.1: Create Vercel Account
1. Go to [https://vercel.com](https://vercel.com)
2. Sign up with GitHub

### Step 3.2: Import Project
1. Click **"Add New..."** → **"Project"**
2. Import your GitHub repository
3. Configure the project:

| Setting | Value |
|---------|-------|
| **Framework Preset** | Vite |
| **Root Directory** | `apps/web` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

### Step 3.3: Set Environment Variables

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://aplus-cafe-api.onrender.com/api` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` (optional) |

### Step 3.4: Deploy
1. Click **"Deploy"**
2. Wait for build to complete (2-3 minutes)
3. Your app will be available at: `https://your-app.vercel.app`

---

## Part 4: Post-Deployment Configuration

### Step 4.1: Update CORS (Important!)
Go back to Render and update the `FRONTEND_URL` environment variable:
```
FRONTEND_URL=https://your-app.vercel.app
```
Render will automatically redeploy.

### Step 4.2: Fix Admin Password
The admin password hash needs to be set correctly. Connect to your Neon database and run:

```sql
UPDATE users SET password_hash = '$2a$10$bUMjRgRVX0HHhqbSu684/OQp4M2cBwIc4cwh5K5IdJtDwVZ1Rj.P2'
WHERE email = 'admin@gmail.com';
```

Or use Neon's SQL Editor in the dashboard.

### Step 4.3: Test the Application
1. Open your Vercel URL
2. Register a new account
3. Try logging in to admin: `admin@gmail.com` / `admin123`
4. Place a test order

---

## Environment Variables Summary

### Backend (Render)

```env
# Database (Neon)
SPRING_DATASOURCE_URL=jdbc:postgresql://ep-xxx.neon.tech/aplus_cafe?sslmode=require
SPRING_DATASOURCE_USERNAME=your_username
SPRING_DATASOURCE_PASSWORD=your_password

# Security
JWT_SECRET_KEY=your_64_char_hex_secret

# CORS
FRONTEND_URL=https://your-app.vercel.app

# Email (Mailtrap - Free for testing)
MAIL_HOST=sandbox.smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=your_mailtrap_username
MAIL_PASSWORD=your_mailtrap_password
MAIL_FROM=noreply@aplus.cafe

# Stripe (Optional)
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

### Frontend (Vercel)

```env
VITE_API_URL=https://aplus-cafe-api.onrender.com/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

---

## Free Tier Limitations

### Render Free Tier
- Service spins down after 15 minutes of inactivity
- First request after spin-down takes 30-60 seconds (cold start)
- 750 hours/month of free usage

### Vercel Free Tier
- 100GB bandwidth/month
- Unlimited deployments
- No cold starts (static hosting)

### Neon Free Tier
- 0.5 GB storage
- 1 project
- Always-on (no cold starts for database)

---

## Troubleshooting

### API returns 502 Bad Gateway
- Check Render logs for errors
- Verify database connection string is correct
- Ensure JWT_SECRET_KEY is set

### CORS Error
- Verify `FRONTEND_URL` matches your Vercel URL exactly
- Include `https://` in the URL
- Redeploy after changing environment variables

### Login not working
- Check if admin user exists in database
- Verify password hash is correct (run the SQL fix above)
- Check API logs for authentication errors

### Images not loading
- Images should be in `/images/` folder
- Verify the menu items have correct image URLs in database

### Slow first load
- Normal for Render free tier (cold start)
- Subsequent requests will be fast
- Consider upgrading to paid tier for production

---

## Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@gmail.com` | `admin123` |

---

## Useful Commands

### Generate JWT Secret
```bash
openssl rand -hex 32
```

### Test API Health
```bash
curl https://your-api.onrender.com/actuator/health
```

### View Render Logs
Go to Render Dashboard → Your Service → Logs

---

## Support

For issues with:
- **Render**: [render.com/docs](https://render.com/docs)
- **Vercel**: [vercel.com/docs](https://vercel.com/docs)
- **Neon**: [neon.tech/docs](https://neon.tech/docs)
