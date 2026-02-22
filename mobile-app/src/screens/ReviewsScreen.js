import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  Text,
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  ActivityIndicator,
  Rating,
  Portal,
  Modal,
  TextInput,
  Divider,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { apiService } from '../services/supabase';
import Toast from 'react-native-toast-message';

const ReviewsScreen = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [userReview, setUserReview] = useState(null);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [bookStats, setBookStats] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  const navigation = useNavigation();
  const route = useRoute();
  const { bookId, bookTitle } = route.params || {};
  const { theme, colors } = useTheme();

  useEffect(() => {
    if (bookId) {
      loadReviews();
      loadBookStats();
      loadUserReview();
    }
  }, [bookId]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      
      const response = await apiService.getBookReviews(bookId, {
        limit: 50,
        sort: 'created_at',
        order: 'desc'
      });
      
      setReviews(response.reviews || []);
    } catch (error) {
      console.error('Error loading reviews:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load reviews',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadBookStats = async () => {
    try {
      const response = await apiService.getReviewStats(bookId);
      setBookStats(response);
    } catch (error) {
      console.error('Error loading book stats:', error);
    }
  };

  const loadUserReview = async () => {
    try {
      const response = await apiService.getMyReviews();
      const myReview = response.reviews?.find(r => r.book_id === bookId);
      setUserReview(myReview);
      if (myReview) {
        setRating(myReview.rating);
        setReviewText(myReview.review_text || '');
      }
    } catch (error) {
      console.error('Error loading user review:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadReviews();
    loadBookStats();
    loadUserReview();
  };

  const handleSubmitReview = async () => {
    if (rating === 0) {
      Toast.show({
        type: 'error',
        text1: 'Rating Required',
        text2: 'Please select a rating',
      });
      return;
    }

    try {
      setSubmitting(true);
      
      await apiService.createOrUpdateReview(bookId, {
        rating,
        review_text: reviewText.trim() || null
      });

      setReviewModalVisible(false);
      loadReviews();
      loadBookStats();
      loadUserReview();
      
      Toast.show({
        type: 'success',
        text1: 'Review Submitted',
        text2: userReview ? 'Your review has been updated' : 'Your review has been added',
      });
    } catch (error) {
      console.error('Error submitting review:', error);
      Toast.show({
        type: 'error',
        text1: 'Submission Failed',
        text2: 'Failed to submit your review',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditReview = () => {
    setReviewModalVisible(true);
  };

  const handleDeleteReview = async () => {
    try {
      await apiService.deleteReview(userReview.id);
      setUserReview(null);
      setRating(0);
      setReviewText('');
      loadReviews();
      loadBookStats();
      
      Toast.show({
        type: 'success',
        text1: 'Review Deleted',
        text2: 'Your review has been removed',
      });
    } catch (error) {
      console.error('Error deleting review:', error);
      Toast.show({
        type: 'error',
        text1: 'Deletion Failed',
        text2: 'Failed to delete your review',
      });
    }
  };

  const renderReviewItem = ({ item }) => {
    if (!item.users) return null;

    return (
      <Card style={[styles.reviewCard, { backgroundColor: colors.surface }]}>
        <Card.Content style={styles.cardContent}>
          <View style={styles.reviewHeader}>
            <View style={styles.reviewerInfo}>
              <Text style={[styles.reviewerName, { color: colors.onSurface }]}>
                {item.users.email.split('@')[0]}
              </Text>
              <Text style={[styles.reviewDate, { color: colors.onSurface }]}>
                {new Date(item.created_at).toLocaleDateString()}
              </Text>
            </View>
            <Rating
              rating={item.rating}
              size={16}
              readonly
              starContainerStyle={styles.ratingContainer}
            />
          </View>

          {item.review_text && (
            <Paragraph 
              style={[styles.reviewText, { color: colors.onSurface }]}
            >
              {item.review_text}
            </Paragraph>
          )}

          {item.updated_at && item.updated_at !== item.created_at && (
            <Text style={[styles.editedText, { color: colors.onSurface }]}>
              Edited {new Date(item.updated_at).toLocaleDateString()}
            </Text>
          )}
        </Card.Content>
      </Card>
    );
  };

  const renderStatsCard = () => {
    if (!bookStats) return null;

    return (
      <Card style={[styles.statsCard, { backgroundColor: colors.surface }]}>
        <Card.Content>
          <Title style={[styles.statsTitle, { color: colors.onSurface }]}>
            ⭐ Rating Statistics
          </Title>
          
          <View style={styles.ratingOverview}>
            <Text style={[styles.averageRating, { color: colors.primary }]}>
              {bookStats.average_rating.toFixed(1)}
            </Text>
            <Rating
              rating={Math.round(bookStats.average_rating)}
              size={20}
              readonly
              starContainerStyle={styles.ratingContainer}
            />
            <Text style={[styles.totalReviews, { color: colors.onSurface }]}>
              {bookStats.total_reviews} {bookStats.total_reviews === 1 ? 'review' : 'reviews'}
            </Text>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.ratingDistribution}>
            {bookStats.rating_distribution?.map((item) => (
              <View key={item.rating} style={styles.ratingBar}>
                <Text style={[styles.ratingLabel, { color: colors.onSurface }]}>
                  {item.rating}
                </Text>
                <View style={[styles.barContainer, { backgroundColor: colors.surface }]}>
                  <View 
                    style={[
                      styles.bar, 
                      { 
                        width: `${(item.count / Math.max(...bookStats.rating_distribution.map(r => r.count))) * 100}%`,
                        backgroundColor: colors.primary 
                      }
                    ]} 
                  />
                </View>
                <Text style={[styles.ratingCount, { color: colors.onSurface }]}>
                  {item.count}
                </Text>
              </View>
            ))}
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderUserReviewCard = () => {
    if (!userReview) return null;

    return (
      <Card style={[styles.userReviewCard, { backgroundColor: colors.surface }]}>
        <Card.Content>
          <View style={styles.userReviewHeader}>
            <Title style={[styles.userReviewTitle, { color: colors.onSurface }]}>
              Your Review
            </Title>
            <View style={styles.userReviewActions}>
              <Button
                mode="text"
                onPress={handleEditReview}
                icon="pencil"
                textColor={colors.primary}
              >
                Edit
              </Button>
              <Button
                mode="text"
                onPress={handleDeleteReview}
                icon="delete"
                textColor="#f44336"
              >
                Delete
              </Button>
            </View>
          </View>
          
          <Rating
            rating={userReview.rating}
            size={20}
            readonly
            starContainerStyle={styles.ratingContainer}
          />
          
          {userReview.review_text && (
            <Paragraph 
              style={[styles.userReviewText, { color: colors.onSurface }]}
            >
              {userReview.review_text}
            </Paragraph>
          )}
        </Card.Content>
      </Card>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="star-outline" size={64} color={colors.primary} />
      <Title style={[styles.emptyTitle, { color: colors.onSurface }]}>
        No Reviews Yet
      </Title>
      <Paragraph style={[styles.emptyText, { color: colors.onSurface }]}>
        Be the first to review this book!
      </Paragraph>
    </View>
  );

  if (loading && reviews.length === 0) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.onSurface }]}>
          Loading reviews...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Book Title Header */}
      <View style={styles.headerContainer}>
        <Title style={[styles.headerTitle, { color: colors.onSurface }]}>
          {bookTitle || 'Book Reviews'}
        </Title>
        <Button
          mode="contained"
          onPress={() => setReviewModalVisible(true)}
          style={[styles.addReviewButton, { backgroundColor: colors.primary }]}
          icon={userReview ? 'pencil' : 'plus'}
        >
          {userReview ? 'Edit Review' : 'Add Review'}
        </Button>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Stats Card */}
        {renderStatsCard()}

        {/* User Review Card */}
        {renderUserReviewCard()}

        {/* Reviews List */}
        {reviews.length > 0 ? (
          <View style={styles.reviewsContainer}>
            <Title style={[styles.reviewsTitle, { color: colors.onSurface }]}>
              All Reviews
            </Title>
            {reviews.map((review) => (
              <View key={review.id} style={styles.reviewItem}>
                {renderReviewItem({ item: review })}
              </View>
            ))}
          </View>
        ) : (
          renderEmptyState()
        )}
      </ScrollView>

      {/* Review Modal */}
      <Portal>
        <Modal
          visible={reviewModalVisible}
          onDismiss={() => setReviewModalVisible(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: colors.surface }]}
        >
          <Title style={[styles.modalTitle, { color: colors.onSurface }]}>
            {userReview ? 'Edit Your Review' : 'Write a Review'}
          </Title>
          <Paragraph style={[styles.modalSubtitle, { color: colors.onSurface }]}>
            "{bookTitle}"
          </Paragraph>
          
          <View style={styles.ratingInput}>
            <Text style={[styles.ratingLabel, { color: colors.onSurface }]}>
              Your Rating:
            </Text>
            <Rating
              rating={rating}
              size={32}
              onChange={(value) => setRating(value)}
              starContainerStyle={styles.ratingContainer}
            />
          </View>
          
          <TextInput
            mode="outlined"
            label="Review (optional)"
            value={reviewText}
            onChangeText={setReviewText}
            multiline
            numberOfLines={4}
            placeholder="Share your thoughts about this book..."
            style={styles.reviewInput}
          />

          <View style={styles.modalActions}>
            <Button
              mode="text"
              onPress={() => setReviewModalVisible(false)}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSubmitReview}
              loading={submitting}
              disabled={submitting || rating === 0}
            >
              {userReview ? 'Update' : 'Submit'}
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
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  addReviewButton: {
    borderRadius: 8,
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
  ratingOverview: {
    alignItems: 'center',
    marginBottom: 16,
  },
  averageRating: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  ratingContainer: {
    marginVertical: 4,
  },
  totalReviews: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  divider: {
    marginVertical: 16,
  },
  ratingDistribution: {
    gap: 8,
  },
  ratingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingLabel: {
    fontSize: 14,
    width: 20,
  },
  barContainer: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 4,
  },
  ratingCount: {
    fontSize: 14,
    width: 30,
    textAlign: 'right',
  },
  userReviewCard: {
    margin: 16,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#2196f3',
  },
  userReviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userReviewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  userReviewActions: {
    flexDirection: 'row',
    gap: 8,
  },
  userReviewText: {
    marginTop: 8,
  },
  reviewsContainer: {
    padding: 16,
  },
  reviewsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  reviewItem: {
    marginBottom: 12,
  },
  reviewCard: {
    elevation: 1,
  },
  cardContent: {
    padding: 16,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reviewerInfo: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  reviewDate: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 2,
  },
  reviewText: {
    fontSize: 14,
    lineHeight: 20,
  },
  editedText: {
    fontSize: 10,
    fontStyle: 'italic',
    marginTop: 8,
  },
  emptyContainer: {
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
  ratingInput: {
    alignItems: 'center',
    marginBottom: 20,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  reviewInput: {
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
});

export default ReviewsScreen;
