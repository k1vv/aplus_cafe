# A+ Cafe Deployment Guide

Free hosting setup for your assignment using Vercel (frontend), Render (backend), and Neon (database).

---

## Step 1: Push Code to GitHub

First, push your project to a GitHub repository:

```bash
# If not already initialized
git init
git add .
git commit -m "Initial commit"

# Create a new repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/aplus_cafe.git
git branch -M main
git push -u origin main
```

---

## Step 2: Set Up Neon Database (PostgreSQL)

1. Go to [https://neon.tech](https://neon.tech) and sign up (free)
2. Click **"Create Project"**
3. Choose a project name (e.g., `aplus-cafe`)
4. Select region closest to you
5. Click **"Create Project"**
6. Copy your connection details:
   - Go to **Dashboard** → **Connection Details**
   - Select **Java** from the dropdown
   - Copy the connection string, it looks like:
     ```
     jdbc:postgresql://ep-cool-name-123456.us-east-2.aws.neon.tech/neondb?user=neondb_owner&password=xxx&sslmode=require
     ```
   - Extract these values:
     - **URL**: `jdbc:postgresql://ep-xxx.region.aws.neon.tech/neondb?sslmode=require`
     - **Username**: `neondb_owner`
     - **Password**: (the password shown)

---

## Step 3: Deploy Backend on Render

1. Go to [https://render.com](https://render.com) and sign up (free)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account and select your repository
4. Configure the service:
   - **Name**: `aplus-cafe-api`
   - **Region**: Oregon (or closest)
   - **Branch**: `main`
   - **Root Directory**: `apps/api`
   - **Runtime**: `Docker`
   - **Plan**: `Free`

5. Add **Environment Variables** (click "Advanced" → "Add Environment Variable"):

   | Key | Value |
   |-----|-------|
   | `SPRING_DATASOURCE_URL` | `jdbc:postgresql://ep-xxx.neon.tech/neondb?sslmode=require` |
   | `SPRING_DATASOURCE_USERNAME` | `neondb_owner` |
   | `SPRING_DATASOURCE_PASSWORD` | Your Neon password |
   | `JWT_SECRET_KEY` | Generate: `openssl rand -base64 32` |
   | `STRIPE_SECRET_KEY` | `sk_test_xxx` (from Stripe dashboard) |
   | `STRIPE_WEBHOOK_SECRET` | `whsec_xxx` (optional for testing) |
   | `MAIL_HOST` | `sandbox.smtp.mailtrap.io` |
   | `MAIL_PORT` | `2525` |
   | `MAIL_USERNAME` | Your Mailtrap username |
   | `MAIL_PASSWORD` | Your Mailtrap password |
   | `MAIL_FROM` | `noreply@aplus.cafe` |
   | `FRONTEND_URL` | `https://your-app.vercel.app` (update after Vercel deploy) |

6. Click **"Create Web Service"**
7. Wait for deployment (first deploy takes 5-10 minutes)
8. Copy your backend URL: `https://aplus-cafe-api.onrender.com`

**Note**: Free tier sleeps after 15 mins of inactivity. First request may take 30-60 seconds.

---

## Step 4: Deploy Frontend on Vercel

1. Go to [https://vercel.com](https://vercel.com) and sign up (free, use GitHub)
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `apps/web` (click "Edit" to change)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

5. Add **Environment Variables**:

   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://aplus-cafe-api.onrender.com/api` |
   | `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_test_xxx` (from Stripe) |

6. Click **"Deploy"**
7. Copy your frontend URL: `https://your-app.vercel.app`

---

## Step 5: Update Backend CORS

After Vercel deployment, update Render environment variable:
- Go to Render Dashboard → Your Service → Environment
- Update `FRONTEND_URL` to your Vercel URL (e.g., `https://aplus-cafe.vercel.app`)
- Click "Save Changes" (this will redeploy)

---

## Step 6: Set Up Stripe (Optional - for payments)

1. Go to [https://dashboard.stripe.com](https://dashboard.stripe.com)
2. Get your test API keys:
   - **Publishable key** (`pk_test_xxx`) → Add to Vercel
   - **Secret key** (`sk_test_xxx`) → Add to Render
3. For webhooks (optional):
   - Go to Developers → Webhooks → Add endpoint
   - URL: `https://aplus-cafe-api.onrender.com/api/webhook/stripe`
   - Copy webhook secret → Add to Render as `STRIPE_WEBHOOK_SECRET`

---

## Step 7: Set Up Email (Optional)

### Option A: Mailtrap (Recommended for testing)
1. Go to [https://mailtrap.io](https://mailtrap.io) and sign up (free)
2. Go to Email Testing → Inboxes → SMTP Settings
3. Copy credentials to Render environment variables

### Option B: Gmail (For real emails)
1. Enable 2-Factor Authentication on your Gmail
2. Go to [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Generate an App Password
4. Update Render environment:
   - `MAIL_HOST`: `smtp.gmail.com`
   - `MAIL_PORT`: `587`
   - `MAIL_USERNAME`: `your.email@gmail.com`
   - `MAIL_PASSWORD`: Your app password

---

## Troubleshooting

### Backend won't start
- Check Render logs for errors
- Verify database URL format includes `?sslmode=require`
- Ensure all required environment variables are set

### CORS errors
- Verify `FRONTEND_URL` in Render matches your Vercel URL exactly
- Include protocol (`https://`)

### Database connection fails
- Neon free tier may sleep - first connection wakes it up
- Check credentials are correct
- Ensure `?sslmode=require` is in the URL

### Frontend API calls fail
- Check `VITE_API_URL` ends with `/api`
- Backend may be sleeping (wait 30-60 seconds)
- Check browser console for specific errors

---

## Useful Links

| Service | Dashboard |
|---------|-----------|
| Vercel | [vercel.com/dashboard](https://vercel.com/dashboard) |
| Render | [dashboard.render.com](https://dashboard.render.com) |
| Neon | [console.neon.tech](https://console.neon.tech) |
| Stripe | [dashboard.stripe.com](https://dashboard.stripe.com) |
| Mailtrap | [mailtrap.io](https://mailtrap.io) |

---

## Quick Test Checklist

- [ ] Frontend loads at Vercel URL
- [ ] Can register a new user
- [ ] Can log in
- [ ] Menu items display
- [ ] Can add items to cart
- [ ] Checkout works (with test Stripe card: `4242 4242 4242 4242`)
