# Production Deployment Guide for Zoho-IT

## 🌐 Live Application
**Production URL**: https://zohopeople.netlify.app/
**OAuth Callback**: https://zohopeople.netlify.app/auth/callback

## 🔧 Zoho OAuth Setup for Production

### 1. Zoho Developer Console Configuration
1. Go to https://api-console.zoho.in/
2. Find your existing application or create a new one
3. **Add Production Redirect URI**: `https://zohopeople.netlify.app/auth/callback`
4. Note your Client ID and Client Secret
5. Ensure scopes include: `ZohoCRM.modules.ALL,ZohoCRM.users.READ`

### 2. Environment Variables for Production
Set these environment variables in your hosting platform:

```env
ZOHO_CLIENT_ID=your_production_client_id
ZOHO_CLIENT_SECRET=your_production_client_secret
ZOHO_REDIRECT_URI=https://zohopeople.netlify.app/auth/callback
ZOHO_SCOPE=ZohoCRM.modules.ALL,ZohoCRM.users.READ
CORS_ORIGIN=https://zohopeople.netlify.app
NODE_ENV=production
```

### 3. Netlify Configuration
If deploying to Netlify:

1. **Environment Variables**:
   - Go to Site Settings > Environment Variables
   - Add all the variables listed above

2. **Build Settings**:
   - Build command: `npm run build`
   - Publish directory: `build`

3. **Redirects** (create `_redirects` file in `static` folder):
   ```
   /api/* http://your-backend-server.com/api/:splat 200
   ```

### 4. Backend Deployment
Your Node.js backend needs to be deployed separately to a service like:
- **Heroku**: `git push heroku main`
- **Railway**: Connect GitHub repository
- **DigitalOcean App Platform**: Deploy from GitHub
- **AWS Lambda**: Serverless deployment

### 5. OAuth Flow for Production
1. User visits: https://zohopeople.netlify.app/
2. Clicks "Connect with Zoho"
3. Redirected to: `https://accounts.zoho.in/oauth/v2/auth?...`
4. User authenticates with Zoho
5. Zoho redirects to: `https://zohopeople.netlify.app/auth/callback?code=...`
6. Application exchanges code for tokens
7. Tokens stored in browser localStorage
8. User redirected to dashboard with authenticated state

## 🔐 Security Considerations for Production

### HTTPS Required
- Zoho requires HTTPS for production OAuth
- Netlify provides HTTPS automatically
- Ensure all API calls use HTTPS

### Environment Variables
- Never commit `.env` files to Git
- Use platform-specific environment variable settings
- Rotate secrets regularly

### CORS Configuration
- Restrict CORS to your production domain
- Don't use wildcard (*) in production
- Validate all incoming requests

## 🚀 Deployment Steps

### Frontend (Netlify)
1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `build`
4. Add environment variables in Netlify dashboard
5. Deploy

### Backend (Your Choice)
1. Choose a hosting platform
2. Set environment variables
3. Deploy your Express server
4. Update frontend API endpoints to point to production backend

## 🧪 Testing Production OAuth

### Test Checklist
- [ ] Zoho app has production redirect URI
- [ ] Environment variables are set correctly
- [ ] CORS allows your production domain
- [ ] HTTPS is working
- [ ] OAuth flow completes successfully
- [ ] Tokens are stored and refreshed properly
- [ ] Asset sync works with Zoho CRM

### Common Issues
1. **CORS Errors**: Check backend CORS configuration
2. **OAuth Errors**: Verify redirect URI matches exactly
3. **Token Issues**: Ensure client credentials are correct
4. **API Errors**: Check backend deployment and environment variables

## 📊 Monitoring
- Monitor OAuth success/failure rates
- Track API usage and rate limits
- Set up error logging and alerts
- Monitor token refresh cycles

Your production site at **https://zohopeople.netlify.app/** is now ready for Zoho OAuth integration! 🎯
