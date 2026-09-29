import { validationResult } from 'express-validator';
import Admin from '../models/admin.model.js';
import OTP from '../models/otp.model.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
const SALT_ROUND = 10;


export const create_admin = async (req, res) => {
    try {
        const { name, email, mobile_no, password, conform_pass, otp } = req.body;
        const error = validationResult(req);
        if (!error.isEmpty()) {
            return res.status(400).json({ message: "Validation Errors", errors: error.array(), success: false });
        }

        const normalizedEmail = email.toLowerCase();

        const check_admin_email = await Admin.findOne({ email: normalizedEmail });
        if (check_admin_email) {
            return res.status(400).json({ message: "Email already exists", success: false });
        }
        const check_admin_mobile = await Admin.findOne({ mobile_no });
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
            name,
            email: normalizedEmail,
            mobile_no,
            password: hash
        });

        if (!admin_created) {
            return res.status(400).json({ message: "something went wrong", success: false });
        }

        // Clean up used OTPs for this email
        await OTP.deleteMany({ email: normalizedEmail });

        return res.status(200).json({
            message: "Admin Has Created Successfully",
            success: true,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error", success: false });
    }
}
