const express = require('express');
const supabase = require('../config/supabase');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateCategory } = require('../middleware/validation');

const router = express.Router();

// Get all categories
router.get('/', async (req, res) => {
  try {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Categories fetch error:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to fetch categories'
      });
    }

    // Get book count for each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const { count } = await supabase
          .from('books')
          .select('*', { count: 'exact', head: true })
          .eq('category', category.name);

        return {
          ...category,
          books_count: count || 0
        };
      })
    );

    res.json({
      categories: categoriesWithCount
    });
  } catch (error) {
    console.error('Categories route error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch categories'
    });
  }
});

// Get category statistics (admin only)
router.get('/stats/overview', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { count: totalCategories } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true });

    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('name');

    if (categoriesError) {
      console.error('Category stats list error:', categoriesError);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to fetch categories'
      });
    }

    const categoriesWithStats = await Promise.all(
      (categories || []).map(async (category) => {
        const { count } = await supabase
          .from('books')
          .select('*', { count: 'exact', head: true })
          .eq('category', category.name);

        return {
          name: category.name,
          books_count: count || 0
        };
      })
    );

    categoriesWithStats.sort((a, b) => b.books_count - a.books_count);

    res.json({
      total_categories: totalCategories || 0,
      categories_by_books: categoriesWithStats
    });
  } catch (error) {
    console.error('Category stats error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch category statistics'
    });
  }
});

// Get single category by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: category, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !category) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Category not found'
      });
    }

    // Get book count for this category
    const { count } = await supabase
      .from('books')
      .select('*', { count: 'exact', head: true })
      .eq('category', category.name);

    res.json({
      category: {
        ...category,
        books_count: count || 0
      }
    });
  } catch (error) {
    console.error('Category fetch error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch category'
    });
  }
});

// Create new category (admin only)
router.post('/', authenticateToken, requireAdmin, validateCategory, async (req, res) => {
  try {
    const { name, description } = req.body;

    // Check if category already exists
    const { data: existingCategory } = await supabase
      .from('categories')
      .select('id')
      .eq('name', name)
      .single();

    if (existingCategory) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Category already exists'
      });
    }

    const { data: category, error } = await supabase
      .from('categories')
      .insert([
        {
          name,
          description,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Category creation error:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to create category'
      });
    }

    res.status(201).json({
      message: 'Category created successfully',
      category: {
        ...category,
        books_count: 0
      }
    });
  } catch (error) {
    console.error('Category creation error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create category'
    });
  }
});

// Update category (admin only)
router.put('/:id', authenticateToken, requireAdmin, validateCategory, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    // Check if category exists
    const { data: existingCategory, error: fetchError } = await supabase
      .from('categories')
      .select('id, name')
      .eq('id', id)
      .single();

    if (fetchError || !existingCategory) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Category not found'
      });
    }

    // If name is being updated, check if it's already taken
    if (name && name !== existingCategory.name) {
      const { data: nameCheck } = await supabase
        .from('categories')
        .select('id')
        .eq('name', name)
        .single();

      if (nameCheck) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Category name already exists'
        });
      }

      // Update all books with this category name
      await supabase
        .from('books')
        .update({ category: name })
        .eq('category', existingCategory.name);
    }

    const { data: category, error } = await supabase
      .from('categories')
      .update({
        name: name || existingCategory.name,
        description: description !== undefined ? description : existingCategory.description
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Category update error:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to update category'
      });
    }

    // Get updated book count
    const { count } = await supabase
      .from('books')
      .select('*', { count: 'exact', head: true })
      .eq('category', category.name);

    res.json({
      message: 'Category updated successfully',
      category: {
        ...category,
        books_count: count || 0
      }
    });
  } catch (error) {
    console.error('Category update error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update category'
    });
  }
});

// Delete category (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category exists
    const { data: category, error: fetchError } = await supabase
      .from('categories')
      .select('id, name')
      .eq('id', id)
      .single();

    if (fetchError || !category) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Category not found'
      });
    }

    // Check if category has books
    const { count: booksCount } = await supabase
      .from('books')
      .select('*', { count: 'exact', head: true })
      .eq('category', category.name);

    if (booksCount && booksCount > 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Cannot delete category that contains books. Please move or delete the books first.'
      });
    }

    // Delete category
    const { error: deleteError } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Category deletion error:', deleteError);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to delete category'
      });
    }

    res.json({
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Category deletion error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete category'
    });
  }
});

module.exports = router;
