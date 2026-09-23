import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({
    razorpay_payment_id: { type: String, required: true },
    razorpay_order_id: { type: String, required: true },
    razorpay_signature: { type: String, required: true },
    subscription_start_date: { type: Date, required: true },
    subscription_end_date: { type: Date },
    amount: { type: Number, required: true },
    token_id: { type: String, required: true },
    status: {
        type: String,
        required: true,
        enum: ["Active", "Inactive"]
    }

}, { versionKey: false, timestamps: true });

const SubScription = mongoose.model("fx_subscription");
export default SubScription;