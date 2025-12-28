const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static("public"));

if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");
if (!fs.existsSync("videos.json")) fs.writeFileSync("videos.json", "[]");

/* ---------- Upload config ---------- */
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (_, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

/* ---------- ADMIN UPLOAD (hidden URL) ---------- */
app.post("/admin/upload", upload.single("video"), (req, res) => {
  const db = JSON.parse(fs.readFileSync("videos.json"));
  db.push({
    id: Date.now(),
    title: req.body.title,
    language: req.body.language,
    file: req.file.filename
  });
  fs.writeFileSync("videos.json", JSON.stringify(db, null, 2));
  res.json({ success: true });
});

/* ---------- LIST VIDEOS ---------- */
app.get("/api/videos", (req, res) => {
  res.json(JSON.parse(fs.readFileSync("videos.json")));
});

/* ---------- STREAM VIDEO ---------- */
app.get("/stream/:file", (req, res) => {
  const videoPath = path.join(__dirname, "uploads", req.params.file);
  const stat = fs.statSync(videoPath);
  const range = req.headers.range;
  
  if (range) {
    const [start, end] = range.replace(/bytes=/, "").split("-");
    const s = parseInt(start);
    const e = end ? parseInt(end) : stat.size - 1;
    
    res.writeHead(206, {
      "Content-Range": `bytes ${s}-${e}/${stat.size}`,
      "Accept-Ranges": "bytes",
      "Content-Length": e - s + 1,
      "Content-Type": "video/mp4"
    });
    
    fs.createReadStream(videoPath, { start: s, end: e }).pipe(res);
  } else {
    res.writeHead(200, {
      "Content-Length": stat.size,
      "Content-Type": "video/mp4"
    });
    fs.createReadStream(videoPath).pipe(res);
  }
});

/* ---------- DOWNLOAD ---------- */
app.get("/download/:file", (req, res) => {
  res.download(path.join(__dirname, "uploads", req.params.file));
});

app.listen(PORT, () =>
  console.log("BALUFLIX running on http://localhost:" + PORT)
);

const usersFile = "users.json";
if (!fs.existsSync(usersFile)) fs.writeFileSync(usersFile, "[]");

app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  const users = JSON.parse(fs.readFileSync(usersFile));
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ error: "Invalid" });
  res.json({ success: true, profile: user.profile });
});