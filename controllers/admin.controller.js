import { validationResult } from 'express-validator';
import Admin from '../models/admin.model.js';
import OTP from '../models/otp.model.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import generateFourDigitNumber from '../services/otp_generator.js';

const SALT_ROUND = 10;

export const create_admin = async (req, res) => {
    try {
        const { name, email, mobile_no, password, conform_pass, otp } = req.body;
        const error = validationResult(req);
        if (!error.isEmpty()) {
            return res.status(400).json({ message: "Validation Errors", errors: error.array(), success: false });
        }

        const normalizedEmail = email.toLowerCase().trim();

        const check_admin_email = await Admin.findOne({ email: normalizedEmail });
        if (check_admin_email) {
            return res.status(400).json({ message: "Email already exists", success: false });
        }
        const check_admin_mobile = await Admin.findOne({ mobile_no: mobile_no.trim() });
        if (check_admin_mobile) {
            return res.status(400).json({ message: "Mobile Number Already Exist", success: false });
        }
        if (password !== conform_pass) {
            return res.status(400).json({ message: "Password doesn't Matched", success: false });
        }

        const latest_otp_doc = await OTP.findOne({ email: normalizedEmail }).sort({ _id: -1 });

        if (!latest_otp_doc) {
            return res.status(400).json({ message: "OTP not found. Please request a new OTP", success: false });
        }

        if (Number(latest_otp_doc.otp) !== Number(otp)) {
            return res.status(400).json({ message: "Invalid OTP", success: false });
        }

        const currentTime = new Date().getTime();
        const expire_otp_date = new Date(latest_otp_doc.expire_otp).getTime();

        if (currentTime > expire_otp_date) {
            return res.status(400).json({ message: "OTP Expired", success: false });
        }
        const hash = await bcrypt.hash(password, SALT_ROUND);

        const admin_created = await Admin.create({
            name: name.trim(),
            email: normalizedEmail,
            mobile_no: mobile_no.trim(),
            password: hash,
            type: "Admin",
            role: "Admin",
            login_history: []
        });

        if (!admin_created) {
            return res.status(400).json({ message: "something went wrong", success: false });
        }

        // Clean up used OTPs for this email
        await OTP.deleteMany({ email: normalizedEmail });

        return res.status(201).json({
            message: "Admin Has Created Successfully",
            success: true,
            admin: {
                _id: admin_created._id,
                name: admin_created.name,
                email: admin_created.email,
                mobile_no: admin_created.mobile_no,
                role: admin_created.role
            }
        });
    } catch (error) {
        console.error("create_admin error:", error);
        return res.status(500).json({ message: "Internal Server Error", success: false });
    }
};

export const sendOtpToEmail = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: "Validation Errors",
                errors: errors.array(),
                success: false
            });
        }
        await generateFourDigitNumber(req.body.email.toLowerCase().trim(), req, res);
    } catch (error) {
        console.error("sendOtpToEmail error:", error);
        return res.status(500).json({ message: "Internal Server Error", success: false });
    }
};

export const admin_login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: "Validation Errors", errors: errors.array(), success: false });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const check_email = await Admin.findOne({ email: normalizedEmail });
        if (!check_email) {
            return res.status(400).json({ message: "Account doesn't Exists", success: false });
        }

        const check_password = await bcrypt.compare(password, check_email.password);
        if (!check_password) {
            return res.status(400).json({ message: "Password doesn't Match", success: false });
        }

        // Update login history & last login
        check_email.last_login = new Date();
        check_email.login_history.push(new Date());
        await check_email.save();

        const token = jwt.sign(
            {
                _id: check_email._id,
                email: check_email.email,
                mobile_no: check_email.mobile_no,
                role: "Admin",
                type: "Admin"
            },
            process.env.JWT_SECRET,
            { algorithm: "HS256", expiresIn: "7d" }
        );

        return res.status(200).json({
            message: "Login Successfully",
            success: true,
            token: token,
            admin: {
                _id: check_email._id,
                name: check_email.name,
                email: check_email.email,
                mobile_no: check_email.mobile_no,
                role: "Admin"
            }
        });

    } catch (error) {
        console.error("admin_login error:", error);
        return res.status(500).json({ message: "Internal Server Error", success: false });
    }
};

export const get_admin_profile = async (req, res) => {
    try {
        const admin = await Admin.findById(req.admin._id).select('-password');
        if (!admin) {
            return res.status(404).json({ message: "Admin not found", success: false });
        }
        return res.status(200).json({
            message: "Admin profile fetched successfully",
            success: true,
            admin
        });
    } catch (error) {
        console.error("get_admin_profile error:", error);
        return res.status(500).json({ message: "Internal Server Error", success: false });
    }
};
