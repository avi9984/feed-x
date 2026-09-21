import mongoose from "mongoose";

const contentSchema = new mongoose.Schema({
    headline: { type: String, required: true },
    description: { type: String, required: true }
})

const newsSchema = new mongoose.Schema({
    title: { type: String, required: true },
    category_name: { type: String, required: true },
    author: { type: String, required: true },
    content: { type: [contentSchema], required: true },
    status: { type: String, required: true, enum: ["ACTIVE", "INACTIVE"] }
}, { versionKey: false, timestamps: true });

const NEWS = mongoose.model("fx_news", newsSchema);

export default NEWS;