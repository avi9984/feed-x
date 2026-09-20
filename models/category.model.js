import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
    category_name: { type: String, required: true }
}, { versionKey: false, timestamps: true })

const Category = mongoose.model("fx_category", categorySchema);

export default Category;