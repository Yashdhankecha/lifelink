# 🚀 Railway Deployment Guide

## Quick Setup

1. **Connect your GitHub repository to Railway**
2. **Set Environment Variables in Railway Dashboard:**
   ```
   NODE_ENV=production
   MONGODB_URI=your-mongodb-connection-string
   JWT_SECRET=your-jwt-secret
   JWT_EXPIRE=7d
   CLIENT_URL=https://your-app-name.railway.app
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   GROQ_API_KEY=your-groq-api-key
   ```

3. **Deploy!** Railway will automatically:
   - Install dependencies (`npm install`)
   - Run postinstall script (installs server + client deps + builds frontend)
   - Start the server (`npm start`)

## What Happens During Deployment

1. **Dependencies Installation:**
   - Root: `npm install` (installs concurrently)
   - Server: `npm install` (installs express, mongoose, etc.)
   - Client: `npm install` (installs react, vite, etc.)

2. **Build Process:**
   - Client: `npm run build` (creates production build in `client/dist`)

3. **Server Start:**
   - Runs `npm start` → `cd server && npm start`
   - Serves React build from `client/dist`
   - Handles client-side routing

## Environment Variables Required

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://...` |
| `JWT_SECRET` | JWT signing secret | `your-secret-key` |
| `JWT_EXPIRE` | JWT expiration time | `7d` |
| `CLIENT_URL` | Your Railway app URL | `https://app.railway.app` |
| `EMAIL_HOST` | SMTP host | `smtp.gmail.com` |
| `EMAIL_PORT` | SMTP port | `587` |
| `EMAIL_USER` | Email username | `your-email@gmail.com` |
| `EMAIL_PASS` | Email app password | `your-app-password` |
| `GROQ_API_KEY` | Groq API key for chatbot | `gsk_...` |

## Troubleshooting

- **Missing dependencies:** Check that `postinstall` script runs successfully
- **Build failures:** Ensure all client dependencies are installed
- **Server won't start:** Check environment variables are set correctly
- **Database connection:** Verify MongoDB URI is correct and accessible

## Production Features

✅ **Single Port Deployment** - Everything runs on Railway's assigned port  
✅ **Static File Serving** - React build served by Express  
✅ **Client-side Routing** - React Router works properly  
✅ **Environment Configuration** - Production-ready settings  
✅ **Health Check** - `/api/health` endpoint for monitoring
