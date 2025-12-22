const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/admin/login", (req, res) => {
  const { username, password } = req.body;
  if (username === "admin" && password === "12345") {
    return res.json({ ok: true });
  }
  res.status(401).json({ ok: false });
});

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
    res.send("Upload OK");
  }
);

app.get("/health", (req, res) => {
  res.send("OK");
});

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
