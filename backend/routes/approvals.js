const express = require('express');
const supabase = require('../config/supabase');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get pending books for approval (admin only)
router.get('/pending', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = Number.parseInt(page, 10) || 1;
    const limitNum = Number.parseInt(limit, 10) || 10;
    const offset = (pageNum - 1) * limitNum;

    const { data: books, error, count } = await supabase
      .from('books')
      .select(`
        *,
        users!books_uploaded_by_fkey (
          email,
          role
        )
      `, { count: 'exact' })
      .eq('approval_status', 'pending')
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (error) {
      console.error('Pending books fetch error:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to fetch pending books'
      });
    }

    res.json({
      books,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limitNum)
      }
    });
  } catch (error) {
    console.error('Pending books route error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch pending books'
    });
  }
});

// Approve a book (admin only)
router.post('/approve/:bookId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { bookId } = req.params;

    // Check if book exists and is pending
    const { data: book, error: fetchError } = await supabase
      .from('books')
      .select('id, title, approval_status')
      .eq('id', bookId)
      .single();

    if (fetchError || !book) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Book not found'
      });
    }

    if (book.approval_status !== 'pending') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Book is not pending approval'
      });
    }

    // Approve the book
    const { data: approvedBook, error } = await supabase
      .from('books')
      .update({
        approval_status: 'approved',
        approved_by: req.user.id,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', bookId)
      .select(`
        *,
        users!books_uploaded_by_fkey (
          email
        )
      `)
      .single();

    if (error) {
      console.error('Book approval error:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to approve book'
      });
    }

    res.json({
      message: 'Book approved successfully',
      book: approvedBook
    });
  } catch (error) {
    console.error('Book approval error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to approve book'
    });
  }
});

// Reject a book (admin only)
router.post('/reject/:bookId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { bookId } = req.params;
    const { rejection_reason } = req.body;

    if (!rejection_reason || rejection_reason.trim().length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Rejection reason is required'
      });
    }

    // Check if book exists and is pending
    const { data: book, error: fetchError } = await supabase
      .from('books')
      .select('id, title, approval_status, file_url')
      .eq('id', bookId)
      .single();

    if (fetchError || !book) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Book not found'
      });
    }

    if (book.approval_status !== 'pending') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Book is not pending approval'
      });
    }

    // Reject the book
    const { data: rejectedBook, error } = await supabase
      .from('books')
      .update({
        approval_status: 'rejected',
        approved_by: req.user.id,
        approved_at: new Date().toISOString(),
        rejection_reason: rejection_reason.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', bookId)
      .select(`
        *,
        users!books_uploaded_by_fkey (
          email
        )
      `)
      .single();

    if (error) {
      console.error('Book rejection error:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to reject book'
      });
    }

    res.json({
      message: 'Book rejected successfully',
      book: rejectedBook
    });
  } catch (error) {
    console.error('Book rejection error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to reject book'
    });
  }
});

// Get approval statistics (admin only)
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { data: statusRows, error: statusError } = await supabase
      .from('books')
      .select('approval_status, created_at');

    if (statusError) {
      console.error('Approval status stats error:', statusError);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to fetch approval status counts'
      });
    }

    const statusCounts = (statusRows || []).reduce((acc, book) => {
      const key = book.approval_status || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const pendingToday = (statusRows || []).filter((book) => {
      if (book.approval_status !== 'pending' || !book.created_at) return false;
      return new Date(book.created_at) >= todayStart;
    }).length;

    // Get recent approvals
    const { data: recentApprovals } = await supabase
      .from('books')
      .select(`
        id,
        title,
        approval_status,
        approved_at,
        users!books_approved_by_fkey (
          email
        )
      `)
      .in('approval_status', ['approved', 'rejected'])
      .not('approved_at', 'is', null)
      .order('approved_at', { ascending: false })
      .limit(10);

    // Get pending books count
    const { count: pendingCount } = await supabase
      .from('books')
      .select('*', { count: 'exact', head: true })
      .eq('approval_status', 'pending');

    res.json({
      total_pending: pendingCount || 0,
      status_counts: statusCounts || {},
      pending_today: pendingToday,
      recent_approvals: recentApprovals || []
    });
  } catch (error) {
    console.error('Approval stats error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch approval statistics'
    });
  }
});

// Get user's uploaded books with approval status
router.get('/my-uploads', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { data: books, error, count } = await supabase
      .from('books')
      .select(`
        *,
        users!books_approved_by_fkey (
          email
        )
      `, { count: 'exact' })
      .eq('uploaded_by', req.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('User uploads fetch error:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to fetch your uploads'
      });
    }

    res.json({
      books,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('User uploads route error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch your uploads'
    });
  }
});

module.exports = router;
