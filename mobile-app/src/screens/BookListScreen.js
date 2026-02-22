import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
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
  RadioButton,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { apiService } from '../services/supabase';

const { width } = Dimensions.get('window');
const NUM_COLUMNS = 2;

const BookListScreen = ({ route }) => {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLetter, setSelectedLetter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  
  const navigation = useNavigation();
  const { theme, colors } = useTheme();
  
  const initialSearchQuery = route.params?.searchQuery || '';
  const initialCategory = route.params?.category || '';

  useEffect(() => {
    if (initialSearchQuery) {
      setSearchQuery(initialSearchQuery);
    }
    if (initialCategory) {
      setSelectedCategory(initialCategory);
    }
  }, [initialSearchQuery, initialCategory]);

  useFocusEffect(
    useCallback(() => {
      loadBooks(true);
      loadCategories();
    }, [])
  );

  useEffect(() => {
    loadBooks(true);
  }, [searchQuery, selectedCategory, selectedLetter, sortBy, sortOrder]);

  const loadBooks = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setCurrentPage(1);
        setBooks([]);
      }

      const params = {
        page: reset ? 1 : currentPage,
        limit: 20,
        query: searchQuery || undefined,
        category: selectedCategory || undefined,
        rack_letter: selectedLetter || undefined,
        sort: sortBy,
        order: sortOrder,
      };

      const response = await apiService.getBooks(params);
      
      if (reset) {
        setBooks(response.books || []);
      } else {
        setBooks(prev => [...prev, ...(response.books || [])]);
      }

      setHasMore(response.pagination?.totalPages > currentPage);
      if (!reset) {
        setCurrentPage(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error loading books:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await apiService.getCategories();
      setCategories(response.categories || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadBooks(true);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      loadBooks(false);
    }
  };

  const handleSearch = () => {
    loadBooks(true);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedLetter('');
    setSortBy('created_at');
    setSortOrder('desc');
    setShowFilters(false);
  };

  const renderBookItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('BookDetail', { bookId: item.id })}
      style={styles.bookItemContainer}
    >
      <Card style={[styles.bookCard, { backgroundColor: colors.surface }]}>
        <Card.Content style={styles.bookCardContent}>
          <View style={styles.bookHeader}>
            <Chip 
              style={[styles.rackChip, { backgroundColor: colors.primary }]}
              textStyle={{ color: '#ffffff', fontSize: 10 }}
            >
              {item.rack_letter}
            </Chip>
          </View>
          
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
            {item.author}
          </Paragraph>
          
          <View style={styles.bookFooter}>
            <Text style={[styles.categoryText, { color: colors.primary }]}>
              {item.category}
            </Text>
            <Text style={[styles.downloadsText, { color: colors.onSurface }]}>
              📥 {item.download_count || 0}
            </Text>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  const renderAlphabetSelector = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    
    return (
      <View style={styles.alphabetContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.alphabetRow}>
            <Chip
              style={[
                styles.letterChip,
                !selectedLetter && { backgroundColor: colors.primary }
              ]}
              textStyle={[
                styles.letterText,
                !selectedLetter && { color: '#ffffff' }
              ]}
              onPress={() => setSelectedLetter('')}
            >
              All
            </Chip>
            {letters.map(letter => (
              <Chip
                key={letter}
                style={[
                  styles.letterChip,
                  selectedLetter === letter && { backgroundColor: colors.primary }
                ]}
                textStyle={[
                  styles.letterText,
                  selectedLetter === letter && { color: '#ffffff' }
                ]}
                onPress={() => setSelectedLetter(letter)}
              >
                {letter}
              </Chip>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderCategoryFilter = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.categoryRow}>
        <Chip
          style={[
            styles.categoryChip,
            !selectedCategory && { backgroundColor: colors.primary }
          ]}
          textStyle={[
            styles.categoryChipText,
            !selectedCategory && { color: '#ffffff' }
          ]}
          onPress={() => setSelectedCategory('')}
        >
          All Categories
        </Chip>
        {categories.map(category => (
          <Chip
            key={category.id}
            style={[
              styles.categoryChip,
              selectedCategory === category.name && { backgroundColor: colors.primary }
            ]}
            textStyle={[
              styles.categoryChipText,
              selectedCategory === category.name && { color: '#ffffff' }
            ]}
            onPress={() => setSelectedCategory(category.name)}
          >
            {category.name}
          </Chip>
        ))}
      </View>
    </ScrollView>
  );

  if (loading && books.length === 0) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.onSurface }]}>
          Loading books...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search books, authors..."
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          value={searchQuery}
          style={[styles.searchBar, { backgroundColor: colors.surface }]}
          iconColor={colors.onSurface}
          inputStyle={{ color: colors.onSurface }}
        />
        <Button
          mode="outlined"
          onPress={() => setShowFilters(true)}
          style={styles.filterButton}
          icon="filter-variant"
        >
          Filters
        </Button>
      </View>

      {/* Category Filter */}
      {renderCategoryFilter()}

      {/* Alphabet Selector */}
      {renderAlphabetSelector()}

      {/* Books List */}
      <FlatList
        data={books}
        renderItem={renderBookItem}
        keyExtractor={item => item.id}
        numColumns={NUM_COLUMNS}
        contentContainerStyle={styles.booksList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.onSurface }]}>
              No books found. Try adjusting your filters or upload a book!
            </Text>
          </View>
        }
        ListFooterComponent={
          hasMore && !loading ? (
            <ActivityIndicator style={styles.loadMoreIndicator} color={colors.primary} />
          ) : null
        }
      />

      {/* Upload FAB */}
      <FAB
        style={[styles.fab, { backgroundColor: colors.primary }]}
        icon="plus"
        onPress={() => navigation.navigate('Upload')}
      />

      {/* Filters Modal */}
      <Portal>
        <Modal
          visible={showFilters}
          onDismiss={() => setShowFilters(false)}
          contentContainerStyle={[styles.modalContainer, { backgroundColor: colors.surface }]}
        >
          <Title style={[styles.modalTitle, { color: colors.onSurface }]}>
            Sort Options
          </Title>
          
          <Text style={[styles.sectionLabel, { color: colors.onSurface }]}>
            Sort By:
          </Text>
          <RadioButton.Group
            onValueChange={newValue => setSortBy(newValue)}
            value={sortBy}
          >
            <RadioButton.Item label="Date Added" value="created_at" />
            <RadioButton.Item label="Title" value="title" />
            <RadioButton.Item label="Author" value="author" />
            <RadioButton.Item label="Downloads" value="download_count" />
          </RadioButton.Group>

          <Text style={[styles.sectionLabel, { color: colors.onSurface }]}>
            Order:
          </Text>
          <RadioButton.Group
            onValueChange={newValue => setSortOrder(newValue)}
            value={sortOrder}
          >
            <RadioButton.Item label="Ascending" value="asc" />
            <RadioButton.Item label="Descending" value="desc" />
          </RadioButton.Group>

          <View style={styles.modalActions}>
            <Button mode="outlined" onPress={clearFilters} style={styles.modalButton}>
              Clear All
            </Button>
            <Button 
              mode="contained" 
              onPress={() => setShowFilters(false)} 
              style={[styles.modalButton, { backgroundColor: colors.primary }]}
            >
              Apply
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
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  searchBar: {
    flex: 1,
    elevation: 2,
  },
  filterButton: {
    justifyContent: 'center',
  },
  categoryRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  categoryChip: {
    height: 32,
  },
  categoryChipText: {
    fontSize: 12,
  },
  alphabetContainer: {
    backgroundColor: 'rgba(0,0,0,0.02)',
    paddingVertical: 8,
  },
  alphabetRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 4,
  },
  letterChip: {
    height: 32,
    minWidth: 32,
  },
  letterText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  booksList: {
    padding: 16,
  },
  bookItemContainer: {
    width: (width - 48) / NUM_COLUMNS,
    marginHorizontal: 4,
    marginBottom: 12,
  },
  bookCard: {
    elevation: 2,
    height: 200,
  },
  bookCardContent: {
    flex: 1,
    padding: 12,
  },
  bookHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  rackChip: {
    height: 24,
  },
  bookTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 12,
    marginBottom: 8,
  },
  bookFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
  },
  categoryText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  downloadsText: {
    fontSize: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
  },
  loadMoreIndicator: {
    paddingVertical: 20,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
    maxHeight: '80%',
  },
  modalTitle: {
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 8,
  },
});

export default BookListScreen;
