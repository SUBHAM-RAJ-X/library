const express = require('express');
const supabase = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get reading progress for a specific book
router.get('/book/:bookId', authenticateToken, async (req, res) => {
  try {
    const { bookId } = req.params;

    // Check if book exists and is approved
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('id, title, approval_status, total_pages')
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

    // Get user's reading progress
    const { data: progress, error } = await supabase
      .from('reading_progress')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('book_id', bookId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Reading progress fetch error:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to fetch reading progress'
      });
    }

    // If no progress exists, return default
    if (!progress) {
      return res.json({
        progress: {
          user_id: req.user.id,
          book_id: bookId,
          current_page: 0,
          total_pages: book.total_pages || 0,
          progress_percentage: 0.00,
          last_read_at: null,
          is_completed: false,
          completed_at: null
        }
      });
    }

    res.json({ progress });
  } catch (error) {
    console.error('Reading progress route error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch reading progress'
    });
  }
});

// Update reading progress for a book
router.put('/book/:bookId', authenticateToken, async (req, res) => {
  try {
    const { bookId } = req.params;
    const { current_page, total_pages } = req.body;

    if (current_page < 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Current page cannot be negative'
      });
    }

    // Check if book exists and is approved
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('id, title, approval_status, total_pages')
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
        message: 'Cannot update progress for unapproved book'
      });
    }

    const finalTotalPages = total_pages || book.total_pages || 0;

    // Check if progress already exists
    const { data: existingProgress } = await supabase
      .from('reading_progress')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('book_id', bookId)
      .single();

    let progress;
    let message;

    if (existingProgress) {
      // Update existing progress
      const { data: updatedProgress, error } = await supabase
        .from('reading_progress')
        .update({
          current_page,
          total_pages: finalTotalPages,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingProgress.id)
        .select('*')
        .single();

      if (error) {
        console.error('Reading progress update error:', error);
        return res.status(500).json({
          error: 'Database Error',
          message: 'Failed to update reading progress'
        });
      }

      progress = updatedProgress;
      message = 'Reading progress updated successfully';
    } else {
      // Create new progress record
      const { data: newProgress, error } = await supabase
        .from('reading_progress')
        .insert([
          {
            user_id: req.user.id,
            book_id: bookId,
            current_page,
            total_pages: finalTotalPages
          }
        ])
        .select('*')
        .single();

      if (error) {
        console.error('Reading progress creation error:', error);
        return res.status(500).json({
          error: 'Database Error',
          message: 'Failed to create reading progress'
        });
      }

      progress = newProgress;
      message = 'Reading progress created successfully';
    }

    res.json({
      message,
      progress
    });
  } catch (error) {
    console.error('Reading progress update error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update reading progress'
    });
  }
});

// Get all reading progress for the user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status = 'all' } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('reading_progress')
      .select(`
        *,
        books!reading_progress_book_id_fkey (
          id,
          title,
          author,
          approval_status,
          total_pages
        )
      `, { count: 'exact' })
      .eq('user_id', req.user.id);

    // Filter by status if specified
    if (status === 'completed') {
      query = query.eq('is_completed', true);
    } else if (status === 'reading') {
      query = query.eq('is_completed', false).gt('current_page', 0);
    } else if (status === 'not-started') {
      query = query.eq('current_page', 0);
    }

    const { data: progressList, error, count } = await query
      .order('last_read_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Reading progress list fetch error:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to fetch reading progress'
      });
    }

    // Filter out books that are not approved
    const approvedProgress = progressList?.filter(
      p => p.books && p.books.approval_status === 'approved'
    ) || [];

    res.json({
      progress: approvedProgress,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Reading progress list error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch reading progress'
    });
  }
});

// Mark book as completed
router.post('/complete/:bookId', authenticateToken, async (req, res) => {
  try {
    const { bookId } = req.params;

    // Check if book exists and is approved
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('id, title, approval_status, total_pages')
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
        message: 'Cannot complete unapproved book'
      });
    }

    // Update or create progress with completion status
    const { data: progress, error } = await supabase
      .from('reading_progress')
      .upsert(
        {
          user_id: req.user.id,
          book_id: bookId,
          current_page: book.total_pages || 0,
          total_pages: book.total_pages || 0,
          is_completed: true,
          completed_at: new Date().toISOString(),
          last_read_at: new Date().toISOString()
        },
        {
          onConflict: 'user_id,book_id',
          ignoreDuplicates: false
        }
      )
      .select('*')
      .single();

    if (error) {
      console.error('Book completion error:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to mark book as completed'
      });
    }

    res.json({
      message: 'Book marked as completed successfully',
      progress
    });
  } catch (error) {
    console.error('Book completion error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to mark book as completed'
    });
  }
});

// Get reading statistics for the user
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    // Get all reading progress for user
    const { data: allProgress } = await supabase
      .from('reading_progress')
      .select(`
        *,
        books!reading_progress_book_id_fkey (
          id,
          title,
          approval_status
        )
      `)
      .eq('user_id', req.user.id);

    // Filter approved books
    const approvedProgress = allProgress?.filter(
      p => p.books && p.books.approval_status === 'approved'
    ) || [];

    const totalBooks = approvedProgress.length;
    const completedBooks = approvedProgress.filter(p => p.is_completed).length;
    const currentlyReading = approvedProgress.filter(p => !p.is_completed && p.current_page > 0).length;
    const notStarted = approvedProgress.filter(p => p.current_page === 0).length;

    // Calculate total pages read
    const totalPagesRead = approvedProgress.reduce((sum, p) => sum + (p.current_page || 0), 0);

    // Get recently completed books
    const recentlyCompleted = approvedProgress
      .filter(p => p.is_completed && p.completed_at)
      .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))
      .slice(0, 5)
      .map(p => ({
        id: p.books.id,
        title: p.books.title,
        completed_at: p.completed_at
      }));

    res.json({
      total_books: totalBooks,
      completed_books: completedBooks,
      currently_reading: currentlyReading,
      not_started: notStarted,
      total_pages_read: totalPagesRead,
      completion_rate: totalBooks > 0 ? ((completedBooks / totalBooks) * 100).toFixed(2) : 0,
      recently_completed
    });
  } catch (error) {
    console.error('Reading stats error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch reading statistics'
    });
  }
});

module.exports = router;
