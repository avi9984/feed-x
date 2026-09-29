import { body } from 'express-validator';
import express from 'express';
import { create_admin } from '../controllers/admin.controller.js';

const adminRouter = express.Router();


adminRouter.post('/', [
    body('name', 'Name is required').isAlpha('en-US', { ignore: ' ' }).withMessage("Name must be in Letters").isLength({ min: 2, max: 26 }).withMessage("Name must be minimum 2 letters & max 26"),
    body('email', 'Email is required field').isEmail().withMessage("Invalid Email"),
    body('mobile_no', 'Mobile number is required').isMobilePhone("en-IN").withMessage("Invalid Mobile Number"),
    body("password", "Password is Required").isString().withMessage("Invalid Password"),
    body("conform_pass", "Confirm Password is Required").isString().withMessage("Invalid Confirm Password"),
    body("otp").isNumeric().withMessage("Invalid OTP").isLength({ min: 4, max: 4 }).withMessage("Invalid OTP")
], create_admin);



export default adminRouter;
