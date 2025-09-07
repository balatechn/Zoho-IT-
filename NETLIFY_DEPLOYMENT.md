# Netlify Deployment Guide for Zoho-IT Asset Tracker

## 🚀 Quick Netlify Deployment

### Step 1: Connect GitHub Repository
1. Go to [Netlify](https://app.netlify.com/)
2. Click "New site from Git"
3. Choose GitHub and authorize Netlify
4. Select repository: `balatechn/Zoho-IT-`

### Step 2: Build Settings
```
Build command: npm run build
Publish directory: build
Node version: 18
```

### Step 3: Environment Variables
Add these in Netlify Site Settings > Environment Variables:

```env
# Zoho OAuth Configuration
ZOHO_CLIENT_ID=1000.FCMJ4WPDJRQ29B5N5C4GVVXOM7O5EW
ZOHO_CLIENT_SECRET=your_client_secret_here
ZOHO_REDIRECT_URI=https://zohopeople.netlify.app/auth/callback
ZOHO_SCOPE=ZohoCRM.modules.ALL,ZohoCRM.users.READ

# Build Configuration
NODE_ENV=production
VITE_API_URL=https://your-backend-server.herokuapp.com
```

### Step 4: Deploy Backend
Your Node.js backend needs separate deployment:

#### Option A: Heroku
```bash
# Create Heroku app
heroku create zoho-it-backend

# Set environment variables
heroku config:set ZOHO_CLIENT_ID=1000.FCMJ4WPDJRQ29B5N5C4GVVXOM7O5EW
heroku config:set ZOHO_CLIENT_SECRET=your_secret
heroku config:set ZOHO_REDIRECT_URI=https://zohopeople.netlify.app/auth/callback
heroku config:set CORS_ORIGIN=https://zohopeople.netlify.app

# Deploy
git push heroku main
```

#### Option B: Railway
1. Connect GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically

### Step 5: Update API Endpoints
After backend deployment, update your frontend API calls:

```javascript
// Replace localhost URLs with your backend URL
const API_BASE = 'https://your-backend-server.herokuapp.com';
```

### Step 6: Test Production OAuth
1. Visit: https://zohopeople.netlify.app/
2. Click "Connect with Zoho"
3. Complete OAuth flow
4. Verify asset sync functionality

## 🔧 Troubleshooting

### Common Issues:
1. **Build Fails**: Check Node version and dependencies
2. **API Errors**: Verify backend deployment and CORS
3. **OAuth Fails**: Confirm redirect URI in Zoho console
4. **404 Errors**: Check _redirects file for SPA routing

### Environment Variables Checklist:
- [ ] ZOHO_CLIENT_ID set
- [ ] ZOHO_CLIENT_SECRET set  
- [ ] ZOHO_REDIRECT_URI points to Netlify URL
- [ ] VITE_API_URL points to deployed backend
- [ ] CORS_ORIGIN allows Netlify domain

## 📊 Production URLs
- **Frontend**: https://zohopeople.netlify.app/
- **Backend**: https://your-backend-server.herokuapp.com/
- **OAuth Callback**: https://zohopeople.netlify.app/auth/callback

Your site will be live and fully functional with Zoho OAuth integration! 🎉
