const express = require('express');
const supabase = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Admin reading analytics summary
router.get('/analytics', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Admin access required'
      });
    }

    const days = Number.parseInt(req.query.timeRange, 10) || 30;
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);
    const fromIso = fromDate.toISOString();

    const { data: progressRows, error: progressError } = await supabase
      .from('reading_progress')
      .select(`
        user_id,
        book_id,
        current_page,
        total_pages,
        is_completed,
        completed_at,
        last_read_at,
        books!reading_progress_book_id_fkey (
          category
        )
      `);

    if (progressError) {
      console.error('Reading analytics fetch error:', progressError);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to fetch reading analytics'
      });
    }

    const rows = progressRows || [];
    const completedRows = rows.filter((row) => row.is_completed);
    const totalBooksCompleted = completedRows.length;
    const totalPagesRead = rows.reduce((sum, row) => sum + (row.current_page || 0), 0);
    const avgPagesPerBook = rows.length > 0 ? totalPagesRead / rows.length : 0;
    const readerSet = new Set(rows.map((row) => row.user_id));
    const activeReaderSet = new Set(
      rows
        .filter((row) => row.last_read_at && new Date(row.last_read_at) >= fromDate)
        .map((row) => row.user_id)
    );

    const daysByUser = rows.reduce((acc, row) => {
      if (!row.user_id || !row.last_read_at) return acc;
      const key = row.user_id;
      if (!acc[key]) acc[key] = new Set();
      acc[key].add(new Date(row.last_read_at).toISOString().slice(0, 10));
      return acc;
    }, {});
    const avgReadingStreak = Object.keys(daysByUser).length > 0
      ? Object.values(daysByUser).reduce((sum, daySet) => sum + daySet.size, 0) / Object.keys(daysByUser).length
      : 0;

    const completionStats = {
      completed: rows.filter((row) => row.is_completed).length,
      in_progress: rows.filter((row) => !row.is_completed && (row.current_page || 0) > 0).length,
      not_started: rows.filter((row) => (row.current_page || 0) === 0).length
    };

    const genreBucket = {};
    rows.forEach((row) => {
      const category = row.books?.category || 'Uncategorized';
      if (!genreBucket[category]) {
        genreBucket[category] = {
          category,
          total_pages: 0,
          book_ids: new Set(),
          user_ids: new Set()
        };
      }
      genreBucket[category].total_pages += row.current_page || 0;
      if (row.book_id) genreBucket[category].book_ids.add(row.book_id);
      if (row.user_id) genreBucket[category].user_ids.add(row.user_id);
    });

    const genreStats = Object.values(genreBucket).map((bucket) => ({
      category: bucket.category,
      total_pages: bucket.total_pages,
      book_count: bucket.book_ids.size,
      reader_count: bucket.user_ids.size
    }));

    const dailyBucket = {};
    rows.forEach((row) => {
      if (!row.last_read_at) return;
      const dt = new Date(row.last_read_at);
      if (dt < fromDate) return;
      const day = dt.toISOString().slice(0, 10);
      if (!dailyBucket[day]) {
        dailyBucket[day] = {
          date: day,
          pages_read: 0,
          books_completed: 0,
          active_readers_set: new Set()
        };
      }
      dailyBucket[day].pages_read += row.current_page || 0;
      if (row.is_completed && row.completed_at && new Date(row.completed_at).toISOString().slice(0, 10) === day) {
        dailyBucket[day].books_completed += 1;
      }
      if (row.user_id) dailyBucket[day].active_readers_set.add(row.user_id);
    });

    const dailyStats = Object.values(dailyBucket)
      .map((day) => ({
        date: day.date,
        pages_read: day.pages_read,
        books_completed: day.books_completed,
        active_readers: day.active_readers_set.size
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const booksCompletionRate = rows.length > 0
      ? (completionStats.completed / rows.length) * 100
      : 0;

    res.json({
      total_books_completed: totalBooksCompleted,
      books_completion_rate: Number(booksCompletionRate.toFixed(2)),
      total_pages_read: totalPagesRead,
      avg_pages_per_book: Number(avgPagesPerBook.toFixed(2)),
      active_readers: activeReaderSet.size,
      total_readers: readerSet.size,
      avg_reading_streak: Number(avgReadingStreak.toFixed(2)),
      daily_stats: dailyStats,
      genre_stats: genreStats,
      completion_stats: completionStats
    });
  } catch (error) {
    console.error('Reading analytics route error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch reading analytics'
    });
  }
});

// Admin top readers list
router.get('/top-readers', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Admin access required'
      });
    }

    const { data: progressRows, error: progressError } = await supabase
      .from('reading_progress')
      .select(`
        user_id,
        current_page,
        is_completed,
        last_read_at,
        users!reading_progress_user_id_fkey (
          email,
          role
        )
      `);

    if (progressError) {
      console.error('Top readers fetch error:', progressError);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to fetch top readers'
      });
    }

    const rows = progressRows || [];
    const byUser = {};
    rows.forEach((row) => {
      if (!row.user_id) return;
      if (!byUser[row.user_id]) {
        byUser[row.user_id] = {
          user_id: row.user_id,
          email: row.users?.email || '',
          role: row.users?.role || 'student',
          books_completed: 0,
          pages_read: 0,
          days: new Set()
        };
      }
      byUser[row.user_id].pages_read += row.current_page || 0;
      if (row.is_completed) byUser[row.user_id].books_completed += 1;
      if (row.last_read_at) {
        byUser[row.user_id].days.add(new Date(row.last_read_at).toISOString().slice(0, 10));
      }
    });

    const topReaders = Object.values(byUser)
      .map((entry) => {
        const readingStreak = entry.days.size;
        const avgPagesPerDay = readingStreak > 0 ? entry.pages_read / readingStreak : 0;
        return {
          user_id: entry.user_id,
          email: entry.email,
          role: entry.role,
          books_completed: entry.books_completed,
          pages_read: entry.pages_read,
          reading_streak: readingStreak,
          avg_pages_per_day: Number(avgPagesPerDay.toFixed(2))
        };
      })
      .sort((a, b) => b.pages_read - a.pages_read);

    res.json(topReaders);
  } catch (error) {
    console.error('Top readers route error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch top readers'
    });
  }
});

// Admin popular books list
router.get('/popular-books', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Admin access required'
      });
    }

    const { data: progressRows, error: progressError } = await supabase
      .from('reading_progress')
      .select(`
        book_id,
        user_id,
        is_completed,
        current_page,
        completed_at,
        books!reading_progress_book_id_fkey (
          title,
          author
        )
      `);

    if (progressError) {
      console.error('Popular books fetch error:', progressError);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to fetch popular books'
      });
    }

    const byBook = {};
    (progressRows || []).forEach((row) => {
      if (!row.book_id) return;
      if (!byBook[row.book_id]) {
        byBook[row.book_id] = {
          book_id: row.book_id,
          title: row.books?.title || 'Untitled',
          author: row.books?.author || 'Unknown',
          readers: new Set(),
          completed_readers: 0,
          completion_days: []
        };
      }

      byBook[row.book_id].readers.add(row.user_id);
      if (row.is_completed) {
        byBook[row.book_id].completed_readers += 1;
        if (row.completed_at) {
          const completedDate = new Date(row.completed_at);
          if (!Number.isNaN(completedDate.getTime())) {
            byBook[row.book_id].completion_days.push(completedDate.getTime());
          }
        }
      }
    });

    const popularBooks = Object.values(byBook)
      .map((entry) => {
        const totalReaders = entry.readers.size;
        const completionRate = totalReaders > 0
          ? (entry.completed_readers / totalReaders) * 100
          : 0;
        const avgDaysToComplete = entry.completion_days.length > 1
          ? 1
          : (entry.completion_days.length === 1 ? 1 : 0);

        return {
          book_id: entry.book_id,
          title: entry.title,
          author: entry.author,
          total_readers: totalReaders,
          completed_readers: entry.completed_readers,
          completion_rate: Number(completionRate.toFixed(2)),
          avg_days_to_complete: avgDaysToComplete
        };
      })
      .sort((a, b) => b.total_readers - a.total_readers);

    res.json(popularBooks);
  } catch (error) {
    console.error('Popular books route error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch popular books'
    });
  }
});

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
      recently_completed: recentlyCompleted
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
