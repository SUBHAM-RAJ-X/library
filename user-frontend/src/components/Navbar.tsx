import React from "react"
import { Link, useNavigate } from "react-router-dom"
import { supabase } from "../config/supabaseClient"

interface NavbarProps {
  user: any
}

const Navbar: React.FC<NavbarProps> = ({ user }) => {
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate("/")
  }

  return (
    <nav className="bg-white shadow-card sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">

          {/* Left */}
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-blue-700">
              📚 Library System
            </Link>

            <div className="hidden md:flex ml-10 space-x-2">
              <Link
                to="/books"
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition"
              >
                Browse Books
              </Link>

              {user && (
                <Link
                  to="/my-books"
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition"
                >
                  My Books
                </Link>
              )}
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center space-x-3">
            {user ? (
              <>
                <Link
                  to="/profile"
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition"
                >
                  Profile
                </Link>

                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition"
                >
                  Login
                </Link>

                <Link
                  to="/register"
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition"
                >
                  Register
                </Link>
              </>
            )}
          </div>

        </div>
      </div>
    </nav>
  )
}

export default Navbar