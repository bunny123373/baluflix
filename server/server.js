import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 5000;

/* ================= PATH ================= */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ================= MIDDLEWARE ================= */
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"]
}));

// 🔥 BIG FILE SUPPORT
app.use(express.json({ limit: "2gb" }));
app.use(express.urlencoded({ extended: true, limit: "2gb" }));

// 🔥 NO TIMEOUT (GB uploads)
app.use((req, res, next) => {
  res.setTimeout(0);
  next();
});

/* ================= DB CONNECT ================= */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Error:", err));

/* ================= MODELS ================= */
import User from './models/User.js';

// 🎬 MOVIE
const movieSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    year: String,
    category: { type: String, required: true },
    poster: { type: String, required: true },
    video: { type: String, required: true },
    description: String,
    cast: [String],
    crew: [String],
    rating: String,
    duration: String,
    genre: [String],
    director: String,
    releaseDate: Date,
    language: String,
    trending: { type: Boolean, default: false },
    isHero: { type: Boolean, default: false }
  },
  { timestamps: true }
);
const Movie = mongoose.model("Movie", movieSchema);

// ▶ CONTINUE WATCHING
const watchSchema = new mongoose.Schema(
  {
    userId: String,
    movieId: { type: mongoose.Schema.Types.ObjectId, ref: "Movie" },
    currentTime: Number
  },
  { timestamps: true }
);
const Watch = mongoose.model("Watch", watchSchema);

// ❤️ WATCHLIST/FAVORITES
const watchlistSchema = new mongoose.Schema(
  {
    userId: String,
    movieId: { type: mongoose.Schema.Types.ObjectId, ref: "Movie" }
  },
  { timestamps: true }
);
const Watchlist = mongoose.model("Watchlist", watchlistSchema);

/* ================= UPLOAD (5GB SUPPORT) ================= */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "uploads");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 1024 * 5 } // 5GB
});

/* ================= STATIC ================= */
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/admin", express.static(path.join(__dirname, "admin")));
app.use(express.static(path.join(__dirname, "../client")));

// Serve admin.html at /admin.html for convenience
app.get("/admin.html", (req, res) => {
  res.sendFile(path.join(__dirname, "admin", "admin.html"));
});

/* ================= ROUTES ================= */
import userRoutes from './routes/user.js';

// Health check
app.get("/", (req, res) => {
  res.send("🔥 BaluFlix API running");
});

// User routes
app.use('/api/user', userRoutes);

/* ---------- USER LOGIN SAVE (Firebase) ---------- */
app.post("/api/user/login", async (req, res) => {
  const { uid, email } = req.body;
  await User.findOneAndUpdate(
    { uid },
    { email },
    { upsert: true }
  );
  res.json({ success: true });
});

/* ---------- CHECK BANNED USER ---------- */
app.get("/api/check-user/:uid", async (req, res) => {
  const user = await User.findOne({ uid: req.params.uid });
  if (user?.banned) {
    return res.status(403).json({ banned: true });
  }
  res.json({ banned: false });
});

/* ---------- CREATE (UPLOAD MOVIE) ---------- */
app.post(
  "/api/upload",
  upload.fields([
    { name: "poster", maxCount: 1 },
    { name: "video", maxCount: 1 }
  ]),
  async (req, res) => {
    if (!req.files?.poster || !req.files?.video) {
      return res.status(400).json({ error: "Poster & Video required" });
    }

    // Process array fields (comma-separated strings to arrays)
    const cast = req.body.cast ? req.body.cast.split(',').map(item => item.trim()).filter(item => item) : [];
    const crew = req.body.crew ? req.body.crew.split(',').map(item => item.trim()).filter(item => item) : [];
    const genre = req.body.genre ? req.body.genre.split(',').map(item => item.trim()).filter(item => item) : [];

    const movie = new Movie({
      title: req.body.title,
      year: req.body.year,
      category: req.body.category,
      poster: "uploads/" + req.files.poster[0].filename,
      video: "uploads/" + req.files.video[0].filename,
      description: req.body.description,
      cast: cast,
      crew: crew,
      rating: req.body.rating,
      duration: req.body.duration,
      genre: genre,
      director: req.body.director,
      releaseDate: req.body.releaseDate ? new Date(req.body.releaseDate) : null,
      language: req.body.language,
      trending: req.body.trending === "true",
      isHero: req.body.isHero === "true"
    });

    await movie.save();
    res.json({ success: true, movie });
  }
);

/* ---------- READ (ALL – ADMIN) ---------- */
app.get("/api/movies", async (req, res) => {
  const movies = await Movie.find().sort({ createdAt: -1 });
  res.json(movies);
});

/* ---------- READ (SINGLE MOVIE) ---------- */
app.get("/api/movie/:id", async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({ error: "Movie not found" });
    }
    res.json(movie);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

/* ---------- READ (HOME – GROUPED) ---------- */
app.get("/api/categories", async (req, res) => {
  const movies = await Movie.find();
  const grouped = {};

  movies.forEach(m => {
    if (!grouped[m.category]) grouped[m.category] = [];
    grouped[m.category].push(m);
  });

  res.json(grouped);
});

/* ---------- UPDATE ---------- */
app.put(
  "/api/movie/:id",
  upload.fields([
    { name: "poster", maxCount: 1 },
    { name: "video", maxCount: 1 }
  ]),
  async (req, res) => {
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ error: "Movie not found" });

    // Process array fields (comma-separated strings to arrays)
    const cast = req.body.cast ? req.body.cast.split(',').map(item => item.trim()).filter(item => item) : [];
    const crew = req.body.crew ? req.body.crew.split(',').map(item => item.trim()).filter(item => item) : [];
    const genre = req.body.genre ? req.body.genre.split(',').map(item => item.trim()).filter(item => item) : [];

    const update = {
      title: req.body.title,
      year: req.body.year,
      category: req.body.category,
      description: req.body.description,
      cast: cast,
      crew: crew,
      rating: req.body.rating,
      duration: req.body.duration,
      genre: genre,
      director: req.body.director,
      releaseDate: req.body.releaseDate ? new Date(req.body.releaseDate) : null,
      language: req.body.language,
      trending: req.body.trending === "true",
      isHero: req.body.isHero === "true"
    };

    if (req.files?.poster) {
      safeUnlink(movie.poster);
      update.poster = "uploads/" + req.files.poster[0].filename;
    }

    if (req.files?.video) {
      safeUnlink(movie.video);
      update.video = "uploads/" + req.files.video[0].filename;
    }

    await Movie.findByIdAndUpdate(req.params.id, update);
    res.json({ success: true });
  }
);

/* ---------- DELETE ---------- */
app.delete("/api/movie/:id", async (req, res) => {
  const movie = await Movie.findById(req.params.id);
  if (!movie) return res.status(404).json({ error: "Movie not found" });

  safeUnlink(movie.poster);
  safeUnlink(movie.video);

  await Movie.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

/* ---------- CONTINUE WATCHING ---------- */
app.post("/api/watch", async (req, res) => {
  const { userId, movieId, currentTime } = req.body;
  await Watch.findOneAndUpdate(
    { userId, movieId },
    { currentTime },
    { upsert: true }
  );
  res.json({ success: true });
});

app.get("/api/watch/:userId", async (req, res) => {
  const data = await Watch.find({ userId: req.params.userId })
    .populate("movieId")
    .sort({ updatedAt: -1 })
    .limit(10);
  res.json(data);
});

/* ---------- WATCHLIST/FAVORITES ---------- */
app.get("/api/watchlist/:userId", async (req, res) => {
  try {
    const watchlist = await Watchlist.find({ userId: req.params.userId })
      .populate("movieId")
      .sort({ createdAt: -1 });
    res.json(watchlist);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/watchlist", async (req, res) => {
  try {
    const { userId, movieId } = req.body;
    if (!userId || !movieId) {
      return res.status(400).json({ error: "userId and movieId required" });
    }

    // Check if already in watchlist
    const existing = await Watchlist.findOne({ userId, movieId });
    if (existing) {
      return res.status(400).json({ error: "Movie already in watchlist" });
    }

    const watchlistItem = new Watchlist({ userId, movieId });
    await watchlistItem.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.delete("/api/watchlist/:userId/:movieId", async (req, res) => {
  try {
    const { userId, movieId } = req.params;
    await Watchlist.findOneAndDelete({ userId, movieId });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

/* ---------- ADMIN STATS ---------- */
app.get("/api/admin/stats", async (req, res) => {
  const movies = await Movie.countDocuments();
  const users = await User.countDocuments();
  const views = await Watch.countDocuments();

  res.json({ movies, users, views });
});

/* ---------- ADMIN USERS ---------- */
app.get("/api/admin/users", async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.json(users);
});

app.put("/api/admin/users/:id/ban", async (req, res) => {
  await User.findByIdAndUpdate(req.params.id, {
    banned: req.body.banned
  });
  res.json({ success: true });
});

/* ================= HELPERS ================= */
function safeUnlink(filePath) {
  if (!filePath) return;
  const full = path.join(__dirname, filePath);
  if (fs.existsSync(full)) fs.unlinkSync(full);
}

/* ================= START ================= */
app.listen(PORT, () => {
  console.log(`🔥 Server running → http://localhost:${PORT}`);
});
