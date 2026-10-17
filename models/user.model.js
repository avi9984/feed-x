import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    mobile_no: { type: String, unique: true, required: true, minLength: 10, maxLength: 10, trim: true },
    password: { type: String, required: true },
    login_history: { type: [Date], default: [] },
    last_login: { type: Date },
    role: { type: String, enum: ["User"], default: "User" },
    type: { type: String, enum: ["User"], default: "User" }
}, { versionKey: false, timestamps: true });

const USER = mongoose.model("fx_user", userSchema);
export default USER;