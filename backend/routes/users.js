const express = require('express');
const supabase = require('../config/supabase');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateUserUpdate } = require('../middleware/validation');

const router = express.Router();

// Get all users (admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, role } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('users')
      .select('id, email, role, created_at, updated_at', { count: 'exact' });

    if (role) {
      query = query.eq('role', role);
    }

    const { data: users, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Users fetch error:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to fetch users'
      });
    }

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Users route error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch users'
    });
  }
});

// Get user by ID (admin only)
router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, role, created_at, updated_at')
      .eq('id', id)
      .single();

    if (error || !user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    // Get user's books count
    const { count: booksCount } = await supabase
      .from('books')
      .select('*', { count: 'exact', head: true })
      .eq('uploaded_by', id);

    // Get user's downloads count
    const { count: downloadsCount } = await supabase
      .from('downloads')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', id);

    res.json({
      user: {
        ...user,
        books_uploaded: booksCount || 0,
        downloads_made: downloadsCount || 0
      }
    });
  } catch (error) {
    console.error('User fetch error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch user'
    });
  }
});

// Update user (admin only)
router.put('/:id', authenticateToken, requireAdmin, validateUserUpdate, async (req, res) => {
  try {
    const { id } = req.params;
    const { email, role } = req.body;

    // Check if user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', id)
      .single();

    if (fetchError || !existingUser) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    // If email is being updated, check if it's already taken
    if (email && email !== existingUser.email) {
      const { data: emailCheck } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (emailCheck) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Email is already in use'
        });
      }
    }

    const { data: user, error } = await supabase
      .from('users')
      .update({
        email: email || existingUser.email,
        role: role || existingUser.role,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('id, email, role, created_at, updated_at')
      .single();

    if (error) {
      console.error('User update error:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to update user'
      });
    }

    res.json({
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    console.error('User update error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update user'
    });
  }
});

// Delete user (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (id === req.user.id) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'You cannot delete your own account'
      });
    }

    // Check if user exists
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', id)
      .single();

    if (fetchError || !user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    // Delete user's downloads
    const { error: deleteDownloadsError } = await supabase
      .from('downloads')
      .delete()
      .eq('user_id', id);

    if (deleteDownloadsError) {
      console.error('User downloads deletion error:', deleteDownloadsError);
    }

    // Get user's books to delete files
    const { data: userBooks } = await supabase
      .from('books')
      .select('id, file_url, uploaded_by')
      .eq('uploaded_by', id);

    // Delete user's books and files
    if (userBooks && userBooks.length > 0) {
      for (const book of userBooks) {
        // Delete book from database
        await supabase
          .from('books')
          .delete()
          .eq('id', book.id);

        // Delete file from storage
        if (book.file_url) {
          const urlParts = book.file_url.split('/');
          const filePath = `${book.uploaded_by}/${urlParts[urlParts.length - 1]}`;
          
          await supabase.storage
            .from('books')
            .remove([filePath]);
        }
      }
    }

    // Delete user from database
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('User deletion error:', deleteError);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to delete user'
      });
    }

    // Delete user from Supabase Auth
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(id);

    if (authDeleteError) {
      console.error('Auth user deletion error:', authDeleteError);
    }

    res.json({
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('User deletion error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete user'
    });
  }
});

// Get user statistics (admin only)
router.get('/stats/overview', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Get total users count
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    // Get users by role
    const { data: roleStats } = await supabase
      .from('users')
      .select('role')
      .then(({ data }) => {
        const stats = data.reduce((acc, user) => {
          acc[user.role] = (acc[user.role] || 0) + 1;
          return acc;
        }, {});
        return stats;
      });

    // Get recent users (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count: recentUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString());

    res.json({
      total_users: totalUsers || 0,
      users_by_role: roleStats || {},
      recent_users_30_days: recentUsers || 0
    });
  } catch (error) {
    console.error('User stats error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch user statistics'
    });
  }
});

module.exports = router;
