import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../config/supabaseClient'

interface NavbarProps {
  user: any
}

const Navbar: React.FC<NavbarProps> = ({ user }) => {
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold">
              Library System
            </Link>
            <div className="hidden md:flex ml-10 space-x-4">
              <Link to="/books" className="hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium">
                Browse Books
              </Link>
              {user && (
                <Link to="/my-books" className="hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium">
                  My Books
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link to="/profile" className="hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium">
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-md text-sm font-medium"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="bg-blue-500 hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-md text-sm font-medium"
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
