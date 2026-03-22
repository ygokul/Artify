# Render Deployment Guide

## Quick Start with render.yaml

This project includes `render.yaml` for one-click deployment to Render.

### Prerequisites

1. **GitHub Account** - Push code to GitHub
2. **Render Account** - Sign up at https://render.com
3. **Environment Variables** - API keys ready

### Deployment Steps

#### Step 1: Push to GitHub
```bash
git add .
git commit -m "Setup Render deployment configuration"
git push origin main
```

#### Step 2: Connect to Render

1. Go to https://dashboard.render.com
2. Click **New +** → **Web Service**
3. Select **Build and deploy from a Git repository**
4. Connect your GitHub account and select your Artify repository
5. Render will automatically detect `render.yaml`

#### Step 3: Configure Environment Variables

In the Render dashboard, go to **Environment** and add these variables:

```
STABILITY_API_KEY = sk-Va6LAQD6fSM3fa7hBpjyNRLGwGBsekaHPllFSFQLpolVLa5n
MONGODB_URI = mongodb+srv://username:password@cluster.mongodb.net/artify?retryWrites=true&w=majority
GOOGLE_GENAI_API_KEY = AIzaSyCzBJ8cIjTBQaqM2306Z1cLHWWchKwrnCM
```

> Replace `mongodb://localhost:27017/artify` with your MongoDB Atlas connection string

#### Step 4: Update Code to Use Environment Variables (Optional but Recommended)

If you want to use Render's env vars instead of hardcoded config:

Replace in `src/lib/mongodb.ts`:
```typescript
// OLD (hardcoded)
import apiKeys from '@/config/api-keys.json';
const MONGODB_URI = apiKeys.mongodb.uri;

// NEW (env var)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/artify';
```

Replace in `src/ai/flows/generate-image-from-prompt.ts`:
```typescript
// OLD (hardcoded)
const stabilityApiKey = apiKeys.stability.apiKey;

// NEW (env var)
const stabilityApiKey = process.env.STABILITY_API_KEY;
```

#### Step 5: Deploy

1. Back in Render dashboard, click **Create Web Service**
2. Render will:
   - Install dependencies: `npm ci`
   - Build: `npm run build`
   - Start: `npm start`
3. Wait for deployment to complete (~5-10 minutes)
4. Your app will be live at `https://artify-xxxxx.onrender.com`

### MongoDB Atlas Setup

If using local MongoDB, follow these steps for MongoDB Atlas:

1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Go to **Connect** and copy the connection string
4. Add username and password to the URI
5. Paste into Render's `MONGODB_URI` environment variable

**Example:**
```
mongodb+srv://akda2003a:YOUR_PASSWORD@cluster0.mreqm1w.mongodb.net/artify?retryWrites=true&w=majority
```

### render.yaml Configuration

The `render.yaml` file includes:

- **Service Type**: Web service (Next.js app)
- **Runtime**: Node.js
- **Build Command**: `npm ci && npm run build`
- **Start Command**: `npm start`
- **Platform**: Standard (enough for development)
- **Health Check**: `/` endpoint
- **Auto Deploy**: On every push to main branch

### Monitoring & Logs

1. Go to **Logs** tab in Render dashboard
2. View real-time application logs
3. Check for errors or issues

### Environment-Specific URLs

Update `NEXT_PUBLIC_API_URL` if you have API calls:
```
https://artify-${RENDER_GIT_COMMIT:0:7}.onrender.com
```

### Troubleshooting

#### Build Fails
- Check build logs in Render dashboard
- Ensure `npm run build` works locally: `npm run build`
- Check for missing dependencies: `npm install`

#### MongoDB Connection Fails
- Verify `MONGODB_URI` is correct
- Check MongoDB Atlas IP whitelist includes Render's IPs: `0.0.0.0/0` (or be more specific)
- Test connection locally first

#### API Keys Not Working
- Verify keys in Render environment variables
- Make sure code is reading from `process.env` or config file
- Restart service after changing env vars

#### Out of Memory
- Upgrade to higher plan
- Check for memory leaks in code
- Monitor resource usage in Render dashboard

### Cost Estimation

- **Free Tier**: Limited availability, auto-spins down
- **Starter**: $7/month - Good for development
- **Standard**: $12/month - Recommended for production

### Next Steps

1. ✅ Push code with `render.yaml`
2. ✅ Connect GitHub to Render
3. ✅ Add environment variables
4. ✅ Deploy and test
5. ✅ Monitor logs for issues
