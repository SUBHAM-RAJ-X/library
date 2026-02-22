# Library Management System - Deployment Guide

This guide covers deployment instructions for the Library Management System across different environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Supabase Setup](#supabase-setup)
4. [Backend Deployment](#backend-deployment)
5. [Mobile App Deployment](#mobile-app-deployment)
6. [Admin Dashboard Deployment](#admin-dashboard-deployment)
7. [Environment Variables](#environment-variables)
8. [Production Considerations](#production-considerations)

## Prerequisites

### Required Software
- Node.js (v18 or higher)
- npm or yarn
- Git
- Supabase Account
- Expo CLI (for mobile app)
- React Native development environment

### Platform-Specific Requirements

#### For React Native Mobile App
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)
- Expo Go app (for testing)

#### For Admin Dashboard
- Modern web browser
- Node.js environment

## Environment Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd library-management-system
```

### 2. Install Dependencies

#### Backend
```bash
cd backend
npm install
```

#### Mobile App
```bash
cd mobile-app
npm install
```

#### Admin Dashboard
```bash
cd admin-dashboard
npm install
```

## Supabase Setup

### 1. Create a New Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Sign up/login to your account
3. Click "New Project"
4. Choose your organization
5. Enter project name: `library-management`
6. Set a strong database password
7. Choose your region
8. Click "Create new project"

### 2. Set Up Database Schema
1. Go to the SQL Editor in your Supabase project
2. Copy and paste the contents of `supabase/schema.sql`
3. Click "Run" to execute the schema

### 3. Configure Storage
1. Go to Storage in your Supabase project
2. Create a new bucket named `books`
3. Set up RLS policies (included in schema.sql)

### 4. Get Project Credentials
1. Go to Project Settings > API
2. Copy the following values:
   - Project URL
   - anon public key
   - service_role key (keep this secret!)

## Backend Deployment

### Option 1: Local Development
```bash
cd backend
cp .env.example .env
# Edit .env with your Supabase credentials
npm run dev
```

### Option 2: Railway
1. Install Railway CLI: `npm install -g @railway/cli`
2. Login: `railway login`
3. Deploy: `railway up`
4. Set environment variables in Railway dashboard

### Option 3: Vercel
1. Install Vercel CLI: `npm install -g vercel`
2. Deploy: `vercel --prod`
3. Set environment variables in Vercel dashboard

### Option 4: DigitalOcean App Platform
1. Create a new app in DigitalOcean
2. Connect your GitHub repository
3. Set build command: `npm install`
4. Set run command: `npm start`
5. Add environment variables

### Backend Environment Variables
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key
JWT_SECRET=your_jwt_secret
PORT=3001
NODE_ENV=production
MAX_FILE_SIZE=50000000
ALLOWED_FILE_TYPES=application/pdf
```

## Mobile App Deployment

### Development Build
```bash
cd mobile-app
cp .env.example .env
# Edit .env with your API and Supabase URLs
npm start
```

### Production Build

#### Expo Application Services (EAS)
1. Install EAS CLI: `npm install -g eas-cli`
2. Login: `eas login`
3. Configure: `eas build:configure`
4. Build for Android: `eas build --platform android`
5. Build for iOS: `eas build --platform ios`

#### Google Play Store
1. Create a Google Play Developer account
2. Upload your signed APK/AAB
3. Complete store listing
4. Submit for review

#### Apple App Store
1. Create an Apple Developer account
2. Use Xcode to archive and upload
3. Complete App Store Connect information
4. Submit for review

### Mobile App Environment Variables
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_API_URL=your_backend_url
```

## Admin Dashboard Deployment

### Option 1: Vercel (Recommended)
1. Install Vercel CLI: `npm install -g vercel`
2. Deploy: `vercel --prod`
3. Set environment variables in Vercel dashboard

### Option 2: Netlify
1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `build`
4. Add environment variables

### Option 3: AWS S3 + CloudFront
1. Build the app: `npm run build`
2. Upload build folder to S3
3. Configure CloudFront distribution
4. Set up custom domain

### Admin Dashboard Environment Variables
```env
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_API_URL=your_backend_url
```

## Environment Variables Reference

### Backend (.env)
| Variable | Required | Description |
|----------|----------|-------------|
| SUPABASE_URL | Yes | Your Supabase project URL |
| SUPABASE_SERVICE_ROLE_KEY | Yes | Service role key for admin operations |
| SUPABASE_ANON_KEY | Yes | Anonymous key for public operations |
| JWT_SECRET | Yes | Secret for JWT token signing |
| PORT | No | Server port (default: 3001) |
| NODE_ENV | No | Environment (development/production) |
| MAX_FILE_SIZE | No | Maximum file upload size in bytes |
| ALLOWED_FILE_TYPES | No | Allowed file types for uploads |

### Mobile App (.env)
| Variable | Required | Description |
|----------|----------|-------------|
| EXPO_PUBLIC_SUPABASE_URL | Yes | Your Supabase project URL |
| EXPO_PUBLIC_SUPABASE_ANON_KEY | Yes | Anonymous key for Supabase |
| EXPO_PUBLIC_API_URL | Yes | Your backend API URL |

### Admin Dashboard (.env)
| Variable | Required | Description |
|----------|----------|-------------|
| REACT_APP_SUPABASE_URL | Yes | Your Supabase project URL |
| REACT_APP_SUPABASE_ANON_KEY | Yes | Anonymous key for Supabase |
| REACT_APP_API_URL | Yes | Your backend API URL |

## Production Considerations

### Security
1. **Environment Variables**: Never commit secrets to version control
2. **API Keys**: Use different keys for development and production
3. **HTTPS**: Always use HTTPS in production
4. **CORS**: Configure CORS properly for your domains
5. **Rate Limiting**: Implement rate limiting on API endpoints

### Performance
1. **Database Indexing**: Ensure proper indexes on frequently queried columns
2. **File Storage**: Use CDN for file delivery
3. **Caching**: Implement Redis or similar for caching
4. **Image Optimization**: Optimize images and files
5. **Bundle Size**: Keep mobile app bundle size minimal

### Monitoring
1. **Error Tracking**: Use Sentry or similar for error monitoring
2. **Analytics**: Implement analytics for usage tracking
3. **Performance Monitoring**: Monitor API response times
4. **Uptime Monitoring**: Use services like UptimeRobot

### Backup Strategy
1. **Database Backups**: Enable automatic backups in Supabase
2. **File Backups**: Regular backup of uploaded files
3. **Code Backups**: Use Git with proper branching strategy
4. **Configuration Backups**: Backup environment configurations

### Scaling
1. **Database**: Monitor database performance and scale when needed
2. **API Server**: Use load balancers for high traffic
3. **CDN**: Use CDN for static assets
4. **Caching Layer**: Add Redis for better performance

## Troubleshooting

### Common Issues

#### Backend Issues
- **CORS Errors**: Check CORS configuration
- **Database Connection**: Verify Supabase credentials
- **File Upload Issues**: Check storage bucket permissions

#### Mobile App Issues
- **Build Failures**: Check Node.js version and dependencies
- **Network Issues**: Verify API endpoints are accessible
- **Authentication**: Check Supabase auth configuration

#### Admin Dashboard Issues
- **Build Errors**: Check environment variables
- **API Calls**: Verify CORS and API endpoints
- **Authentication**: Check admin role permissions

### Debugging Tips
1. Check browser console for JavaScript errors
2. Use network tab to inspect API calls
3. Check mobile app logs using Expo CLI
4. Verify environment variables are correctly set
5. Test API endpoints directly using Postman or curl

## Maintenance

### Regular Tasks
1. Update dependencies regularly
2. Monitor and rotate API keys
3. Review and optimize database queries
4. Clean up old/unused files
5. Update SSL certificates

### Updates
1. Test updates in staging environment first
2. Create database backups before major updates
3. Use feature flags for gradual rollouts
4. Monitor performance after updates
5. Have rollback plan ready

## Support

For issues and questions:
1. Check the documentation
2. Review GitHub issues
3. Create new issue with detailed description
4. Include environment details and error logs

---

**Note**: This deployment guide covers the most common deployment scenarios. Adjust based on your specific requirements and infrastructure preferences.
