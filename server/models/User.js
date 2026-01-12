import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  displayName: { type: String },
  photoURL: { type: String },
  profileLevel: { type: String, enum: ['basic', 'premium', 'vip'], default: 'basic' },
  subscriptionEndDate: { type: Date },
  watchlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Movie' }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  banned: { type: Boolean, default: false }
});

// Indexes are automatically created by unique: true constraints

export default mongoose.model("User", userSchema);
