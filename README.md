# 📚 Library Management System

A comprehensive library management system with separate interfaces for students, librarians, and administrators. Built with React, Node.js, and Supabase.

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Frontend │    │  Admin Dashboard│    │   Mobile App    │
│   (React)       │    │   (React)       │    │   (React Native)│
│   Port: 3000    │    │   Port: 3002    │    │   Expo          │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Backend API   │
                    │   (Node.js)     │
                    │   Port: 3001    │
                    └─────────────────┘
                                 │
                    ┌─────────────────┐
                    │    Supabase     │
                    │   (PostgreSQL)  │
                    └─────────────────┘
```

## ✨ Features

### 👤 Student/User Features
- 📖 Browse and search books
- 📥 Download books
- ⭐ Rate and review books
- 📚 Track reading progress
- 🔖 Create bookmarks
- 👤 Profile management

### 👨‍💼 Admin Features
- 📊 Dashboard with analytics
- 📚 Book management (CRUD)
- 👥 User management
- 📂 Category management
- ✅ Book approval system
- ⭐ Review management
- 📈 Reading analytics
- 📥 Download statistics

### 📱 Mobile App Features
- 📱 Native mobile experience
- 📖 Offline book reading
- 🔔 Push notifications
- 📚 Book synchronization
- 📖 Reading progress tracking

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Supabase account

### 1. Clone the Repository
```bash
git clone <repository-url>
cd library-management-system
```

### 2. Environment Setup

Create environment files for each service:

#### Backend (.env)
```env
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_ANON_KEY=your_supabase_anon_key

# Backend Configuration
BACKEND_URL=http://localhost:3001
JWT_SECRET=your_jwt_secret_key
PORT=3001
NODE_ENV=development

# File Upload Configuration
MAX_FILE_SIZE=50000000
ALLOWED_FILE_TYPES=application/pdf
```

#### Admin Dashboard (.env)
```env
# Admin Dashboard Configuration
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_API_URL=http://localhost:3001/api
```

#### User Frontend (.env)
```env
# User Frontend Configuration
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### Mobile App (app.json)
```json
{
  "expo": {
    "extra": {
      "supabaseUrl": "your_supabase_url",
      "supabaseAnonKey": "your_supabase_anon_key",
      "apiUrl": "http://localhost:3001/api"
    }
  }
}
```

### 3. Install Dependencies

```bash
# Backend
cd backend
npm install

# Admin Dashboard
cd ../admin-dashboard
npm install

# User Frontend
cd ../user-frontend
npm install

# Mobile App
cd ../mobile-app
npm install
```

### 4. Database Setup

1. Create a new project in [Supabase](https://supabase.com)
2. Run the SQL schema from `supabase/schema.sql` in your Supabase SQL editor
3. Update environment variables with your Supabase credentials

### 5. Create Admin User

```bash
cd backend
node create-admin.js
```

This will create an admin user with:
- Email: `subhamrajx@gmail.com`
- Password: `1234567890`
- Role: `admin`

### 6. Start All Services

#### Terminal 1 - Backend
```bash
cd backend
node server.js
```

#### Terminal 2 - Admin Dashboard
```bash
cd admin-dashboard
npm start
```

#### Terminal 3 - User Frontend
```bash
cd user-frontend
npm start
```

#### Terminal 4 - Mobile App (Optional)
```bash
cd mobile-app
npx expo start
```

## 🌐 Access Points

| Service | URL | Default Credentials |
|---------|-----|-------------------|
| User Frontend | http://localhost:3000 | Register new account |
| Admin Dashboard | http://localhost:3002 | subhamrajx@gmail.com / 1234567890 |
| Backend API | http://localhost:3001 | - |
| Mobile App | Expo QR Code | - |

## 📁 Project Structure

```
library-management-system/
├── backend/                 # Node.js API server
│   ├── config/             # Configuration files
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Express middleware
│   ├── routes/            # API routes
│   ├── server.js          # Main server file
│   └── create-admin.js    # Admin user creation script
├── admin-dashboard/         # React admin interface
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── contexts/      # React contexts
│   │   ├── pages/         # Page components
│   │   └── services/      # API services
├── user-frontend/          # React user interface
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── contexts/      # React contexts
│   │   ├── pages/         # Page components
│   │   └── services/      # API services
├── mobile-app/             # React Native mobile app
│   ├── src/
│   │   ├── components/    # Mobile components
│   │   ├── contexts/      # React contexts
│   │   ├── screens/       # Screen components
│   │   └── services/      # API services
├── supabase/               # Database schema
│   └── schema.sql         # SQL schema file
├── docs/                   # Documentation
│   ├── API_DOCUMENTATION.md
│   └── DEPLOYMENT.md
└── README.md              # This file
```

## 🔧 Development Scripts

### Backend
```bash
npm start          # Start server
npm run dev        # Start with nodemon
npm test           # Run tests
```

### Frontend Applications
```bash
npm start          # Start development server
npm run build      # Build for production
npm test           # Run tests
```

### Mobile App
```bash
npx expo start     # Start Expo development server
npx expo build     # Build mobile app
```

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/logout` - User logout

### Book Endpoints
- `GET /api/books` - Get all books
- `GET /api/books/:id` - Get book by ID
- `POST /api/books` - Create new book
- `PUT /api/books/:id` - Update book
- `DELETE /api/books/:id` - Delete book

### User Endpoints
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

For complete API documentation, see `docs/API_DOCUMENTATION.md`.

## 🗄️ Database Schema

The system uses PostgreSQL via Supabase with the following main tables:
- `users` - User accounts and profiles
- `books` - Book information and metadata
- `categories` - Book categories
- `reviews` - Book reviews and ratings
- `downloads` - Download tracking
- `reading_progress` - Reading progress tracking
- `bookmarks` - User bookmarks

For detailed schema information, see `supabase/schema.sql`.

## 🔐 Authentication & Authorization

- **JWT-based authentication** for API access
- **Role-based access control** (student, admin)
- **Supabase Auth** for user management
- **Row Level Security (RLS)** for data protection

## 🎨 UI/UX Technologies

### Admin Dashboard
- **Material-UI (MUI)** for components
- **React Router** for navigation
- **React Query** for data fetching
- **Recharts** for analytics charts

### User Frontend
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Axios** for API calls

### Mobile App
- **React Native Paper** for components
- **React Navigation** for navigation
- **Expo** for development and deployment

## 🚀 Deployment

### Backend Deployment
1. Set production environment variables
2. Build and deploy to your preferred platform (Heroku, AWS, etc.)
3. Update Supabase CORS settings

### Frontend Deployment
1. Build the application: `npm run build`
2. Deploy to static hosting (Vercel, Netlify, etc.)
3. Update environment variables

### Mobile App Deployment
1. Build with Expo: `npx expo build`
2. Submit to app stores
3. Update production API endpoints

For detailed deployment instructions, see `docs/DEPLOYMENT.md`.

## 🐛 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find process using port
netstat -ano | findstr :3001

# Kill process
taskkill /PID [PID] /F
```

#### Supabase Connection Issues
- Verify Supabase URL and keys in .env files
- Check Supabase project status
- Ensure CORS is configured correctly

#### Authentication Issues
- Check JWT_SECRET is set in backend .env
- Verify user exists in both Supabase Auth and users table
- Check email confirmation status

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions:
- Create an issue in the repository
- Email: support@library-management.com
- Documentation: Check the `docs/` folder

## 🙏 Acknowledgments

- [Supabase](https://supabase.com) for backend services
- [React](https://reactjs.org) for frontend framework
- [Material-UI](https://mui.com) for UI components
- [Expo](https://expo.dev) for mobile development

---

**Happy Reading! 📚✨**
