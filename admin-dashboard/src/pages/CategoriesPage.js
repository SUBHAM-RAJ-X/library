import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Pagination,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit,
  Delete,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { format } from 'date-fns';

import { apiService } from '../services/api';
import toast from 'react-hot-toast';

const CategoriesPage = () => {
  const [page, setPage] = useState(1);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const queryClient = useQueryClient();

  const { data: categoriesData, isLoading, error } = useQuery(
    ['categories', page],
    () => apiService.getCategories(),
    {
      keepPreviousData: true,
    }
  );

  const createCategoryMutation = useMutation(apiService.createCategory, {
    onSuccess: () => {
      queryClient.invalidateQueries('categories');
      toast.success('Category created successfully');
      setCreateDialogOpen(false);
      setFormData({ name: '', description: '' });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create category');
    },
  });

  const updateCategoryMutation = useMutation(
    ({ id, data }) => apiService.updateCategory(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('categories');
        toast.success('Category updated successfully');
        setEditDialogOpen(false);
        setSelectedCategory(null);
        setFormData({ name: '', description: '' });
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to update category');
      },
    }
  );

  const deleteCategoryMutation = useMutation(apiService.deleteCategory, {
    onSuccess: () => {
      queryClient.invalidateQueries('categories');
      toast.success('Category deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedCategory(null);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete category');
    },
  });

  const handleCreateCategory = () => {
    if (!formData.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    createCategoryMutation.mutate(formData);
  };

  const handleEditCategory = () => {
    if (!formData.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    updateCategoryMutation.mutate({
      id: selectedCategory.id,
      data: formData,
    });
  };

  const handleDeleteCategory = () => {
    deleteCategoryMutation.mutate(selectedCategory.id);
  };

  const openEditDialog = (category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (category) => {
    setSelectedCategory(category);
    setDeleteDialogOpen(true);
  };

  const closeDialogs = () => {
    setCreateDialogOpen(false);
    setEditDialogOpen(false);
    setDeleteDialogOpen(false);
    setSelectedCategory(null);
    setFormData({ name: '', description: '' });
  };

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Failed to load categories: {error.message}
      </Alert>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Categories Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Add Category
        </Button>
      </Box>

      {/* Categories Table */}
      <Card>
        <CardContent>
          {isLoading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Books Count</TableCell>
                      <TableCell>Created Date</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {categoriesData?.categories?.map((category) => (
                      <TableRow key={category.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {category.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {category.description || 'No description'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {category.books_count || 0}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {format(new Date(category.created_at), 'MMM dd, yyyy')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => openEditDialog(category)}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => openDeleteDialog(category)}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Empty State */}
              {(!categoriesData?.categories || categoriesData.categories.length === 0) && (
                <Box textAlign="center" py={4}>
                  <Typography variant="body2" color="text.secondary">
                    No categories found
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setCreateDialogOpen(true)}
                    sx={{ mt: 2 }}
                  >
                    Create First Category
                  </Button>
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Category Dialog */}
      <Dialog open={createDialogOpen} onClose={closeDialogs} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Category</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Category Name"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialogs}>Cancel</Button>
          <Button
            onClick={handleCreateCategory}
            variant="contained"
            disabled={createCategoryMutation.isLoading}
          >
            {createCategoryMutation.isLoading ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={editDialogOpen} onClose={closeDialogs} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Category</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Category Name"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialogs}>Cancel</Button>
          <Button
            onClick={handleEditCategory}
            variant="contained"
            disabled={updateCategoryMutation.isLoading}
          >
            {updateCategoryMutation.isLoading ? 'Updating...' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={closeDialogs}>
        <DialogTitle>Delete Category</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedCategory?.name}"? This action cannot be undone.
            {selectedCategory?.books_count > 0 && (
              <Box component="span" color="error.main">
                {' '}Note: This category contains {selectedCategory.books_count} books.
              </Box>
            )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialogs}>Cancel</Button>
          <Button
            onClick={handleDeleteCategory}
            color="error"
            disabled={deleteCategoryMutation.isLoading}
          >
            {deleteCategoryMutation.isLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CategoriesPage;
