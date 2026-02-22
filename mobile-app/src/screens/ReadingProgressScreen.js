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
  ProgressBar,
  FAB,
  Portal,
  Modal,
  TextInput,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { apiService } from '../services/supabase';
import Toast from 'react-native-toast-message';

const ReadingProgressScreen = () => {
  const [readingProgress, setReadingProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [stats, setStats] = useState(null);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [currentPage, setCurrentPage] = useState('');
  const [totalPages, setTotalPages] = useState('');
  
  const navigation = useNavigation();
  const { theme, colors } = useTheme();

  useEffect(() => {
    loadReadingProgress();
    loadStats();
  }, [selectedStatus]);

  const loadReadingProgress = async () => {
    try {
      setLoading(true);
      
      const params = {
        status: selectedStatus,
        limit: 50,
      };

      const response = await apiService.getReadingProgress(params);
      setReadingProgress(response.progress || []);
    } catch (error) {
      console.error('Error loading reading progress:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load reading progress',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await apiService.getReadingStats();
      setStats(response);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadReadingProgress();
    loadStats();
  };

  const handleUpdateProgress = (book) => {
    setSelectedBook(book);
    setCurrentPage(book.current_page?.toString() || '');
    setTotalPages(book.total_pages?.toString() || '');
    setUpdateModalVisible(true);
  };

  const saveProgress = async () => {
    if (!currentPage || !totalPages) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please fill in all fields',
      });
      return;
    }

    try {
      await apiService.updateReadingProgress(selectedBook.book_id, {
        current_page: parseInt(currentPage),
        total_pages: parseInt(totalPages),
      });

      setUpdateModalVisible(false);
      setSelectedBook(null);
      setCurrentPage('');
      setTotalPages('');
      
      loadReadingProgress();
      loadStats();
      
      Toast.show({
        type: 'success',
        text1: 'Progress Updated',
        text2: 'Your reading progress has been saved',
      });
    } catch (error) {
      console.error('Error updating progress:', error);
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: 'Failed to update reading progress',
      });
    }
  };

  const markAsCompleted = async (book) => {
    try {
      await apiService.markBookAsCompleted(book.book_id);
      loadReadingProgress();
      loadStats();
      
      Toast.show({
        type: 'success',
        text1: 'Book Completed',
        text2: `Congratulations! You finished "${book.books.title}"`,
      });
    } catch (error) {
      console.error('Error marking as completed:', error);
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: 'Failed to mark book as completed',
      });
    }
  };

  const handleOpenBook = (book) => {
    navigation.navigate('BookDetail', { bookId: book.book_id });
  };

  const getStatusColor = (progress) => {
    if (progress.is_completed) return '#4caf50';
    if (progress.current_page > 0) return '#2196f3';
    return '#9e9e9e';
  };

  const getStatusText = (progress) => {
    if (progress.is_completed) return 'Completed';
    if (progress.current_page > 0) return 'Reading';
    return 'Not Started';
  };

  const renderProgressItem = ({ item }) => {
    if (!item.books) return null;

    return (
      <Card style={[styles.progressCard, { backgroundColor: colors.surface }]}>
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
            <Chip 
              style={[styles.statusChip, { backgroundColor: getStatusColor(item) }]}
              textStyle={{ color: '#ffffff' }}
            >
              {getStatusText(item)}
            </Chip>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={[styles.progressText, { color: colors.onSurface }]}>
                Progress
              </Text>
              <Text style={[styles.progressPercentage, { color: colors.primary }]}>
                {item.progress_percentage || 0}%
              </Text>
            </View>
            <ProgressBar
              progress={item.progress_percentage / 100 || 0}
              color={colors.primary}
              style={styles.progressBar}
            />
            <Text style={[styles.pageText, { color: colors.onSurface }]}>
              Page {item.current_page || 0} of {item.total_pages || 0}
            </Text>
          </View>

          {/* Last Read */}
          {item.last_read_at && (
            <View style={styles.lastReadContainer}>
              <Ionicons name="time" size={16} color={colors.primary} />
              <Text style={[styles.lastReadText, { color: colors.onSurface }]}>
                Last read {new Date(item.last_read_at).toLocaleDateString()}
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Button
              mode="text"
              onPress={() => handleOpenBook(item)}
              icon="book-open-variant"
              textColor={colors.primary}
            >
              View Book
            </Button>
            <Button
              mode="text"
              onPress={() => handleUpdateProgress(item)}
              icon="pencil"
              textColor={colors.primary}
            >
              Update
            </Button>
            {!item.is_completed && item.current_page > 0 && (
              <Button
                mode="text"
                onPress={() => markAsCompleted(item)}
                icon="check"
                textColor="#4caf50"
              >
                Complete
              </Button>
            )}
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
            📊 Reading Statistics
          </Title>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.primary }]}>
                {stats.total_books}
              </Text>
              <Text style={[styles.statLabel, { color: colors.onSurface }]}>
                Total Books
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#4caf50' }]}>
                {stats.completed_books}
              </Text>
              <Text style={[styles.statLabel, { color: colors.onSurface }]}>
                Completed
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#2196f3' }]}>
                {stats.currently_reading}
              </Text>
              <Text style={[styles.statLabel, { color: colors.onSurface }]}>
                Reading
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.primary }]}>
                {stats.completion_rate}%
              </Text>
              <Text style={[styles.statLabel, { color: colors.onSurface }]}>
                Completion Rate
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="book-outline" size={64} color={colors.primary} />
      <Title style={[styles.emptyTitle, { color: colors.onSurface }]}>
        No Reading Progress
      </Title>
      <Paragraph style={[styles.emptyText, { color: colors.onSurface }]}>
        Start reading books to track your progress here
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

  if (loading && readingProgress.length === 0) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.onSurface }]}>
          Loading reading progress...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Stats Card */}
      {renderStatsCard()}

      {/* Status Filter */}
      <View style={styles.filterContainer}>
        <Chip
          selected={selectedStatus === 'all'}
          onPress={() => setSelectedStatus('all')}
          style={styles.filterChip}
        >
          All
        </Chip>
        <Chip
          selected={selectedStatus === 'reading'}
          onPress={() => setSelectedStatus('reading')}
          style={styles.filterChip}
        >
          Reading
        </Chip>
        <Chip
          selected={selectedStatus === 'completed'}
          onPress={() => setSelectedStatus('completed')}
          style={styles.filterChip}
        >
          Completed
        </Chip>
        <Chip
          selected={selectedStatus === 'not-started'}
          onPress={() => setSelectedStatus('not-started')}
          style={styles.filterChip}
        >
          Not Started
        </Chip>
      </View>

      {/* Progress List */}
      {readingProgress.length > 0 ? (
        <FlatList
          data={readingProgress}
          renderItem={renderProgressItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.progressList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      ) : (
        renderEmptyState()
      )}

      {/* Update Progress Modal */}
      <Portal>
        <Modal
          visible={updateModalVisible}
          onDismiss={() => {
            setUpdateModalVisible(false);
            setSelectedBook(null);
            setCurrentPage('');
            setTotalPages('');
          }}
          contentContainerStyle={[styles.modal, { backgroundColor: colors.surface }]}
        >
          <Title style={[styles.modalTitle, { color: colors.onSurface }]}>
            Update Reading Progress
          </Title>
          <Paragraph style={[styles.modalSubtitle, { color: colors.onSurface }]}>
            "{selectedBook?.books?.title}"
          </Paragraph>
          
          <TextInput
            mode="outlined"
            label="Current Page"
            value={currentPage}
            onChangeText={setCurrentPage}
            keyboardType="numeric"
            style={styles.input}
          />
          
          <TextInput
            mode="outlined"
            label="Total Pages"
            value={totalPages}
            onChangeText={setTotalPages}
            keyboardType="numeric"
            style={styles.input}
          />

          <View style={styles.modalActions}>
            <Button
              mode="text"
              onPress={() => {
                setUpdateModalVisible(false);
                setSelectedBook(null);
                setCurrentPage('');
                setTotalPages('');
              }}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={saveProgress}
            >
              Save Progress
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
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  filterChip: {
    flex: 1,
  },
  progressList: {
    padding: 16,
  },
  progressCard: {
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
  statusChip: {
    height: 32,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  pageText: {
    fontSize: 12,
    textAlign: 'center',
  },
  lastReadContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 6,
  },
  lastReadText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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

export default ReadingProgressScreen;
