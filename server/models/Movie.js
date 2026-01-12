import mongoose from "mongoose";

const movieSchema = new mongoose.Schema({
  title: String,
  poster: String,
  video: String,
  year: String,
  category: String,
  description: String,
  cast: [String],
  crew: [String],
  rating: String,
  duration: String,
  genre: [String],
  director: String,
  releaseDate: Date,
  language: String
});

export default mongoose.model("Movie", movieSchema);
