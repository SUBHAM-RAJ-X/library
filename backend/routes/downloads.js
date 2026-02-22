const express = require('express');
const supabase = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Record a download
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { book_id } = req.body;

    if (!book_id) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Book ID is required'
      });
    }

    // Check if book exists
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('id, title, download_count')
      .eq('id', book_id)
      .single();

    if (bookError || !book) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Book not found'
      });
    }

    // Check if download already exists for this user
    const { data: existingDownload, error: checkError } = await supabase
      .from('downloads')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('book_id', book_id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Download check error:', checkError);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to check existing download'
      });
    }

    // If download doesn't exist, create it
    if (!existingDownload) {
      const { error: downloadError } = await supabase
        .from('downloads')
        .insert([
          {
            user_id: req.user.id,
            book_id: book_id,
            downloaded_at: new Date().toISOString()
          }
        ]);

      if (downloadError) {
        console.error('Download creation error:', downloadError);
        return res.status(500).json({
          error: 'Database Error',
          message: 'Failed to record download'
        });
      }
    }

    // Update book download count
    const { error: updateError } = await supabase
      .from('books')
      .update({
        download_count: book.download_count + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', book_id);

    if (updateError) {
      console.error('Download count update error:', updateError);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to update download count'
      });
    }

    res.json({
      message: 'Download recorded successfully',
      download_count: book.download_count + 1
    });
  } catch (error) {
    console.error('Download route error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to record download'
    });
  }
});

// Get user's download history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { data: downloads, error, count } = await supabase
      .from('downloads')
      .select(`
        *,
        books!downloads_book_id_fkey (
          id,
          title,
          author,
          category,
          file_url,
          download_count
        )
      `, { count: 'exact' })
      .eq('user_id', req.user.id)
      .order('downloaded_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Download history fetch error:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to fetch download history'
      });
    }

    res.json({
      downloads,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Download history route error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch download history'
    });
  }
});

// Get most downloaded books (admin only)
router.get('/most-downloaded', authenticateToken, async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Admin access required'
      });
    }

    const { data: books, error } = await supabase
      .from('books')
      .select(`
        id,
        title,
        author,
        category,
        download_count,
        created_at,
        users!books_uploaded_by_fkey (
          email
        )
      `)
      .order('download_count', { ascending: false })
      .limit(parseInt(limit));

    if (error) {
      console.error('Most downloaded fetch error:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to fetch most downloaded books'
      });
    }

    res.json({
      books
    });
  } catch (error) {
    console.error('Most downloaded route error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch most downloaded books'
    });
  }
});

// Get download statistics for a book
router.get('/stats/:book_id', authenticateToken, async (req, res) => {
  try {
    const { book_id } = req.params;

    // Check if user owns the book or is admin
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('uploaded_by, download_count')
      .eq('id', book_id)
      .single();

    if (bookError || !book) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Book not found'
      });
    }

    if (book.uploaded_by !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied'
      });
    }

    // Get download statistics
    const { data: stats, error: statsError } = await supabase
      .from('downloads')
      .select('downloaded_at, user_id')
      .eq('book_id', book_id);

    if (statsError) {
      console.error('Download stats fetch error:', statsError);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to fetch download statistics'
      });
    }

    // Calculate statistics
    const totalDownloads = stats.length;
    const uniqueUsers = new Set(stats.map(d => d.user_id)).size;
    const recentDownloads = stats.filter(d => {
      const downloadDate = new Date(d.downloaded_at);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return downloadDate > thirtyDaysAgo;
    }).length;

    res.json({
      book_id,
      total_downloads: totalDownloads,
      unique_downloaders: uniqueUsers,
      recent_downloads_30_days: recentDownloads,
      download_count_in_db: book.download_count
    });
  } catch (error) {
    console.error('Download stats route error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch download statistics'
    });
  }
});

module.exports = router;
