import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../config/supabaseClient'

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

interface Review {
  id: string
  rating: number
  review_text: string
  user_id: string
  book_id: string
  created_at: string
  users: {
    email: string
  }
}

const BookDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [book, setBook] = useState<Book | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [newReview, setNewReview] = useState({ rating: 5, review_text: '' })
  const [readingProgress, setReadingProgress] = useState(0)

  useEffect(() => {
    if (id) {
      fetchBook()
      fetchReviews()
      checkUser()
    }
  }, [id])

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    setUser(session?.user)
  }

  const fetchBook = async () => {
    try {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      setBook(data)
    } catch (error) {
      console.error('Error fetching book:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          users (email)
        `)
        .eq('book_id', id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setReviews(data || [])
    } catch (error) {
      console.error('Error fetching reviews:', error)
    }
  }

  const handleDownload = async () => {
    if (!book || !user) {
      navigate('/login')
      return
    }

    try {
      // Increment download count
      await supabase
        .from('books')
        .update({ download_count: book.download_count + 1 })
        .eq('id', book.id)

      // Add to downloads
      await supabase
        .from('downloads')
        .insert({
          user_id: user.id,
          book_id: book.id
        })

      alert('Download started! (This would trigger actual file download)')
      setBook({ ...book, download_count: book.download_count + 1 })
    } catch (error) {
      console.error('Error downloading book:', error)
    }
  }

  const handleSubmitReview = async () => {
    if (!user || !book) return

    try {
      const { error } = await supabase
        .from('reviews')
        .insert({
          user_id: user.id,
          book_id: book.id,
          rating: newReview.rating,
          review_text: newReview.review_text
        })

      if (error) throw error

      setNewReview({ rating: 5, review_text: '' })
      fetchReviews()
      fetchBook() // Refresh to update average rating
    } catch (error) {
      console.error('Error submitting review:', error)
    }
  }

  const updateReadingProgress = async () => {
    if (!user || !book) return

    try {
      await supabase
        .from('reading_progress')
        .upsert({
          user_id: user.id,
          book_id: book.id,
          current_page: readingProgress,
          total_pages: book.total_pages
        })

      alert('Reading progress updated!')
    } catch (error) {
      console.error('Error updating progress:', error)
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading book details...</p>
        </div>
      </div>
    )
  }

  if (!book) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-600">Book not found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Book Info */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <span className="inline-block px-3 py-1 text-sm font-semibold text-blue-800 bg-blue-100 rounded">
                  Rack {book.rack_letter}
                </span>
                <span className="text-sm text-gray-500">
                  ⭐ {book.average_rating?.toFixed(1) || '0.0'} ({reviews.length} reviews)
                </span>
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{book.title}</h1>
              <p className="text-lg text-gray-600 mb-4">by {book.author}</p>
              
              <div className="mb-6">
                <span className="inline-block px-3 py-1 text-sm font-medium text-gray-800 bg-gray-100 rounded">
                  {book.category}
                </span>
                <span className="ml-4 text-sm text-gray-500">
                  {book.total_pages} pages
                </span>
                <span className="ml-4 text-sm text-gray-500">
                  📥 {book.download_count} downloads
                </span>
              </div>

              <div className="prose max-w-none">
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <p className="text-gray-700">{book.description}</p>
              </div>

              {/* Reading Progress */}
              {user && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">Reading Progress</h3>
                  <div className="flex items-center space-x-4">
                    <input
                      type="number"
                      min="0"
                      max={book.total_pages}
                      placeholder="Current page"
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={readingProgress}
                      onChange={(e) => setReadingProgress(parseInt(e.target.value) || 0)}
                    />
                    <span className="text-gray-600">/ {book.total_pages} pages</span>
                    <button
                      onClick={updateReadingProgress}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                      Update Progress
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="lg:col-span-1">
              <div className="space-y-4">
                <button
                  onClick={handleDownload}
                  className="w-full bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 font-medium"
                >
                  Download Book
                </button>
                
                {user && (
                  <button
                    className="w-full bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 font-medium"
                  >
                    Add to My Books
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="mt-12 border-t pt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Reviews</h2>
            
            {/* Add Review */}
            {user && (
              <div className="mb-8 p-6 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Write a Review</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={newReview.rating}
                      onChange={(e) => setNewReview({ ...newReview, rating: parseInt(e.target.value) })}
                    >
                      <option value={5}>5 Stars</option>
                      <option value={4}>4 Stars</option>
                      <option value={3}>3 Stars</option>
                      <option value={2}>2 Stars</option>
                      <option value={1}>1 Star</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Review</label>
                    <textarea
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Share your thoughts about this book..."
                      value={newReview.review_text}
                      onChange={(e) => setNewReview({ ...newReview, review_text: e.target.value })}
                    />
                  </div>
                  <button
                    onClick={handleSubmitReview}
                    className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
                  >
                    Submit Review
                  </button>
                </div>
              </div>
            )}

            {/* Reviews List */}
            <div className="space-y-4">
              {reviews.length === 0 ? (
                <p className="text-gray-600">No reviews yet. Be the first to review this book!</p>
              ) : (
                reviews.map((review) => (
                  <div key={review.id} className="p-4 bg-white border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{review.users.email}</span>
                      <div className="flex items-center">
                        <span className="text-yellow-500">{'⭐'.repeat(review.rating)}</span>
                        <span className="ml-2 text-sm text-gray-500">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {review.review_text && (
                      <p className="text-gray-700">{review.review_text}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BookDetail
