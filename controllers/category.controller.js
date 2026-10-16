import mongoose from 'mongoose';
import { validationResult } from 'express-validator';
import Category from '../models/category.model.js';
import NEWS from '../models/news.model.js';

/**
 * @desc Create a new category (Admin Only - verified by verifyAdmin middleware)
 * @route POST /api/categories
 */
export const create_category = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: "Validation Errors", errors: errors.array(), success: false });
        }

        const { category_name } = req.body;
        if (!category_name || typeof category_name !== 'string' || !category_name.trim()) {
            return res.status(400).json({ message: "Category name is required", success: false });
        }

        const trimmedName = category_name.trim();

        // Check if category already exists (case-insensitive check)
        const existingCategory = await Category.findOne({
            category_name: { $regex: new RegExp(`^${trimmedName}$`, "i") }
        });

        if (existingCategory) {
            return res.status(400).json({ message: "Category already exists", success: false });
        }

        const newCategory = await Category.create({
            category_name: trimmedName
        });

        return res.status(201).json({
            message: "Category created successfully",
            success: true,
            data: newCategory
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error", success: false });
    }
};

/**
 * @desc Get all categories
 * @route GET /api/categories
 */
export const get_all_categories = async (req, res) => {
    try {
        const categories = await Category.find().sort({ createdAt: -1 });
        return res.status(200).json({
            message: "Categories fetched successfully",
            success: true,
            total: categories.length,
            data: categories
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error", success: false });
    }
};

/**
 * @desc Get category by ID
 * @route GET /api/categories/:id
 */
export const get_category_by_id = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid Category ID", success: false });
        }

        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({ message: "Category not found", success: false });
        }

        return res.status(200).json({
            message: "Category fetched successfully",
            success: true,
            data: category
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error", success: false });
    }
};

/**
 * @desc Update a category (Admin Only - verified by verifyAdmin middleware)
 * @route PUT /api/categories/:id
 */
export const update_category = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: "Validation Errors", errors: errors.array(), success: false });
        }

        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid Category ID", success: false });
        }

        const { category_name } = req.body;
        if (!category_name || typeof category_name !== 'string' || !category_name.trim()) {
            return res.status(400).json({ message: "Category name is required", success: false });
        }

        const trimmedName = category_name.trim();

        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({ message: "Category not found", success: false });
        }

        // Check if another category already has this name
        const duplicateCategory = await Category.findOne({
            _id: { $ne: id },
            category_name: { $regex: new RegExp(`^${trimmedName}$`, "i") }
        });

        if (duplicateCategory) {
            return res.status(400).json({ message: "Category name already exists", success: false });
        }

        const oldCategoryName = category.category_name;
        category.category_name = trimmedName;
        await category.save();

        // Update associated news articles if category name changed
        if (oldCategoryName !== trimmedName) {
            await NEWS.updateMany(
                { category_name: oldCategoryName },
                { $set: { category_name: trimmedName } }
            );
        }

        return res.status(200).json({
            message: "Category updated successfully",
            success: true,
            data: category
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error", success: false });
    }
};

/**
 * @desc Delete a category (Admin Only - verified by verifyAdmin middleware)
 * @route DELETE /api/categories/:id
 */
export const delete_category = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid Category ID", success: false });
        }

        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({ message: "Category not found", success: false });
        }

        // Check if news articles are linked with this category
        const newsCount = await NEWS.countDocuments({ category_name: category.category_name });
        if (newsCount > 0 && req.query.force !== 'true') {
            return res.status(400).json({
                message: `Cannot delete category. There are ${newsCount} news articles associated with this category. Add query ?force=true to delete anyway.`,
                success: false,
                associated_news_count: newsCount
            });
        }

        await Category.findByIdAndDelete(id);

        return res.status(200).json({
            message: "Category deleted successfully",
            success: true
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error", success: false });
    }
};

// Aliases for camelCase conventions
export {
    create_category as createCategory,
    get_all_categories as getAllCategories,
    get_category_by_id as getCategoryById,
    update_category as updateCategory,
    delete_category as deleteCategory
};
