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
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { format } from 'date-fns';

import { apiService } from '../services/api';
import toast from 'react-hot-toast';

const UsersPage = () => {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const queryClient = useQueryClient();

  const { data: usersData, isLoading, error } = useQuery(
    ['users', page, searchQuery, selectedRole],
    () =>
      apiService.getUsers({
        page,
        limit: 10,
        query: searchQuery || undefined,
        role: selectedRole || undefined,
      }),
    {
      keepPreviousData: true,
    }
  );

  const deleteUserMutation = useMutation(apiService.deleteUser, {
    onSuccess: () => {
      queryClient.invalidateQueries('users');
      toast.success('User deleted successfully');
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete user');
    },
  });

  const handleSearch = () => {
    setPage(1);
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (userToDelete) {
      deleteUserMutation.mutate(userToDelete.id);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedRole('');
    setPage(1);
  };

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Failed to load users: {error.message}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Users Management
      </Typography>

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
            <TextField
              placeholder="Search users by email..."
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
              label="Role"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              size="small"
              sx={{ minWidth: 150 }}
            >
              <option value="">All Roles</option>
              <option value="student">Student</option>
              <option value="admin">Admin</option>
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

      {/* Users Table */}
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
                      <TableCell>Email</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Books Uploaded</TableCell>
                      <TableCell>Downloads Made</TableCell>
                      <TableCell>Join Date</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {usersData?.users?.map((user) => (
                      <TableRow key={user.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {user.email}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={user.role}
                            size="small"
                            color={user.role === 'admin' ? 'secondary' : 'primary'}
                            variant={user.role === 'admin' ? 'filled' : 'outlined'}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {user.books_uploaded || 0}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {user.downloads_made || 0}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {format(new Date(user.created_at), 'MMM dd, yyyy')}
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
              {usersData?.pagination && (
                <Box display="flex" justifyContent="center" mt={3}>
                  <Pagination
                    count={usersData.pagination.totalPages}
                    page={page}
                    onChange={handlePageChange}
                    color="primary"
                  />
                </Box>
              )}

              {/* Empty State */}
              {(!usersData?.users || usersData.users.length === 0) && (
                <Box textAlign="center" py={4}>
                  <Typography variant="body2" color="text.secondary">
                    No users found matching your criteria
                  </Typography>
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete user "{userToDelete?.email}"? This action cannot be undone and will also delete all their books and download history.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            disabled={deleteUserMutation.isLoading}
          >
            {deleteUserMutation.isLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UsersPage;
