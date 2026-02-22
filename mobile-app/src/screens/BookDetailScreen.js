import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Share,
  Linking,
} from 'react-native';
import {
  Text,
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  ActivityIndicator,
  IconButton,
  Divider,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { apiService } from '../services/supabase';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const BookDetailScreen = () => {
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  
  const route = useRoute();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { theme, colors } = useTheme();
  
  const { bookId } = route.params;

  useEffect(() => {
    loadBookDetails();
  }, [bookId]);

  const loadBookDetails = async () => {
    try {
      setLoading(true);
      const { book: bookData } = await apiService.getBook(bookId);
      setBook(bookData);
      
      // Check if book is already downloaded
      checkDownloadStatus(bookData);
    } catch (error) {
      console.error('Error loading book details:', error);
      Alert.alert('Error', 'Failed to load book details');
    } finally {
      setLoading(false);
    }
  };

  const checkDownloadStatus = async (bookData) => {
    try {
      const { downloads } = await apiService.getDownloadHistory();
      const isAlreadyDownloaded = downloads.some(
        download => download.book_id === bookId
      );
      setIsDownloaded(isAlreadyDownloaded);
    } catch (error) {
      console.error('Error checking download status:', error);
    }
  };

  const handleDownload = async () => {
    if (!book) return;

    try {
      setDownloading(true);
      
      // Record download in backend
      await apiService.recordDownload(book.id);
      
      // Download the file
      const downloadResumable = FileSystem.createDownloadResumable(
        book.file_url,
        FileSystem.documentDirectory + `${book.title.replace(/[^a-z0-9]/gi, '_')}.pdf`
      );

      const result = await downloadResumable.downloadAsync();
      
      if (result) {
        setIsDownloaded(true);
        
        // Ask user if they want to open or share the file
        Alert.alert(
          'Download Complete',
          'Book downloaded successfully! What would you like to do?',
          [
            {
              text: 'Open',
              onPress: () => Sharing.shareAsync(result.uri),
            },
            {
              text: 'Share',
              onPress: () => Sharing.shareAsync(result.uri),
            },
            {
              text: 'Cancel',
              style: 'cancel',
            },
          ]
        );
      }
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Download Failed', 'Failed to download the book. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    if (!book) return;

    try {
      await Share.share({
        message: `Check out this book: ${book.title} by ${book.author}\n\nAvailable in our Library Management System!`,
        title: book.title,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleOpenUrl = () => {
    if (book?.file_url) {
      Linking.openURL(book.file_url);
    }
  };

  const handleEdit = () => {
    navigation.navigate('EditBook', { bookId: book.id });
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Book',
      'Are you sure you want to delete this book? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteBook(book.id);
              Alert.alert('Success', 'Book deleted successfully');
              navigation.goBack();
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Error', 'Failed to delete book');
            }
          },
        },
      ]
    );
  };

  const canEdit = user && (book?.uploaded_by === user.id || user.role === 'admin');
  const canDelete = user && user.role === 'admin';

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.onSurface }]}>
          Loading book details...
        </Text>
      </View>
    );
  }

  if (!book) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.onSurface }]}>
          Book not found
        </Text>
        <Button mode="contained" onPress={() => navigation.goBack()}>
          Go Back
        </Button>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header Actions */}
      <View style={styles.headerActions}>
        <IconButton
          icon="share-variant"
          size={24}
          iconColor={colors.primary}
          onPress={handleShare}
        />
        {canEdit && (
          <IconButton
            icon="pencil"
            size={24}
            iconColor={colors.primary}
            onPress={handleEdit}
          />
        )}
        {canDelete && (
          <IconButton
            icon="delete"
            size={24}
            iconColor="#ef4444"
            onPress={handleDelete}
          />
        )}
      </View>

      {/* Book Info Card */}
      <Card style={[styles.bookCard, { backgroundColor: colors.surface }]}>
        <Card.Content style={styles.bookContent}>
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

          <View style={styles.bookMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="folder" size={16} color={colors.primary} />
              <Text style={[styles.metaText, { color: colors.onSurface }]}>
                {book.category}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="download" size={16} color={colors.primary} />
              <Text style={[styles.metaText, { color: colors.onSurface }]}>
                {book.download_count || 0} downloads
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="calendar" size={16} color={colors.primary} />
              <Text style={[styles.metaText, { color: colors.onSurface }]}>
                {new Date(book.created_at).toLocaleDateString()}
              </Text>
            </View>
          </View>

          {book.description && (
            <>
              <Divider style={styles.divider} />
              <View style={styles.descriptionSection}>
                <Title style={[styles.sectionTitle, { color: colors.onSurface }]}>
                  Description
                </Title>
                <Paragraph style={[styles.description, { color: colors.onSurface }]}>
                  {book.description}
                </Paragraph>
              </View>
            </>
          )}

          <Divider style={styles.divider} />

          <View style={styles.fileInfoSection}>
            <Title style={[styles.sectionTitle, { color: colors.onSurface }]}>
              File Information
            </Title>
            <View style={styles.fileInfo}>
              <View style={styles.fileMetaItem}>
                <Text style={[styles.fileMetaLabel, { color: colors.onSurface }]}>
                  File Name:
                </Text>
                <Text style={[styles.fileMetaValue, { color: colors.primary }]}>
                  {book.file_name}
                </Text>
              </View>
              {book.file_size && (
                <View style={styles.fileMetaItem}>
                  <Text style={[styles.fileMetaLabel, { color: colors.onSurface }]}>
                    File Size:
                  </Text>
                  <Text style={[styles.fileMetaValue, { color: colors.primary }]}>
                    {(book.file_size / (1024 * 1024)).toFixed(2)} MB
                  </Text>
                </View>
              )}
            </View>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.uploadedInfoSection}>
            <Title style={[styles.sectionTitle, { color: colors.onSurface }]}>
              Uploaded By
            </Title>
            <View style={styles.uploaderInfo}>
              <Ionicons name="person-circle" size={20} color={colors.primary} />
              <Text style={[styles.uploaderText, { color: colors.onSurface }]}>
                {book.users?.email || 'Unknown'}
              </Text>
              <Chip style={styles.roleChip} textStyle={{ fontSize: 10 }}>
                {book.users?.role || 'student'}
              </Chip>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <Button
          mode="contained"
          onPress={handleDownload}
          loading={downloading}
          disabled={downloading || isDownloaded}
          style={[
            styles.downloadButton,
            { backgroundColor: isDownloaded ? '#10b981' : colors.primary }
          ]}
          contentStyle={styles.buttonContent}
        >
          {downloading 
            ? 'Downloading...' 
            : isDownloaded 
              ? '✓ Downloaded' 
              : 'Download Book'
          }
        </Button>

        <Button
          mode="outlined"
          onPress={handleOpenUrl}
          style={styles.openButton}
          contentStyle={styles.buttonContent}
        >
          Open in Browser
        </Button>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    marginBottom: 20,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  bookCard: {
    margin: 16,
    elevation: 4,
  },
  bookContent: {
    padding: 20,
  },
  bookHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  bookInfo: {
    flex: 1,
    marginRight: 16,
  },
  bookTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  bookAuthor: {
    fontSize: 16,
    fontStyle: 'italic',
  },
  rackChip: {
    height: 32,
  },
  bookMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 14,
  },
  divider: {
    marginVertical: 16,
  },
  descriptionSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  fileInfoSection: {
    marginBottom: 16,
  },
  fileInfo: {
    gap: 8,
  },
  fileMetaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fileMetaLabel: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  fileMetaValue: {
    fontSize: 14,
  },
  uploadedInfoSection: {
    marginBottom: 16,
  },
  uploaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  uploaderText: {
    fontSize: 14,
    flex: 1,
  },
  roleChip: {
    height: 24,
  },
  actionButtons: {
    padding: 16,
    gap: 12,
  },
  downloadButton: {
    borderRadius: 8,
  },
  openButton: {
    borderRadius: 8,
    borderColor: '#6366f1',
  },
  buttonContent: {
    paddingVertical: 12,
  },
});

export default BookDetailScreen;
