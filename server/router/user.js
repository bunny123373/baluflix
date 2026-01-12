import express from 'express';
import User from '../models/User.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Configure multer for photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/profile-photos';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, req.params.uid + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Login/Register user (for Google auth)
router.post('/login', async (req, res) => {
  try {
    const { uid, email } = req.body;

    if (!uid || !email) {
      return res.status(400).json({ error: 'UID and email are required' });
    }

    // Check if user exists
    let user = await User.findOne({ uid });

    if (!user) {
      // Create new user
      user = new User({
        uid,
        email,
        displayName: email.split('@')[0], // Use email prefix as display name
        profileLevel: 'basic'
      });
      await user.save();
    }

    res.json({ message: 'Login successful', user });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user profile
router.get('/profile/:uid', async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.params.uid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
router.put('/profile/:uid', async (req, res) => {
  try {
    const { displayName, photoURL } = req.body;
    const user = await User.findOneAndUpdate(
      { uid: req.params.uid },
      { displayName, photoURL, updatedAt: new Date() },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upgrade user profile
router.post('/upgrade/:uid', async (req, res) => {
  try {
    const { newLevel, duration } = req.body; // duration in months

    if (!['premium', 'vip'].includes(newLevel)) {
      return res.status(400).json({ error: 'Invalid profile level' });
    }

    const subscriptionEndDate = new Date();
    subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + duration);

    const user = await User.findOneAndUpdate(
      { uid: req.params.uid },
      {
        profileLevel: newLevel,
        subscriptionEndDate,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'Profile upgraded successfully',
      user: {
        uid: user.uid,
        profileLevel: user.profileLevel,
        subscriptionEndDate: user.subscriptionEndDate
      }
    });
  } catch (error) {
    console.error('Error upgrading user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Downgrade user profile
router.post('/downgrade/:uid', async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { uid: req.params.uid },
      {
        profileLevel: 'basic',
        subscriptionEndDate: null,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'Profile downgraded successfully',
      user: {
        uid: user.uid,
        profileLevel: user.profileLevel,
        subscriptionEndDate: user.subscriptionEndDate
      }
    });
  } catch (error) {
    console.error('Error downgrading user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add to watchlist
router.post('/watchlist/:uid', async (req, res) => {
  try {
    const { movieId } = req.body;
    const user = await User.findOneAndUpdate(
      { uid: req.params.uid },
      { $addToSet: { watchlist: movieId }, updatedAt: new Date() },
      { new: true }
    ).populate('watchlist');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user.watchlist);
  } catch (error) {
    console.error('Error adding to watchlist:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove from watchlist
router.delete('/watchlist/:uid/:movieId', async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { uid: req.params.uid },
      { $pull: { watchlist: req.params.movieId }, updatedAt: new Date() },
      { new: true }
    ).populate('watchlist');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user.watchlist);
  } catch (error) {
    console.error('Error removing from watchlist:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get watchlist
router.get('/watchlist/:uid', async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.params.uid }).populate('watchlist');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user.watchlist);
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload profile photo
router.post('/profile/:uid/photo', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Delete old photo if exists
    const user = await User.findOne({ uid: req.params.uid });
    if (user && user.photoURL) {
      const oldPhotoPath = path.join('uploads/profile-photos', path.basename(user.photoURL));
      if (fs.existsSync(oldPhotoPath)) {
        fs.unlinkSync(oldPhotoPath);
      }
    }

    const photoURL = `/uploads/profile-photos/${req.file.filename}`;

    const updatedUser = await User.findOneAndUpdate(
      { uid: req.params.uid },
      { photoURL, updatedAt: new Date() },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'Photo uploaded successfully', user: updatedUser });
  } catch (error) {
    console.error('Error uploading photo:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove profile photo
router.delete('/profile/:uid/photo', async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.params.uid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete photo file if exists
    if (user.photoURL) {
      const photoPath = path.join('uploads/profile-photos', path.basename(user.photoURL));
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
    }

    const updatedUser = await User.findOneAndUpdate(
      { uid: req.params.uid },
      { photoURL: null, updatedAt: new Date() },
      { new: true }
    );

    res.json({ message: 'Photo removed successfully', user: updatedUser });
  } catch (error) {
    console.error('Error removing photo:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
