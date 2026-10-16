import jwt from 'jsonwebtoken';
import Admin from '../models/admin.model.js';

/**
 * Middleware to verify Admin JWT authentication directly in routes
 */
export const verifyAdmin = async (req, res, next) => {
    try {
        // Extract token from Authorization header or custom token header
        const authHeader = req.headers.authorization || req.headers.token;
        if (!authHeader) {
            return res.status(401).json({
                message: "Authorization token is required",
                success: false
            });
        }

        const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : authHeader;
        if (!token) {
            return res.status(401).json({
                message: "Token not found or invalid format",
                success: false
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Fetch admin account (exclude password hash)
        const admin = await Admin.findById(decoded._id).select('-password');
        if (!admin) {
            return res.status(403).json({
                message: "Admin account not found or unauthorized",
                success: false
            });
        }

        // Verify admin type
        if (admin.type && admin.type !== "Admin") {
            return res.status(403).json({
                message: "Access denied. Only Admins can perform this action",
                success: false
            });
        }

        // Attach verified admin to request object
        req.admin = admin;
        next();
    } catch (error) {
        console.log("verifyAdmin error:", error.message);
        return res.status(401).json({
            message: "Invalid or expired token",
            success: false
        });
    }
};

// Alias export for flexible importing
export { verifyAdmin as verifyAdminAuth };
export default verifyAdmin;
