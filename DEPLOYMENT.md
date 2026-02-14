# Deployment Guide

This guide will help you deploy your D&D Character Creator to production.

## Overview

- **Frontend:** GitHub Pages (via GitHub Actions)
- **Backend:** Railway (or Render)
- **Database:** MongoDB Atlas

---

## Step 1: Set Up MongoDB Atlas (Database)

### 1.1 Create Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Sign up for a free account

### 1.2 Create Cluster
1. Click "Build a Database"
2. Choose **FREE** tier (M0 Sandbox)
3. Select your preferred cloud provider and region
4. Click "Create Cluster"

### 1.3 Create Database User
1. Security → Database Access → Add New Database User
2. Choose "Password" authentication
3. Username: `dnd-user` (or your choice)
4. Generate a secure password and **save it**
5. Set role to "Read and write to any database"
6. Click "Add User"

### 1.4 Allow Network Access
1. Security → Network Access → Add IP Address
2. Click "Allow Access from Anywhere" (0.0.0.0/0)
3. Click "Confirm"

### 1.5 Get Connection String
1. Click "Connect" on your cluster
2. Choose "Connect your application"
3. Copy the connection string (looks like: `mongodb+srv://dnd-user:<password>@cluster0...`)
4. **Replace `<password>` with your actual password**
5. **Replace `<dbname>` with `crucible`**

Final string should look like:
```
mongodb+srv://dnd-user:yourpassword@cluster0.xxxxx.mongodb.net/crucible?retryWrites=true&w=majority
```

---

## Step 2: Deploy Backend to Railway

**Note:** For monorepo setup details, see [RAILWAY_SETUP.md](./RAILWAY_SETUP.md)

### 2.1 Prepare Backend
1. Make sure your backend has a build script:
   ```bash
   cd apps/backend
   npm run build
   ```

### 2.2 Deploy Backend to Railway
1. Go to [Railway.app](https://railway.app)
2. Sign up/Login with GitHub
3. Click "New Project"
4. Choose "Deploy from GitHub repo"
5. Select your repository
6. Configure service:
   - **Root Directory:** `apps/backend`
   - Railway will use the `railway.toml` config automatically

### 2.3 Set Environment Variables
1. In Railway dashboard, click on your service
2. Go to "Variables" tab
3. Add these variables:
   ```
   PORT=5001
   MONGODB_URI=<your MongoDB Atlas connection string>
   NODE_ENV=production
   ```

### 2.4 Get Backend URL
1. In Railway dashboard, go to "Settings"
2. Generate a domain (or add custom domain)
3. Copy your backend URL (e.g., `https://your-app.railway.app`)

---

## Step 3: Deploy Frontend to GitHub Pages

The frontend automatically deploys to GitHub Pages via GitHub Actions when you push to the `main` branch.

### 3.1 Enable GitHub Pages
1. Go to your repository on GitHub
2. Settings → Pages
3. Source: **GitHub Actions**

### 3.2 Set Environment Variables
1. Go to Settings → Secrets and variables → Actions → Variables
2. Add a new repository variable:
   - **Name:** `VITE_API_URL`
   - **Value:** `https://your-backend-url.railway.app/api`

### 3.3 Deploy
1. Push changes to the `main` branch
2. The GitHub Action will automatically build and deploy
3. Check the Actions tab for deployment status
4. Your site will be available at `https://<username>.github.io/<repo-name>/`

---

## Alternative: Deploy Backend to Render

If you prefer Render over Railway:

### 1. Create Render Account
1. Go to [Render](https://render.com)
2. Sign up with GitHub

### 2. Create Web Service
1. Dashboard → New → Web Service
2. Connect your repository
3. Configure:
   - **Name:** dnd-backend
   - **Root Directory:** `apps/backend`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Plan:** Free

### 3. Environment Variables
Add in Render dashboard:
```
PORT=5001
MONGODB_URI=<your MongoDB Atlas connection string>
NODE_ENV=production
```

---

## Step 4: Test Your Deployment

1. Visit your frontend URL (from GitHub Pages)
2. Try creating a character
3. Check that data saves to MongoDB Atlas
4. Verify character list loads properly

---

## Troubleshooting

### CORS Issues
Make sure backend CORS allows your frontend domain. Update `apps/backend/src/index.ts`:
```typescript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://<username>.github.io'
  ],
  // ... rest of config
}));
```

### Database Connection Fails
- Verify MongoDB Atlas IP whitelist includes 0.0.0.0/0
- Check connection string has correct password
- Ensure database name is specified in connection string

### Build Fails
- Check Node.js version matches (should be 18+)
- Verify all dependencies are in package.json
- Check build logs for specific errors

### SPA Routing Issues on GitHub Pages
The app includes a 404.html redirect to handle client-side routing. If routes aren't working:
- Verify `public/404.html` exists
- Check that `main.tsx` has the redirect handling code

---

## Quick Deploy Checklist

- [ ] MongoDB Atlas cluster created
- [ ] Database user created with password
- [ ] Connection string obtained
- [ ] Backend deployed to Railway/Render
- [ ] Backend environment variables set
- [ ] Backend URL obtained
- [ ] GitHub Pages enabled (Source: GitHub Actions)
- [ ] `VITE_API_URL` variable set in GitHub repo
- [ ] Push to main branch to trigger deployment
- [ ] Test character creation works
- [ ] Test character list loads

---

## Costs

- **MongoDB Atlas:** Free tier (512 MB storage)
- **Railway:** Free tier ($5 credit/month, then $0.000463/GB-hour)
- **GitHub Pages:** Free for public repositories
- **Render:** Free tier (services spin down after 15min inactivity)

**Note:** Railway's free tier may require credit card after trial. Consider Render's free tier as alternative.

---

## Custom Domains (Optional)

### GitHub Pages
1. Repository Settings → Pages → Custom domain
2. Add your custom domain
3. Configure DNS records as shown
4. Optionally enable "Enforce HTTPS"

### Railway/Render
1. Service Settings → Domains
2. Add custom domain
3. Configure DNS records as shown

---

## Updates & Redeployment

### Frontend (GitHub Pages)
- Automatically redeploys on git push to main branch (if `apps/frontend/**` changed)
- Or manually trigger from Actions tab → Deploy Frontend → Run workflow

### Backend (Railway/Render)
- Automatically redeploys on git push to main branch
- Or manually redeploy from dashboard

---

Need help? Check the logs in each platform's dashboard for error details.
