const express = require('express');
const supabase = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all bookmarks for a user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, book_id } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('bookmarks')
      .select(`
        *,
        books!bookmarks_book_id_fkey (
          id,
          title,
          author,
          approval_status,
          total_pages
        )
      `, { count: 'exact' })
      .eq('user_id', req.user.id);

    if (book_id) {
      query = query.eq('book_id', book_id);
    }

    const { data: bookmarks, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Bookmarks fetch error:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to fetch bookmarks'
      });
    }

    // Filter out bookmarks for unapproved books
    const approvedBookmarks = bookmarks?.filter(
      b => b.books && b.books.approval_status === 'approved'
    ) || [];

    res.json({
      bookmarks: approvedBookmarks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Bookmarks route error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch bookmarks'
    });
  }
});

// Get bookmarks for a specific book
router.get('/book/:bookId', authenticateToken, async (req, res) => {
  try {
    const { bookId } = req.params;

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
      return res.status(404).json({
        error: 'Not Found',
        message: 'Book not available'
      });
    }

    const { data: bookmarks, error } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('book_id', bookId)
      .order('page_number', { ascending: true });

    if (error) {
      console.error('Book bookmarks fetch error:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to fetch book bookmarks'
      });
    }

    res.json({ bookmarks });
  } catch (error) {
    console.error('Book bookmarks route error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch book bookmarks'
    });
  }
});

// Create a new bookmark
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { book_id, page_number, note } = req.body;

    if (!book_id || page_number === undefined || page_number < 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Book ID and valid page number are required'
      });
    }

    // Check if book exists and is approved
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('id, title, approval_status, total_pages')
      .eq('id', book_id)
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
        message: 'Cannot bookmark unapproved book'
      });
    }

    // Validate page number
    if (book.total_pages && page_number > book.total_pages) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Page number exceeds total pages'
      });
    }

    // Check if bookmark already exists for this page
    const { data: existingBookmark } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('book_id', book_id)
      .eq('page_number', page_number)
      .single();

    if (existingBookmark) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Bookmark already exists for this page'
      });
    }

    // Create new bookmark
    const { data: bookmark, error } = await supabase
      .from('bookmarks')
      .insert([
        {
          user_id: req.user.id,
          book_id,
          page_number,
          note: note || null
        }
      ])
      .select(`
        *,
        books!bookmarks_book_id_fkey (
          title,
          author
        )
      `)
      .single();

    if (error) {
      console.error('Bookmark creation error:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to create bookmark'
      });
    }

    res.status(201).json({
      message: 'Bookmark created successfully',
      bookmark
    });
  } catch (error) {
    console.error('Bookmark creation error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create bookmark'
    });
  }
});

// Update a bookmark
router.put('/:bookmarkId', authenticateToken, async (req, res) => {
  try {
    const { bookmarkId } = req.params;
    const { note, page_number } = req.body;

    // Check if bookmark exists and belongs to user
    const { data: bookmark, error: fetchError } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('id', bookmarkId)
      .single();

    if (fetchError || !bookmark) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Bookmark not found'
      });
    }

    if (bookmark.user_id !== req.user.id) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only update your own bookmarks'
      });
    }

    // Validate page number if provided
    if (page_number !== undefined && page_number < 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Page number cannot be negative'
      });
    }

    // Check if updating page number would cause conflict
    if (page_number !== undefined && page_number !== bookmark.page_number) {
      const { data: conflictBookmark } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', req.user.id)
        .eq('book_id', bookmark.book_id)
        .eq('page_number', page_number)
        .single();

      if (conflictBookmark) {
        return res.status(409).json({
          error: 'Conflict',
          message: 'Bookmark already exists for this page'
        });
      }
    }

    // Update bookmark
    const updateData = {};
    if (note !== undefined) updateData.note = note || null;
    if (page_number !== undefined) updateData.page_number = page_number;

    const { data: updatedBookmark, error } = await supabase
      .from('bookmarks')
      .update(updateData)
      .eq('id', bookmarkId)
      .select(`
        *,
        books!bookmarks_book_id_fkey (
          title,
          author
        )
      `)
      .single();

    if (error) {
      console.error('Bookmark update error:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to update bookmark'
      });
    }

    res.json({
      message: 'Bookmark updated successfully',
      bookmark: updatedBookmark
    });
  } catch (error) {
    console.error('Bookmark update error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update bookmark'
    });
  }
});

// Delete a bookmark
router.delete('/:bookmarkId', authenticateToken, async (req, res) => {
  try {
    const { bookmarkId } = req.params;

    // Check if bookmark exists and belongs to user
    const { data: bookmark, error: fetchError } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('id', bookmarkId)
      .single();

    if (fetchError || !bookmark) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Bookmark not found'
      });
    }

    if (bookmark.user_id !== req.user.id) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only delete your own bookmarks'
      });
    }

    // Delete the bookmark
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('id', bookmarkId);

    if (error) {
      console.error('Bookmark deletion error:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to delete bookmark'
      });
    }

    res.json({
      message: 'Bookmark deleted successfully'
    });
  } catch (error) {
    console.error('Bookmark deletion error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete bookmark'
    });
  }
});

// Get bookmark statistics for a user
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    // Get all bookmarks for user with book info
    const { data: bookmarks } = await supabase
      .from('bookmarks')
      .select(`
        *,
        books!bookmarks_book_id_fkey (
          id,
          title,
          approval_status
        )
      `)
      .eq('user_id', req.user.id);

    // Filter approved books
    const approvedBookmarks = bookmarks?.filter(
      b => b.books && b.books.approval_status === 'approved'
    ) || [];

    const totalBookmarks = approvedBookmarks.length;
    const booksWithBookmarks = new Set(approvedBookmarks.map(b => b.book_id)).size;

    // Get recent bookmarks
    const recentBookmarks = approvedBookmarks
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5)
      .map(b => ({
        id: b.id,
        book_title: b.books.title,
        page_number: b.page_number,
        note: b.note,
        created_at: b.created_at
      }));

    res.json({
      total_bookmarks: totalBookmarks,
      books_with_bookmarks: booksWithBookmarks,
      recent_bookmarks: recentBookmarks
    });
  } catch (error) {
    console.error('Bookmark stats error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch bookmark statistics'
    });
  }
});

module.exports = router;
