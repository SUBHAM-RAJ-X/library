const express = require('express');
const multer = require('multer');
const path = require('path');
const supabase = require('../config/supabase');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateBook, validateSearch } = require('../middleware/validation');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024, // 50MB default
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// Get all books with pagination and filtering
router.get('/', validateSearch, async (req, res) => {
  try {
    const { page = 1, limit = 10, rack_letter, category, query } = req.query;
    const offset = (page - 1) * limit;

    let supabaseQuery = supabase
      .from('books')
      .select(`
        *,
        users!books_uploaded_by_fkey (
          email,
          role
        )
      `, { count: 'exact' });

    // Apply filters
    if (rack_letter) {
      supabaseQuery = supabaseQuery.eq('rack_letter', rack_letter.toUpperCase());
    }

    if (category) {
      supabaseQuery = supabaseQuery.eq('category', category);
    }

    if (query) {
      supabaseQuery = supabaseQuery.or(`title.ilike.%${query}%,author.ilike.%${query}%`);
    }

    // Apply ordering and pagination
    const { data: books, error, count } = await supabaseQuery
      .order('rack_letter', { ascending: true })
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Books fetch error:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to fetch books'
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
    console.error('Books route error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch books'
    });
  }
});

// Get single book by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: book, error } = await supabase
      .from('books')
      .select(`
        *,
        users!books_uploaded_by_fkey (
          email,
          role
        )
      `)
      .eq('id', id)
      .single();

    if (error || !book) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Book not found'
      });
    }

    res.json({ book });
  } catch (error) {
    console.error('Book fetch error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch book'
    });
  }
});

// Upload new book
router.post('/', authenticateToken, upload.single('file'), validateBook, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'PDF file is required'
      });
    }

    const { title, author, description, category } = req.body;
    const file = req.file;

    // Generate unique filename
    const fileName = `${Date.now()}-${file.originalname}`;
    const filePath = `${req.user.id}/${fileName}`;

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('books')
      .upload(filePath, file.buffer, {
        contentType: 'application/pdf',
        upsert: false
      });

    if (uploadError) {
      console.error('File upload error:', uploadError);
      return res.status(500).json({
        error: 'Upload Error',
        message: 'Failed to upload file'
      });
    }

    // Get public URL for the file
    const { data: urlData } = supabase.storage
      .from('books')
      .getPublicUrl(filePath);

    // Create book record in database
    const { data: book, error: bookError } = await supabase
      .from('books')
      .insert([
        {
          title,
          author,
          description,
          category,
          file_url: urlData.publicUrl,
          file_name: file.originalname,
          file_size: file.size,
          uploaded_by: req.user.id
        }
      ])
      .select(`
        *,
        users!books_uploaded_by_fkey (
          email,
          role
        )
      `)
      .single();

    if (bookError) {
      console.error('Book creation error:', bookError);
      
      // Clean up uploaded file if database insert fails
      await supabase.storage
        .from('books')
        .remove([filePath]);

      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to create book record'
      });
    }

    res.status(201).json({
      message: 'Book uploaded successfully',
      book
    });
  } catch (error) {
    console.error('Book upload error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to upload book'
    });
  }
});

// Update book
router.put('/:id', authenticateToken, validateBook, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, author, description, category } = req.body;

    // Check if user owns the book or is admin
    const { data: existingBook, error: fetchError } = await supabase
      .from('books')
      .select('uploaded_by')
      .eq('id', id)
      .single();

    if (fetchError || !existingBook) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Book not found'
      });
    }

    if (existingBook.uploaded_by !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only update your own books'
      });
    }

    const { data: book, error } = await supabase
      .from('books')
      .update({
        title,
        author,
        description,
        category,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        users!books_uploaded_by_fkey (
          email,
          role
        )
      `)
      .single();

    if (error) {
      console.error('Book update error:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to update book'
      });
    }

    res.json({
      message: 'Book updated successfully',
      book
    });
  } catch (error) {
    console.error('Book update error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update book'
    });
  }
});

// Delete book (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Get book details before deletion
    const { data: book, error: fetchError } = await supabase
      .from('books')
      .select('file_url, uploaded_by')
      .eq('id', id)
      .single();

    if (fetchError || !book) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Book not found'
      });
    }

    // Extract file path from URL
    const urlParts = book.file_url.split('/');
    const filePath = `${book.uploaded_by}/${urlParts[urlParts.length - 1]}`;

    // Delete book from database
    const { error: deleteError } = await supabase
      .from('books')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Book deletion error:', deleteError);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to delete book'
      });
    }

    // Delete file from storage
    const { error: storageError } = await supabase.storage
      .from('books')
      .remove([filePath]);

    if (storageError) {
      console.error('File deletion error:', storageError);
      // Don't fail the request if file deletion fails
    }

    res.json({
      message: 'Book deleted successfully'
    });
  } catch (error) {
    console.error('Book deletion error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete book'
    });
  }
});

// Get books by rack letter
router.get('/rack/:letter', async (req, res) => {
  try {
    const { letter } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    if (!/^[A-Z]$/.test(letter.toUpperCase())) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Rack letter must be a single uppercase letter (A-Z)'
      });
    }

    const { data: books, error, count } = await supabase
      .from('books')
      .select(`
        *,
        users!books_uploaded_by_fkey (
          email,
          role
        )
      `, { count: 'exact' })
      .eq('rack_letter', letter.toUpperCase())
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Rack books fetch error:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to fetch rack books'
      });
    }

    res.json({
      books,
      rack_letter: letter.toUpperCase(),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Rack books route error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch rack books'
    });
  }
});

module.exports = router;
