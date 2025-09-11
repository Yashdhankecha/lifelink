# 🚀 Netlify + Render Deployment Guide

## **Architecture Overview**
- **Frontend (React):** Netlify - Fast, global CDN, excellent for static sites
- **Backend (Node.js):** Render - Robust API hosting with database connectivity

## **Benefits of This Setup**
- ✅ **Netlify:** Fast global CDN, instant deployments, form handling
- ✅ **Render:** Reliable backend, database connections, API hosting
- ✅ **Separation of concerns:** Frontend and backend can scale independently
- ✅ **Better performance:** Static frontend served from CDN
- ✅ **Cost effective:** Both have generous free tiers

---

## **Step 1: Prepare Backend for Render (API Only)**

### **1.1 Update Render Configuration**
Create a new `render-backend.yaml`:

```yaml
services:
  - type: web
    name: life-link-backend
    env: node
    plan: free
    buildCommand: cd server && npm install
    startCommand: cd server && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: MONGODB_URI
        value: mongodb+srv://harshvyas:kushdon@lifelink.tugr4wr.mongodb.net/life-link
      - key: JWT_SECRET
        value: lifelinkbymaksad
      - key: JWT_EXPIRE
        value: 7d
      - key: CLIENT_URL
        value: https://your-netlify-app.netlify.app
      - key: EMAIL_HOST
        value: smtp.gmail.com
      - key: EMAIL_PORT
        value: 587
      - key: EMAIL_USER
        value: yashdhankecha101@gmail.com
      - key: EMAIL_PASS
        value: bewz faij mzfm mwnb
      - key: GROQ_API_KEY
        value: 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
```

### **1.2 Update Server Configuration**
Remove static file serving from server:

```javascript
// server/src/server.js - Remove these lines:
// if (process.env.NODE_ENV === 'production') {
//   app.use(express.static(path.join(__dirname, '../../client/dist')));
// }

// Update 404 handler to only handle API routes:
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});
```

---

## **Step 2: Prepare Frontend for Netlify**

### **2.1 Create Netlify Configuration**
Create `netlify.toml` in your root:

```toml
[build]
  base = "client"
  publish = "dist"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/api/*"
  [headers.values]
    Access-Control-Allow-Origin = "https://your-render-backend.onrender.com"
    Access-Control-Allow-Methods = "GET, POST, PUT, DELETE, OPTIONS"
    Access-Control-Allow-Headers = "Content-Type, Authorization"
    Access-Control-Allow-Credentials = "true"
```

### **2.2 Update Frontend API Configuration**
Update `client/src/services/api.js`:

```javascript
import axios from 'axios';

// Use environment variable for API URL, fallback to Render backend
const API_URL = import.meta.env.VITE_API_URL || 'https://your-render-backend.onrender.com/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Rest of your API configuration...
```

### **2.3 Create Environment Files**
Create `client/.env.production`:

```bash
VITE_API_URL=https://your-render-backend.onrender.com/api
VITE_NODE_ENV=production
VITE_APP_NAME=Life Link
VITE_ENABLE_DEBUG=false
```

Create `client/.env.development`:

```bash
VITE_API_URL=http://localhost:5000/api
VITE_NODE_ENV=development
VITE_APP_NAME=Life Link (Dev)
VITE_ENABLE_DEBUG=true
```

---

## **Step 3: Deploy Backend to Render**

### **3.1 Create Render Service**
1. Go to [render.com](https://render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Name:** `life-link-backend`
   - **Environment:** `Node`
   - **Build Command:** `cd server && npm install`
   - **Start Command:** `cd server && npm start`

### **3.2 Set Environment Variables**
Add these in Render dashboard:

```bash
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://harshvyas:kushdon@lifelink.tugr4wr.mongodb.net/life-link
JWT_SECRET=lifelinkbymaksad
JWT_EXPIRE=7d
CLIENT_URL=https://your-netlify-app.netlify.app
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=yashdhankecha101@gmail.com
EMAIL_PASS=bewz faij mzfm mwnb
GROQ_API_KEY=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
```

### **3.3 Deploy Backend**
1. Click **"Create Web Service"**
2. Wait for deployment
3. Note your backend URL: `https://your-backend-name.onrender.com`

---

## **Step 4: Deploy Frontend to Netlify**

### **4.1 Create Netlify Site**
1. Go to [netlify.com](https://netlify.com)
2. Click **"New site from Git"**
3. Connect your GitHub repository
4. Configure:
   - **Base directory:** `client`
   - **Build command:** `npm run build`
   - **Publish directory:** `client/dist`

### **4.2 Set Environment Variables**
In Netlify dashboard, go to **"Site settings"** → **"Environment variables"**:

```bash
VITE_API_URL=https://your-render-backend.onrender.com/api
VITE_NODE_ENV=production
VITE_APP_NAME=Life Link
VITE_ENABLE_DEBUG=false
```

### **4.3 Deploy Frontend**
1. Click **"Deploy site"**
2. Wait for build and deployment
3. Note your frontend URL: `https://your-app-name.netlify.app`

---

## **Step 5: Update CORS Configuration**

### **5.1 Update Backend CORS**
Update `server/src/server.js`:

```javascript
// CORS middleware
app.use(cors({
  origin: [
    'https://your-netlify-app.netlify.app',
    'http://localhost:5173' // For development
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### **5.2 Update Frontend API URL**
Update the API URL in your frontend environment variables to match your actual Render backend URL.

---

## **Step 6: Test Your Deployment**

### **6.1 Test Backend**
```bash
curl https://your-render-backend.onrender.com/api/health
```

### **6.2 Test Frontend**
Visit: `https://your-netlify-app.netlify.app`

### **6.3 Test Integration**
- Try logging in/registering
- Test API calls from frontend
- Verify database connectivity

---

## **Step 7: Custom Domains (Optional)**

### **7.1 Netlify Custom Domain**
1. Go to **"Domain settings"** in Netlify
2. Add your custom domain
3. Configure DNS records

### **7.2 Render Custom Domain**
1. Go to **"Settings"** in Render
2. Add custom domain
3. Configure DNS records

---

## **Architecture Diagram**

```
┌─────────────────┐    API Calls    ┌─────────────────┐
│                 │ ──────────────► │                 │
│   Netlify       │                 │   Render        │
│   (Frontend)    │ ◄────────────── │   (Backend)     │
│                 │    JSON Data    │                 │
└─────────────────┘                 └─────────────────┘
        │                                    │
        │                                    │
        ▼                                    ▼
┌─────────────────┐                 ┌─────────────────┐
│   Global CDN    │                 │   MongoDB       │
│   (Static Files)│                 │   (Database)    │
└─────────────────┘                 └─────────────────┘
```

---

## **Benefits of This Setup**

### **Netlify Frontend:**
- ✅ **Global CDN:** Fast loading worldwide
- ✅ **Instant deployments:** Deploy on git push
- ✅ **Form handling:** Built-in form processing
- ✅ **Branch previews:** Test different branches
- ✅ **Free SSL:** Automatic HTTPS

### **Render Backend:**
- ✅ **Reliable hosting:** 99.9% uptime
- ✅ **Database connections:** Easy MongoDB integration
- ✅ **Environment variables:** Secure configuration
- ✅ **Auto-scaling:** Handles traffic spikes
- ✅ **Free tier:** Generous limits

---

## **Troubleshooting**

### **CORS Issues:**
- Check CORS configuration in backend
- Verify frontend URL in backend CORS settings
- Ensure credentials are properly configured

### **API Connection Issues:**
- Verify API URL in frontend environment variables
- Check if backend is running and accessible
- Test API endpoints directly

### **Build Issues:**
- Check build logs in both Netlify and Render
- Verify environment variables are set correctly
- Ensure all dependencies are installed

---

## **Success Checklist**

- [ ] Backend deployed to Render
- [ ] Frontend deployed to Netlify
- [ ] Environment variables configured
- [ ] CORS settings updated
- [ ] API endpoints working
- [ ] Frontend-backend communication working
- [ ] Database connectivity verified
- [ ] Custom domains configured (optional)

---

## **Your URLs**
- **Frontend:** `https://your-app-name.netlify.app`
- **Backend:** `https://your-backend-name.onrender.com`
- **API Health:** `https://your-backend-name.onrender.com/api/health`

**🎉 Your app is now deployed with the best of both worlds!**
