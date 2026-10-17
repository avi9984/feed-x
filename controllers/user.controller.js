import { validationResult } from 'express-validator';
import USER from '../models/user.model.js';
import OTP from '../models/otp.model.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import generateFourDigitNumber from '../services/otp_generator.js';

const SALT_ROUND = 10;

/**
 * @desc Send 4-digit OTP to user's email for registration or verification
 * @route POST /api/users/send-otp
 * @access Public
 */
export const sendUserOtp = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: "Validation Errors",
                errors: errors.array(),
                success: false
            });
        }

        const normalizedEmail = req.body.email.toLowerCase().trim();
        await generateFourDigitNumber(normalizedEmail, req, res);
    } catch (error) {
        console.error("sendUserOtp error:", error);
        return res.status(500).json({ message: "Internal Server Error", success: false });
    }
};

/**
 * @desc Register a new user with OTP verification
 * @route POST /api/users/register
 * @access Public
 */
export const register_user = async (req, res) => {
    try {
        const { name, email, mobile_no, password, conform_pass, otp } = req.body;
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: "Validation Errors",
                errors: errors.array(),
                success: false
            });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const trimmedMobile = mobile_no.trim();

        // Check if user already exists
        const existingEmail = await USER.findOne({ email: normalizedEmail });
        if (existingEmail) {
            return res.status(400).json({
                message: "Email is already registered",
                success: false
            });
        }

        const existingMobile = await USER.findOne({ mobile_no: trimmedMobile });
        if (existingMobile) {
            return res.status(400).json({
                message: "Mobile number is already registered",
                success: false
            });
        }

        if (password !== conform_pass) {
            return res.status(400).json({
                message: "Password and Confirm Password do not match",
                success: false
            });
        }

        // Verify OTP
        const latestOtpDoc = await OTP.findOne({ email: normalizedEmail }).sort({ _id: -1 });
        if (!latestOtpDoc) {
            return res.status(400).json({
                message: "OTP not found. Please request a new OTP",
                success: false
            });
        }

        if (Number(latestOtpDoc.otp) !== Number(otp)) {
            return res.status(400).json({
                message: "Invalid OTP",
                success: false
            });
        }

        const currentTime = new Date().getTime();
        const expireTime = new Date(latestOtpDoc.expire_otp).getTime();
        if (currentTime > expireTime) {
            return res.status(400).json({
                message: "OTP has expired. Please request a new one",
                success: false
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, SALT_ROUND);

        // Create User
        const newUser = await USER.create({
            name: name.trim(),
            email: normalizedEmail,
            mobile_no: trimmedMobile,
            password: hashedPassword,
            role: "User",
            type: "User",
            login_history: []
        });

        if (!newUser) {
            return res.status(500).json({
                message: "Failed to create user account",
                success: false
            });
        }

        // Clean up OTPs
        await OTP.deleteMany({ email: normalizedEmail });

        return res.status(201).json({
            message: "User registered successfully",
            success: true,
            user: {
                _id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                mobile_no: newUser.mobile_no,
                role: newUser.role
            }
        });

    } catch (error) {
        console.error("register_user error:", error);
        return res.status(500).json({ message: "Internal Server Error", success: false });
    }
};

/**
 * @desc User login
 * @route POST /api/users/login
 * @access Public
 */
export const user_login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: "Validation Errors",
                errors: errors.array(),
                success: false
            });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await USER.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(400).json({
                message: "Account doesn't exist with this email",
                success: false
            });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(400).json({
                message: "Incorrect password",
                success: false
            });
        }

        // Record login time
        user.last_login = new Date();
        user.login_history.push(new Date());
        await user.save();

        // Sign JWT token with explicit role: "User"
        const token = jwt.sign(
            {
                _id: user._id,
                email: user.email,
                mobile_no: user.mobile_no,
                role: "User",
                type: "User"
            },
            process.env.JWT_SECRET,
            { algorithm: "HS256", expiresIn: "7d" }
        );

        return res.status(200).json({
            message: "Login Successfully",
            success: true,
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                mobile_no: user.mobile_no,
                role: user.role
            }
        });

    } catch (error) {
        console.error("user_login error:", error);
        return res.status(500).json({ message: "Internal Server Error", success: false });
    }
};

/**
 * @desc Get currently authenticated user's profile
 * @route GET /api/users/profile
 * @access Private (User Only)
 */
export const get_user_profile = async (req, res) => {
    try {
        const user = await USER.findById(req.user._id).select('-password');
        if (!user) {
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        }

        return res.status(200).json({
            message: "Profile retrieved successfully",
            success: true,
            user
        });
    } catch (error) {
        console.error("get_user_profile error:", error);
        return res.status(500).json({ message: "Internal Server Error", success: false });
    }
};

/**
 * @desc Update user profile (name, mobile_no)
 * @route PUT /api/users/profile
 * @access Private (User Only)
 */
export const update_user_profile = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: "Validation Errors",
                errors: errors.array(),
                success: false
            });
        }

        const { name, mobile_no } = req.body;
        const user = await USER.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        }

        if (name) {
            user.name = name.trim();
        }

        if (mobile_no && mobile_no.trim() !== user.mobile_no) {
            const existingMobile = await USER.findOne({
                mobile_no: mobile_no.trim(),
                _id: { $ne: user._id }
            });
            if (existingMobile) {
                return res.status(400).json({
                    message: "Mobile number is already in use by another account",
                    success: false
                });
            }
            user.mobile_no = mobile_no.trim();
        }

        await user.save();

        return res.status(200).json({
            message: "Profile updated successfully",
            success: true,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                mobile_no: user.mobile_no,
                role: user.role
            }
        });

    } catch (error) {
        console.error("update_user_profile error:", error);
        return res.status(500).json({ message: "Internal Server Error", success: false });
    }
};

/**
 * @desc Change user password
 * @route PUT /api/users/change-password
 * @access Private (User Only)
 */
export const change_user_password = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: "Validation Errors",
                errors: errors.array(),
                success: false
            });
        }

        const { old_password, new_password, conform_pass } = req.body;

        if (new_password !== conform_pass) {
            return res.status(400).json({
                message: "New password and Confirm password do not match",
                success: false
            });
        }

        const user = await USER.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        }

        const isMatch = await bcrypt.compare(old_password, user.password);
        if (!isMatch) {
            return res.status(400).json({
                message: "Current password is incorrect",
                success: false
            });
        }

        user.password = await bcrypt.hash(new_password, SALT_ROUND);
        await user.save();

        return res.status(200).json({
            message: "Password changed successfully",
            success: true
        });

    } catch (error) {
        console.error("change_user_password error:", error);
        return res.status(500).json({ message: "Internal Server Error", success: false });
    }
};

/**
 * @desc User logout
 * @route POST /api/users/logout
 * @access Private (User Only)
 */
export const logout_user = async (req, res) => {
    try {
        return res.status(200).json({
            message: "Logged out successfully",
            success: true
        });
    } catch (error) {
        console.error("logout_user error:", error);
        return res.status(500).json({ message: "Internal Server Error", success: false });
    }
};
