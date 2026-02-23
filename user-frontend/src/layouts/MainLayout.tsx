import React from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import RightSidebar from '../components/RightSidebar'

interface MainLayoutProps {
  user: any
  children?: React.ReactNode
}

const MainLayout: React.FC<MainLayoutProps> = ({ user, children }) => {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Left Sidebar */}
      <Sidebar user={user} />
      
      {/* Main Content */}
      <div className="flex-1 max-w-5xl mx-auto">
        <main className="p-8">
          <div className="bg-gradient-to-b from-orange-50 to-pink-50 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 min-h-full">
            <div className="p-8">
              {children || <Outlet />}
            </div>
          </div>
        </main>
      </div>
      
      {/* Right Sidebar */}
      <RightSidebar />
    </div>
  )
}

export default MainLayout
