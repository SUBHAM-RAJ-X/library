import React from "react"
import { Link } from "react-router-dom"

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-soft">
      
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-card hidden md:block">
        <div className="p-6 text-xl font-bold text-primary">
          📚 Library
        </div>

        <nav className="px-4 space-y-2">
          <Link className="block px-4 py-2 rounded hover:bg-blue-50" to="/books">Discover</Link>
          <Link className="block px-4 py-2 rounded hover:bg-blue-50" to="/my-books">My Books</Link>
          <Link className="block px-4 py-2 rounded hover:bg-blue-50" to="/profile">Profile</Link>
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  )
}

export default DashboardLayout