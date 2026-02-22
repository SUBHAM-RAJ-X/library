import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
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
  FAB,
  Portal,
  Modal,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { apiService } from '../services/supabase';
import Toast from 'react-native-toast-message';

const BookApprovalScreen = ({ navigation }) => {
  const [pendingBooks, setPendingBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState(null);
  const [rejectionModalVisible, setRejectionModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  const { theme, colors } = useTheme();

  useEffect(() => {
    loadPendingBooks(true);
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const timeoutId = setTimeout(() => {
        loadPendingBooks(true);
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      loadPendingBooks(true);
    }
  }, [searchQuery]);

  const loadPendingBooks = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setCurrentPage(1);
        setPendingBooks([]);
      }

      const params = {
        page: reset ? 1 : currentPage,
        limit: 10,
      };

      const response = await apiService.getPendingBooks(params);
      
      if (reset) {
        setPendingBooks(response.books || []);
      } else {
        setPendingBooks(prev => [...prev, ...(response.books || [])]);
      }

      setHasMore(response.pagination?.totalPages > currentPage);
      if (!reset) {
        setCurrentPage(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error loading pending books:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load pending books',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPendingBooks(true);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      loadPendingBooks(false);
    }
  };

  const handleApproveBook = async (book) => {
    try {
      await apiService.approveBook(book.id);
      setPendingBooks(prev => prev.filter(b => b.id !== book.id));
      Toast.show({
        type: 'success',
        text1: 'Book Approved',
        text2: `"${book.title}" has been approved and is now public`,
      });
    } catch (error) {
      console.error('Error approving book:', error);
      Toast.show({
        type: 'error',
        text1: 'Approval Failed',
        text2: 'Failed to approve the book',
      });
    }
  };

  const handleRejectBook = (book) => {
    setSelectedBook(book);
    setRejectionModalVisible(true);
  };

  const confirmRejection = async () => {
    if (!rejectionReason.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Reason Required',
        text2: 'Please provide a reason for rejection',
      });
      return;
    }

    try {
      await apiService.rejectBook(selectedBook.id, rejectionReason);
      setPendingBooks(prev => prev.filter(b => b.id !== selectedBook.id));
      setRejectionModalVisible(false);
      setRejectionReason('');
      setSelectedBook(null);
      Toast.show({
        type: 'success',
        text1: 'Book Rejected',
        text2: `"${selectedBook.title}" has been rejected`,
      });
    } catch (error) {
      console.error('Error rejecting book:', error);
      Toast.show({
        type: 'error',
        text1: 'Rejection Failed',
        text2: 'Failed to reject the book',
      });
    }
  };

  const handleViewBook = (book) => {
    navigation.navigate('BookDetail', { bookId: book.id });
  };

  const filterPendingBooks = (books) => {
    if (!searchQuery.trim()) return books;
    
    const query = searchQuery.toLowerCase();
    return books.filter(book => 
      book.title?.toLowerCase().includes(query) ||
      book.author?.toLowerCase().includes(query) ||
      book.category?.toLowerCase().includes(query) ||
      book.users?.email?.toLowerCase().includes(query)
    );
  };

  const renderPendingBookItem = ({ item }) => {
    if (!item.users) return null;

    return (
      <Card style={[styles.bookCard, { backgroundColor: colors.surface }]}>
        <Card.Content style={styles.cardContent}>
          <View style={styles.bookHeader}>
            <View style={styles.bookInfo}>
              <Title 
                style={[styles.bookTitle, { color: colors.onSurface }]} 
                numberOfLines={2}
              >
                {item.title}
              </Title>
              <Paragraph 
                style={[styles.bookAuthor, { color: colors.onSurface }]} 
                numberOfLines={1}
              >
                by {item.author}
              </Paragraph>
              <Text style={[styles.uploadedBy, { color: colors.primary }]}>
                Uploaded by: {item.users.email}
              </Text>
            </View>
            <Chip style={[styles.statusChip, { backgroundColor: '#ff9800' }]}>
              Pending
            </Chip>
          </View>

          <View style={styles.bookDetails}>
            <View style={styles.detailRow}>
              <Ionicons name="folder" size={16} color={colors.primary} />
              <Text style={[styles.detailText, { color: colors.onSurface }]}>
                {item.category}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="book" size={16} color={colors.primary} />
              <Text style={[styles.detailText, { color: colors.onSurface }]}>
                {item.total_pages || 0} pages
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="calendar" size={16} color={colors.primary} />
              <Text style={[styles.detailText, { color: colors.onSurface }]}>
                {new Date(item.created_at).toLocaleDateString()}
              </Text>
            </View>
          </View>

          {item.description && (
            <Paragraph 
              style={[styles.description, { color: colors.onSurface }]} 
              numberOfLines={3}
            >
              {item.description}
            </Paragraph>
          )}

          <View style={styles.actionButtons}>
            <Button
              mode="contained"
              onPress={() => handleApproveBook(item)}
              style={[styles.approveButton, { backgroundColor: '#4caf50' }]}
              icon="check"
            >
              Approve
            </Button>
            <Button
              mode="outlined"
              onPress={() => handleRejectBook(item)}
              style={[styles.rejectButton, { borderColor: '#f44336' }]}
              textColor="#f44336"
              icon="close"
            >
              Reject
            </Button>
            <Button
              mode="text"
              onPress={() => handleViewBook(item)}
              icon="eye"
              textColor={colors.primary}
            >
              View
            </Button>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="checkmark-circle" size={64} color={colors.primary} />
      <Title style={[styles.emptyTitle, { color: colors.onSurface }]}>
        No Pending Books
      </Title>
      <Paragraph style={[styles.emptyText, { color: colors.onSurface }]}>
        All books have been reviewed. Great job!
      </Paragraph>
    </View>
  );

  const filteredBooks = filterPendingBooks(pendingBooks);

  if (loading && pendingBooks.length === 0) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.onSurface }]}>
          Loading pending books...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search pending books..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={[styles.searchBar, { backgroundColor: colors.surface }]}
          iconColor={colors.onSurface}
          inputStyle={{ color: colors.onSurface }}
        />
      </View>

      {/* Pending Books List */}
      {filteredBooks.length > 0 ? (
        <FlatList
          data={filteredBooks}
          renderItem={renderPendingBookItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.booksList}
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
                {filteredBooks.length} {filteredBooks.length === 1 ? 'Book' : 'Books'} Pending Approval
              </Text>
            </View>
          }
        />
      ) : (
        renderEmptyState()
      )}

      {/* Rejection Modal */}
      <Portal>
        <Modal
          visible={rejectionModalVisible}
          onDismiss={() => {
            setRejectionModalVisible(false);
            setRejectionReason('');
            setSelectedBook(null);
          }}
          contentContainerStyle={[styles.modal, { backgroundColor: colors.surface }]}
        >
          <Title style={[styles.modalTitle, { color: colors.onSurface }]}>
            Reject Book
          </Title>
          <Paragraph style={[styles.modalSubtitle, { color: colors.onSurface }]}>
            "{selectedBook?.title}"
          </Paragraph>
          
          <Text style={[styles.reasonLabel, { color: colors.onSurface }]}>
            Reason for rejection:
          </Text>
          <TextInput
            mode="outlined"
            multiline
            numberOfLines={4}
            value={rejectionReason}
            onChangeText={setRejectionReason}
            placeholder="Please provide a reason for rejection..."
            style={styles.reasonInput}
          />

          <View style={styles.modalActions}>
            <Button
              mode="text"
              onPress={() => {
                setRejectionModalVisible(false);
                setRejectionReason('');
                setSelectedBook(null);
              }}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={confirmRejection}
              style={[styles.confirmRejectButton, { backgroundColor: '#f44336' }]}
            >
              Reject Book
            </Button>
          </View>
        </Modal>
      </Portal>
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
  booksList: {
    padding: 16,
  },
  listHeader: {
    marginBottom: 16,
  },
  headerText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  bookCard: {
    marginBottom: 16,
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
    marginBottom: 4,
  },
  uploadedBy: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusChip: {
    height: 32,
  },
  bookDetails: {
    gap: 6,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 14,
  },
  description: {
    fontSize: 14,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  approveButton: {
    flex: 1,
    marginRight: 8,
  },
  rejectButton: {
    flex: 1,
    marginRight: 8,
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
  },
  loadMoreIndicator: {
    paddingVertical: 20,
  },
  modal: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  reasonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  reasonInput: {
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  confirmRejectButton: {
    marginLeft: 8,
  },
});

export default BookApprovalScreen;
