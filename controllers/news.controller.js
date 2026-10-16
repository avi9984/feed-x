import mongoose from 'mongoose';
import { validationResult } from 'express-validator';
import NEWS from '../models/news.model.js';
import Category from '../models/category.model.js';

// Helper function to escape regex characters safely
const escapeRegex = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * @desc Create a new news article (Admin Only - verified by verifyAdmin middleware)
 * @route POST /api/news
 */
export const create_news = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: "Validation Errors", errors: errors.array(), success: false });
        }

        const { title, category_name, author, content, status } = req.body;

        // Verify that category exists in database
        const trimmedCategory = category_name.trim();
        const categoryExists = await Category.findOne({
            category_name: { $regex: new RegExp(`^${escapeRegex(trimmedCategory)}$`, "i") }
        });

        if (!categoryExists) {
            return res.status(400).json({
                message: `Category '${trimmedCategory}' does not exist. Please create or choose an existing category first.`,
                success: false
            });
        }

        // Validate content structure
        if (!Array.isArray(content) || content.length === 0) {
            return res.status(400).json({
                message: "Content must be a non-empty array of sections with headline and description",
                success: false
            });
        }

        for (let i = 0; i < content.length; i++) {
            const item = content[i];
            if (!item || !item.headline || !item.headline.trim() || !item.description || !item.description.trim()) {
                return res.status(400).json({
                    message: `Content item at index ${i} must include both a valid headline and description`,
                    success: false
                });
            }
        }

        // Default or sanitize author (uses verified req.admin if available)
        const newsAuthor = (author && author.trim()) ? author.trim() : (req.admin?.name || "Admin");

        // Validate status (default to ACTIVE)
        const newsStatus = status ? status.toUpperCase() : "ACTIVE";
        if (!["ACTIVE", "INACTIVE"].includes(newsStatus)) {
            return res.status(400).json({
                message: "Status must be either 'ACTIVE' or 'INACTIVE'",
                success: false
            });
        }

        const newNews = await NEWS.create({
            title: title.trim(),
            category_name: categoryExists.category_name, // Use canonical name
            author: newsAuthor,
            content: content.map(item => ({
                headline: item.headline.trim(),
                description: item.description.trim()
            })),
            status: newsStatus
        });

        return res.status(201).json({
            message: "News article created successfully",
            success: true,
            data: newNews
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error", success: false });
    }
};

/**
 * @desc Get all news articles with filtering, search, pagination, and sorting
 * @route GET /api/news
 */
export const get_all_news = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            category,
            category_name,
            status,
            search,
            q,
            author,
            sortBy = "createdAt",
            sortOrder = "desc"
        } = req.query;

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
        const skip = (pageNum - 1) * limitNum;

        // Build query filter
        const queryFilter = {};

        // Status filter: defaults to ACTIVE unless specified or explicitly requesting 'all'
        if (status) {
            const upperStatus = status.toUpperCase();
            if (upperStatus !== "ALL") {
                queryFilter.status = upperStatus;
            }
        } else {
            queryFilter.status = "ACTIVE";
        }

        // Category filter
        const cat = category || category_name;
        if (cat && cat.trim()) {
            queryFilter.category_name = { $regex: new RegExp(`^${escapeRegex(cat.trim())}$`, "i") };
        }

        // Author filter
        if (author && author.trim()) {
            queryFilter.author = { $regex: new RegExp(escapeRegex(author.trim()), "i") };
        }

        // Text search across title, category, author, and content headlines/descriptions
        const searchTerm = (search || q || "").trim();
        if (searchTerm) {
            const escapedSearch = escapeRegex(searchTerm);
            queryFilter.$or = [
                { title: { $regex: escapedSearch, $options: "i" } },
                { category_name: { $regex: escapedSearch, $options: "i" } },
                { author: { $regex: escapedSearch, $options: "i" } },
                { "content.headline": { $regex: escapedSearch, $options: "i" } },
                { "content.description": { $regex: escapedSearch, $options: "i" } }
            ];
        }

        // Sorting options
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder.toLowerCase() === "asc" ? 1 : -1;

        const [newsList, totalCount] = await Promise.all([
            NEWS.find(queryFilter)
                .sort(sortOptions)
                .skip(skip)
                .limit(limitNum),
            NEWS.countDocuments(queryFilter)
        ]);

        const totalPages = Math.ceil(totalCount / limitNum);

        return res.status(200).json({
            message: "News fetched successfully",
            success: true,
            pagination: {
                total: totalCount,
                page: pageNum,
                limit: limitNum,
                totalPages: totalPages,
                hasNextPage: pageNum < totalPages,
                hasPrevPage: pageNum > 1
            },
            data: newsList
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error", success: false });
    }
};

/**
 * @desc Get single news article by ID
 * @route GET /api/news/:id
 */
export const get_news_by_id = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid News ID format", success: false });
        }

        const news = await NEWS.findById(id);
        if (!news) {
            return res.status(404).json({ message: "News not found", success: false });
        }

        return res.status(200).json({
            message: "News fetched successfully",
            success: true,
            data: news
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error", success: false });
    }
};

/**
 * @desc Get news articles by category name
 * @route GET /api/news/category/:category_name
 */
export const get_news_by_category = async (req, res) => {
    try {
        const { category_name } = req.params;
        const { page = 1, limit = 10, status = "ACTIVE" } = req.query;

        if (!category_name || !category_name.trim()) {
            return res.status(400).json({ message: "Category name is required", success: false });
        }

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
        const skip = (pageNum - 1) * limitNum;

        const queryFilter = {
            category_name: { $regex: new RegExp(`^${escapeRegex(category_name.trim())}$`, "i") }
        };

        if (status && status.toUpperCase() !== "ALL") {
            queryFilter.status = status.toUpperCase();
        }

        const [newsList, totalCount] = await Promise.all([
            NEWS.find(queryFilter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum),
            NEWS.countDocuments(queryFilter)
        ]);

        const totalPages = Math.ceil(totalCount / limitNum);

        return res.status(200).json({
            message: `News for category '${category_name}' fetched successfully`,
            success: true,
            category: category_name,
            pagination: {
                total: totalCount,
                page: pageNum,
                limit: limitNum,
                totalPages: totalPages,
                hasNextPage: pageNum < totalPages,
                hasPrevPage: pageNum > 1
            },
            data: newsList
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error", success: false });
    }
};

/**
 * @desc Get latest active news articles
 * @route GET /api/news/latest
 */
export const get_latest_news = async (req, res) => {
    try {
        const { limit = 5 } = req.query;
        const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 5));

        const latestNews = await NEWS.find({ status: "ACTIVE" })
            .sort({ createdAt: -1 })
            .limit(limitNum);

        return res.status(200).json({
            message: "Latest news fetched successfully",
            success: true,
            total: latestNews.length,
            data: latestNews
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error", success: false });
    }
};

/**
 * @desc Search news articles by query
 * @route GET /api/news/search
 */
export const search_news = async (req, res) => {
    try {
        const { q, query, page = 1, limit = 10 } = req.query;
        const searchQuery = (q || query || "").trim();

        if (!searchQuery) {
            return res.status(400).json({
                message: "Search query parameter 'q' or 'query' is required",
                success: false
            });
        }

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
        const skip = (pageNum - 1) * limitNum;

        const escaped = escapeRegex(searchQuery);
        const filter = {
            status: "ACTIVE",
            $or: [
                { title: { $regex: escaped, $options: "i" } },
                { category_name: { $regex: escaped, $options: "i" } },
                { author: { $regex: escaped, $options: "i" } },
                { "content.headline": { $regex: escaped, $options: "i" } },
                { "content.description": { $regex: escaped, $options: "i" } }
            ]
        };

        const [results, totalCount] = await Promise.all([
            NEWS.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum),
            NEWS.countDocuments(filter)
        ]);

        const totalPages = Math.ceil(totalCount / limitNum);

        return res.status(200).json({
            message: "News search results fetched successfully",
            success: true,
            query: searchQuery,
            pagination: {
                total: totalCount,
                page: pageNum,
                limit: limitNum,
                totalPages: totalPages,
                hasNextPage: pageNum < totalPages,
                hasPrevPage: pageNum > 1
            },
            data: results
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error", success: false });
    }
};

/**
 * @desc Update a news article (Admin Only - verified by verifyAdmin middleware)
 * @route PUT /api/news/:id
 */
export const update_news = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: "Validation Errors", errors: errors.array(), success: false });
        }

        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid News ID format", success: false });
        }

        const news = await NEWS.findById(id);
        if (!news) {
            return res.status(404).json({ message: "News not found", success: false });
        }

        const { title, category_name, author, content, status } = req.body;

        // If category is being updated, verify it exists
        if (category_name !== undefined) {
            const trimmedCategory = category_name.trim();
            const categoryExists = await Category.findOne({
                category_name: { $regex: new RegExp(`^${escapeRegex(trimmedCategory)}$`, "i") }
            });

            if (!categoryExists) {
                return res.status(400).json({
                    message: `Category '${trimmedCategory}' does not exist. Please create or choose an existing category first.`,
                    success: false
                });
            }
            news.category_name = categoryExists.category_name;
        }

        // If title provided
        if (title !== undefined) {
            if (!title.trim()) {
                return res.status(400).json({ message: "Title cannot be empty", success: false });
            }
            news.title = title.trim();
        }

        // If author provided
        if (author !== undefined) {
            news.author = author.trim() || news.author;
        }

        // If content provided, validate
        if (content !== undefined) {
            if (!Array.isArray(content) || content.length === 0) {
                return res.status(400).json({
                    message: "Content must be a non-empty array of sections",
                    success: false
                });
            }

            for (let i = 0; i < content.length; i++) {
                const item = content[i];
                if (!item || !item.headline || !item.headline.trim() || !item.description || !item.description.trim()) {
                    return res.status(400).json({
                        message: `Content item at index ${i} must include both a valid headline and description`,
                        success: false
                    });
                }
            }

            news.content = content.map(item => ({
                headline: item.headline.trim(),
                description: item.description.trim()
            }));
        }

        // If status provided, validate
        if (status !== undefined) {
            const upperStatus = status.toUpperCase();
            if (!["ACTIVE", "INACTIVE"].includes(upperStatus)) {
                return res.status(400).json({
                    message: "Status must be either 'ACTIVE' or 'INACTIVE'",
                    success: false
                });
            }
            news.status = upperStatus;
        }

        const updatedNews = await news.save();

        return res.status(200).json({
            message: "News article updated successfully",
            success: true,
            data: updatedNews
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error", success: false });
    }
};

/**
 * @desc Toggle or change news status (ACTIVE <-> INACTIVE) (Admin Only - verified by verifyAdmin middleware)
 * @route PATCH /api/news/:id/status
 */
export const update_news_status = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid News ID format", success: false });
        }

        const news = await NEWS.findById(id);
        if (!news) {
            return res.status(404).json({ message: "News not found", success: false });
        }

        const { status } = req.body;

        if (status) {
            const upperStatus = status.toUpperCase();
            if (!["ACTIVE", "INACTIVE"].includes(upperStatus)) {
                return res.status(400).json({
                    message: "Status must be either 'ACTIVE' or 'INACTIVE'",
                    success: false
                });
            }
            news.status = upperStatus;
        } else {
            // Toggle status if not explicitly provided
            news.status = news.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
        }

        await news.save();

        return res.status(200).json({
            message: `News status successfully updated to ${news.status}`,
            success: true,
            data: {
                _id: news._id,
                title: news.title,
                status: news.status,
                updatedAt: news.updatedAt
            }
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error", success: false });
    }
};

/**
 * @desc Delete a news article (Admin Only - verified by verifyAdmin middleware)
 * @route DELETE /api/news/:id
 */
export const delete_news = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid News ID format", success: false });
        }

        const news = await NEWS.findByIdAndDelete(id);
        if (!news) {
            return res.status(404).json({ message: "News not found", success: false });
        }

        return res.status(200).json({
            message: "News article deleted successfully",
            success: true
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error", success: false });
    }
};

/**
 * @desc Get news statistics / analytics (Admin Only - verified by verifyAdmin middleware)
 * @route GET /api/news/admin/stats
 */
export const get_news_stats = async (req, res) => {
    try {
        const [totalCount, activeCount, inactiveCount, categoryBreakdown, latestArticle] = await Promise.all([
            NEWS.countDocuments(),
            NEWS.countDocuments({ status: "ACTIVE" }),
            NEWS.countDocuments({ status: "INACTIVE" }),
            NEWS.aggregate([
                {
                    $group: {
                        _id: "$category_name",
                        count: { $sum: 1 },
                        active_count: {
                            $sum: { $cond: [{ $eq: ["$status", "ACTIVE"] }, 1, 0] }
                        }
                    }
                },
                { $sort: { count: -1 } }
            ]),
            NEWS.findOne().sort({ createdAt: -1 }).select("title category_name createdAt")
        ]);

        return res.status(200).json({
            message: "News statistics fetched successfully",
            success: true,
            data: {
                total_news: totalCount,
                active_news: activeCount,
                inactive_news: inactiveCount,
                total_categories_used: categoryBreakdown.length,
                category_breakdown: categoryBreakdown.map(item => ({
                    category: item._id,
                    total: item.count,
                    active: item.active_count
                })),
                latest_published_news: latestArticle || null
            }
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error", success: false });
    }
};

// Aliases for camelCase conventions
export {
    create_news as createNews,
    get_all_news as getAllNews,
    get_news_by_id as getNewsById,
    get_news_by_category as getNewsByCategory,
    get_latest_news as getLatestNews,
    search_news as searchNews,
    update_news as updateNews,
    update_news_status as updateNewsStatus,
    delete_news as deleteNews,
    get_news_stats as getNewsStats
};
