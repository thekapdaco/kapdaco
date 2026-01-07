import mongoose from 'mongoose';
const ReviewSchema = new mongoose.Schema(
{
productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
rating: { type: Number, min: 1, max: 5, required: true },
comment: String,
flagged: { type: Boolean, default: false }
},
{ timestamps: true }
);
export default mongoose.model('Review', ReviewSchema);