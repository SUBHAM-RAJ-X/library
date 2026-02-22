import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  Title,
  Paragraph,
  ActivityIndicator,
  RadioButton,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { apiService } from '../services/supabase';

const UploadScreen = () => {
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    description: '',
    category: '',
  });
  const [categories, setCategories] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const navigation = useNavigation();
  const { user } = useAuth();
  const { theme, colors } = useTheme();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await apiService.getCategories();
      setCategories(response.categories || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        
        // Validate file size (50MB max)
        if (file.size && file.size > 50 * 1024 * 1024) {
          Alert.alert('File Too Large', 'Please select a PDF file smaller than 50MB.');
          return;
        }

        setSelectedFile(file);
        
        // Auto-fill title from filename if empty
        if (!formData.title) {
          const titleWithoutExtension = file.name.replace(/\.pdf$/i, '');
          setFormData(prev => ({
            ...prev,
            title: titleWithoutExtension.replace(/[-_]/g, ' ').trim()
          }));
        }
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      Alert.alert('Validation Error', 'Please enter a book title');
      return false;
    }

    if (!formData.author.trim()) {
      Alert.alert('Validation Error', 'Please enter the author name');
      return false;
    }

    if (!formData.category) {
      Alert.alert('Validation Error', 'Please select a category');
      return false;
    }

    if (!selectedFile) {
      Alert.alert('Validation Error', 'Please select a PDF file');
      return false;
    }

    return true;
  };

  const handleUpload = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setUploading(true);

      // Create FormData for file upload
      const uploadFormData = new FormData();
      uploadFormData.append('title', formData.title.trim());
      uploadFormData.append('author', formData.author.trim());
      uploadFormData.append('description', formData.description.trim());
      uploadFormData.append('category', formData.category);
      uploadFormData.append('file', {
        uri: selectedFile.uri,
        type: 'application/pdf',
        name: selectedFile.name,
      });

      const response = await apiService.uploadBook(uploadFormData);

      Alert.alert(
        'Upload Successful',
        'Your book has been uploaded successfully!',
        [
          {
            text: 'View Book',
            onPress: () => navigation.navigate('BookDetail', { bookId: response.book.id }),
          },
          {
            text: 'Upload Another',
            onPress: resetForm,
          },
          {
            text: 'Go to Books',
            onPress: () => navigation.navigate('Books'),
          },
        ]
      );
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert(
        'Upload Failed',
        error.message || 'Failed to upload book. Please try again.'
      );
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      author: '',
      description: '',
      category: '',
    });
    setSelectedFile(null);
  };

  const removeFile = () => {
    setSelectedFile(null);
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.onSurface }]}>
          Loading categories...
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Title style={[styles.title, { color: colors.primary }]}>
            📤 Upload Book
          </Title>
          <Paragraph style={[styles.subtitle, { color: colors.onSurface }]}>
            Share your knowledge with the community
          </Paragraph>
        </View>

        <Card style={[styles.card, { backgroundColor: colors.surface }]}>
          <Card.Content style={styles.cardContent}>
            <Title style={[styles.cardTitle, { color: colors.onSurface }]}>
              Book Information
            </Title>

            <TextInput
              label="Title *"
              value={formData.title}
              onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
              mode="outlined"
              style={styles.input}
              theme={{ colors: { background: colors.surface } }}
            />

            <TextInput
              label="Author *"
              value={formData.author}
              onChangeText={(text) => setFormData(prev => ({ ...prev, author: text }))}
              mode="outlined"
              style={styles.input}
              theme={{ colors: { background: colors.surface } }}
            />

            <TextInput
              label="Description"
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
              theme={{ colors: { background: colors.surface } }}
            />

            <View style={styles.categorySection}>
              <Text style={[styles.categoryLabel, { color: colors.onSurface }]}>
                Category *:
              </Text>
              {categories.length > 0 ? (
                <RadioButton.Group
                  onValueChange={newValue => setFormData(prev => ({ ...prev, category: newValue }))}
                  value={formData.category}
                >
                  {categories.map(category => (
                    <RadioButton.Item
                      key={category.id}
                      label={category.name}
                      value={category.name}
                      style={styles.radioItem}
                    />
                  ))}
                </RadioButton.Group>
              ) : (
                <Text style={[styles.noCategoriesText, { color: colors.onSurface }]}>
                  No categories available
                </Text>
              )}
            </View>
          </Card.Content>
        </Card>

        <Card style={[styles.card, { backgroundColor: colors.surface }]}>
          <Card.Content style={styles.cardContent}>
            <Title style={[styles.cardTitle, { color: colors.onSurface }]}>
              File Upload
            </Title>

            {selectedFile ? (
              <View style={styles.fileInfo}>
                <View style={styles.fileDetails}>
                  <Text style={[styles.fileName, { color: colors.onSurface }]}>
                    📄 {selectedFile.name}
                  </Text>
                  {selectedFile.size && (
                    <Text style={[styles.fileSize, { color: colors.onSurface }]}>
                      Size: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </Text>
                  )}
                </View>
                <Button
                  mode="outlined"
                  onPress={removeFile}
                  textColor="#ef4444"
                  style={styles.removeButton}
                >
                  Remove
                </Button>
              </View>
            ) : (
              <View style={styles.fileUploadArea}>
                <Text style={[styles.uploadText, { color: colors.onSurface }]}>
                  Select a PDF file to upload
                </Text>
                <Button
                  mode="outlined"
                  onPress={pickDocument}
                  icon="file-upload"
                  style={styles.selectButton}
                >
                  Choose File
                </Button>
                <Text style={[styles.uploadHint, { color: colors.onSurface }]}>
                  Maximum file size: 50MB
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        <View style={styles.actionButtons}>
          <Button
            mode="contained"
            onPress={handleUpload}
            loading={uploading}
            disabled={uploading}
            style={[styles.uploadButton, { backgroundColor: colors.primary }]}
            contentStyle={styles.buttonContent}
          >
            {uploading ? 'Uploading...' : 'Upload Book'}
          </Button>

          <Button
            mode="outlined"
            onPress={resetForm}
            disabled={uploading}
            style={styles.resetButton}
            contentStyle={styles.buttonContent}
          >
            Reset Form
          </Button>
        </View>

        <View style={styles.infoSection}>
          <Paragraph style={[styles.infoText, { color: colors.onSurface }]}>
            📚 Your book will be automatically organized alphabetically by title.
          </Paragraph>
          <Paragraph style={[styles.infoText, { color: colors.onSurface }]}>
            🔒 All uploaded books are subject to review by administrators.
          </Paragraph>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
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
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 4,
  },
  card: {
    marginBottom: 20,
    elevation: 4,
  },
  cardContent: {
    padding: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  categorySection: {
    marginBottom: 16,
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  radioItem: {
    paddingVertical: 4,
  },
  noCategoriesText: {
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  fileInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 8,
  },
  fileDetails: {
    flex: 1,
    marginRight: 12,
  },
  fileName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  fileSize: {
    fontSize: 14,
  },
  removeButton: {
    borderColor: '#ef4444',
  },
  fileUploadArea: {
    alignItems: 'center',
    padding: 32,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  uploadText: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  selectButton: {
    marginBottom: 8,
  },
  uploadHint: {
    fontSize: 12,
    textAlign: 'center',
  },
  actionButtons: {
    gap: 12,
    marginBottom: 20,
  },
  uploadButton: {
    borderRadius: 8,
  },
  resetButton: {
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 12,
  },
  infoSection: {
    padding: 16,
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    borderRadius: 8,
    gap: 4,
  },
  infoText: {
    fontSize: 12,
    textAlign: 'center',
  },
});

export default UploadScreen;
