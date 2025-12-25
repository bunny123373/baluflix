const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const port = 3000;

const app = express();
app.use(express.static('public'));
app.use(express.json());

// Ensure folders exist
const uploadDir = path.join(__dirname, 'public/uploads');
const posterDir = path.join(uploadDir, 'posters');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
if (!fs.existsSync(posterDir)) fs.mkdirSync(posterDir);

const dataFile = path.join(__dirname, 'movies.json');
if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, JSON.stringify([], null, 2));
}

// Multer Config (Video + Poster)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === 'poster') cb(null, posterDir);
        else cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 500 * 1024 * 1024 } // 500MB
}).fields([
    { name: 'video', maxCount: 1 },
    { name: 'poster', maxCount: 1 }
]);

// ---------- ROUTES ----------

// Get all movies
app.get('/api/movies', (req, res) => {
    const movies = JSON.parse(fs.readFileSync(dataFile));
    res.json(movies);
});

// Increment view count
app.post('/api/movies/:id/view', (req, res) => {
    let movies = JSON.parse(fs.readFileSync(dataFile));
    const movieId = parseInt(req.params.id);
    const movie = movies.find(m => m.id === movieId);
    
    if (movie) {
        movie.views = (movie.views || 0) + 1;
        fs.writeFileSync(dataFile, JSON.stringify(movies, null, 2));
        res.json({ success: true, views: movie.views });
    } else {
        res.status(404).json({ success: false });
    }
});

// Upload Movie (Admin)
app.post('/api/upload', upload, (req, res) => {
    // Check video uploaded
    if (!req.files.video) return res.status(400).send('No video uploaded!');

    const videoFile = req.files.video[0];
    const posterFile = req.files.poster ? req.files.poster[0] : null;

    const newMovie = {
        id: Date.now(),
        title: req.body.title,
        description: req.body.description,
        videoUrl: `uploads/${videoFile.filename}`,
        thumbnail: posterFile 
            ? `uploads/posters/${posterFile.filename}` 
            : req.body.thumbnail || "https://via.placeholder.com/300x450",
        language: req.body.language || "Telugu",
        isLatest: req.body.isLatest === 'on',
        isTrending: req.body.isTrending === 'on',
        views: 0 // Initialize views
    };

    const movies = JSON.parse(fs.readFileSync(dataFile));
    movies.push(newMovie);
    fs.writeFileSync(dataFile, JSON.stringify(movies, null, 2));
    res.redirect('/admin.html');
});

// Delete Movie
app.delete('/api/movies/:id', (req, res) => {
    let movies = JSON.parse(fs.readFileSync(dataFile));
    const id = parseInt(req.params.id);
    const movie = movies.find(m => m.id === id);

    if (movie) {
        // Delete files
        if (movie.videoUrl.startsWith('uploads/')) {
            const videoPath = path.join(__dirname, 'public', movie.videoUrl);
            if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
        }
        if (movie.thumbnail.startsWith('uploads/posters/')) {
            const posterPath = path.join(__dirname, 'public', movie.thumbnail);
            if (fs.existsSync(posterPath)) fs.unlinkSync(posterPath);
        }

        movies = movies.filter(m => m.id !== id);
        fs.writeFileSync(dataFile, JSON.stringify(movies, null, 2));
        res.json({ success: true });
    } else {
        res.status(404).json({ success: false });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
