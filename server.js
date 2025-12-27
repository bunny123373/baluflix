const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

const MOVIES_FILE = path.join(__dirname, "movies.json");
if (!fs.existsSync(MOVIES_FILE)) fs.writeFileSync(MOVIES_FILE, JSON.stringify([], null, 2));

function readMovies() {
  const raw = fs.readFileSync(MOVIES_FILE, "utf-8");
  const movies = JSON.parse(raw || "[]");
  return movies.map((m) => ({
    views: 0,
    language: "",
    ...m,
    views: Number.isFinite(m.views) ? m.views : 0,
    language: m.language || "",
  }));
}

function writeMovies(movies) {
  fs.writeFileSync(MOVIES_FILE, JSON.stringify(movies, null, 2));
}

// Multer config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === "poster") {
      cb(null, path.join(__dirname, "public/uploads/posters"));
    } else if (file.fieldname === "movieFile") {
      cb(null, path.join(__dirname, "public/uploads"));
    } else {
      cb(null, path.join(__dirname, "public/uploads"));
    }
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + "-" + file.fieldname + ext);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 1024 * 1024 * 1024 * 5, // 5GB max
  },
});

// Public APIs
app.get("/api/movies", (req, res) => {
  res.json(readMovies());
});

app.get("/api/movies/:id", (req, res) => {
  const movies = readMovies();
  const movie = movies.find((m) => m.id === req.params.id);
  if (!movie) return res.status(404).json({ error: "Movie not found" });
  res.json(movie);
});

app.post("/api/movies/:id/view", (req, res) => {
  const movies = readMovies();
  const idx = movies.findIndex((m) => m.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Movie not found" });

  movies[idx].views = (movies[idx].views || 0) + 1;
  writeMovies(movies);
  res.json({ success: true, views: movies[idx].views });
});

// Admin APIs (NO LOGIN REQUIRED)
app.get("/api/admin/stats", (req, res) => {
  const movies = readMovies();
  const totalViews = movies.reduce((sum, m) => sum + (m.views || 0), 0);
  res.json({
    totalMovies: movies.length,
    totalViews,
    movies,
  });
});

app.post(
  "/api/movies",
  upload.fields([
    { name: "poster", maxCount: 1 },
    { name: "movieFile", maxCount: 1 },
  ]),
  (req, res) => {
    try {
      const { title, description, year, category, language } = req.body || {};

      if (!title || !req.files?.movieFile?.[0]) {
        return res.status(400).json({ error: "Title and movie file are required" });
      }

      const movies = readMovies();
      const id = "m" + Date.now();

      const posterPath = req.files?.poster?.[0]
        ? "/uploads/posters/" + req.files.poster[0].filename
        : null;

      const moviePath = "/uploads/" + req.files.movieFile[0].filename;

      const newMovie = {
        id,
        title: String(title),
        description: description ? String(description) : "",
        year: year ? String(year) : "",
        category: category ? String(category) : "",
        language: language ? String(language) : "",
        poster: posterPath,
        src: moviePath,
        views: 0,
        createdAt: new Date().toISOString(),
      };

      movies.push(newMovie);
      writeMovies(movies);

      res.json(newMovie);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

app.put("/api/movies/:id", (req, res) => {
  const movies = readMovies();
  const idx = movies.findIndex((m) => m.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Movie not found" });

  const allowed = ["title", "description", "year", "category", "language"];
  for (const k of allowed) {
    if (typeof req.body?.[k] === "string") movies[idx][k] = req.body[k];
  }
  writeMovies(movies);
  res.json(movies[idx]);
});

app.delete("/api/movies/:id", (req, res) => {
  const movies = readMovies();
  const movie = movies.find((m) => m.id === req.params.id);
  if (!movie) return res.status(404).json({ error: "Movie not found" });

  if (movie.poster) {
    const posterFile = path.join(__dirname, "public", movie.poster);
    if (fs.existsSync(posterFile)) fs.unlinkSync(posterFile);
  }
  if (movie.src) {
    const videoFile = path.join(__dirname, "public", movie.src);
    if (fs.existsSync(videoFile)) fs.unlinkSync(videoFile);
  }

  writeMovies(movies.filter((m) => m.id !== req.params.id));
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Baluflix running at http://localhost:${PORT}`);
});
// Admin Users Database
const ADMIN_USERS = [
    {
        id: "u1",
        username: "baluflix",
        password: "Balujeswanth25", // Your specified password
        role: "admin"
    }
];

// Login Endpoint
app.post("/api/login", (req, res) => {
    const { username, password } = req.body;

    // Validate credentials
    const user = ADMIN_USERS.find(u => u.username === username && u.password === password);

    if (!user) {
        return res.status(401).json({ error: "Invalid username or password" });
    }

    // Generate token (simple version)
    const token = require('crypto').randomBytes(16).toString('hex');

    // Store token with expiration (1 hour)
    const tokenExpiry = new Date();
    tokenExpiry.setHours(tokenExpiry.getHours() + 1);

    // In a real app, you'd store this in a database
    // For demo, we'll just send it back
    res.json({
        token: token,
        user: {
            id: user.id,
            username: user.username,
            role: user.role
        },
        expiresAt: tokenExpiry
    });
});

// Middleware to verify token
function requireAdmin(req, res, next) {
    const token = req.headers['x-admin-token'];

    if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
    }

    // In a real app, you'd verify the token against your database
    // For demo, we'll just check if it exists
    next();
}
// Example for movies route
app.get("/api/movies", requireAdmin, (req, res) => {
    // Your existing code
});

// Example for upload route
app.post("/api/movies", requireAdmin, upload.fields([
    { name: "poster", maxCount: 1 },
    { name: "movieFile", maxCount: 1 }
]), (req, res) => {
    // Your existing upload code
});
