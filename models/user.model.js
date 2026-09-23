import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    mobile_no: { type: String, unique: true, required: true, minLength: 10, maxLength: 10 },
    password: { type: String, required: true },
    login_history: { type: [Date], required: true },
    last_login: { type: Date }
}, { versionKey: false, timestamps: true });

const USER = mongoose.model("fx_user", userSchema);
export default USER;