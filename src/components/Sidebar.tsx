import React from "react"
import { Link, useLocation } from "react-router-dom"
import { supabase } from "../config/supabaseClient"

interface SidebarProps {
  user: any
}

const Sidebar: React.FC<SidebarProps> = ({ user }) => {
  const location = useLocation()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = "/"
  }

  const menuItems = [
    { path: "/", label: "Home", icon: "🏠" },
    { path: "/books", label: "Browse Books", icon: "📚" },
    { path: "/my-books", label: "My Books", icon: "📖" },
    { path: "/bookmarks", label: "Bookmarks", icon: "🔖" },
    { path: "/reviews", label: "My Reviews", icon: "⭐" },
  ]

  return (
    <div className="bg-gradient-to-b from-orange-50 to-pink-50 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 min-h-full text-black">
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-8 flex items-center">
          <span className="mr-2">📚</span>
          Library
        </h1>
        
        {user && (
          <div className="mb-6 p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
            <p className="text-sm font-medium text-white">{user.email}</p>
            <p className="text-xs text-blue-200">Student</p>
          </div>
        )}

        <nav className="space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-4 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 ${
                location.pathname === item.path
                  ? "bg-white text-indigo-600 font-medium shadow-lg"
                  : "text-black hover:bg-white/10"
              }`}
            >
              <span className="mr-3 text-lg">{item.icon}</span>
              <span className="text-black">{item.label}</span>
            </Link>
          ))}
        </nav>

        {user && (
          <div className="mt-8 pt-8 border-t border-white/20">
            <Link
              to="/profile"
              className={`flex items-center px-4 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 mb-2 ${
                location.pathname === "/profile"
                  ? "bg-white text-indigo-600 font-medium shadow-lg"
                  : "text-black hover:bg-white/10"
              }`}
            >
              <span className="mr-3 text-lg">👤</span>
              <span className="text-black">Profile</span>
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-3 rounded-lg text-black hover:bg-red-500/20 transition-all duration-300 transform hover:scale-105"
            >
              <span className="mr-3 text-lg">🚪</span>
              <span className="text-black">Logout</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Sidebar
