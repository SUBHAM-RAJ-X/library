import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../config/supabaseClient'
import { api, API_ENDPOINTS } from '../services/apiService'
import DashboardLayout from "../components/DashboardLayout"

interface Book {
  id: string
  title: string
  author: string
  description: string
  category: string
  rack_letter: string
  total_pages: number
  average_rating: number
  download_count: number
  created_at: string
}

const Books: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedRack, setSelectedRack] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)

  useEffect(() => {
    fetchBooks()
  }, [searchQuery, selectedCategory, selectedRack, currentPage])

  const fetchBooks = async () => {
    setLoading(true)
    try {
      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
        ...(searchQuery && { search: searchQuery }),
        ...(selectedCategory && { category: selectedCategory }),
        ...(selectedRack && { rack: selectedRack }),
      })

      const response = await api.get(`${API_ENDPOINTS.BOOKS}?${params}`)
      const data = await response.json()
      
      setBooks(data.books || [])
      setTotalPages(Math.ceil((data.total || 0) / 12))
    } catch (error) {
      console.error('Error fetching books:', error)
      // Fallback to Supabase if API fails
      try {
        let query = supabase
          .from('books')
          .select('*', { count: 'exact' })
          .eq('is_approved', true)
          .order('created_at', { ascending: false })
          .range((currentPage - 1) * 12, currentPage * 12 - 1)

        if (searchQuery) {
          query = query.ilike('title', `%${searchQuery}%`)
        }

        if (selectedCategory) {
          query = query.eq('category', selectedCategory)
        }

        if (selectedRack) {
          query = query.eq('rack_letter', selectedRack)
        }

        const { data, error, count } = await query

        if (error) throw error
        setBooks(data || [])
        setTotalPages(Math.ceil((count || 0) / 12))
      } catch (supabaseError) {
        console.error('Supabase fallback also failed:', supabaseError)
      }
    } finally {
      setLoading(false)
    }
  }

  const categories = ['Fiction', 'Non-Fiction', 'Science', 'Technology', 'History', 'Biography']
  const racks = ['A', 'B', 'C', 'D', 'E', 'F']

  return (
  <DashboardLayout>
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">

      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Discover Books
      </h1>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <input
              type="text"
              placeholder="Search by title..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rack
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              value={selectedRack}
              onChange={(e) => setSelectedRack(e.target.value)}
            >
              <option value="">All Racks</option>
              {racks.map((rack) => (
                <option key={rack} value={rack}>
                  Rack {rack}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchQuery('')
                setSelectedCategory('')
                setSelectedRack('')
                setCurrentPage(1)
              }}
              className="w-full bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
            >
              Clear Filters
            </button>
          </div>

        </div>
      </div>

      {/* Books Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading books...</p>
        </div>
      ) : books.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">No books found matching your criteria.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {books.map((book) => (
              <div
  key={book.id}
  className="bg-white rounded-xl shadow-card hover:-translate-y-1 transition transform"
>
                <div className="p-6">
                  {/* Book Cover Placeholder */}
                  <div className="h-40 bg-gradient-to-br from-blue-100 to-blue-300 rounded-md mb-4 flex items-center justify-center text-xl font-bold text-blue-700">
                    {book.title.charAt(0)}
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      Rack {book.rack_letter}
                    </span>
                    <span className="text-sm text-gray-500">
                      ⭐ {book.average_rating?.toFixed(1) || "0.0"}
                    </span>
                  </div>

                  <h3 className="font-semibold line-clamp-2">
                    {book.title}
                  </h3>
                  <p className="text-sm text-gray-500 mb-3">
                    by {book.author}
                  </p>

                  <Link
                    to={`/books/${book.id}`}
                    className="text-blue-600 text-sm font-medium"
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center mt-8 gap-3">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border rounded disabled:opacity-50"
              >
                Previous
              </button>

              <span className="px-4 py-2">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

    </div>
  </DashboardLayout>
)
}

export default Books
