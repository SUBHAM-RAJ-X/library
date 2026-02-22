import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Chip,
  Avatar,
  IconButton,
  Pagination,
  Alert,
  CircularProgress,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  TrendingUp,
  Book,
  People,
  CheckCircle,
  Refresh,
  Search,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useQuery } from 'react-query';
import { format, subDays } from 'date-fns';

import { apiService } from '../services/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const ReadingAnalyticsPage = () => {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [timeRange, setTimeRange] = useState('30');

  const { data: analyticsData, isLoading, error, refetch } = useQuery(
    ['readingAnalytics', timeRange],
    () => apiService.getReadingAnalytics({ timeRange }),
    {
      keepPreviousData: true,
    }
  );

  const { data: topReadersData } = useQuery('topReaders', apiService.getTopReaders);

  const { data: popularBooksData } = useQuery('popularBooks', apiService.getPopularBooks);

  const handleRefresh = () => {
    refetch();
  };

  const generateTimeSeriesData = () => {
    if (!analyticsData?.daily_stats) return [];
    
    const days = parseInt(timeRange);
    return Array.from({ length: days }, (_, i) => {
      const date = subDays(new Date(), days - i - 1);
      const dayData = analyticsData.daily_stats.find(
        stat => format(new Date(stat.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      );
      
      return {
        date: format(date, 'MMM dd'),
        pagesRead: dayData?.pages_read || 0,
        booksCompleted: dayData?.books_completed || 0,
        activeReaders: dayData?.active_readers || 0,
      };
    }).reverse();
  };

  const generateGenreData = () => {
    if (!analyticsData?.genre_stats) return [];
    
    return analyticsData.genre_stats.map(genre => ({
      name: genre.category,
      value: genre.total_pages,
      books: genre.book_count,
      readers: genre.reader_count,
    }));
  };

  const getCompletionRateData = () => {
    if (!analyticsData?.completion_stats) return [];
    
    return [
      { name: 'Completed', value: analyticsData.completion_stats.completed, color: '#4CAF50' },
      { name: 'In Progress', value: analyticsData.completion_stats.in_progress, color: '#2196F3' },
      { name: 'Not Started', value: analyticsData.completion_stats.not_started, color: '#9E9E9E' },
    ];
  };

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Failed to load analytics: {error.message}
      </Alert>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Reading Analytics</Typography>
        <Box display="flex" gap={2}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              label="Time Range"
            >
              <MenuItem value="7">Last 7 days</MenuItem>
              <MenuItem value="30">Last 30 days</MenuItem>
              <MenuItem value="90">Last 90 days</MenuItem>
            </Select>
          </FormControl>
          <IconButton onClick={handleRefresh} disabled={isLoading}>
            <Refresh />
          </IconButton>
        </Box>
      </Box>

      {/* Key Metrics */}
      {analyticsData && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <Book />
                  </Avatar>
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Total Books Read
                    </Typography>
                    <Typography variant="h4">
                      {analyticsData.total_books_completed}
                    </Typography>
                    <Typography variant="body2" color="success.main">
                      <TrendingUp fontSize="small" />
                      {analyticsData.books_completion_rate}% completion rate
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar sx={{ bgcolor: 'success.main' }}>
                    <CheckCircle />
                  </Avatar>
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Pages Read
                    </Typography>
                    <Typography variant="h4">
                      {analyticsData.total_pages_read.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Avg: {analyticsData.avg_pages_per_book} per book
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar sx={{ bgcolor: 'info.main' }}>
                    <People />
                  </Avatar>
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Active Readers
                    </Typography>
                    <Typography variant="h4">
                      {analyticsData.active_readers}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {analyticsData.total_readers} total readers
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar sx={{ bgcolor: 'warning.main' }}>
                    <TrendingUp />
                  </Avatar>
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Reading Streak
                    </Typography>
                    <Typography variant="h4">
                      {analyticsData.avg_reading_streak} days
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Average per user
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Charts Row 1 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Reading Activity Over Time
              </Typography>
              {isLoading ? (
                <Box display="flex" justifyContent="center" py={4}>
                  <CircularProgress />
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={generateTimeSeriesData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="pagesRead" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      name="Pages Read"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="booksCompleted" 
                      stroke="#82ca9d" 
                      strokeWidth={2}
                      name="Books Completed"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Reading Status Distribution
              </Typography>
              {isLoading ? (
                <Box display="flex" justifyContent="center" py={4}>
                  <CircularProgress />
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={getCompletionRateData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getCompletionRateData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Row 2 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Genre Popularity
              </Typography>
              {isLoading ? (
                <Box display="flex" justifyContent="center" py={4}>
                  <CircularProgress />
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={generateGenreData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" name="Pages Read" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Daily Active Readers
              </Typography>
              {isLoading ? (
                <Box display="flex" justifyContent="center" py={4}>
                  <CircularProgress />
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={generateTimeSeriesData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="activeReaders" 
                      stroke="#ff7300" 
                      strokeWidth={2}
                      name="Active Readers"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Top Readers Table */}
      {topReadersData && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Top Readers This Month
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Reader</TableCell>
                    <TableCell>Books Completed</TableCell>
                    <TableCell>Pages Read</TableCell>
                    <TableCell>Reading Streak</TableCell>
                    <TableCell>Avg Pages/Day</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {topReadersData.slice(0, 10).map((reader) => (
                    <TableRow key={reader.user_id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {reader.email}
                        </Typography>
                        <Chip
                          label={reader.role}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {reader.books_completed}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {reader.pages_read.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body2">
                            {reader.reading_streak} days
                          </Typography>
                          {reader.reading_streak >= 7 && (
                            <Chip
                              label="🔥"
                              size="small"
                              color="warning"
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {reader.avg_pages_per_day}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Popular Books Table */}
      {popularBooksData && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Most Read Books
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Book</TableCell>
                    <TableCell>Author</TableCell>
                    <TableCell>Total Readers</TableCell>
                    <TableCell>Completed</TableCell>
                    <TableCell>Completion Rate</TableCell>
                    <TableCell>Avg Days to Complete</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {popularBooksData.slice(0, 10).map((book) => (
                    <TableRow key={book.book_id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {book.title}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {book.author}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {book.total_readers}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {book.completed_readers}
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <LinearProgress
                            variant="determinate"
                            value={book.completion_rate}
                            sx={{ width: 60 }}
                          />
                          <Typography variant="body2">
                            {book.completion_rate.toFixed(1)}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {book.avg_days_to_complete} days
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default ReadingAnalyticsPage;
