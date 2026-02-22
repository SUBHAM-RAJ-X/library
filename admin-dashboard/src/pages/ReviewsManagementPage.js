import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Rating,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Pagination,
  Alert,
  CircularProgress,
  TextField,
  Grid,
  Divider,
  LinearProgress,
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility,
  Delete,
  Refresh,
  Star,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { format } from 'date-fns';

import { apiService } from '../services/api';
import toast from 'react-hot-toast';

const ReviewsManagementPage = () => {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReview, setSelectedReview] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ratingFilter, setRatingFilter] = useState('');

  const queryClient = useQueryClient();

  const { data: reviewsData, isLoading, error, refetch } = useQuery(
    ['reviews', page, searchQuery, ratingFilter],
    () =>
      apiService.getAllReviews({
        page,
        limit: 20,
        query: searchQuery || undefined,
        rating: ratingFilter || undefined,
      }),
    {
      keepPreviousData: true,
    }
  );

  const { data: statsData } = useQuery('reviewsStats', apiService.getReviewsStats);

  const deleteReviewMutation = useMutation(apiService.deleteReview, {
    onSuccess: () => {
      queryClient.invalidateQueries('reviews');
      queryClient.invalidateQueries('reviewsStats');
      setDeleteDialogOpen(false);
      setSelectedReview(null);
      toast.success('Review deleted successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete review');
    },
  });

  const handleSearch = () => {
    setPage(1);
  };

  const handleViewReview = (review) => {
    setSelectedReview(review);
    setViewDialogOpen(true);
  };

  const handleDeleteReview = (review) => {
    setSelectedReview(review);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    deleteReviewMutation.mutate(selectedReview.id);
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleRefresh = () => {
    refetch();
  };

  const getRatingDistribution = () => {
    if (!statsData?.rating_distribution) return [];
    
    return [5, 4, 3, 2, 1].map(rating => ({
      rating,
      count: statsData.rating_distribution.find(r => r.rating === rating)?.count || 0,
      percentage: statsData.total_reviews > 0 
        ? ((statsData.rating_distribution.find(r => r.rating === rating)?.count || 0) / statsData.total_reviews) * 100
        : 0
    }));
  };

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Failed to load reviews: {error.message}
      </Alert>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Reviews Management</Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={handleRefresh}
          disabled={isLoading}
        >
          Refresh
        </Button>
      </Box>

      {/* Stats Cards */}
      {statsData && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Reviews
                </Typography>
                <Typography variant="h4" component="div">
                  {statsData.total_reviews}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Average Rating
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="h4" component="div">
                    {statsData.average_rating.toFixed(1)}
                  </Typography>
                  <Rating value={Math.round(statsData.average_rating)} readOnly size="small" />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  5-Star Reviews
                </Typography>
                <Typography variant="h4" component="div">
                  {statsData.rating_distribution?.find(r => r.rating === 5)?.count || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Recent Reviews
                </Typography>
                <Typography variant="h4" component="div">
                  {statsData.recent_reviews_7_days || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Rating Distribution */}
      {statsData && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Rating Distribution
            </Typography>
            {getRatingDistribution().map((item) => (
              <Box key={item.rating} sx={{ mb: 1 }}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Box display="flex" alignItems="center" gap={1} sx={{ minWidth: 80 }}>
                    <Typography variant="body2">{item.rating}</Typography>
                    <Star fontSize="small" color="warning" />
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={item.percentage}
                    sx={{ flex: 1, height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="body2" sx={{ minWidth: 50 }}>
                    {item.count} ({item.percentage.toFixed(1)}%)
                  </Typography>
                </Box>
              </Box>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
            <TextField
              placeholder="Search reviews, books, or users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              size="small"
              sx={{ minWidth: 300 }}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />,
              }}
            />
            
            <TextField
              select
              label="Rating Filter"
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              size="small"
              sx={{ minWidth: 120 }}
            >
              <option value="">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </TextField>

            <Button variant="contained" onClick={handleSearch}>
              Search
            </Button>
            <Button variant="outlined" onClick={() => { setSearchQuery(''); setRatingFilter(''); setPage(1); }}>
              Clear
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Reviews Table */}
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
                      <TableCell>Book</TableCell>
                      <TableCell>Reviewer</TableCell>
                      <TableCell>Rating</TableCell>
                      <TableCell>Review</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reviewsData?.reviews?.map((review) => (
                      <TableRow key={review.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {review.books?.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            by {review.books?.author}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {review.users?.email}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {review.users?.role}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Rating value={review.rating} readOnly size="small" />
                            <Typography variant="body2">
                              ({review.rating})
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ maxWidth: 200 }}>
                            {review.review_text 
                              ? review.review_text.substring(0, 100) + (review.review_text.length > 100 ? '...' : '')
                              : 'No text'
                            }
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {format(new Date(review.created_at), 'MMM dd, yyyy')}
                          </Typography>
                          {review.updated_at && review.updated_at !== review.created_at && (
                            <Typography variant="caption" color="text.secondary">
                              Edited
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Box display="flex" gap={1}>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleViewReview(review)}
                            >
                              <Visibility />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteReview(review)}
                              disabled={deleteReviewMutation.isLoading}
                            >
                              <Delete />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Pagination */}
              {reviewsData?.pagination && (
                <Box display="flex" justifyContent="center" mt={3}>
                  <Pagination
                    count={reviewsData.pagination.totalPages}
                    page={page}
                    onChange={handlePageChange}
                    color="primary"
                  />
                </Box>
              )}

              {/* Empty State */}
              {(!reviewsData?.reviews || reviewsData.reviews.length === 0) && (
                <Box textAlign="center" py={4}>
                  <Typography variant="body2" color="text.secondary">
                    No reviews found
                  </Typography>
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* View Review Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Review Details</DialogTitle>
        <DialogContent>
          {selectedReview && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Book
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {selectedReview.books?.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    by {selectedReview.books?.author}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Reviewer
                  </Typography>
                  <Typography variant="body1">
                    {selectedReview.users?.email}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedReview.users?.role}
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>
                  Rating
                </Typography>
                <Rating value={selectedReview.rating} readOnly />
              </Box>

              {selectedReview.review_text && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>
                    Review Text
                  </Typography>
                  <Typography variant="body1">
                    {selectedReview.review_text}
                  </Typography>
                </Box>
              )}

              <Box>
                <Typography variant="subtitle2" color="textSecondary">
                  Dates
                </Typography>
                <Typography variant="body2">
                  Created: {format(new Date(selectedReview.created_at), 'PPPpp')}
                </Typography>
                {selectedReview.updated_at && selectedReview.updated_at !== selectedReview.created_at && (
                  <Typography variant="body2">
                    Updated: {format(new Date(selectedReview.updated_at), 'PPPpp')}
                  </Typography>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Review</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this review? This action cannot be undone.
          </Typography>
          {selectedReview && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" fontWeight="medium">
                Book: {selectedReview.books?.title}
              </Typography>
              <Typography variant="body2">
                Reviewer: {selectedReview.users?.email}
              </Typography>
              <Typography variant="body2">
                Rating: {selectedReview.rating} stars
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={confirmDelete}
            color="error"
            disabled={deleteReviewMutation.isLoading}
          >
            {deleteReviewMutation.isLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReviewsManagementPage;
