import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
    email: { type: String, required: true },
    otp: { type: Number, required: true },
    expire_otp: { type: Date, required: true }
}, { versionKey: false, timestamps: true })

const OTP = mongoose.model("fx_otp", otpSchema);
export default OTP;
