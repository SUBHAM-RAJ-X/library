const QRCode = require('qrcode');

class QRCodeService {
  constructor() {
    this.baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    this.qrCodeOptions = {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    };
  }

  // Generate QR code for book sharing
  async generateBookQRCode(bookId) {
    try {
      if (!bookId) {
        throw new Error('Book ID is required');
      }

      // Create the book URL
      const bookUrl = `${this.baseUrl}/books/${bookId}`;
      
      // Generate QR code
      const qrCodeDataUrl = await QRCode.toDataURL(bookUrl, this.qrCodeOptions);
      
      // In a production environment, you might want to save this to cloud storage
      // For now, we'll return the data URL
      return {
        qr_code_url: qrCodeDataUrl,
        book_url: bookUrl,
        book_id: bookId
      };
    } catch (error) {
      console.error('QR Code generation error:', error);
      throw new Error(`Failed to generate QR code: ${error.message}`);
    }
  }

  // Generate QR code for download link
  async generateDownloadQRCode(bookId, downloadToken = null) {
    try {
      if (!bookId) {
        throw new Error('Book ID is required');
      }

      // Create download URL
      let downloadUrl = `${this.baseUrl}/api/books/${bookId}/download`;
      if (downloadToken) {
        downloadUrl += `?token=${downloadToken}`;
      }
      
      // Generate QR code
      const qrCodeDataUrl = await QRCode.toDataURL(downloadUrl, this.qrCodeOptions);
      
      return {
        qr_code_url: qrCodeDataUrl,
        download_url: downloadUrl,
        book_id: bookId
      };
    } catch (error) {
      console.error('Download QR Code generation error:', error);
      throw new Error(`Failed to generate download QR code: ${error.message}`);
    }
  }

  // Generate QR code for app download
  async generateAppDownloadQRCode(platform = 'universal') {
    try {
      let appUrl;
      
      switch (platform) {
        case 'ios':
          appUrl = 'https://apps.apple.com/app/your-app-id';
          break;
        case 'android':
          appUrl = 'https://play.google.com/store/apps/details?id=your.package.name';
          break;
        case 'expo':
          appUrl = 'exp://exp.host/@your-username/your-app';
          break;
        default:
          appUrl = `${this.baseUrl}/download`;
      }
      
      // Generate QR code
      const qrCodeDataUrl = await QRCode.toDataURL(appUrl, this.qrCodeOptions);
      
      return {
        qr_code_url: qrCodeDataUrl,
        app_url: appUrl,
        platform
      };
    } catch (error) {
      console.error('App download QR Code generation error:', error);
      throw new Error(`Failed to generate app download QR code: ${error.message}`);
    }
  }

  // Generate QR code with custom data
  async generateCustomQRCode(data, options = {}) {
    try {
      const customOptions = { ...this.qrCodeOptions, ...options };
      
      // Generate QR code
      const qrCodeDataUrl = await QRCode.toDataURL(data, customOptions);
      
      return {
        qr_code_url: qrCodeDataUrl,
        data
      };
    } catch (error) {
      console.error('Custom QR Code generation error:', error);
      throw new Error(`Failed to generate custom QR code: ${error.message}`);
    }
  }

  // Generate QR code for book review
  async generateReviewQRCode(bookId) {
    try {
      if (!bookId) {
        throw new Error('Book ID is required');
      }

      // Create review URL
      const reviewUrl = `${this.baseUrl}/books/${bookId}/review`;
      
      // Generate QR code
      const qrCodeDataUrl = await QRCode.toDataURL(reviewUrl, this.qrCodeOptions);
      
      return {
        qr_code_url: qrCodeDataUrl,
        review_url: reviewUrl,
        book_id: bookId
      };
    } catch (error) {
      console.error('Review QR Code generation error:', error);
      throw new Error(`Failed to generate review QR code: ${error.message}`);
    }
  }

  // Generate QR code for sharing user's library
  async generateLibraryQRCode(userId) {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      // Create library URL
      const libraryUrl = `${this.baseUrl}/users/${userId}/library`;
      
      // Generate QR code
      const qrCodeDataUrl = await QRCode.toDataURL(libraryUrl, this.qrCodeOptions);
      
      return {
        qr_code_url: qrCodeDataUrl,
        library_url: libraryUrl,
        user_id: userId
      };
    } catch (error) {
      console.error('Library QR Code generation error:', error);
      throw new Error(`Failed to generate library QR code: ${error.message}`);
    }
  }

  // Validate QR code data
  validateQRCodeData(data) {
    try {
      if (!data || typeof data !== 'string') {
        return { valid: false, error: 'Invalid data format' };
      }

      // Check if it's a valid URL
      try {
        new URL(data);
        return { valid: true, type: 'url' };
      } catch {
        // If not a URL, check if it's valid JSON
        try {
          JSON.parse(data);
          return { valid: true, type: 'json' };
        } catch {
          return { valid: true, type: 'text' };
        }
      }
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  // Generate batch QR codes for multiple books
  async generateBatchBookQRCodes(bookIds) {
    try {
      if (!Array.isArray(bookIds) || bookIds.length === 0) {
        throw new Error('Book IDs array is required');
      }

      const results = [];
      
      for (const bookId of bookIds) {
        try {
          const qrCode = await this.generateBookQRCode(bookId);
          results.push({
            book_id: bookId,
            success: true,
            ...qrCode
          });
        } catch (error) {
          results.push({
            book_id: bookId,
            success: false,
            error: error.message
          });
        }
      }
      
      return results;
    } catch (error) {
      console.error('Batch QR Code generation error:', error);
      throw new Error(`Failed to generate batch QR codes: ${error.message}`);
    }
  }

  // Generate QR code with logo (advanced feature)
  async generateQRCodeWithLogo(data, logoPath, options = {}) {
    try {
      // This would require additional libraries like 'qrcode-with-logos' or custom canvas manipulation
      // For now, we'll generate a standard QR code
      return await this.generateCustomQRCode(data, options);
    } catch (error) {
      console.error('QR Code with logo generation error:', error);
      throw new Error(`Failed to generate QR code with logo: ${error.message}`);
    }
  }

  // Get QR code analytics (placeholder for future implementation)
  async getQRCodeAnalytics(qrCodeId) {
    try {
      // This would track scans, location, device info, etc.
      return {
        qr_code_id: qrCodeId,
        total_scans: 0,
        unique_scans: 0,
        last_scanned: null,
        scan_locations: [],
        devices: []
      };
    } catch (error) {
      console.error('QR Code analytics error:', error);
      throw new Error(`Failed to get QR code analytics: ${error.message}`);
    }
  }
}

module.exports = new QRCodeService();
