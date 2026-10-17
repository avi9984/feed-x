import express from 'express';
import { body } from 'express-validator';
import {
    sendUserOtp,
    register_user,
    user_login,
    get_user_profile,
    update_user_profile,
    change_user_password,
    logout_user
} from '../controllers/user.controller.js';
import { verifyUser } from '../middleware/auth.middleware.js';

const userRouter = express.Router();

// ==========================================
// Public Routes
// ==========================================

// Request OTP for registration / verification
userRouter.post(
    '/send-otp',
    [
        body('email', 'Email is required field').isEmail().withMessage('Invalid Email')
    ],
    sendUserOtp
);

// Register a new user
userRouter.post(
    '/register',
    [
        body('name', 'Name is required')
            .isAlpha('en-US', { ignore: ' ' })
            .withMessage('Name must only contain letters')
            .isLength({ min: 2, max: 50 })
            .withMessage('Name must be between 2 and 50 characters'),
        body('email', 'Email is required field')
            .isEmail()
            .withMessage('Invalid Email'),
        body('mobile_no', 'Mobile number is required')
            .isMobilePhone('en-IN')
            .withMessage('Invalid Indian Mobile Number'),
        body('password', 'Password is Required')
            .isString()
            .isLength({ min: 6 })
            .withMessage('Password must be at least 6 characters'),
        body('conform_pass', 'Confirm Password is Required')
            .isString()
            .withMessage('Invalid Confirm Password'),
        body('otp', 'OTP is required')
            .isNumeric()
            .withMessage('Invalid OTP')
            .isLength({ min: 4, max: 4 })
            .withMessage('OTP must be exactly 4 digits')
    ],
    register_user
);

// Alias route: POST / (identical to register)
userRouter.post(
    '/',
    [
        body('name', 'Name is required')
            .isAlpha('en-US', { ignore: ' ' })
            .withMessage('Name must only contain letters')
            .isLength({ min: 2, max: 50 })
            .withMessage('Name must be between 2 and 50 characters'),
        body('email', 'Email is required field')
            .isEmail()
            .withMessage('Invalid Email'),
        body('mobile_no', 'Mobile number is required')
            .isMobilePhone('en-IN')
            .withMessage('Invalid Indian Mobile Number'),
        body('password', 'Password is Required')
            .isString()
            .isLength({ min: 6 })
            .withMessage('Password must be at least 6 characters'),
        body('conform_pass', 'Confirm Password is Required')
            .isString()
            .withMessage('Invalid Confirm Password'),
        body('otp', 'OTP is required')
            .isNumeric()
            .withMessage('Invalid OTP')
            .isLength({ min: 4, max: 4 })
            .withMessage('OTP must be exactly 4 digits')
    ],
    register_user
);

// User login
userRouter.post(
    '/login',
    [
        body('email', 'Email is required field').isEmail().withMessage('Invalid Email'),
        body('password', 'Password is Required').isString().notEmpty().withMessage('Password cannot be empty')
    ],
    user_login
);

// ==========================================
// Protected Routes (User-Only via verifyUser)
// ==========================================

// Get user profile
userRouter.get('/profile', verifyUser, get_user_profile);

// Update user profile
userRouter.put(
    '/profile',
    verifyUser,
    [
        body('name')
            .optional()
            .isAlpha('en-US', { ignore: ' ' })
            .withMessage('Name must only contain letters')
            .isLength({ min: 2, max: 50 })
            .withMessage('Name must be between 2 and 50 characters'),
        body('mobile_no')
            .optional()
            .isMobilePhone('en-IN')
            .withMessage('Invalid Indian Mobile Number')
    ],
    update_user_profile
);

// Change user password
userRouter.put(
    '/change-password',
    verifyUser,
    [
        body('old_password', 'Current password is required').isString().notEmpty(),
        body('new_password', 'New password is required')
            .isString()
            .isLength({ min: 6 })
            .withMessage('New password must be at least 6 characters'),
        body('conform_pass', 'Confirm password is required').isString().notEmpty()
    ],
    change_user_password
);

// User logout
userRouter.post('/logout', verifyUser, logout_user);

export default userRouter;
