import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../config/supabaseClient'

interface Download {
  id: string
  book_id: string
  downloaded_at: string
  books: {
    id: string
    title: string
    author: string
    category: string
    rack_letter: string
    total_pages: number
    average_rating: number
  }
}

interface ReadingProgress {
  id: string
  book_id: string
  current_page: number
  total_pages: number
  books: {
    id: string
    title: string
    author: string
    total_pages: number
  }
}

interface Bookmark {
  id: string
  book_id: string
  page_number: number
  note: string
  books: {
    id: string
    title: string
    author: string
  }
}

const MyBooks: React.FC = () => {
  const [downloads, setDownloads] = useState<Download[]>([])
  const [readingProgress, setReadingProgress] = useState<ReadingProgress[]>([])
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'downloads' | 'progress' | 'bookmarks'>('downloads')

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const userId = session.user.id

      // Fetch downloads
      const { data: downloadsData } = await supabase
        .from('downloads')
        .select(`
          *,
          books (*)
        `)
        .eq('user_id', userId)
        .order('downloaded_at', { ascending: false })

      // Fetch reading progress
      const { data: progressData } = await supabase
        .from('reading_progress')
        .select(`
          *,
          books (*)
        `)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })

      // Fetch bookmarks
      const { data: bookmarksData } = await supabase
        .from('bookmarks')
        .select(`
          *,
          books (*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      setDownloads(downloadsData || [])
      setReadingProgress(progressData || [])
      setBookmarks(bookmarksData || [])
    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateProgress = (current: number, total: number) => {
    if (total === 0) return 0
    return Math.round((current / total) * 100)
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading your books...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Books</h1>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('downloads')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'downloads'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Downloads ({downloads.length})
          </button>
          <button
            onClick={() => setActiveTab('progress')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'progress'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Reading Progress ({readingProgress.length})
          </button>
          <button
            onClick={() => setActiveTab('bookmarks')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'bookmarks'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Bookmarks ({bookmarks.length})
          </button>
        </nav>
      </div>

      {/* Downloads Tab */}
      {activeTab === 'downloads' && (
        <div>
          {downloads.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">You haven't downloaded any books yet.</p>
              <Link
                to="/books"
                className="mt-4 inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
              >
                Browse Books
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {downloads.map((download) => (
                <div key={download.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{download.books.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">by {download.books.author}</p>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs text-gray-500">{download.books.category}</span>
                      <span className="text-xs text-gray-500">
                        ⭐ {download.books.average_rating?.toFixed(1) || '0.0'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mb-4">
                      Downloaded on {new Date(download.downloaded_at).toLocaleDateString()}
                    </div>
                    <Link
                      to={`/books/${download.book_id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reading Progress Tab */}
      {activeTab === 'progress' && (
        <div>
          {readingProgress.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No reading progress tracked yet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {readingProgress.map((progress) => (
                <div key={progress.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{progress.books.title}</h3>
                      <p className="text-sm text-gray-600">by {progress.books.author}</p>
                    </div>
                    <Link
                      to={`/books/${progress.book_id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View Book →
                    </Link>
                  </div>
                  <div className="mb-2">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progress: {progress.current_page} / {progress.total_pages} pages</span>
                      <span>{calculateProgress(progress.current_page, progress.total_pages)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${calculateProgress(progress.current_page, progress.total_pages)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bookmarks Tab */}
      {activeTab === 'bookmarks' && (
        <div>
          {bookmarks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No bookmarks saved yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookmarks.map((bookmark) => (
                <div key={bookmark.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{bookmark.books.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">by {bookmark.books.author}</p>
                      <div className="flex items-center mb-2">
                        <span className="inline-block px-2 py-1 text-xs font-semibold text-blue-800 bg-blue-100 rounded mr-2">
                          Page {bookmark.page_number}
                        </span>
                      </div>
                      {bookmark.note && (
                        <div className="bg-gray-50 p-3 rounded-md">
                          <p className="text-sm text-gray-700 italic">"{bookmark.note}"</p>
                        </div>
                      )}
                    </div>
                    <Link
                      to={`/books/${bookmark.book_id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium ml-4"
                    >
                      View Book →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default MyBooks
