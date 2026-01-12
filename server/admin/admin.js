 const API_BASE = 'http://localhost:5000/api';

// DOM Elements
const stats = {
    movies: document.getElementById('total-movies'),
    users: document.getElementById('total-users'),
    views: document.getElementById('total-views')
};

const sections = {
    dashboard: document.getElementById('dashboard-section'),
    movies: document.getElementById('movies-section'),
    popular: document.getElementById('popular-section'),
    users: document.getElementById('users-section'),
    upload: document.getElementById('upload-section'),
    settings: document.getElementById('settings-section')
};

const moviesGrid = document.getElementById('movies-grid');
const usersList = document.getElementById('users-list');
const uploadForm = document.getElementById('upload-form');
const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-form');
const previewModal = document.getElementById('preview-modal');

// Search and Filter Elements
const movieSearch = document.getElementById('movie-search');
const genreFilter = document.getElementById('genre-filter');
const yearFilter = document.getElementById('year-filter');
const ratingFilter = document.getElementById('rating-filter');
const clearFiltersBtn = document.getElementById('clear-filters');
const moviesCount = document.getElementById('movies-count');

// Global variables for movies data and current filters
let allMovies = [];
let currentFilters = {
    search: '',
    genre: '',
    year: '',
    rating: ''
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    setupScrollAnimations();
});

function initializeApp() {
    // Load saved theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        const icon = themeToggle.querySelector('i');
        icon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    // Load initial data
    loadStats();
    loadMovies();
    loadDashboardData();

    // Set default active section
    showSection('dashboard');
}



// Load Stats
async function loadStats() {
    try {
        const response = await fetch(`${API_BASE}/admin/stats`);
        const data = await response.json();
        stats.movies.textContent = data.movies;
        stats.users.textContent = data.users;
        stats.views.textContent = data.views;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load Movies
async function loadMovies() {
    try {
        const response = await fetch(`${API_BASE}/movies`);
        const movies = await response.json();
        allMovies = movies; // Store all movies globally
        populateFilters(movies); // Populate filter dropdowns
        applyFilters(); // Apply current filters and display
    } catch (error) {
        console.error('Error loading movies:', error);
    }
}

// Display Movies
function displayMovies(movies) {
    moviesGrid.innerHTML = '';

    if (movies.length === 0) {
        moviesGrid.innerHTML = '<p>No movies found.</p>';
        return;
    }

    movies.forEach(movie => {
        const movieCard = document.createElement('div');
        movieCard.className = 'movie-card';
        movieCard.innerHTML = `
            <img src="${API_BASE.replace('/api', '')}/${movie.poster}" alt="${movie.title}" onerror="this.src='https://via.placeholder.com/200x300?text=No+Image'">
            <div class="movie-info">
                <h3>${movie.title}</h3>
                <p>${movie.year || 'N/A'} • ${movie.category}</p>
                <div class="movie-badges">
                    ${movie.trending ? '<span class="badge trending">Trending</span>' : ''}
                    ${movie.isHero ? '<span class="badge hero">Hero</span>' : ''}
                </div>
                <div class="movie-actions">
                    <button onclick="editMovie('${movie._id}')" class="btn-edit">Edit</button>
                    <button onclick="deleteMovie('${movie._id}')" class="btn-delete">Delete</button>
                </div>
            </div>
        `;
        moviesGrid.appendChild(movieCard);
    });
}

// Load Users
async function loadUsers() {
    try {
        const response = await fetch(`${API_BASE}/admin/users`);
        const users = await response.json();
        displayUsers(users);
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

// Display Users
function displayUsers(users) {
    usersList.innerHTML = '';

    if (users.length === 0) {
        usersList.innerHTML = '<p>No users found.</p>';
        return;
    }

    users.forEach(user => {
        const userItem = document.createElement('div');
        userItem.className = 'user-item';
        userItem.innerHTML = `
            <div class="user-info">
                <h4>${user.email}</h4>
                <p>UID: ${user.uid}</p>
                <p>Joined: ${new Date(user.createdAt).toLocaleDateString()}</p>
            </div>
            <div class="user-actions">
                <button onclick="toggleBan('${user._id}', ${user.banned})" class="btn-${user.banned ? 'unban' : 'ban'}">
                    ${user.banned ? 'Unban' : 'Ban'}
                </button>
            </div>
        `;
        usersList.appendChild(userItem);
    });
}

// Upload Movie
uploadForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('title', document.getElementById('title').value);
    formData.append('year', document.getElementById('year').value);
    formData.append('category', document.getElementById('category').value);
    formData.append('description', document.getElementById('description').value);
    formData.append('cast', document.getElementById('cast').value);
    formData.append('crew', document.getElementById('crew').value);
    formData.append('rating', document.getElementById('rating').value);
    formData.append('duration', document.getElementById('duration').value);
    formData.append('genre', document.getElementById('genre').value);
    formData.append('director', document.getElementById('director').value);
    formData.append('releaseDate', document.getElementById('releaseDate').value);
    formData.append('language', document.getElementById('language').value);
    formData.append('poster', document.getElementById('poster').files[0]);
    formData.append('video', document.getElementById('video').files[0]);
    formData.append('trending', document.getElementById('trending').checked);
    formData.append('isHero', document.getElementById('isHero').checked);

    // Show progress bar
    const progressContainer = document.getElementById('upload-progress');
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    progressContainer.style.display = 'block';
    progressFill.style.width = '0%';
    progressText.textContent = 'Uploading... 0%';

    // Disable submit button
    const submitBtn = uploadForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Uploading...';

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100;
            progressFill.style.width = percentComplete + '%';
            progressText.textContent = `Uploading... ${Math.round(percentComplete)}%`;
        }
    });

    xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
            alert('Movie uploaded successfully!');
            uploadForm.reset();
            progressContainer.style.display = 'none';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Upload Movie';
            loadMovies();
            loadStats();
        } else {
            try {
                const error = JSON.parse(xhr.responseText);
                alert('Upload failed: ' + error.error);
            } catch {
                // Upload failed - error already logged above
            }
            progressContainer.style.display = 'none';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Upload Movie';
        }
    });

    xhr.addEventListener('error', () => {
        // Upload failed due to network error
        progressContainer.style.display = 'none';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Upload Movie';
    });

    xhr.open('POST', `${API_BASE}/upload`);
    xhr.send(formData);
});

// Edit Movie
function editMovie(movieId) {
    // Find movie data from the already loaded movies
    const movie = allMovies.find(m => m._id === movieId);
    if (movie) {
        // Populate all form fields
        document.getElementById('edit-movie-id').value = movie._id;
        document.getElementById('edit-title').value = movie.title || '';
        document.getElementById('edit-year').value = movie.year || '';
        document.getElementById('edit-category').value = movie.category || 'movie';
        document.getElementById('edit-genre').value = movie.genre ? movie.genre.join(', ') : '';
        document.getElementById('edit-director').value = movie.director || '';
        document.getElementById('edit-rating').value = movie.rating || '';
        document.getElementById('edit-duration').value = movie.duration || '';
        document.getElementById('edit-language').value = movie.language || '';
        document.getElementById('edit-releaseDate').value = movie.releaseDate ? new Date(movie.releaseDate).toISOString().split('T')[0] : '';
        document.getElementById('edit-description').value = movie.description || '';
        document.getElementById('edit-cast').value = movie.cast ? movie.cast.join(', ') : '';
        document.getElementById('edit-crew').value = movie.crew ? movie.crew.join(', ') : '';
        document.getElementById('edit-trending').checked = movie.trending || false;
        document.getElementById('edit-isHero').checked = movie.isHero || false;

        // Show modal
        editModal.style.display = 'block';
    } else {
        console.error('Movie not found:', movieId);
        alert('Movie not found. Please refresh the page and try again.');
    }
}

// Close Modal
function closeModal() {
    editModal.style.display = 'none';
}

// Edit Form Submit
editForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const movieId = document.getElementById('edit-movie-id').value;
    const formData = new FormData();

    // Add all form fields
    formData.append('title', document.getElementById('edit-title').value);
    formData.append('year', document.getElementById('edit-year').value);
    formData.append('category', document.getElementById('edit-category').value);
    formData.append('genre', document.getElementById('edit-genre').value);
    formData.append('director', document.getElementById('edit-director').value);
    formData.append('rating', document.getElementById('edit-rating').value);
    formData.append('duration', document.getElementById('edit-duration').value);
    formData.append('language', document.getElementById('edit-language').value);
    formData.append('releaseDate', document.getElementById('edit-releaseDate').value);
    formData.append('description', document.getElementById('edit-description').value);
    formData.append('cast', document.getElementById('edit-cast').value);
    formData.append('crew', document.getElementById('edit-crew').value);
    formData.append('trending', document.getElementById('edit-trending').checked);
    formData.append('isHero', document.getElementById('edit-isHero').checked);

    // Add files if selected
    const posterFile = document.getElementById('edit-poster').files[0];
    const videoFile = document.getElementById('edit-video').files[0];
    if (posterFile) formData.append('poster', posterFile);
    if (videoFile) formData.append('video', videoFile);

    try {
        const response = await fetch(`${API_BASE}/movie/${movieId}`, {
            method: 'PUT',
            body: formData
        });

        if (response.ok) {
            alert('Movie updated successfully!');
            closeModal();
            loadMovies();
            loadStats();
        } else {
            const error = await response.json();
            alert('Update failed: ' + error.error);
        }
    } catch (error) {
        console.error('Update error:', error);
        // Update failed - error logged to console
    }
});

// Delete Movie
async function deleteMovie(movieId) {
    if (!confirm('Are you sure you want to delete this movie?')) return;

    try {
        const response = await fetch(`${API_BASE}/movie/${movieId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            alert('Movie deleted successfully!');
            loadMovies();
            loadStats();
        } else {
            // Delete failed - response not ok
        }
    } catch (error) {
        console.error('Delete error:', error);
        // Delete failed - error logged to console
    }
}

// Toggle Ban User
async function toggleBan(userId, currentlyBanned) {
    try {
        const response = await fetch(`${API_BASE}/admin/users/${userId}/ban`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ banned: !currentlyBanned })
        });

        if (response.ok) {
            alert(`User ${currentlyBanned ? 'unbanned' : 'banned'} successfully!`);
            loadUsers();
        } else {
            alert('Action failed. Please try again.');
        }
    } catch (error) {
        console.error('Ban toggle error:', error);
        alert('Action failed. Please try again.');
    }
}

// Populate Filter Dropdowns
function populateFilters(movies) {
    // Populate genre filter
    const genres = new Set();
    const years = new Set();

    movies.forEach(movie => {
        if (movie.genre && Array.isArray(movie.genre)) {
            movie.genre.forEach(g => genres.add(g.trim()));
        }
        if (movie.year) {
            years.add(movie.year.toString());
        }
    });

    // Clear existing options except "All"
    genreFilter.innerHTML = '<option value="">All Genres</option>';
    yearFilter.innerHTML = '<option value="">All Years</option>';

    // Add genre options
    Array.from(genres).sort().forEach(genre => {
        const option = document.createElement('option');
        option.value = genre;
        option.textContent = genre;
        genreFilter.appendChild(option);
    });

    // Add year options
    Array.from(years).sort((a, b) => b - a).forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearFilter.appendChild(option);
    });
}

// Apply Filters and Search
function applyFilters() {
    const filteredMovies = filterMovies(allMovies, currentFilters);
    displayMovies(filteredMovies);
    moviesCount.textContent = filteredMovies.length;
}

// Filter Movies Function
function filterMovies(movies, filters) {
    return movies.filter(movie => {
        // Search filter
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            const searchableText = [
                movie.title,
                movie.director,
                movie.description,
                ...(movie.cast || []),
                ...(movie.genre || []),
                ...(movie.crew || [])
            ].join(' ').toLowerCase();

            if (!searchableText.includes(searchTerm)) {
                return false;
            }
        }

        // Genre filter
        if (filters.genre) {
            if (!movie.genre || !movie.genre.some(g => g.toLowerCase().includes(filters.genre.toLowerCase()))) {
                return false;
            }
        }

        // Year filter
        if (filters.year && movie.year != filters.year) {
            return false;
        }

        // Rating filter
        if (filters.rating && movie.rating !== filters.rating) {
            return false;
        }

        return true;
    });
}

// Clear All Filters
function clearFilters() {
    currentFilters = {
        search: '',
        genre: '',
        year: '',
        rating: ''
    };

    movieSearch.value = '';
    genreFilter.value = '';
    yearFilter.value = '';
    ratingFilter.value = '';

    applyFilters();
}

// Setup Event Listeners
function setupEventListeners() {
    // Sidebar navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = e.currentTarget.getAttribute('data-section');
            showSection(section);
        });
    });

    // Sidebar toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleSidebar);
    }

    // Mobile menu toggle
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', toggleMobileMenu);
    }

    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    // Search input event listener
    if (movieSearch) {
        movieSearch.addEventListener('input', (e) => {
            currentFilters.search = e.target.value.trim();
            applyFilters();
        });
    }

    // Filter dropdown event listeners
    if (genreFilter) {
        genreFilter.addEventListener('change', (e) => {
            currentFilters.genre = e.target.value;
            applyFilters();
        });
    }

    if (yearFilter) {
        yearFilter.addEventListener('change', (e) => {
            currentFilters.year = e.target.value;
            applyFilters();
        });
    }

    if (ratingFilter) {
        ratingFilter.addEventListener('change', (e) => {
            currentFilters.rating = e.target.value;
            applyFilters();
        });
    }

    // Clear filters button
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', clearFilters);
    }

    // Preview button
    const previewBtn = document.getElementById('preview-btn');
    if (previewBtn) {
        previewBtn.addEventListener('click', showPreview);
    }

    // Close modal when clicking outside
    window.onclick = function(event) {
        if (event.target === editModal) {
            closeModal();
        }
        if (event.target === previewModal) {
            closePreviewModal();
        }
    };
}

// Navigation
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });

    // Remove active class from nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });

    // Show selected section
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    // Add active class to clicked nav link
    const activeLink = document.querySelector(`[data-section="${sectionName}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }

    // Update page title
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) {
        pageTitle.textContent = sectionName.charAt(0).toUpperCase() + sectionName.slice(1);
    }

    // Load data for section
    if (sectionName === 'movies') loadMovies();
    if (sectionName === 'users') loadUsers();
    if (sectionName === 'dashboard') loadDashboardData();
    if (sectionName === 'popular') loadPopularData();
    if (sectionName === 'settings') loadSettingsData();
}

// Sidebar Functions
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');

    if (sidebar && mainContent) {
        sidebar.classList.toggle('collapsed');
        mainContent.classList.toggle('sidebar-collapsed');
    }
}

function toggleMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('mobile-open');
    }
}

// Theme Toggle with Animation
function toggleTheme() {
    const currentTheme = document.body.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';

    // Add transition class for smooth animation
    document.body.setAttribute('data-theme-transition', '');
    document.body.setAttribute('data-theme', newTheme);

    // Update icon with animation
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        const icon = themeToggle.querySelector('i');
        icon.style.transform = 'scale(0.8) rotate(180deg)';
        icon.style.opacity = '0';

        setTimeout(() => {
            icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            icon.style.transform = 'scale(1) rotate(0deg)';
            icon.style.opacity = '1';
        }, 150);
    }

    // Save to localStorage
    localStorage.setItem('theme', newTheme);

    // Remove transition class after animation
    setTimeout(() => {
        document.body.removeAttribute('data-theme-transition');
    }, 300);
}

// Logout Function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        // Clear any stored session data
        localStorage.removeItem('adminToken');
        // Redirect to login page
        window.location.href = '/admin/login.html';
    }
}

// Load Dashboard Data
async function loadDashboardData() {
    try {
        // Load recent activity
        const activityResponse = await fetch(`${API_BASE}/admin/activity`);
        if (activityResponse.ok) {
            const activities = await activityResponse.json();
            displayRecentActivity(activities);
        }

        // Load category stats
        const categoryResponse = await fetch(`${API_BASE}/admin/categories`);
        if (categoryResponse.ok) {
            const categories = await categoryResponse.json();
            displayCategoryStats(categories);
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// Display Recent Activity
function displayRecentActivity(activities) {
    const activityList = document.getElementById('recent-activity');
    if (!activityList) return;

    activityList.innerHTML = '';

    if (!activities || activities.length === 0) {
        activityList.innerHTML = '<p>No recent activity</p>';
        return;
    }

    activities.slice(0, 5).forEach(activity => {
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        activityItem.innerHTML = `
            <div class="activity-icon">
                <i class="fas fa-${activity.type === 'upload' ? 'upload' : activity.type === 'edit' ? 'edit' : 'user'}"></i>
            </div>
            <div class="activity-content">
                <p>${activity.description}</p>
                <span class="activity-time">${new Date(activity.timestamp).toLocaleString()}</span>
            </div>
        `;
        activityList.appendChild(activityItem);
    });
}

// Display Category Stats
function displayCategoryStats(categories) {
    const categoryStats = document.getElementById('category-stats');
    if (!categoryStats) return;

    categoryStats.innerHTML = '';

    if (!categories || categories.length === 0) {
        categoryStats.innerHTML = '<p>No category data available</p>';
        return;
    }

    categories.forEach(category => {
        const categoryItem = document.createElement('div');
        categoryItem.className = 'category-item';
        categoryItem.innerHTML = `
            <span class="category-name">${category.name}</span>
            <span class="category-count">${category.count}</span>
            <div class="category-bar">
                <div class="category-fill" style="width: ${category.percentage}%"></div>
            </div>
        `;
        categoryStats.appendChild(categoryItem);
    });
}

// Load Popular Data
async function loadPopularData() {
    try {
        // Load trending movies
        const trendingResponse = await fetch(`${API_BASE}/movies/trending`);
        if (trendingResponse.ok) {
            const trendingMovies = await trendingResponse.json();
            displayPopularMovies('trending-movies', trendingMovies);
        }

        // Load top rated movies
        const topRatedResponse = await fetch(`${API_BASE}/movies/top-rated`);
        if (topRatedResponse.ok) {
            const topRatedMovies = await topRatedResponse.json();
            displayPopularMovies('top-rated-movies', topRatedMovies);
        }

        // Load most viewed movies
        const mostViewedResponse = await fetch(`${API_BASE}/movies/most-viewed`);
        if (mostViewedResponse.ok) {
            const mostViewedMovies = await mostViewedResponse.json();
            displayPopularMovies('most-viewed-movies', mostViewedMovies);
        }

        // Load recent hits
        const recentHitsResponse = await fetch(`${API_BASE}/movies/recent-hits`);
        if (recentHitsResponse.ok) {
            const recentHits = await recentHitsResponse.json();
            displayPopularMovies('recent-hits', recentHits);
        }
    } catch (error) {
        console.error('Error loading popular data:', error);
    }
}

// Display Popular Movies
function displayPopularMovies(containerId, movies) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';

    if (!movies || movies.length === 0) {
        container.innerHTML = '<p>No movies available</p>';
        return;
    }

    movies.slice(0, 5).forEach(movie => {
        const movieItem = document.createElement('div');
        movieItem.className = 'popular-movie-item';
        movieItem.innerHTML = `
            <img src="${API_BASE.replace('/api', '')}/${movie.poster}" alt="${movie.title}" onerror="this.src='https://via.placeholder.com/60x90?text=No+Image'">
            <div class="popular-movie-info">
                <h4>${movie.title}</h4>
                <p>${movie.year || 'N/A'} • ${movie.category}</p>
                <div class="popular-movie-stats">
                    ${containerId === 'trending-movies' ? `<span class="stat"><i class="fas fa-fire"></i> Trending</span>` : ''}
                    ${containerId === 'top-rated-movies' ? `<span class="stat"><i class="fas fa-star"></i> ${movie.rating || 'N/A'}</span>` : ''}
                    ${containerId === 'most-viewed-movies' ? `<span class="stat"><i class="fas fa-eye"></i> ${movie.views || 0} views</span>` : ''}
                    ${containerId === 'recent-hits' ? `<span class="stat"><i class="fas fa-calendar"></i> ${new Date(movie.releaseDate).toLocaleDateString()}</span>` : ''}
                </div>
            </div>
        `;
        container.appendChild(movieItem);
    });
}

// Load Settings Data
async function loadSettingsData() {
    try {
        // Load current settings
        const settingsResponse = await fetch(`${API_BASE}/admin/settings`);
        if (settingsResponse.ok) {
            const settings = await settingsResponse.json();
            populateSettingsForm(settings);
        }

        // Load database stats
        const dbStatsResponse = await fetch(`${API_BASE}/admin/db-stats`);
        if (dbStatsResponse.ok) {
            const dbStats = await dbStatsResponse.json();
            updateDatabaseStats(dbStats);
        }
    } catch (error) {
        console.error('Error loading settings data:', error);
    }
}

// Populate Settings Form
function populateSettingsForm(settings) {
    // General settings
    document.getElementById('site-title').value = settings.siteTitle || 'BaluFlix';
    document.getElementById('site-description').value = settings.siteDescription || 'Your ultimate streaming destination';
    document.getElementById('max-upload-size').value = settings.maxUploadSize || 500;
    document.getElementById('maintenance-mode').checked = settings.maintenanceMode || false;

    // Security settings
    document.getElementById('enable-registration').checked = settings.enableRegistration !== false;
    document.getElementById('require-email-verification').checked = settings.requireEmailVerification || false;
    document.getElementById('session-timeout').value = settings.sessionTimeout || 1440;
    document.getElementById('max-login-attempts').value = settings.maxLoginAttempts || 5;

    // Analytics settings
    document.getElementById('enable-analytics').checked = settings.enableAnalytics !== false;
    document.getElementById('track-user-behavior').checked = settings.trackUserBehavior !== false;
    document.getElementById('analytics-retention').value = settings.analyticsRetention || 365;
}

// Update Database Stats
function updateDatabaseStats(stats) {
    document.getElementById('db-size').textContent = stats.size || 'Calculating...';
    document.getElementById('last-backup').textContent = stats.lastBackup ? new Date(stats.lastBackup).toLocaleDateString() : 'Never';
}

// Settings Form Handlers
document.addEventListener('DOMContentLoaded', () => {
    // General settings form
    const generalSettingsForm = document.getElementById('general-settings');
    if (generalSettingsForm) {
        generalSettingsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await saveGeneralSettings();
        });
    }

    // Security settings form
    const securitySettingsForm = document.getElementById('security-settings');
    if (securitySettingsForm) {
        securitySettingsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await saveSecuritySettings();
        });
    }

    // Analytics settings form
    const analyticsSettingsForm = document.getElementById('analytics-settings');
    if (analyticsSettingsForm) {
        analyticsSettingsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await saveAnalyticsSettings();
        });
    }

    // Database actions
    const backupDbBtn = document.getElementById('backup-db');
    if (backupDbBtn) {
        backupDbBtn.addEventListener('click', createDatabaseBackup);
    }

    const optimizeDbBtn = document.getElementById('optimize-db');
    if (optimizeDbBtn) {
        optimizeDbBtn.addEventListener('click', optimizeDatabase);
    }

    const clearCacheBtn = document.getElementById('clear-cache');
    if (clearCacheBtn) {
        clearCacheBtn.addEventListener('click', clearCache);
    }

    // Popular actions
    const refreshPopularBtn = document.getElementById('refresh-popular');
    if (refreshPopularBtn) {
        refreshPopularBtn.addEventListener('click', refreshPopularRankings);
    }
});

// Save General Settings
async function saveGeneralSettings() {
    const settings = {
        siteTitle: document.getElementById('site-title').value,
        siteDescription: document.getElementById('site-description').value,
        maxUploadSize: parseInt(document.getElementById('max-upload-size').value),
        maintenanceMode: document.getElementById('maintenance-mode').checked
    };

    try {
        const response = await fetch(`${API_BASE}/admin/settings/general`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings)
        });

        if (response.ok) {
            alert('General settings saved successfully!');
        } else {
            alert('Failed to save general settings.');
        }
    } catch (error) {
        console.error('Error saving general settings:', error);
        alert('Error saving general settings.');
    }
}

// Save Security Settings
async function saveSecuritySettings() {
    const settings = {
        enableRegistration: document.getElementById('enable-registration').checked,
        requireEmailVerification: document.getElementById('require-email-verification').checked,
        sessionTimeout: parseInt(document.getElementById('session-timeout').value),
        maxLoginAttempts: parseInt(document.getElementById('max-login-attempts').value)
    };

    try {
        const response = await fetch(`${API_BASE}/admin/settings/security`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings)
        });

        if (response.ok) {
            alert('Security settings saved successfully!');
        } else {
            alert('Failed to save security settings.');
        }
    } catch (error) {
        console.error('Error saving security settings:', error);
        alert('Error saving security settings.');
    }
}

// Save Analytics Settings
async function saveAnalyticsSettings() {
    const settings = {
        enableAnalytics: document.getElementById('enable-analytics').checked,
        trackUserBehavior: document.getElementById('track-user-behavior').checked,
        analyticsRetention: parseInt(document.getElementById('analytics-retention').value)
    };

    try {
        const response = await fetch(`${API_BASE}/admin/settings/analytics`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings)
        });

        if (response.ok) {
            alert('Analytics settings saved successfully!');
        } else {
            alert('Failed to save analytics settings.');
        }
    } catch (error) {
        console.error('Error saving analytics settings:', error);
        alert('Error saving analytics settings.');
    }
}

// Database Actions
async function createDatabaseBackup() {
    if (!confirm('Are you sure you want to create a database backup?')) return;

    try {
        const response = await fetch(`${API_BASE}/admin/database/backup`, {
            method: 'POST'
        });

        if (response.ok) {
            alert('Database backup created successfully!');
            loadSettingsData(); // Refresh stats
        } else {
            alert('Failed to create database backup.');
        }
    } catch (error) {
        console.error('Error creating backup:', error);
        alert('Error creating database backup.');
    }
}

async function optimizeDatabase() {
    if (!confirm('Are you sure you want to optimize the database?')) return;

    try {
        const response = await fetch(`${API_BASE}/admin/database/optimize`, {
            method: 'POST'
        });

        if (response.ok) {
            alert('Database optimized successfully!');
        } else {
            alert('Failed to optimize database.');
        }
    } catch (error) {
        console.error('Error optimizing database:', error);
        alert('Error optimizing database.');
    }
}

async function clearCache() {
    if (!confirm('Are you sure you want to clear the cache?')) return;

    try {
        const response = await fetch(`${API_BASE}/admin/cache/clear`, {
            method: 'POST'
        });

        if (response.ok) {
            alert('Cache cleared successfully!');
        } else {
            alert('Failed to clear cache.');
        }
    } catch (error) {
        console.error('Error clearing cache:', error);
        alert('Error clearing cache.');
    }
}

// Refresh Popular Rankings
async function refreshPopularRankings() {
    try {
        const response = await fetch(`${API_BASE}/admin/popular/refresh`, {
            method: 'POST'
        });

        if (response.ok) {
            alert('Popular rankings refreshed successfully!');
            loadPopularData(); // Refresh the data
        } else {
            alert('Failed to refresh popular rankings.');
        }
    } catch (error) {
        console.error('Error refreshing popular rankings:', error);
        alert('Error refreshing popular rankings.');
    }
}

// Scroll Animations
function setupScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);

    // Observe all animate-on-scroll elements
    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        observer.observe(el);
    });
}

// Preview Functions
function showPreview() {
    // Add click animation to the button
    const previewBtn = document.getElementById('preview-btn');
    const icon = previewBtn.querySelector('i');
    icon.style.transform = 'scale(0.8) rotate(360deg)';
    icon.style.opacity = '0.7';

    setTimeout(() => {
        icon.style.transform = 'scale(1) rotate(0deg)';
        icon.style.opacity = '1';
    }, 300);

    // Get form data
    const title = document.getElementById('title').value || 'No title provided';
    const year = document.getElementById('year').value || 'N/A';
    const category = document.getElementById('category').value || 'movie';
    const description = document.getElementById('description').value || 'No description provided';
    const cast = document.getElementById('cast').value || 'No cast information';
    const crew = document.getElementById('crew').value || 'No crew information';
    const rating = document.getElementById('rating').value || 'N/A';
    const duration = document.getElementById('duration').value || 'N/A';
    const genre = document.getElementById('genre').value || 'No genre specified';
    const director = document.getElementById('director').value || 'No director specified';
    const releaseDate = document.getElementById('releaseDate').value || 'N/A';
    const language = document.getElementById('language').value || 'N/A';
    const trending = document.getElementById('trending').checked;
    const isHero = document.getElementById('isHero').checked;

    // Get poster preview
    const posterFile = document.getElementById('poster').files[0];
    const posterPreview = posterFile ? URL.createObjectURL(posterFile) : 'https://via.placeholder.com/200x300?text=No+Image';

    // Populate preview modal
    document.getElementById('preview-title').textContent = title;
    document.getElementById('preview-year').textContent = year;
    document.getElementById('preview-category').textContent = category;
    document.getElementById('preview-description').textContent = description;
    document.getElementById('preview-cast').textContent = cast;
    document.getElementById('preview-crew').textContent = crew;
    document.getElementById('preview-rating').textContent = rating;
    document.getElementById('preview-duration').textContent = duration;
    document.getElementById('preview-genre').textContent = genre;
    document.getElementById('preview-director').textContent = director;
    document.getElementById('preview-releaseDate').textContent = releaseDate;
    document.getElementById('preview-language').textContent = language;
    document.getElementById('preview-trending').textContent = trending ? 'Yes' : 'No';
    document.getElementById('preview-isHero').textContent = isHero ? 'Yes' : 'No';
    document.getElementById('preview-poster').src = posterPreview;

    // Show modal
    previewModal.style.display = 'block';
}

function closePreviewModal() {
    previewModal.style.display = 'none';
    // Clean up object URL to prevent memory leaks
    const posterImg = document.getElementById('preview-poster');
    if (posterImg.src.startsWith('blob:')) {
        URL.revokeObjectURL(posterImg.src);
    }
}
