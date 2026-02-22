import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  ActivityIndicator,
  Searchbar,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { apiService } from '../services/supabase';

const HomeScreen = () => {
  const [stats, setStats] = useState({
    totalBooks: 0,
    totalUsers: 0,
    recentBooks: [],
    popularBooks: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const navigation = useNavigation();
  const { user, isAdmin } = useAuth();
  const { theme, colors } = useTheme();

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      setLoading(true);
      
      // Get recent books
      const { books: recentBooks } = await apiService.getBooks({
        limit: 5,
        sort: 'created_at',
        order: 'desc'
      });

      // Get popular books (most downloaded)
      const { books: popularBooks } = await apiService.getBooks({
        limit: 5,
        sort: 'download_count',
        order: 'desc'
      });

      // Get stats (admin only)
      let userStats = { totalUsers: 0 };
      if (isAdmin) {
        try {
          userStats = await apiService.getUserStats();
        } catch (error) {
          console.log('User stats not available or user not admin');
        }
      }

      setStats({
        totalBooks: recentBooks.length,
        totalUsers: userStats.total_users || 0,
        recentBooks,
        popularBooks,
      });
    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadHomeData();
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigation.navigate('Books', { searchQuery: searchQuery.trim() });
    }
  };

  const renderBookCard = (book, index) => (
    <Card key={book.id} style={[styles.bookCard, { backgroundColor: colors.surface }]}>
      <TouchableOpacity
        onPress={() => navigation.navigate('BookDetail', { bookId: book.id })}
      >
        <Card.Content>
          <View style={styles.bookHeader}>
            <View style={styles.bookInfo}>
              <Title style={[styles.bookTitle, { color: colors.onSurface }]}>
                {book.title}
              </Title>
              <Paragraph style={[styles.bookAuthor, { color: colors.onSurface }]}>
                by {book.author}
              </Paragraph>
            </View>
            <Chip style={[styles.rackChip, { backgroundColor: colors.primary }]}>
              {book.rack_letter}
            </Chip>
          </View>
          <View style={styles.bookFooter}>
            <Text style={[styles.categoryText, { color: colors.primary }]}>
              {book.category}
            </Text>
            <Text style={[styles.downloadsText, { color: colors.onSurface }]}>
              📥 {book.download_count || 0}
            </Text>
          </View>
        </Card.Content>
      </TouchableOpacity>
    </Card>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.onSurface }]}>
          Loading library data...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Title style={[styles.welcomeTitle, { color: colors.onSurface }]}>
          Welcome back, {user?.email?.split('@')[0]}! 👋
        </Title>
        <Paragraph style={[styles.welcomeSubtitle, { color: colors.onSurface }]}>
          {isAdmin ? 'Manage your digital library' : 'Explore our collection'}
        </Paragraph>
      </View>

      {/* Search Bar */}
      <Searchbar
        placeholder="Search books, authors, categories..."
        onChangeText={setSearchQuery}
        onSubmitEditing={handleSearch}
        value={searchQuery}
        style={[styles.searchBar, { backgroundColor: colors.surface }]}
        iconColor={colors.onSurface}
        inputStyle={{ color: colors.onSurface }}
      />

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <Card style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Card.Content style={styles.statContent}>
            <Ionicons name="book" size={24} color={colors.primary} />
            <Text style={[styles.statNumber, { color: colors.onSurface }]}>
              {stats.totalBooks}
            </Text>
            <Text style={[styles.statLabel, { color: colors.onSurface }]}>
              Total Books
            </Text>
          </Card.Content>
        </Card>

        {isAdmin && (
          <Card style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Card.Content style={styles.statContent}>
              <Ionicons name="people" size={24} color={colors.primary} />
              <Text style={[styles.statNumber, { color: colors.onSurface }]}>
                {stats.totalUsers}
              </Text>
              <Text style={[styles.statLabel, { color: colors.onSurface }]}>
                Total Users
              </Text>
            </Card.Content>
          </Card>
        )}

        <Card style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Card.Content style={styles.statContent}>
            <Ionicons name="add-circle" size={24} color={colors.primary} />
            <Button
              mode="text"
              onPress={() => navigation.navigate('Upload')}
              compact
              textColor={colors.primary}
            >
              Upload Book
            </Button>
          </Card.Content>
        </Card>
      </View>

      {/* Recent Books */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Title style={[styles.sectionTitle, { color: colors.onSurface }]}>
            📚 Recent Books
          </Title>
          <Button
            mode="text"
            onPress={() => navigation.navigate('Books')}
            compact
            textColor={colors.primary}
          >
            See All
          </Button>
        </View>
        {stats.recentBooks.length > 0 ? (
          stats.recentBooks.map(renderBookCard)
        ) : (
          <Card style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
            <Card.Content style={styles.emptyContent}>
              <Text style={[styles.emptyText, { color: colors.onSurface }]}>
                No books available yet. Be the first to upload!
              </Text>
            </Card.Content>
          </Card>
        )}
      </View>

      {/* Popular Books */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Title style={[styles.sectionTitle, { color: colors.onSurface }]}>
            🔥 Popular Books
          </Title>
          <Button
            mode="text"
            onPress={() => navigation.navigate('Books', { sortBy: 'download_count' })}
            compact
            textColor={colors.primary}
          >
            See All
          </Button>
        </View>
        {stats.popularBooks.length > 0 ? (
          stats.popularBooks.map(renderBookCard)
        ) : (
          <Card style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
            <Card.Content style={styles.emptyContent}>
              <Text style={[styles.emptyText, { color: colors.onSurface }]}>
                No popular books yet. Start downloading to see them here!
              </Text>
            </Card.Content>
          </Card>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 4,
  },
  searchBar: {
    marginHorizontal: 20,
    marginBottom: 20,
    elevation: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    elevation: 2,
  },
  statContent: {
    alignItems: 'center',
    padding: 16,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  bookCard: {
    marginBottom: 12,
    elevation: 2,
  },
  bookHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bookInfo: {
    flex: 1,
    marginRight: 12,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  bookAuthor: {
    fontSize: 14,
    marginTop: 2,
  },
  rackChip: {
    height: 32,
  },
  bookFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  downloadsText: {
    fontSize: 12,
  },
  emptyCard: {
    elevation: 2,
  },
  emptyContent: {
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 14,
  },
});

export default HomeScreen;
