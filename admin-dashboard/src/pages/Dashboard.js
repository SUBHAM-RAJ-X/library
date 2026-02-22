import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  CircularProgress,
} from '@mui/material';
import {
  Book as BookIcon,
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

import { apiService } from '../services/api';
import StatCard from '../components/StatCard';
import RecentBooksTable from '../components/RecentBooksTable';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444'];

const Dashboard = () => {
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
    () => apiService.getMostDownloadedBooks({ limit: 5 })
  );

  const { data: recentBooks, isLoading: recentBooksLoading } = useQuery(
    'recentBooks',
    () => apiService.getBooks({ limit: 5, sort: 'created_at', order: 'desc' })
  );

  const pieData = categoryStats?.categories_by_books?.slice(0, 6).map(cat => ({
    name: cat.name,
    value: cat.books_count,
  })) || [];

  const barData = popularBooks?.books?.slice(0, 5).map(book => ({
    name: book.title.length > 15 ? book.title.substring(0, 15) + '...' : book.title,
    downloads: book.download_count,
  })) || [];

  if (userStatsLoading || categoryStatsLoading || popularBooksLoading || recentBooksLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard Overview
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Welcome to the Library Management System Admin Dashboard
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Users"
            value={userStats?.total_users || 0}
            icon={<PeopleIcon />}
            color="#6366f1"
            subtitle="Active users"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Books"
            value={userStats?.total_books || recentBooks?.pagination?.total || 0}
            icon={<BookIcon />}
            color="#8b5cf6"
            subtitle="In library"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Categories"
            value={categoryStats?.total_categories || 0}
            icon={<CategoryIcon />}
            color="#ec4899"
            subtitle="Book categories"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Recent Users"
            value={userStats?.recent_users_30_days || 0}
            icon={<TrendingUpIcon />}
            color="#10b981"
            subtitle="Last 30 days"
          />
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Most Downloaded Books
            </Typography>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="downloads" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        
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
      </Grid>

      {/* Recent Books Table */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Books
            </Typography>
            <RecentBooksTable books={recentBooks?.books || []} />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
