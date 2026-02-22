import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Share,
  Alert,
} from 'react-native';
import {
  Modal,
  Portal,
  Button,
  Card,
  Title,
  Paragraph,
  IconButton,
  ActivityIndicator,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { useTheme } from '../contexts/ThemeContext';
import { apiService } from '../services/supabase';
import Toast from 'react-native-toast-message';

const QRCodeShare = ({ visible, onDismiss, bookId, bookTitle }) => {
  const [qrCodeData, setQrCodeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const { colors } = useTheme();

  useEffect(() => {
    if (visible && bookId) {
      generateQRCode();
    }
  }, [visible, bookId]);

  const generateQRCode = async () => {
    try {
      setLoading(true);
      
      const response = await apiService.generateBookQRCode(bookId);
      setQrCodeData(response);
    } catch (error) {
      console.error('Error generating QR code:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to generate QR code',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!qrCodeData?.book_url) return;

    try {
      await Share.share({
        message: `Check out this book: ${bookTitle}\n\n${qrCodeData.book_url}`,
        title: `Share "${bookTitle}"`,
        url: qrCodeData.book_url,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleCopyLink = async () => {
    if (!qrCodeData?.book_url) return;

    try {
      await Share.share({
        message: qrCodeData.book_url,
        title: 'Copy Book Link',
      });
      
      Toast.show({
        type: 'success',
        text1: 'Link Copied',
        text2: 'Book link has been copied to clipboard',
      });
    } catch (error) {
      console.error('Error copying link:', error);
    }
  };

  const handleDownloadQR = async () => {
    if (!qrCodeData?.qr_code_url) return;

    try {
      // In a real app, you would save the QR code to device storage
      Alert.alert(
        'Download QR Code',
        'QR code would be saved to your device gallery',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error downloading QR code:', error);
    }
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[styles.modal, { backgroundColor: colors.surface }]}
      >
        <Card style={styles.qrCard}>
          <Card.Content style={styles.cardContent}>
            <View style={styles.header}>
              <Title style={[styles.title, { color: colors.onSurface }]}>
                Share Book
              </Title>
              <IconButton
                icon="close"
                onPress={onDismiss}
                size={20}
              />
            </View>

            <Paragraph 
              style={[styles.subtitle, { color: colors.onSurface }]} 
              numberOfLines={2}
            >
              "{bookTitle}"
            </Paragraph>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.onSurface }]}>
                  Generating QR Code...
                </Text>
              </View>
            ) : qrCodeData ? (
              <View style={styles.qrContainer}>
                <View style={styles.qrCodeWrapper}>
                  <QRCode
                    value={qrCodeData.book_url}
                    size={200}
                    color={colors.onSurface}
                    backgroundColor={colors.surface}
                  />
                </View>

                <Text style={[styles.qrText, { color: colors.onSurface }]}>
                  Scan this QR code to open the book
                </Text>

                <View style={styles.actions}>
                  <Button
                    mode="contained"
                    onPress={handleShare}
                    style={[styles.actionButton, { backgroundColor: colors.primary }]}
                    icon="share"
                  >
                    Share
                  </Button>
                  
                  <Button
                    mode="outlined"
                    onPress={handleCopyLink}
                    style={[styles.actionButton, { borderColor: colors.primary }]}
                    textColor={colors.primary}
                    icon="content-copy"
                  >
                    Copy Link
                  </Button>
                  
                  <Button
                    mode="text"
                    onPress={handleDownloadQR}
                    icon="download"
                    textColor={colors.primary}
                  >
                    Save QR
                  </Button>
                </View>
              </View>
            ) : (
              <View style={styles.errorContainer}>
                <Ionicons name="warning" size={48} color="#f44336" />
                <Text style={[styles.errorText, { color: colors.onSurface }]}>
                  Failed to generate QR code
                </Text>
                <Button
                  mode="contained"
                  onPress={generateQRCode}
                  style={[styles.retryButton, { backgroundColor: colors.primary }]}
                >
                  Retry
                </Button>
              </View>
            )}
          </Card.Content>
        </Card>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modal: {
    margin: 20,
    borderRadius: 12,
  },
  qrCard: {
    elevation: 4,
  },
  cardContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    fontStyle: 'italic',
    marginBottom: 20,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  qrContainer: {
    alignItems: 'center',
  },
  qrCodeWrapper: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#ffffff',
  },
  qrText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  actionButton: {
    borderRadius: 8,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorText: {
    fontSize: 16,
    marginTop: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    borderRadius: 8,
  },
});

export default QRCodeShare;
