const express = require('express');
const supabase = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');
const { validateReview } = require('../middleware/validation');

const router = express.Router();

// Get reviews for a book
router.get('/book/:bookId', async (req, res) => {
  try {
    const { bookId } = req.params;
    const { page = 1, limit = 10, sort = 'created_at', order = 'desc' } = req.query;
    const offset = (page - 1) * limit;

    // First check if book exists and is approved
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('id, title, approval_status')
      .eq('id', bookId)
      .single();

    if (bookError || !book) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Book not found'
      });
    }

    if (book.approval_status !== 'approved') {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Book not available'
      });
    }

    const { data: reviews, error, count } = await supabase
      .from('reviews')
      .select(`
        *,
        users!reviews_user_id_fkey (
          email,
          role
        )
      `, { count: 'exact' })
      .eq('book_id', bookId)
      .order(sort, { ascending: order === 'asc' })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Reviews fetch error:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to fetch reviews'
      });
    }

    res.json({
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Reviews route error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch reviews'
    });
  }
});

// Create or update a review for a book
router.post('/book/:bookId', authenticateToken, validateReview, async (req, res) => {
  try {
    const { bookId } = req.params;
    const { rating, review_text } = req.body;

    // Check if book exists and is approved
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('id, title, approval_status')
      .eq('id', bookId)
      .single();

    if (bookError || !book) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Book not found'
      });
    }

    if (book.approval_status !== 'approved') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Cannot review unapproved book'
      });
    }

    // Check if user has already reviewed this book
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('*')
      .eq('book_id', bookId)
      .eq('user_id', req.user.id)
      .single();

    let review;
    let message;

    if (existingReview) {
      // Update existing review
      const { data: updatedReview, error } = await supabase
        .from('reviews')
        .update({
          rating,
          review_text: review_text || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingReview.id)
        .select(`
          *,
          users!reviews_user_id_fkey (
            email
          )
        `)
        .single();

      if (error) {
        console.error('Review update error:', error);
        return res.status(500).json({
          error: 'Database Error',
          message: 'Failed to update review'
        });
      }

      review = updatedReview;
      message = 'Review updated successfully';
    } else {
      // Create new review
      const { data: newReview, error } = await supabase
        .from('reviews')
        .insert([
          {
            book_id: bookId,
            user_id: req.user.id,
            rating,
            review_text: review_text || null
          }
        ])
        .select(`
          *,
          users!reviews_user_id_fkey (
            email
          )
        `)
        .single();

      if (error) {
        console.error('Review creation error:', error);
        return res.status(500).json({
          error: 'Database Error',
          message: 'Failed to create review'
        });
      }

      review = newReview;
      message = 'Review created successfully';
    }

    res.status(existingReview ? 200 : 201).json({
      message,
      review
    });
  } catch (error) {
    console.error('Review creation error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to save review'
    });
  }
});

// Delete a review
router.delete('/:reviewId', authenticateToken, async (req, res) => {
  try {
    const { reviewId } = req.params;

    // Check if review exists and belongs to user
    const { data: review, error: fetchError } = await supabase
      .from('reviews')
      .select('*')
      .eq('id', reviewId)
      .single();

    if (fetchError || !review) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Review not found'
      });
    }

    if (review.user_id !== req.user.id) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only delete your own reviews'
      });
    }

    // Delete the review
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId);

    if (error) {
      console.error('Review deletion error:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to delete review'
      });
    }

    res.json({
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Review deletion error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete review'
    });
  }
});

// Get user's reviews
router.get('/my-reviews', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { data: reviews, error, count } = await supabase
      .from('reviews')
      .select(`
        *,
        books!reviews_book_id_fkey (
          id,
          title,
          author,
          approval_status
        )
      `, { count: 'exact' })
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('User reviews fetch error:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to fetch your reviews'
      });
    }

    res.json({
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('User reviews route error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch your reviews'
    });
  }
});

// Get review statistics for a book
router.get('/stats/:bookId', async (req, res) => {
  try {
    const { bookId } = req.params;

    // Check if book exists and is approved
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('id, title, approval_status, average_rating, rating_count')
      .eq('id', bookId)
      .single();

    if (bookError || !book) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Book not found'
      });
    }

    if (book.approval_status !== 'approved') {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Book not available'
      });
    }

    // Get rating distribution
    const { data: ratingDistribution } = await supabase
      .from('reviews')
      .select('rating')
      .eq('book_id', bookId);

    const distribution = [1, 2, 3, 4, 5].map(rating => ({
      rating,
      count: ratingDistribution?.filter(r => r.rating === rating).length || 0
    }));

    res.json({
      book_id: bookId,
      average_rating: book.average_rating || 0,
      total_reviews: book.rating_count || 0,
      rating_distribution: distribution
    });
  } catch (error) {
    console.error('Review stats error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch review statistics'
    });
  }
});

module.exports = router;
