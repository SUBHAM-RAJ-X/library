import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
  TextField,
  MenuItem,
  Button,
  CircularProgress,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import { useQuery } from 'react-query';
import { format, subDays } from 'date-fns';

import { apiService } from '../services/api';
import StatCard from '../components/StatCard';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444'];

const AnalyticsPage = () => {
  const [timeRange, setTimeRange] = useState('30');

  const { data: userStats, isLoading: userStatsLoading } = useQuery(
    'userStats',
    apiService.getUserStats
  );

  const { data: categoryStats, isLoading: categoryStatsLoading } = useQuery(
    'categoryStats',
    apiService.getCategoryStats
  );

  const { data: popularBooks, isLoading: popularBooksLoading } = useQuery(
    'popularBooks',
    () => apiService.getMostDownloadedBooks({ limit: 10 })
  );

  // Generate mock data for charts (in real app, this would come from API)
  const downloadTrendData = Array.from({ length: parseInt(timeRange) }, (_, i) => ({
    date: format(subDays(new Date(), parseInt(timeRange) - i - 1), 'MMM dd'),
    downloads: Math.floor(Math.random() * 50) + 10,
    uploads: Math.floor(Math.random() * 20) + 2,
  })).reverse();

  const userActivityData = Array.from({ length: 7 }, (_, i) => ({
    day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
    activeUsers: Math.floor(Math.random() * 100) + 20,
    newUsers: Math.floor(Math.random() * 30) + 5,
  }));

  const pieData = categoryStats?.categories_by_books?.slice(0, 6).map(cat => ({
    name: cat.name,
    value: cat.books_count,
  })) || [];

  const barData = popularBooks?.books?.slice(0, 10).map(book => ({
    name: book.title.length > 20 ? book.title.substring(0, 20) + '...' : book.title,
    downloads: book.download_count,
    category: book.category,
  })) || [];

  if (userStatsLoading || categoryStatsLoading || popularBooksLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Analytics & Insights</Typography>
        <TextField
          select
          label="Time Range"
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          size="small"
          sx={{ minWidth: 120 }}
        >
          <MenuItem value="7">Last 7 days</MenuItem>
          <MenuItem value="30">Last 30 days</MenuItem>
          <MenuItem value="90">Last 90 days</MenuItem>
        </TextField>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Users"
            value={userStats?.total_users || 0}
            icon="👥"
            color="#6366f1"
            subtitle="Registered users"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Users"
            value={userStats?.recent_users_30_days || 0}
            icon="🟢"
            color="#10b981"
            subtitle="Last 30 days"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Books"
            value={categoryStats?.categories_by_books?.reduce((sum, cat) => sum + cat.books_count, 0) || 0}
            icon="📚"
            color="#8b5cf6"
            subtitle="In library"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Categories"
            value={categoryStats?.total_categories || 0}
            icon="📁"
            color="#ec4899"
            subtitle="Book categories"
          />
        </Grid>
      </Grid>

      {/* Charts Grid */}
      <Grid container spacing={3}>
        {/* Download Trend */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Download & Upload Trend
            </Typography>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={downloadTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="downloads"
                  stackId="1"
                  stroke="#6366f1"
                  fill="#6366f1"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="uploads"
                  stackId="2"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Books by Category */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Books by Category
            </Typography>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Most Popular Books */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Most Downloaded Books
            </Typography>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={barData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} />
                <Tooltip />
                <Bar dataKey="downloads" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* User Activity */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Weekly User Activity
            </Typography>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={userActivityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="activeUsers"
                  stroke="#6366f1"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="newUsers"
                  stroke="#10b981"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Additional Insights */}
      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Top Categories by Downloads
            </Typography>
            {categoryStats?.categories_by_books
              ?.sort((a, b) => b.books_count - a.books_count)
              .slice(0, 5)
              .map((category, index) => (
                <Box key={category.name} display="flex" justifyContent="space-between" py={1}>
                  <Typography variant="body2">{category.name}</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {category.books_count} books
                  </Typography>
                </Box>
              ))}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activity Summary
            </Typography>
            <Box display="flex" flexDirection="column" gap={2}>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2">New users (30 days)</Typography>
                <Typography variant="body2" fontWeight="bold" color="success.main">
                  +{userStats?.recent_users_30_days || 0}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2">Total categories</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {categoryStats?.total_categories || 0}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2">Most popular category</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {categoryStats?.categories_by_books?.[0]?.name || 'N/A'}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AnalyticsPage;
