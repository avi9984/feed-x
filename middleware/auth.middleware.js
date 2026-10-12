import jwt from 'jsonwebtoken';
import Admin from '../models/admin.model.js';

export const verifyAdmin = async (req, res, next) => {
    try {
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
                message: "Token not found",
                success: false
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const admin = await Admin.findById(decoded._id);

        if (!admin) {
            return res.status(403).json({
                message: "Admin account not found or unauthorized",
                success: false
            });
        }

        if (admin.type && admin.type !== "Admin") {
            return res.status(403).json({
                message: "Access denied. Only Admins can perform this action",
                success: false
            });
        }

        req.admin = admin;
        next();
    } catch (error) {
        console.log(error);
        return res.status(401).json({
            message: "Invalid or expired token",
            success: false
        });
    }
};

export default verifyAdmin;
