import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    mobile_no: { type: String, required: true, unique: true, minLength: 10, maxLength: 10 },
    password: { type: String, required: true },
    login_history: { type: [Date.now()], default: [] },
    last_login:{type:Date},
    type: { type: String, enum: ["Admin"], default: "Admin" }
}, { versionKey: false, timestamps: true })

const Admin = mongoose.model("fx_admin", adminSchema);

export default Admin;