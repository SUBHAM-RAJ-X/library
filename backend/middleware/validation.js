const Joi = require('joi');

// Book validation schema
const bookSchema = Joi.object({
  title: Joi.string().min(1).max(500).required(),
  author: Joi.string().min(1).max(200).required(),
  description: Joi.string().max(2000).optional(),
  category: Joi.string().min(1).max(100).required(),
  total_pages: Joi.number().integer().min(0).optional()
});

// Review validation schema
const reviewSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required(),
  review_text: Joi.string().max(1000).optional()
});

// Reading progress validation schema
const readingProgressSchema = Joi.object({
  current_page: Joi.number().integer().min(0).required(),
  total_pages: Joi.number().integer().min(0).optional()
});

// Bookmark validation schema
const bookmarkSchema = Joi.object({
  book_id: Joi.string().uuid().required(),
  page_number: Joi.number().integer().min(0).required(),
  note: Joi.string().max(500).optional()
});

// User validation schema
const userSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('student', 'admin').optional()
});

// Category validation schema
const categorySchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  description: Joi.string().max(500).optional()
});

// Search validation schema
const searchSchema = Joi.object({
  query: Joi.string().max(200).optional(),
  category: Joi.string().max(100).optional(),
  rack_letter: Joi.string().length(1).optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  sort: Joi.string().valid('created_at', 'title', 'author', 'download_count', 'average_rating').optional(),
  order: Joi.string().valid('asc', 'desc').optional()
});

// Approval validation schema
const approvalSchema = Joi.object({
  rejection_reason: Joi.string().min(1).max(500).optional()
});

// Validation middleware
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.details[0].message,
        details: error.details
      });
    }
    next();
  };
};

// Query validation middleware
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.query);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.details[0].message
      });
    }
    next();
  };
};

const validateSearch = (req, res, next) => {
  const { error, value } = searchSchema.validate(req.query);
  if (error) {
    return res.status(400).json({
      error: 'Validation Error',
      message: error.details[0].message
    });
  }
  req.query = value;
  next();
};

module.exports = {
  validateBook: validate(bookSchema),
  validateReview: validate(reviewSchema),
  validateReadingProgress: validate(readingProgressSchema),
  validateBookmark: validate(bookmarkSchema),
  validateUser: validate(userSchema),
  validateUserUpdate: validate(userSchema),
  validateCategory: validate(categorySchema),
  validateSearch: validateQuery(searchSchema),
  validateApproval: validate(approvalSchema),
  bookSchema,
  reviewSchema,
  readingProgressSchema,
  bookmarkSchema,
  userSchema,
  categorySchema,
  searchSchema,
  approvalSchema
};
