import React, { useState, useEffect } from 'react'
import { supabase } from '../config/supabaseClient'

const Profile: React.FC = () => {
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    downloads: 0,
    reviews: 0,
    bookmarks: 0
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      setUser(session.user)

      // Fetch user profile from database
      const { data: profileData } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()

      setUserProfile(profileData)

      // Fetch user stats
      const userId = session.user.id

      const { count: downloadCount } = await supabase
        .from('downloads')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      const { count: reviewCount } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      const { count: bookmarkCount } = await supabase
        .from('bookmarks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      setStats({
        downloads: downloadCount || 0,
        reviews: reviewCount || 0,
        bookmarks: bookmarkCount || 0
      })
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const StatCard = ({ title, value }: any) => (
    <div className="bg-white shadow-card rounded-xl p-6">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-600">Please log in to view your profile.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Profile Card */}
        <div className="bg-white shadow-card rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-1">👤 Profile</h2>
          <p className="text-gray-600 text-sm mb-4">
            Your account information
          </p>

          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>

            <div>
              <p className="text-xs text-gray-500">User ID</p>
              <p className="text-sm text-gray-700 break-all">{user.id}</p>
            </div>

            <div>
              <p className="text-xs text-gray-500">Role</p>
              <span className="inline-block mt-1 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full">
                {userProfile?.role || "Student"}
              </span>
            </div>

            <div>
              <p className="text-xs text-gray-500">Member Since</p>
              <p className="text-sm text-gray-700">
                {new Date(user.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Downloads" value={stats.downloads} />
          <StatCard title="Reviews" value={stats.reviews} />
          <StatCard title="Bookmarks" value={stats.bookmarks} />
        </div>

      </div>

      {/* Actions */}
      <div className="mt-8">
        <div className="bg-white shadow-card rounded-xl p-6 flex justify-end">
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 font-medium transition"
          >
            Sign Out
          </button>
        </div>
      </div>

    </div>
  )
}

export default Profile
