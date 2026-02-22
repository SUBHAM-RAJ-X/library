import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { apiService } from '../services/supabase';
import Toast from 'react-native-toast-message';

const DownloadsScreen = () => {
  const [downloads, setDownloads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  const navigation = useNavigation();
  const { theme, colors } = useTheme();

  useFocusEffect(
    React.useCallback(() => {
      loadDownloads(true);
    }, [])
  );

  useEffect(() => {
    if (searchQuery.trim()) {
      const timeoutId = setTimeout(() => {
        loadDownloads(true);
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      loadDownloads(true);
    }
  }, [searchQuery]);

  const loadDownloads = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setCurrentPage(1);
        setDownloads([]);
      }

      const params = {
        page: reset ? 1 : currentPage,
        limit: 20,
      };

      const response = await apiService.getDownloadHistory(params);
      
      if (reset) {
        setDownloads(response.downloads || []);
      } else {
        setDownloads(prev => [...prev, ...(response.downloads || [])]);
      }

      setHasMore(response.pagination?.totalPages > currentPage);
      if (!reset) {
        setCurrentPage(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error loading downloads:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load download history',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDownloads(true);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      loadDownloads(false);
    }
  };

  const handleSearch = () => {
    loadDownloads(true);
  };

  const openBook = (book) => {
    navigation.navigate('BookDetail', { bookId: book.id });
  };

  const filterDownloads = (downloads) => {
    if (!searchQuery.trim()) return downloads;
    
    const query = searchQuery.toLowerCase();
    return downloads.filter(download => 
      download.books?.title?.toLowerCase().includes(query) ||
      download.books?.author?.toLowerCase().includes(query) ||
      download.books?.category?.toLowerCase().includes(query)
    );
  };

  const renderDownloadItem = ({ item }) => {
    if (!item.books) return null;

    return (
      <TouchableOpacity onPress={() => openBook(item.books)}>
        <Card style={[styles.downloadCard, { backgroundColor: colors.surface }]}>
          <Card.Content style={styles.cardContent}>
            <View style={styles.bookHeader}>
              <View style={styles.bookInfo}>
                <Title 
                  style={[styles.bookTitle, { color: colors.onSurface }]} 
                  numberOfLines={2}
                >
                  {item.books.title}
                </Title>
                <Paragraph 
                  style={[styles.bookAuthor, { color: colors.onSurface }]} 
                  numberOfLines={1}
                >
                  by {item.books.author}
                </Paragraph>
              </View>
              <Chip style={[styles.rackChip, { backgroundColor: colors.primary }]}>
                {item.books.rack_letter}
              </Chip>
            </View>

            <View style={styles.downloadInfo}>
              <View style={styles.infoRow}>
                <Ionicons name="folder" size={16} color={colors.primary} />
                <Text style={[styles.infoText, { color: colors.onSurface }]}>
                  {item.books.category}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="download" size={16} color={colors.primary} />
                <Text style={[styles.infoText, { color: colors.onSurface }]}>
                  {item.books.download_count || 0} total downloads
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="calendar" size={16} color={colors.primary} />
                <Text style={[styles.infoText, { color: colors.onSurface }]}>
                  Downloaded {new Date(item.downloaded_at).toLocaleDateString()}
                </Text>
              </View>
            </View>

            <View style={styles.cardActions}>
              <Button
                mode="text"
                onPress={() => openBook(item.books)}
                compact
                icon="book-open-variant"
                textColor={colors.primary}
              >
                View Details
              </Button>
              <Button
                mode="text"
                onPress={() => navigation.navigate('BookDetail', { bookId: item.books.id })}
                compact
                icon="download"
                textColor={colors.primary}
              >
                Download Again
              </Button>
            </View>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="download-outline" size={64} color={colors.onSurface} />
      <Title style={[styles.emptyTitle, { color: colors.onSurface }]}>
        No Downloads Yet
      </Title>
      <Paragraph style={[styles.emptyText, { color: colors.onSurface }]}>
        Start exploring and downloading books from our library!
      </Paragraph>
      <Button
        mode="contained"
        onPress={() => navigation.navigate('Books')}
        style={[styles.browseButton, { backgroundColor: colors.primary }]}
      >
        Browse Books
      </Button>
    </View>
  );

  const filteredDownloads = filterDownloads(downloads);

  if (loading && downloads.length === 0) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.onSurface }]}>
          Loading download history...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search downloaded books..."
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          value={searchQuery}
          style={[styles.searchBar, { backgroundColor: colors.surface }]}
          iconColor={colors.onSurface}
          inputStyle={{ color: colors.onSurface }}
        />
      </View>

      {/* Downloads List */}
      {filteredDownloads.length > 0 ? (
        <FlatList
          data={filteredDownloads}
          renderItem={renderDownloadItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.downloadsList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.1}
          ListFooterComponent={
            hasMore && !loading ? (
              <ActivityIndicator style={styles.loadMoreIndicator} color={colors.primary} />
            ) : null
          }
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={[styles.headerText, { color: colors.onSurface }]}>
                {filteredDownloads.length} {filteredDownloads.length === 1 ? 'Download' : 'Downloads'}
              </Text>
            </View>
          }
        />
      ) : (
        renderEmptyState()
      )}
    </View>
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
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  searchBar: {
    elevation: 2,
  },
  downloadsList: {
    padding: 16,
  },
  listHeader: {
    marginBottom: 16,
  },
  headerText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  downloadCard: {
    marginBottom: 12,
    elevation: 2,
  },
  cardContent: {
    padding: 16,
  },
  bookHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bookInfo: {
    flex: 1,
    marginRight: 12,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  rackChip: {
    height: 32,
  },
  downloadInfo: {
    gap: 6,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 14,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  browseButton: {
    borderRadius: 8,
  },
  loadMoreIndicator: {
    paddingVertical: 20,
  },
});

export default DownloadsScreen;
