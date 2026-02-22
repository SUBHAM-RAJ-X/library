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
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility,
  Check,
  Close,
  Refresh,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { format } from 'date-fns';

import { apiService } from '../services/api';
import toast from 'react-hot-toast';

const ApprovalPage = () => {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const queryClient = useQueryClient();

  const { data: pendingBooksData, isLoading, error, refetch } = useQuery(
    ['pendingBooks', page, searchQuery],
    () =>
      apiService.getPendingBooks({
        page,
        limit: 10,
        query: searchQuery || undefined,
      }),
    {
      keepPreviousData: true,
    }
  );

  const { data: statsData } = useQuery('approvalStats', apiService.getApprovalStats);

  const approveBookMutation = useMutation(apiService.approveBook, {
    onSuccess: () => {
      queryClient.invalidateQueries('pendingBooks');
      queryClient.invalidateQueries('approvalStats');
      toast.success('Book approved successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to approve book');
    },
  });

  const rejectBookMutation = useMutation(apiService.rejectBook, {
    onSuccess: () => {
      queryClient.invalidateQueries('pendingBooks');
      queryClient.invalidateQueries('approvalStats');
      setRejectDialogOpen(false);
      setRejectionReason('');
      setSelectedBook(null);
      toast.success('Book rejected successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to reject book');
    },
  });

  const handleSearch = () => {
    setPage(1);
  };

  const handleApprove = (book) => {
    approveBookMutation.mutate(book.id);
  };

  const handleReject = (book) => {
    setSelectedBook(book);
    setRejectDialogOpen(true);
  };

  const confirmReject = () => {
    if (!rejectionReason.trim()) {
      toast.error('Rejection reason is required');
      return;
    }

    rejectBookMutation.mutate({
      bookId: selectedBook.id,
      rejectionReason: rejectionReason.trim(),
    });
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleRefresh = () => {
    refetch();
  };

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Failed to load pending books: {error.message}
      </Alert>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Book Approvals</Typography>
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
                  Pending Approval
                </Typography>
                <Typography variant="h4" component="div">
                  {statsData.total_pending}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Approved
                </Typography>
                <Typography variant="h4" component="div">
                  {statsData.status_counts?.approved || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Rejected
                </Typography>
                <Typography variant="h4" component="div">
                  {statsData.status_counts?.rejected || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Pending Today
                </Typography>
                <Typography variant="h4" component="div">
                  {statsData.pending_today || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" gap={2} alignItems="center">
            <TextField
              placeholder="Search books, authors, or uploaders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              size="small"
              sx={{ minWidth: 300 }}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />,
              }}
            />
            <Button variant="contained" onClick={handleSearch}>
              Search
            </Button>
            <Button variant="outlined" onClick={() => { setSearchQuery(''); setPage(1); }}>
              Clear
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Pending Books Table */}
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
                      <TableCell>Uploaded By</TableCell>
                      <TableCell>Upload Date</TableCell>
                      <TableCell>AI Suggested</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pendingBooksData?.books?.map((book) => (
                      <TableRow key={book.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {book.title}
                          </Typography>
                          {book.description && (
                            <Typography variant="caption" color="text.secondary">
                              {book.description.substring(0, 100)}...
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
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
                          <Typography variant="body2">
                            {book.users?.email}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {book.users?.role}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {format(new Date(book.created_at), 'MMM dd, yyyy')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {book.ai_detected_category ? (
                            <Chip
                              label={book.ai_detected_category}
                              size="small"
                              color="secondary"
                              variant="outlined"
                            />
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              N/A
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Box display="flex" gap={1}>
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleApprove(book)}
                              disabled={approveBookMutation.isLoading}
                            >
                              <Check />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleReject(book)}
                              disabled={rejectBookMutation.isLoading}
                            >
                              <Close />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="primary"
                            >
                              <Visibility />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Pagination */}
              {pendingBooksData?.pagination && (
                <Box display="flex" justifyContent="center" mt={3}>
                  <Pagination
                    count={pendingBooksData.pagination.totalPages}
                    page={page}
                    onChange={handlePageChange}
                    color="primary"
                  />
                </Box>
              )}

              {/* Empty State */}
              {(!pendingBooksData?.books || pendingBooksData.books.length === 0) && (
                <Box textAlign="center" py={4}>
                  <Typography variant="body2" color="text.secondary">
                    No pending books found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    All books have been reviewed!
                  </Typography>
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      {statsData?.recent_approvals && statsData.recent_approvals.length > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recent Approval Activity
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Book</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Reviewed By</TableCell>
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {statsData.recent_approvals.map((approval) => (
                    <TableRow key={approval.id}>
                      <TableCell>{approval.title}</TableCell>
                      <TableCell>
                        <Chip
                          label={approval.approval_status}
                          size="small"
                          color={approval.approval_status === 'approved' ? 'success' : 'error'}
                        />
                      </TableCell>
                      <TableCell>{approval.users?.email}</TableCell>
                      <TableCell>
                        {format(new Date(approval.approved_at), 'MMM dd, yyyy HH:mm')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Rejection Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Book</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Book: "{selectedBook?.title}"
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Rejection Reason"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Please provide a reason for rejection..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={confirmReject}
            color="error"
            disabled={rejectBookMutation.isLoading}
          >
            {rejectBookMutation.isLoading ? 'Rejecting...' : 'Reject Book'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ApprovalPage;
