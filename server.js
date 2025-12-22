const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const app = express();
const PORT = 3000;

const ADMIN_USER = "admin";
const ADMIN_PASS = "12345";
const ADMIN_KEY = "BALU_SECRET_123";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/posters", express.static("uploads/posters"));
app.use(express.static("public"));

/* ---------- ADMIN LOGIN ---------- */
app.post("/admin/login", (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    return res.json({ ok: true });
  }
  res.status(401).json({ ok: false });
});

/* ---------- MULTER SETUP ---------- */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "poster") {
      cb(null, "uploads/posters");
    } else {
      cb(null, "uploads/videos");
    }
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

/* ---------- ADMIN UPLOAD ---------- */
app.post(
  "/upload",
  upload.fields([{ name: "video" }, { name: "poster" }]),
  (req, res) => {
    if (req.query.key !== ADMIN_KEY) {
      return res.status(403).send("Access Denied");
    }

    const dbPath = "./db/videos.json";
    const videos = JSON.parse(fs.readFileSync(dbPath));

    const movie = {
      id: Date.now(),
      title: req.body.title,
      language: req.body.language,
      year: req.body.year,
      category: req.body.category,
      video: req.files.video[0].filename,
      poster: req.files.poster[0].filename,
      createdAt: new Date()
    };

    videos.push(movie);
    fs.writeFileSync(dbPath, JSON.stringify(videos, null, 2));

    res.send("Movie uploaded successfully");
  }
);

/* ---------- LIST + SEARCH ---------- */
app.get("/videos", (req, res) => {
  const { language, category, search } = req.query;
  let videos = JSON.parse(fs.readFileSync("./db/videos.json"));

  if (language) {
    videos = videos.filter(v => v.language === language);
  }
  if (category) {
    videos = videos.filter(v => v.category === category);
  }
  if (search) {
    videos = videos.filter(v =>
      v.title.toLowerCase().includes(search.toLowerCase())
    );
  }

  res.json(videos);
});

/* ---------- STREAM ---------- */
app.get("/stream/:name", (req, res) => {
  const videoPath = path.join(__dirname, "uploads/videos", req.params.name);
  if (!fs.existsSync(videoPath)) return res.sendStatus(404);

  const stat = fs.statSync(videoPath);
  const range = req.headers.range;
  if (!range) return res.status(400).send("Range required");

  const parts = range.replace(/bytes=/, "").split("-");
  const start = parseInt(parts[0]);
  const end = parts[1] ? parseInt(parts[1]) : stat.size - 1;

  const stream = fs.createReadStream(videoPath, { start, end });
  res.writeHead(206, {
    "Content-Range": `bytes ${start}-${end}/${stat.size}`,
    "Accept-Ranges": "bytes",
    "Content-Length": end - start + 1,
    "Content-Type": "video/mp4"
  });
  stream.pipe(res);
});

app.listen(PORT, () =>
  console.log("Server running http://localhost:" + PORT)
);
