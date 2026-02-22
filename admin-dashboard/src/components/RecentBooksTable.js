import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Typography,
  Box,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Visibility, Download } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

const RecentBooksTable = ({ books }) => {
  const navigate = useNavigate();

  if (!books || books.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" py={4}>
        <Typography variant="body2" color="text.secondary">
          No recent books found
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Title</TableCell>
            <TableCell>Author</TableCell>
            <TableCell>Category</TableCell>
            <TableCell>Rack</TableCell>
            <TableCell>Downloads</TableCell>
            <TableCell>Uploaded</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {books.map((book) => (
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
                  <Download fontSize="small" color="action" />
                  <Typography variant="body2">
                    {book.download_count || 0}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Typography variant="body2" color="text.secondary">
                  {format(new Date(book.created_at), 'MMM dd, yyyy')}
                </Typography>
              </TableCell>
              <TableCell>
                <Tooltip title="View Details">
                  <IconButton
                    size="small"
                    onClick={() => navigate(`/books?view=${book.id}`)}
                  >
                    <Visibility fontSize="small" />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default RecentBooksTable;
