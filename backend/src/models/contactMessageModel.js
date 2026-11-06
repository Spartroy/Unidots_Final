import mongoose from 'mongoose';

// Messages sent from the public website contact form.
const contactMessageSchema = mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 200 },
    phone: { type: String, trim: true, maxlength: 40 },
    message: { type: String, required: true, trim: true, maxlength: 4000 },
    language: { type: String, enum: ['en', 'ar'], default: 'en' },
    status: { type: String, enum: ['new', 'handled'], default: 'new' },
    handledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    handledAt: Date,
    ip: String,
  },
  { timestamps: true }
);

export default mongoose.model('ContactMessage', contactMessageSchema);
