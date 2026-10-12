import express from 'express';
import { body } from 'express-validator';
import {
    create_category,
    get_all_categories,
    get_category_by_id,
    update_category,
    delete_category
} from '../controllers/category.controller.js';
import { verifyAdmin } from '../middleware/auth.middleware.js';

const categoryRouter = express.Router();

// Public routes (Read categories)
categoryRouter.get('/', get_all_categories);
categoryRouter.get('/:id', get_category_by_id);

// Admin-only routes (Create, Update, Delete)
categoryRouter.post(
    '/',
    verifyAdmin,
    [
        body('category_name', 'Category name is required')
            .notEmpty()
            .isString()
            .trim()
            .isLength({ min: 2, max: 50 })
            .withMessage('Category name must be between 2 and 50 characters')
    ],
    create_category
);

categoryRouter.put(
    '/:id',
    verifyAdmin,
    [
        body('category_name', 'Category name is required')
            .notEmpty()
            .isString()
            .trim()
            .isLength({ min: 2, max: 50 })
            .withMessage('Category name must be between 2 and 50 characters')
    ],
    update_category
);

categoryRouter.delete('/:id', verifyAdmin, delete_category);

export default categoryRouter;
