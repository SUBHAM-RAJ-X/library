# Library Management System - API Documentation

This document provides comprehensive API documentation for the Library Management System backend.

## Base URL

```
Production: https://your-api-domain.com/api
Development: http://localhost:3001/api
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Response Format

All API responses follow this format:

### Success Response
```json
{
  "message": "Success message",
  "data": { ... },
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### Error Response
```json
{
  "error": "Error Type",
  "message": "Detailed error message",
  "details": { ... }
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Endpoints

### Authentication

#### Register User
```http
POST /auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "role": "student" // optional, defaults to "student"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "student"
  },
  "token": "jwt-token"
}
```

#### Login User
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "student"
  },
  "token": "jwt-token"
}
```

#### Get User Profile
```http
GET /auth/profile
```

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "student",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

#### Logout User
```http
POST /auth/logout
```

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "message": "Logout successful"
}
```

### Books

#### Get All Books
```http
GET /books
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `query` (string): Search query for title/author
- `category` (string): Filter by category
- `rack_letter` (string): Filter by rack letter (A-Z)
- `sort` (string): Sort field (created_at, title, author, download_count)
- `order` (string): Sort order (asc, desc)

**Example:**
```http
GET /books?page=1&limit=10&category=Fiction&sort=download_count&order=desc
```

**Response:**
```json
{
  "books": [
    {
      "id": "uuid",
      "title": "Book Title",
      "author": "Author Name",
      "description": "Book description",
      "category": "Fiction",
      "rack_letter": "B",
      "file_url": "https://storage.url/book.pdf",
      "file_name": "book.pdf",
      "file_size": 1024000,
      "uploaded_by": "uuid",
      "download_count": 25,
      "created_at": "2024-01-01T00:00:00Z",
      "users": {
        "email": "uploader@example.com",
        "role": "student"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

#### Get Single Book
```http
GET /books/:id
```

**Response:**
```json
{
  "book": {
    "id": "uuid",
    "title": "Book Title",
    "author": "Author Name",
    "description": "Book description",
    "category": "Fiction",
    "rack_letter": "B",
    "file_url": "https://storage.url/book.pdf",
    "file_name": "book.pdf",
    "file_size": 1024000,
    "uploaded_by": "uuid",
    "download_count": 25,
    "created_at": "2024-01-01T00:00:00Z",
    "users": {
      "email": "uploader@example.com",
      "role": "student"
    }
  }
}
```

#### Upload Book
```http
POST /books
```

**Headers:** 
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Request Body (FormData):**
- `title` (string): Book title
- `author` (string): Author name
- `description` (string): Book description
- `category` (string): Book category
- `file` (file): PDF file

**Response:**
```json
{
  "message": "Book uploaded successfully",
  "book": {
    "id": "uuid",
    "title": "Book Title",
    "author": "Author Name",
    "description": "Book description",
    "category": "Fiction",
    "rack_letter": "B",
    "file_url": "https://storage.url/book.pdf",
    "file_name": "book.pdf",
    "file_size": 1024000,
    "uploaded_by": "uuid",
    "download_count": 0,
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

#### Update Book
```http
PUT /books/:id
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "title": "Updated Book Title",
  "author": "Updated Author",
  "description": "Updated description",
  "category": "Updated Category"
}
```

**Response:**
```json
{
  "message": "Book updated successfully",
  "book": { ... }
}
```

#### Delete Book
```http
DELETE /books/:id
```

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "message": "Book deleted successfully"
}
```

#### Get Books by Rack Letter
```http
GET /books/rack/:letter
```

**Query Parameters:**
- `page` (number): Page number
- `limit` (number): Items per page

**Response:**
```json
{
  "books": [ ... ],
  "rack_letter": "A",
  "pagination": { ... }
}
```

### Categories

#### Get All Categories
```http
GET /categories
```

**Response:**
```json
{
  "categories": [
    {
      "id": "uuid",
      "name": "Fiction",
      "description": "Fictional literature",
      "created_at": "2024-01-01T00:00:00Z",
      "books_count": 25
    }
  ]
}
```

#### Create Category (Admin Only)
```http
POST /categories
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "New Category",
  "description": "Category description"
}
```

**Response:**
```json
{
  "message": "Category created successfully",
  "category": {
    "id": "uuid",
    "name": "New Category",
    "description": "Category description",
    "created_at": "2024-01-01T00:00:00Z",
    "books_count": 0
  }
}
```

#### Update Category (Admin Only)
```http
PUT /categories/:id
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Updated Category",
  "description": "Updated description"
}
```

#### Delete Category (Admin Only)
```http
DELETE /categories/:id
```

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "message": "Category deleted successfully"
}
```

### Users (Admin Only)

#### Get All Users
```http
GET /users
```

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (number): Page number
- `limit` (number): Items per page
- `role` (string): Filter by role (student/admin)

**Response:**
```json
{
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "role": "student",
      "created_at": "2024-01-01T00:00:00Z",
      "books_uploaded": 5,
      "downloads_made": 12
    }
  ],
  "pagination": { ... }
}
```

#### Get User by ID
```http
GET /users/:id
```

**Headers:** `Authorization: Bearer <token>`

#### Update User
```http
PUT /users/:id
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "email": "updated@example.com",
  "role": "admin"
}
```

#### Delete User
```http
DELETE /users/:id
```

**Headers:** `Authorization: Bearer <token>`

#### Get User Statistics
```http
GET /users/stats/overview
```

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "total_users": 150,
  "users_by_role": {
    "student": 140,
    "admin": 10
  },
  "recent_users_30_days": 25
}
```

### Downloads

#### Record Download
```http
POST /downloads
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "book_id": "uuid"
}
```

**Response:**
```json
{
  "message": "Download recorded successfully",
  "download_count": 26
}
```

#### Get Download History
```http
GET /downloads/history
```

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (number): Page number
- `limit` (number): Items per page

**Response:**
```json
{
  "downloads": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "book_id": "uuid",
      "downloaded_at": "2024-01-01T00:00:00Z",
      "books": {
        "id": "uuid",
        "title": "Book Title",
        "author": "Author Name",
        "category": "Fiction",
        "file_url": "https://storage.url/book.pdf",
        "download_count": 25
      }
    }
  ],
  "pagination": { ... }
}
```

#### Get Most Downloaded Books (Admin Only)
```http
GET /downloads/most-downloaded
```

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `limit` (number): Number of books to return

**Response:**
```json
{
  "books": [
    {
      "id": "uuid",
      "title": "Popular Book",
      "author": "Author Name",
      "category": "Fiction",
      "download_count": 100,
      "created_at": "2024-01-01T00:00:00Z",
      "users": {
        "email": "uploader@example.com"
      }
    }
  ]
}
```

#### Get Download Statistics
```http
GET /downloads/stats/:book_id
```

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "book_id": "uuid",
  "total_downloads": 50,
  "unique_downloaders": 45,
  "recent_downloads_30_days": 12,
  "download_count_in_db": 50
}
```

## Error Handling

### Common Error Responses

#### Validation Error (400)
```json
{
  "error": "Validation Error",
  "message": "Title is required",
  "details": {
    "field": "title",
    "value": ""
  }
}
```

#### Unauthorized (401)
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing authentication token"
}
```

#### Forbidden (403)
```json
{
  "error": "Forbidden",
  "message": "Admin access required"
}
```

#### Not Found (404)
```json
{
  "error": "Not Found",
  "message": "Book not found"
}
```

#### Internal Server Error (500)
```json
{
  "error": "Internal Server Error",
  "message": "Failed to process request"
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse:
- **100 requests per 15 minutes** per IP address
- **Higher limits** for authenticated users
- **Rate limit headers** included in responses:
  - `X-RateLimit-Limit`: Request limit
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Reset time (Unix timestamp)

## File Upload

### Supported File Types
- PDF files only (`application/pdf`)

### File Size Limits
- Maximum file size: 50MB
- Configurable via `MAX_FILE_SIZE` environment variable

### Upload Process
1. Client sends multipart/form-data request
2. Server validates file type and size
3. File is uploaded to Supabase Storage
4. Metadata is stored in database
5. Public URL is generated and returned

## Security Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (student/admin)
- Token expiration handling
- Secure password storage via Supabase Auth

### Data Protection
- Row Level Security (RLS) enabled
- Input validation and sanitization
- SQL injection prevention
- XSS protection

### File Security
- File type validation
- Size restrictions
- Secure storage bucket policies
- Access control via signed URLs

## SDK Examples

### JavaScript/Node.js
```javascript
const axios = require('axios');

const api = axios.create({
  baseURL: 'https://your-api.com/api',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Get books
const books = await api.get('/books');

// Upload book
const formData = new FormData();
formData.append('title', 'My Book');
formData.append('author', 'Author Name');
formData.append('file', fileInput.files[0]);

const result = await api.post('/books', formData, {
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});
```

### React Native
```javascript
import { apiService } from './services/supabase';

// Get books
const { books } = await apiService.getBooks({
  page: 1,
  limit: 10,
  category: 'Fiction'
});

// Upload book
const formData = new FormData();
formData.append('title', 'My Book');
formData.append('author', 'Author Name');
formData.append('file', {
  uri: fileUri,
  type: 'application/pdf',
  name: 'book.pdf'
});

const result = await apiService.uploadBook(formData);
```

## Testing

### Testing Endpoints
Use tools like Postman, curl, or Insomnia to test API endpoints:

```bash
# Get books
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://your-api.com/api/books

# Upload book
curl -X POST \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -F "title=Test Book" \
     -F "author=Test Author" \
     -F "file=@book.pdf" \
     https://your-api.com/api/books
```

## Pagination

All list endpoints support pagination:
- `page`: Page number (starting from 1)
- `limit`: Items per page (default: 10, max: 100)

Response includes pagination metadata:
```json
{
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

## Search and Filtering

### Search
Search by title or author using the `query` parameter:
```http
GET /books?query=javascript
```

### Filtering
Filter by specific fields:
```http
GET /books?category=Fiction&rack_letter=A
```

### Sorting
Sort results by field and order:
```http
GET /books?sort=download_count&order=desc
```

## Webhooks

### Download Events
Configure webhooks to receive real-time notifications:
- User downloads a book
- New book is uploaded
- Book is deleted

Contact support to set up webhook endpoints.

## Support

For API support:
1. Check this documentation
2. Review error messages carefully
3. Test with small requests first
4. Contact support with request details and error logs

---

**Note**: This API is continuously evolving. Check for updates and new features regularly.
