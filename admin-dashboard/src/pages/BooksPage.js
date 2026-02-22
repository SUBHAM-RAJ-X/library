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
  Chip,
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
  Search as SearchIcon,
  Visibility,
  Delete,
  Edit,
  CloudDownload,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { format } from 'date-fns';

import { apiService } from '../services/api';
import toast from 'react-hot-toast';

const BooksPage = () => {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedRack, setSelectedRack] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState(null);

  const queryClient = useQueryClient();

  const { data: booksData, isLoading, error } = useQuery(
    ['books', page, searchQuery, selectedCategory, selectedRack],
    () =>
      apiService.getBooks({
        page,
        limit: 10,
        query: searchQuery || undefined,
        category: selectedCategory || undefined,
        rack_letter: selectedRack || undefined,
      }),
    {
      keepPreviousData: true,
    }
  );

  const { data: categoriesData } = useQuery('categories', apiService.getCategories);

  const deleteBookMutation = useMutation(apiService.deleteBook, {
    onSuccess: () => {
      queryClient.invalidateQueries('books');
      toast.success('Book deleted successfully');
      setDeleteDialogOpen(false);
      setBookToDelete(null);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete book');
    },
  });

  const handleSearch = () => {
    setPage(1);
  };

  const handleDeleteClick = (book) => {
    setBookToDelete(book);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (bookToDelete) {
      deleteBookMutation.mutate(bookToDelete.id);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setBookToDelete(null);
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedRack('');
    setPage(1);
  };

  const racks = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Failed to load books: {error.message}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Books Management
      </Typography>

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
            <TextField
              placeholder="Search books, authors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              size="small"
              sx={{ minWidth: 250 }}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />,
              }}
            />

            <TextField
              select
              label="Category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              size="small"
              sx={{ minWidth: 150 }}
            >
              <option value="">All Categories</option>
              {categoriesData?.categories?.map((category) => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </TextField>

            <TextField
              select
              label="Rack"
              value={selectedRack}
              onChange={(e) => setSelectedRack(e.target.value)}
              size="small"
              sx={{ minWidth: 100 }}
            >
              <option value="">All Racks</option>
              {racks.map((letter) => (
                <option key={letter} value={letter}>
                  {letter}
                </option>
              ))}
            </TextField>

            <Button variant="contained" onClick={handleSearch}>
              Search
            </Button>

            <Button variant="outlined" onClick={clearFilters}>
              Clear
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Books Table */}
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
                      <TableCell>Title</TableCell>
                      <TableCell>Author</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Rack</TableCell>
                      <TableCell>Downloads</TableCell>
                      <TableCell>Uploaded By</TableCell>
                      <TableCell>Upload Date</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {booksData?.books?.map((book) => (
                      <TableRow key={book.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {book.title}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {book.author}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={book.category}
                            size="small"
                            variant="outlined"
                            color="primary"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={book.rack_letter}
                            size="small"
                            sx={{
                              bgcolor: 'primary.main',
                              color: 'primary.contrastText',
                              fontWeight: 'bold',
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <CloudDownload fontSize="small" color="action" />
                            <Typography variant="body2">
                              {book.download_count || 0}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {book.users?.email || 'Unknown'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {format(new Date(book.created_at), 'MMM dd, yyyy')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <IconButton size="small" color="primary">
                            <Visibility fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error">
                            <Delete fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Pagination */}
              {booksData?.pagination && (
                <Box display="flex" justifyContent="center" mt={3}>
                  <Pagination
                    count={booksData.pagination.totalPages}
                    page={page}
                    onChange={handlePageChange}
                    color="primary"
                  />
                </Box>
              )}

              {/* Empty State */}
              {(!booksData?.books || booksData.books.length === 0) && (
                <Box textAlign="center" py={4}>
                  <Typography variant="body2" color="text.secondary">
                    No books found matching your criteria
                  </Typography>
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Delete Book</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{bookToDelete?.title}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            disabled={deleteBookMutation.isLoading}
          >
            {deleteBookMutation.isLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BooksPage;
