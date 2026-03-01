# Deployment Guide

This guide walks you through deploying the Crucible D&D Character Creator from scratch.

## Overview

- **Frontend:** GitHub Pages (via GitHub Actions)
- **Backend:** GCP Compute Engine (Docker container, auto-deployed via GitHub Actions)
- **Database:** Supabase (hosted Postgres)

---

## Step 1: GCP Project Setup

### 1.1 Create a GCP Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or select an existing one)
3. Note your **Project ID** (e.g. `crucible-12345`)

### 1.2 Enable APIs

```bash
gcloud services enable compute.googleapis.com artifactregistry.googleapis.com
```

### 1.3 Create a Service Account

This account is used by GitHub Actions to deploy.

```bash
# Create the service account
gcloud iam service-accounts create crucible-deployer \
  --display-name="Crucible Deployer"

# Grant required roles
PROJECT_ID=$(gcloud config get-value project)

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:crucible-deployer@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/compute.instanceAdmin.v1"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:crucible-deployer@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:crucible-deployer@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

# Export the key JSON
gcloud iam service-accounts keys create key.json \
  --iam-account=crucible-deployer@${PROJECT_ID}.iam.gserviceaccount.com
```

Save `key.json` — you'll add it as a GitHub secret later. **Do not commit it.**

---

## Step 2: Create Artifact Registry Repository

```bash
gcloud artifacts repositories create crucible \
  --repository-format=docker \
  --location=us-east1 \
  --description="Crucible Docker images"
```

---

## Step 3: Create Compute Engine VM

### 3.1 Create the Instance

```bash
gcloud compute instances create crucible-backend \
  --zone=us-east1-b \
  --machine-type=e2-micro \
  --image-family=debian-12 \
  --image-project=debian-cloud \
  --boot-disk-size=20GB \
  --tags=http-server,https-server
```

### 3.2 Allow HTTP/HTTPS Traffic

```bash
gcloud compute firewall-rules create allow-http \
  --allow tcp:80,tcp:443 \
  --target-tags=http-server,https-server \
  --source-ranges=0.0.0.0/0
```

### 3.3 SSH In and Install Docker

```bash
gcloud compute ssh crucible-backend --zone=us-east1-b

# On the VM:
sudo apt-get update
sudo apt-get install -y docker.io
sudo systemctl enable docker
sudo usermod -aG docker $USER
```

Log out and back in for the group change to take effect.

### 3.4 Configure Docker for Artifact Registry (on the VM)

```bash
gcloud auth configure-docker us-east1-docker.pkg.dev --quiet
```

---

## Step 4: First Deploy (Manual)

From your local machine:

```bash
# Authenticate Docker locally
gcloud auth configure-docker us-east1-docker.pkg.dev

# Build and push
PROJECT_ID=$(gcloud config get-value project)

docker build -t us-east1-docker.pkg.dev/$PROJECT_ID/crucible/crucible-backend:latest apps/backend

docker push us-east1-docker.pkg.dev/$PROJECT_ID/crucible/crucible-backend:latest

# SSH to VM and run
gcloud compute ssh crucible-backend --zone=us-east1-b --command="
  docker pull us-east1-docker.pkg.dev/$PROJECT_ID/crucible/crucible-backend:latest && \
  docker run -d \
    --name crucible-backend \
    --restart unless-stopped \
    -p 80:5001 \
    -e NODE_ENV=production \
    -e PORT=5001 \
    -e SUPABASE_URL=<your-supabase-url> \
    -e SUPABASE_ANON_KEY=<your-supabase-anon-key> \
    us-east1-docker.pkg.dev/$PROJECT_ID/crucible/crucible-backend:latest
"
```

Verify the backend is running by visiting `http://<VM-EXTERNAL-IP>/`.

---

## Step 5: GitHub Actions Setup (Automatic Deploys)

The workflow at `.github/workflows/deploy-backend.yml` automatically builds and deploys on push to `main` when `apps/backend/**` changes.

### 5.1 Add GitHub Secrets

Go to your repo → Settings → Secrets and variables → Actions → Secrets, and add:

| Secret | Value |
|---|---|
| `GCP_SA_KEY` | Contents of `key.json` (the full JSON) |
| `GCP_PROJECT_ID` | Your GCP project ID (e.g. `crucible-12345`) |
| `GCP_REGION` | `us-east1` |
| `GCP_INSTANCE_NAME` | `crucible-backend` |
| `GCP_INSTANCE_ZONE` | `us-east1-b` |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Your Supabase anon/public key |

### 5.2 Test

Push a change to `apps/backend/` on `main` and check the Actions tab.

---

## Step 6: Deploy Frontend to GitHub Pages

The frontend automatically deploys via GitHub Actions when you push to `main` and `apps/frontend/**` changes.

### 6.1 Enable GitHub Pages

1. Go to your repository on GitHub
2. Settings → Pages
3. Source: **GitHub Actions**

### 6.2 Set Environment Variables

1. Go to Settings → Secrets and variables → Actions → **Variables**
2. Add a new repository variable:
   - **Name:** `VITE_API_URL`
   - **Value:** `http://<VM-EXTERNAL-IP>/api` (your backend URL)

### 6.3 Deploy

1. Push changes to `main`
2. The GitHub Action will automatically build and deploy
3. Your site will be available at `https://<username>.github.io/<repo-name>/`

---

## Troubleshooting

### CORS Issues
Update the CORS config in `apps/backend/src/app.ts` to include your GitHub Pages domain.

### Container Crashes
```bash
# SSH to VM
gcloud compute ssh crucible-backend --zone=us-east1-b

# Check logs
docker logs crucible-backend

# Check if container is running
docker ps -a
```

### Build Fails in CI
- Check the Actions tab for error details
- Verify all GitHub secrets are set correctly
- Make sure the Artifact Registry repo exists

### Can't SSH to VM from GitHub Actions
- Verify the service account has `roles/compute.instanceAdmin.v1`
- Check that the VM name and zone in secrets match the actual instance

### SPA Routing Issues on GitHub Pages
The app includes a `404.html` redirect to handle client-side routing. If routes aren't working:
- Verify `public/404.html` exists
- Check that `main.tsx` has the redirect handling code

---

## Quick Deploy Checklist

- [ ] GCP project created, APIs enabled
- [ ] Service account created with correct roles
- [ ] Artifact Registry repo created
- [ ] Compute Engine VM created with Docker installed
- [ ] Firewall rule allows HTTP traffic
- [ ] First manual deploy verified
- [ ] GitHub secrets added (GCP_SA_KEY, GCP_PROJECT_ID, GCP_REGION, GCP_INSTANCE_NAME, GCP_INSTANCE_ZONE, SUPABASE_URL, SUPABASE_ANON_KEY)
- [ ] `VITE_API_URL` variable set in GitHub repo
- [ ] Push to main triggers successful deploy
- [ ] Frontend loads and connects to backend

---

## Costs

- **GCP Compute Engine:** e2-micro is part of the [free tier](https://cloud.google.com/free) (1 instance per month in select regions)
- **GCP Artifact Registry:** 500 MB free storage
- **Supabase:** Free tier (500 MB database, 1 GB file storage)
- **GitHub Pages:** Free for public repositories
