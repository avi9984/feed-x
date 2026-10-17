import jwt from 'jsonwebtoken';
import Admin from '../models/admin.model.js';
import USER from '../models/user.model.js';

/**
 * Core Authentication Middleware:
 * Verifies JWT token and resolves the authenticated account (Admin or User).
 * Attaches the authenticated entity to req.user (and req.admin for Admins).
 */
export const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization || req.headers.token || req.headers['x-access-token'];
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

        // Verify JWT token signature and expiration
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.tokenPayload = decoded;

        let account = null;
        let role = decoded.role || decoded.type;

        if (role === 'Admin') {
            account = await Admin.findById(decoded._id).select('-password');
            if (!account) {
                return res.status(403).json({
                    message: "Admin account not found or unauthorized",
                    success: false
                });
            }
            role = 'Admin';
        } else if (role === 'User') {
            account = await USER.findById(decoded._id).select('-password');
            if (!account) {
                return res.status(403).json({
                    message: "User account not found or unauthorized",
                    success: false
                });
            }
            role = 'User';
        } else {
            // Fallback for older tokens without explicit role: check Admin then User
            account = await Admin.findById(decoded._id).select('-password');
            if (account) {
                role = 'Admin';
            } else {
                account = await USER.findById(decoded._id).select('-password');
                if (account) {
                    role = 'User';
                }
            }
        }

        if (!account) {
            return res.status(401).json({
                message: "Account not found or unauthorized",
                success: false
            });
        }

        // Attach normalized role and user to request object
        req.user = account;
        req.user.role = role;
        if (role === 'Admin') {
            req.admin = account;
        }

        next();
    } catch (error) {
        console.error("Authentication error:", error.message);
        return res.status(401).json({
            message: "Invalid or expired token",
            success: false
        });
    }
};

/**
 * Role-Based Access Control (RBAC) Middleware Factory:
 * Restricts access to specific role(s) (e.g. authorizeRoles('Admin') or authorizeRoles('Admin', 'User'))
 */
export const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(401).json({
                message: "Authentication required before role verification",
                success: false
            });
        }

        const normalizedAllowed = allowedRoles.map(r => r.toLowerCase());
        const userRole = (req.user.role || '').toLowerCase();

        if (!normalizedAllowed.includes(userRole)) {
            return res.status(403).json({
                message: `Access denied. Only ${allowedRoles.join('/')} can perform this action`,
                success: false
            });
        }

        next();
    };
};

/**
 * verifyAdmin Middleware:
 * Authenticates token AND ensures user has the 'Admin' role.
 * Regular users attempting to use Admin APIs will receive a 403 Forbidden.
 */
export const verifyAdmin = async (req, res, next) => {
    authenticate(req, res, () => {
        if (!req.user || req.user.role !== 'Admin') {
            return res.status(403).json({
                message: "Access denied. Only Admins can perform this action",
                success: false
            });
        }
        req.admin = req.user;
        next();
    });
};

/**
 * verifyUser Middleware:
 * Authenticates token AND ensures the requester has the 'User' role.
 */
export const verifyUser = async (req, res, next) => {
    authenticate(req, res, () => {
        if (!req.user || req.user.role !== 'User') {
            return res.status(403).json({
                message: "Access denied. Only Users can perform this action",
                success: false
            });
        }
        next();
    });
};

/**
 * verifyAuth Middleware:
 * Allows any authenticated entity (either Admin or User).
 */
export const verifyAuth = async (req, res, next) => {
    authenticate(req, res, next);
};

// Aliases for flexible importing
export { authenticate as verifyToken };
export { verifyAdmin as verifyAdminAuth };
export default verifyAdmin;
