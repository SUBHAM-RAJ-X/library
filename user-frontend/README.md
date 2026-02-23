# Library System Frontend

A modern, responsive library management system built with React and TypeScript, featuring a beautiful sidebar layout with gradient designs and smooth animations.

## 🚀 Features

### 🎨 Modern UI/UX
- **Gradient Design**: Beautiful color gradients throughout the interface
- **Sidebar Layout**: Left navigation sidebar with menu items
- **Right Sidebar**: Reading progress, recent reviews, and top picks
- **Glass Morphism**: Modern backdrop blur effects
- **Smooth Animations**: Hover effects and transitions
- **Responsive Design**: Works seamlessly on all devices

### 📚 Core Functionality
- **User Authentication**: Login and register with email/password
- **Book Management**: Browse, search, and manage books
- **Reading Progress**: Track reading progress with visual progress bars
- **Reviews & Ratings**: Read and write book reviews
- **Bookmarks**: Save favorite books
- **User Profile**: Manage account information
- **Dashboard**: Personalized user dashboard

### 🛠 Technical Features
- **TypeScript**: Full type safety
- **React Router**: Client-side routing
- **Tailwind CSS**: Modern utility-first styling
- **Supabase**: Backend authentication and database
- **Component Architecture**: Reusable, modular components

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd user-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   
   Create a `.env` file in the root directory:
   ```env
   REACT_APP_SUPABASE_URL=your_supabase_url
   REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

   The application will be available at `http://localhost:3000`

## 🏗 Project Structure

```
src/
├── components/           # Reusable components
│   ├── Sidebar.tsx      # Left navigation sidebar
│   ├── RightSidebar.tsx # Right sidebar with widgets
│   └── Navbar.tsx       # Top navigation (legacy)
├── layouts/             # Layout components
│   ├── MainLayout.tsx   # Main app layout with sidebars
│   └── AuthLayout.tsx   # Authentication pages layout
├── pages/               # Page components
│   ├── Home.tsx         # Home page
│   ├── Books.tsx        # Books listing page
│   ├── BookDetail.tsx   # Book details page
│   ├── Profile.tsx      # User profile page
│   ├── Login.tsx        # Login page
│   └── Register.tsx     # Registration page
├── config/              # Configuration files
│   └── supabaseClient.ts # Supabase client configuration
└── App.tsx             # Main app component
```

## 🎨 Design System

### Color Palette
- **Primary**: Indigo to Purple gradient (sidebar)
- **Secondary**: Orange to Pink gradient (content & right sidebar)
- **Background**: Gray to Blue gradient (main background)
- **Accent**: Various colored cards for different sections

### Typography
- **Headings**: Bold, large fonts with proper hierarchy
- **Body**: Clean, readable text with good contrast
- **Navigation**: Clear, accessible menu items

### Animations
- **Hover Effects**: Scale transforms on interactive elements
- **Transitions**: Smooth color and size changes
- **Progress Bars**: Animated fill effects

## 🔧 Configuration

### Tailwind CSS Configuration
The project uses Tailwind CSS with custom configuration:
- Custom color palette
- Custom box shadows
- Extended utility classes

### TypeScript Configuration
- Strict type checking enabled
- Proper component typing
- Interface definitions for all props

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Environment Variables
Make sure to set the following environment variables in production:
- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_ANON_KEY`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 Development Notes

### Component Architecture
- **Functional Components**: All components are functional with hooks
- **Props Interface**: Each component has properly defined TypeScript interfaces
- **State Management**: Local state with React hooks
- **Styling**: Tailwind CSS classes for consistent styling

### Authentication Flow
- Uses Supabase Auth for user authentication
- Protected routes implemented with React Router
- Session management with automatic token refresh

### Responsive Design
- Mobile-first approach
- Flexible grid layouts
- Adaptive sidebar behavior
- Touch-friendly interactions

## 🐛 Troubleshooting

### Common Issues

1. **Tailwind CSS not working**
   - Ensure PostCSS configuration is correct
   - Check that Tailwind dependencies are installed
   - Restart the development server

2. **Supabase connection issues**
   - Verify environment variables are set correctly
   - Check Supabase project settings
   - Ensure network connectivity

3. **Image not displaying**
   - Use absolute paths from `/` for public folder images
   - Verify image exists in `public/images/` directory
   - Check file extensions and capitalization

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [React](https://reactjs.org/) - UI framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Supabase](https://supabase.com/) - Backend services
- [React Router](https://reactrouter.com/) - Routing solution

---

**Happy Coding! 📚✨**
