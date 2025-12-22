const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

/* =========================
   MIDDLEWARE
   ========================= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

/* =========================
   HOME PAGE
   ========================= */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* =========================
   GET VIDEOS (FOR HOME PAGE)
   ========================= */
app.get("/videos", (req, res) => {
  const dbPath = path.join(__dirname, "db", "videos.json");

  if (!fs.existsSync(dbPath)) {
    return res.json([]);
  }

  try {
    const videos = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
    res.json(videos);
  } catch (err) {
    res.json([]);
  }
});

/* =========================
   SAVE VIDEO DATA (CLOUDINARY)
   ========================= */
app.post("/videos/save", (req, res) => {
  const dbPath = path.join(__dirname, "db", "videos.json");

  let videos = [];
  if (fs.existsSync(dbPath)) {
    try {
      videos = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
    } catch {
      videos = [];
    }
  }

  const movie = {
    id: Date.now(),
    title: req.body.title,
    language: req.body.language,
    year: req.body.year,
    category: req.body.category,
    posterUrl: req.body.posterUrl,
    videoUrl: req.body.videoUrl,
    createdAt: new Date().toISOString()
  };

  videos.push(movie);
  fs.writeFileSync(dbPath, JSON.stringify(videos, null, 2));

  res.json({ ok: true });
});

/* =========================
   HEALTH CHECK
   ========================= */
app.get("/health", (req, res) => {
  res.send("OK");
});

/* =========================
   START SERVER
   ========================= */
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
