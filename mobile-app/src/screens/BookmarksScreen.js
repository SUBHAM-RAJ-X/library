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
  FAB,
  Portal,
  Modal,
  TextInput,
  IconButton,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { apiService } from '../services/supabase';
import Toast from 'react-native-toast-message';

const BookmarksScreen = () => {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedBookmark, setSelectedBookmark] = useState(null);
  const [pageNumber, setPageNumber] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState(null);
  
  const navigation = useNavigation();
  const { theme, colors } = useTheme();

  useEffect(() => {
    loadBookmarks();
    loadStats();
  }, []);

  const loadBookmarks = async () => {
    try {
      setLoading(true);
      
      const response = await apiService.getBookmarks({
        limit: 100
      });
      
      setBookmarks(response.bookmarks || []);
    } catch (error) {
      console.error('Error loading bookmarks:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load bookmarks',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await apiService.getBookmarkStats();
      setStats(response);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadBookmarks();
    loadStats();
  };

  const handleAddBookmark = (book) => {
    setSelectedBook(book);
    setPageNumber('');
    setNote('');
    setAddModalVisible(true);
  };

  const handleEditBookmark = (bookmark) => {
    setSelectedBookmark(bookmark);
    setPageNumber(bookmark.page_number?.toString() || '');
    setNote(bookmark.note || '');
    setEditModalVisible(true);
  };

  const handleDeleteBookmark = async (bookmarkId) => {
    try {
      await apiService.deleteBookmark(bookmarkId);
      setBookmarks(prev => prev.filter(b => b.id !== bookmarkId));
      loadStats();
      
      Toast.show({
        type: 'success',
        text1: 'Bookmark Deleted',
        text2: 'Bookmark has been removed',
      });
    } catch (error) {
      console.error('Error deleting bookmark:', error);
      Toast.show({
        type: 'error',
        text1: 'Deletion Failed',
        text2: 'Failed to delete bookmark',
      });
    }
  };

  const saveBookmark = async () => {
    if (!pageNumber || !selectedBook) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please fill in all required fields',
      });
      return;
    }

    try {
      setSubmitting(true);
      
      await apiService.createBookmark({
        book_id: selectedBook.id,
        page_number: parseInt(pageNumber),
        note: note.trim() || null
      });

      setAddModalVisible(false);
      setSelectedBook(null);
      setPageNumber('');
      setNote('');
      
      loadBookmarks();
      loadStats();
      
      Toast.show({
        type: 'success',
        text1: 'Bookmark Added',
        text2: 'Bookmark has been saved',
      });
    } catch (error) {
      console.error('Error saving bookmark:', error);
      Toast.show({
        type: 'error',
        text1: 'Save Failed',
        text2: error.message || 'Failed to save bookmark',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const updateBookmark = async () => {
    if (!pageNumber || !selectedBookmark) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please fill in all required fields',
      });
      return;
    }

    try {
      setSubmitting(true);
      
      await apiService.updateBookmark(selectedBookmark.id, {
        page_number: parseInt(pageNumber),
        note: note.trim() || null
      });

      setEditModalVisible(false);
      setSelectedBookmark(null);
      setPageNumber('');
      setNote('');
      
      loadBookmarks();
      
      Toast.show({
        type: 'success',
        text1: 'Bookmark Updated',
        text2: 'Bookmark has been updated',
      });
    } catch (error) {
      console.error('Error updating bookmark:', error);
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: error.message || 'Failed to update bookmark',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenBook = (book) => {
    navigation.navigate('BookDetail', { bookId: book.id });
  };

  const groupBookmarksByBook = (bookmarks) => {
    const grouped = {};
    
    bookmarks.forEach(bookmark => {
      if (!bookmark.books) return;
      
      const bookId = bookmark.book_id;
      if (!grouped[bookId]) {
        grouped[bookId] = {
          book: bookmark.books,
          bookmarks: []
        };
      }
      grouped[bookId].bookmarks.push(bookmark);
    });
    
    return Object.values(grouped);
  };

  const renderBookmarkItem = ({ item }) => {
    return (
      <Card style={[styles.bookCard, { backgroundColor: colors.surface }]}>
        <Card.Content style={styles.cardContent}>
          <View style={styles.bookHeader}>
            <View style={styles.bookInfo}>
              <Title 
                style={[styles.bookTitle, { color: colors.onSurface }]} 
                numberOfLines={2}
              >
                {item.book.title}
              </Title>
              <Paragraph 
                style={[styles.bookAuthor, { color: colors.onSurface }]} 
                numberOfLines={1}
              >
                by {item.book.author}
              </Paragraph>
            </View>
            <Button
              mode="text"
              onPress={() => handleOpenBook(item.book)}
              icon="book-open-variant"
              textColor={colors.primary}
            >
              Open
            </Button>
          </View>

          <View style={styles.bookmarksList}>
            {item.bookmarks.map((bookmark) => (
              <View 
                key={bookmark.id} 
                style={[styles.bookmarkItem, { backgroundColor: colors.background }]}
              >
                <View style={styles.bookmarkContent}>
                  <View style={styles.bookmarkHeader}>
                    <View style={styles.bookmarkInfo}>
                      <Ionicons name="bookmark" size={16} color={colors.primary} />
                      <Text style={[styles.pageNumber, { color: colors.onSurface }]}>
                        Page {bookmark.page_number}
                      </Text>
                    </View>
                    <View style={styles.bookmarkActions}>
                      <IconButton
                        size={20}
                        icon="pencil"
                        onPress={() => handleEditBookmark(bookmark)}
                      />
                      <IconButton
                        size={20}
                        icon="delete"
                        onPress={() => handleDeleteBookmark(bookmark.id)}
                      />
                    </View>
                  </View>
                  
                  {bookmark.note && (
                    <Text style={[styles.bookmarkNote, { color: colors.onSurface }]}>
                      {bookmark.note}
                    </Text>
                  )}
                  
                  <Text style={[styles.bookmarkDate, { color: colors.onSurface }]}>
                    {new Date(bookmark.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderStatsCard = () => {
    if (!stats) return null;

    return (
      <Card style={[styles.statsCard, { backgroundColor: colors.surface }]}>
        <Card.Content>
          <Title style={[styles.statsTitle, { color: colors.onSurface }]}>
            🔖 Bookmark Statistics
          </Title>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.primary }]}>
                {stats.total_bookmarks}
              </Text>
              <Text style={[styles.statLabel, { color: colors.onSurface }]}>
                Total Bookmarks
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.primary }]}>
                {stats.books_with_bookmarks}
              </Text>
              <Text style={[styles.statLabel, { color: colors.onSurface }]}>
                Books
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="bookmark-outline" size={64} color={colors.primary} />
      <Title style={[styles.emptyTitle, { color: colors.onSurface }]}>
        No Bookmarks Yet
      </Title>
      <Paragraph style={[styles.emptyText, { color: colors.onSurface }]}>
        Start reading and bookmark your favorite pages
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

  if (loading && bookmarks.length === 0) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.onSurface }]}>
          Loading bookmarks...
        </Text>
      </View>
    );
  }

  const groupedBookmarks = groupBookmarksByBook(bookmarks);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Stats Card */}
      {renderStatsCard()}

      {/* Bookmarks List */}
      {groupedBookmarks.length > 0 ? (
        <FlatList
          data={groupedBookmarks}
          renderItem={renderBookmarkItem}
          keyExtractor={item => item.book.id}
          contentContainerStyle={styles.bookmarksList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      ) : (
        renderEmptyState()
      )}

      {/* Add Bookmark Modal */}
      <Portal>
        <Modal
          visible={addModalVisible}
          onDismiss={() => {
            setAddModalVisible(false);
            setSelectedBook(null);
            setPageNumber('');
            setNote('');
          }}
          contentContainerStyle={[styles.modal, { backgroundColor: colors.surface }]}
        >
          <Title style={[styles.modalTitle, { color: colors.onSurface }]}>
            Add Bookmark
          </Title>
          <Paragraph style={[styles.modalSubtitle, { color: colors.onSurface }]}>
            "{selectedBook?.title}"
          </Paragraph>
          
          <TextInput
            mode="outlined"
            label="Page Number"
            value={pageNumber}
            onChangeText={setPageNumber}
            keyboardType="numeric"
            style={styles.input}
          />
          
          <TextInput
            mode="outlined"
            label="Note (optional)"
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={3}
            placeholder="Add a note about this page..."
            style={styles.input}
          />

          <View style={styles.modalActions}>
            <Button
              mode="text"
              onPress={() => {
                setAddModalVisible(false);
                setSelectedBook(null);
                setPageNumber('');
                setNote('');
              }}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={saveBookmark}
              loading={submitting}
              disabled={submitting || !pageNumber}
            >
              Add Bookmark
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* Edit Bookmark Modal */}
      <Portal>
        <Modal
          visible={editModalVisible}
          onDismiss={() => {
            setEditModalVisible(false);
            setSelectedBookmark(null);
            setPageNumber('');
            setNote('');
          }}
          contentContainerStyle={[styles.modal, { backgroundColor: colors.surface }]}
        >
          <Title style={[styles.modalTitle, { color: colors.onSurface }]}>
            Edit Bookmark
          </Title>
          
          <TextInput
            mode="outlined"
            label="Page Number"
            value={pageNumber}
            onChangeText={setPageNumber}
            keyboardType="numeric"
            style={styles.input}
          />
          
          <TextInput
            mode="outlined"
            label="Note (optional)"
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={3}
            placeholder="Update your note..."
            style={styles.input}
          />

          <View style={styles.modalActions}>
            <Button
              mode="text"
              onPress={() => {
                setEditModalVisible(false);
                setSelectedBookmark(null);
                setPageNumber('');
                setNote('');
              }}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={updateBookmark}
              loading={submitting}
              disabled={submitting || !pageNumber}
            >
              Update
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
  statsCard: {
    margin: 16,
    elevation: 2,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  bookmarksList: {
    padding: 16,
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
    marginBottom: 16,
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
  bookmarksList: {
    gap: 8,
  },
  bookmarkItem: {
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#2196f3',
  },
  bookmarkContent: {
    gap: 4,
  },
  bookmarkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookmarkInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pageNumber: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  bookmarkActions: {
    flexDirection: 'row',
    gap: 4,
  },
  bookmarkNote: {
    fontSize: 14,
    fontStyle: 'italic',
    marginLeft: 22,
  },
  bookmarkDate: {
    fontSize: 12,
    color: '#666',
    marginLeft: 22,
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
  input: {
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
});

export default BookmarksScreen;
