// Netflix-style Watchlist Page for BaluFlix
import { auth } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";

const API_BASE = 'http://localhost:5000/api';
const mainContent = document.getElementById('main-content');
const loadingOverlay = document.getElementById('loadingOverlay');
const searchInput = document.getElementById('searchInput');
const searchIcon = document.getElementById('searchIcon');
const searchContainer = document.querySelector('.search-container');

// Authentication state management
let currentUser = null;

// Global watchlist data
let watchlistMovies = [];

// Show loading initially
loadingOverlay.style.display = 'flex';

// Firebase auth state listener
onAuthStateChanged(auth, (user) => {
  currentUser = user;
  if (user) {
    // User is signed in, load watchlist
    loadingOverlay.style.display = 'none';
    loadWatchlist();
  } else {
    // User is signed out, redirect to login page
    loadingOverlay.style.display = 'none';
    window.location.href = 'login.html';
  }
});

// Logout function
window.logout = async () => {
  try {
    await signOut(auth);
    window.location.reload();
  } catch (error) {
    console.error('Error signing out:', error);
  }
};

// Fetch and render watchlist
async function loadWatchlist() {
  try {
    const response = await fetch(`${API_BASE}/watchlist/${currentUser.uid}`);
    const watchlistData = await response.json();

    // Extract movies from watchlist data
    watchlistMovies = watchlistData.map(item => item.movieId);

    // Render watchlist
    renderWatchlist(watchlistMovies);

    // Initialize search functionality
    initializeSearch();

  } catch (error) {
    console.error('Error loading watchlist:', error);
    mainContent.innerHTML = '<p>Error loading watchlist. Please try again later.</p>';
  }
}

// Render watchlist
function renderWatchlist(movies) {
  if (movies.length === 0) {
    mainContent.innerHTML = `
      <section class="empty-watchlist">
        <div class="empty-content">
          <h1>Your Watchlist is Empty</h1>
          <p>Add movies and TV shows to your watchlist to keep track of what you want to watch.</p>
          <a href="index.html" class="browse-btn">Browse Movies</a>
        </div>
      </section>
    `;
    return;
  }

  const watchlistHTML = `
    <section class="watchlist-section">
      <h1 class="watchlist-title">My Watchlist</h1>
      <div class="watchlist-container">
        ${movies.map(movie => `
          <div class="movie-card watchlist-card" onclick="handleMovieClick('${movie._id}', '${encodeURIComponent(movie.video)}')">
            <div class="watchlist-remove" onclick="removeFromWatchlist('${movie._id}', event)">
              ✕
            </div>
            <img src="${API_BASE.replace('/api', '')}/${movie.poster}" alt="${movie.title}" loading="lazy">
            <div class="movie-info">
              <h3>${movie.title}</h3>
              <p>${movie.year || ''}</p>
            </div>
          </div>
        `).join('')}
      </div>
    </section>
  `;

  mainContent.innerHTML = watchlistHTML;
}

// Remove from watchlist
async function removeFromWatchlist(movieId, event) {
  event.stopPropagation(); // Prevent movie click

  try {
    const response = await fetch(`${API_BASE}/watchlist/${currentUser.uid}/${movieId}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      // Reload watchlist
      loadWatchlist();
    } else {
      alert('Error removing from watchlist');
    }
  } catch (error) {
    console.error('Error removing from watchlist:', error);
    alert('Error removing from watchlist');
  }
}

// Play movie function
function playMovie(videoUrl) {
  try {
    if (!videoUrl) {
      console.error('No video URL provided');
      alert('Movie video not available');
      return;
    }

    const decodedUrl = decodeURIComponent(videoUrl);
    if (!decodedUrl || decodedUrl.trim() === '') {
      console.error('Invalid video URL');
      alert('Movie video not available');
      return;
    }

    console.log('Playing movie:', decodedUrl);
    window.location.href = `watch.html?video=${encodeURIComponent(decodedUrl)}`;
  } catch (error) {
    console.error('Error playing movie:', error);
    alert('Error loading movie. Please try again.');
  }
}

// Handle movie click
function handleMovieClick(movieId, videoUrl) {
  playMovie(videoUrl);
}

// Initialize search functionality
function initializeSearch() {
  // Add event listener for real-time search
  searchInput.addEventListener('input', handleSearch);

  // Add event listener for search icon click
  searchIcon.addEventListener('click', toggleSearch);

  // Add event listener to close search when clicking outside
  document.addEventListener('click', (e) => {
    if (!searchContainer.contains(e.target)) {
      searchContainer.classList.remove('active');
    }
  });
}

// Toggle search bar visibility
function toggleSearch() {
  searchContainer.classList.toggle('active');
  if (searchContainer.classList.contains('active')) {
    searchInput.focus();
  }
}

// Handle search functionality
function handleSearch() {
  const query = searchInput.value.trim().toLowerCase();

  if (query === '') {
    // If search is empty, show all watchlist movies
    renderWatchlist(watchlistMovies);
  } else {
    // Filter watchlist movies based on search query
    const filteredMovies = watchlistMovies.filter(movie =>
      movie.title && movie.title.toLowerCase().includes(query)
    );
    renderWatchlist(filteredMovies);
  }
}

// Expose functions to global scope for onclick handlers
window.playMovie = playMovie;
window.handleMovieClick = handleMovieClick;
window.removeFromWatchlist = removeFromWatchlist;
