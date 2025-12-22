const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =========================
// STATIC FILES
// =========================
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// =========================
// HOME PAGE
// =========================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// =========================
// VIDEOS LIST API  ✅ (FIX FOR "cannot get videos")
// =========================
app.get("/videos", (req, res) => {
  const dbPath = path.join(__dirname, "db", "videos.json");

  if (!fs.existsSync(dbPath)) {
    return res.json([]);
  }

  try {
    const data = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
    res.json(data);
  } catch (err) {
    res.json([]);
  }
});

// =========================
// ADMIN LOGIN API
// =========================
app.post("/admin/login", (req, res) => {
  const { username, password } = req.body;

  if (username === "admin" && password === "12345") {
    return res.json({ ok: true });
  }
  res.status(401).json({ ok: false });
});

// =========================
// UPLOAD (LOCAL DEMO ONLY – Render lo slow/issue)
// =========================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir =
      file.fieldname === "poster"
        ? "uploads/posters"
        : "uploads/videos";
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

app.post(
  "/upload",
  upload.fields([{ name: "poster" }, { name: "video" }]),
  (req, res) => {

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
      poster: req.files.poster[0].filename,
      video: req.files.video[0].filename
    };

    videos.push(movie);
    fs.writeFileSync(dbPath, JSON.stringify(videos, null, 2));

    res.send("Upload OK");
  }
);

// =========================
// HEALTH CHECK
// =========================
app.get("/health", (req, res) => {
  res.send("OK");
});

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
