import express from 'express';
import { body } from 'express-validator';
import {
    create_news,
    get_all_news,
    get_news_by_id,
    get_news_by_category,
    get_latest_news,
    search_news,
    update_news,
    update_news_status,
    delete_news,
    get_news_stats
} from '../controllers/news.controller.js';
import { verifyAdmin } from '../middleware/auth.middleware.js';

const newsRouter = express.Router();

// ==========================================
// Public Routes
// ==========================================

// Get all news (Supports query params: ?page=1&limit=10&category=...&status=...&search=...&sortBy=...&sortOrder=...)
newsRouter.get('/', get_all_news);

// Get latest news (e.g. ?limit=5)
newsRouter.get('/latest', get_latest_news);

// Search news by keyword (e.g. ?q=technology&page=1&limit=10)
newsRouter.get('/search', search_news);

// Get news by specific category name (e.g. /category/Technology?page=1&limit=10)
newsRouter.get('/category/:category_name', get_news_by_category);

// ==========================================
// Admin-Only Routes
// ==========================================

// News statistics & dashboard summary
newsRouter.get('/admin/stats', verifyAdmin, get_news_stats);

// Create a new news article
newsRouter.post(
    '/',
    verifyAdmin,
    [
        body('title', 'Title is required')
            .notEmpty()
            .isString()
            .trim()
            .isLength({ min: 3, max: 300 })
            .withMessage('Title must be between 3 and 300 characters'),
        body('category_name', 'Category name is required')
            .notEmpty()
            .isString()
            .trim(),
        body('author')
            .optional()
            .isString()
            .trim(),
        body('content', 'Content is required')
            .isArray({ min: 1 })
            .withMessage('Content must be a non-empty array'),
        body('content.*.headline', 'Headline is required for each content section')
            .notEmpty()
            .isString()
            .trim(),
        body('content.*.description', 'Description is required for each content section')
            .notEmpty()
            .isString()
            .trim(),
        body('status')
            .optional()
            .isIn(['ACTIVE', 'INACTIVE', 'active', 'inactive'])
            .withMessage('Status must be either ACTIVE or INACTIVE')
    ],
    create_news
);

// Update an existing news article
newsRouter.put(
    '/:id',
    verifyAdmin,
    [
        body('title')
            .optional()
            .isString()
            .trim()
            .isLength({ min: 3, max: 300 })
            .withMessage('Title must be between 3 and 300 characters'),
        body('category_name')
            .optional()
            .isString()
            .trim(),
        body('author')
            .optional()
            .isString()
            .trim(),
        body('content')
            .optional()
            .isArray({ min: 1 })
            .withMessage('Content must be a non-empty array'),
        body('content.*.headline')
            .optional()
            .isString()
            .trim()
            .notEmpty()
            .withMessage('Headline cannot be empty'),
        body('content.*.description')
            .optional()
            .isString()
            .trim()
            .notEmpty()
            .withMessage('Description cannot be empty'),
        body('status')
            .optional()
            .isIn(['ACTIVE', 'INACTIVE', 'active', 'inactive'])
            .withMessage('Status must be either ACTIVE or INACTIVE')
    ],
    update_news
);

// Toggle or update news status (e.g. { status: "ACTIVE" } or empty body to toggle)
newsRouter.patch(
    '/:id/status',
    verifyAdmin,
    [
        body('status')
            .optional()
            .isIn(['ACTIVE', 'INACTIVE', 'active', 'inactive'])
            .withMessage('Status must be either ACTIVE or INACTIVE')
    ],
    update_news_status
);

// Delete a news article
newsRouter.delete('/:id', verifyAdmin, delete_news);

// Get single news article by ID (placed after specific sub-routes)
newsRouter.get('/:id', get_news_by_id);

export default newsRouter;
