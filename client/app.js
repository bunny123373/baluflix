// BaluFlix App JavaScript
const API_BASE = 'http://localhost:5000/api';

// DOM Elements
const hero = document.getElementById('hero');
const heroTitle = document.getElementById('hero-title');
const heroYear = document.getElementById('hero-year');
const heroCategory = document.getElementById('hero-category');
const heroDescription = document.getElementById('hero-description');
const playBtn = document.getElementById('play-btn');
const infoBtn = document.getElementById('info-btn');
const rowsContainer = document.getElementById('rows-container');
const loadingOverlay = document.getElementById('loading-overlay');

// Movie data
let allMovies = [];
let heroMovie = null;

// Initialize app
async function init() {
    try {
        await loadMovies();
        setupHero();
        setupRows(); 
        setupSearch();
        setupHeaderScroll();
    } catch (error) {
        console.error('Error initializing app:', error);
        showError('Failed to load content. Please try again later.');
    } finally {
        loadingOverlay.style.display = 'none';
    }
}

// Load movies from API
async function loadMovies() {
    const response = await fetch(`${API_BASE}/movies`);
    if (!response.ok) {
        throw new Error('Failed to fetch movies');
    }
    allMovies = await response.json();
}

// Setup hero section
function setupHero() {
    // Find hero movie (isHero: true) or latest movie
    heroMovie = allMovies.find(movie => movie.isHero) || allMovies[0];

    if (!heroMovie) {
        console.warn('No movies available');
        return;
    }

    // Set hero background
    hero.style.backgroundImage = `url(${API_BASE.replace('/api', '')}/${heroMovie.poster})`;

    // Set hero content
    heroTitle.textContent = heroMovie.title;
    heroYear.textContent = heroMovie.year;
    heroCategory.textContent = heroMovie.category;
    heroDescription.textContent = heroMovie.description || 'No description available.';

    // Setup play button
    playBtn.onclick = () => {
        window.location.href = `watch.html?video=${encodeURIComponent(heroMovie.video)}`;
    };

    // Setup info button to open movie modal
    infoBtn.onclick = () => {
        showMovieModal(heroMovie);
    };
}

// Setup movie rows
function setupRows() {
    // Get unique categories from movies
    const categories = [...new Set(allMovies.map(movie => movie.category))];

    // Create rows for each category
    categories.forEach(category => {
        const categoryMovies = allMovies.filter(movie => movie.category === category);
        if (categoryMovies.length > 0) {
            createRow(category, categoryMovies);
        }
    });
}

// Create movie row
function createRow(title, movies, isTop10 = false) {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'movie-row';

    const titleDiv = document.createElement('h2');
    titleDiv.className = 'row-title';
    titleDiv.textContent = title;
    rowDiv.appendChild(titleDiv);

    const containerDiv = document.createElement('div');
    containerDiv.className = 'row-container';

    movies.forEach((movie, index) => {
        const cardDiv = document.createElement('div');
        cardDiv.className = isTop10 ? 'movie-card top10-card' : 'movie-card';

        if (isTop10) {
            const numberDiv = document.createElement('div');
            numberDiv.className = 'top10-number';
            numberDiv.textContent = index + 1;
            cardDiv.appendChild(numberDiv);
        }

        const img = document.createElement('img');
        img.src = `${API_BASE.replace('/api', '')}/${movie.poster}`;
        img.alt = movie.title;
        img.loading = 'lazy';

        const infoDiv = document.createElement('div');
        infoDiv.className = 'movie-info';

        const movieTitle = document.createElement('h3');
        movieTitle.textContent = movie.title;

        const movieMeta = document.createElement('p');
        movieMeta.textContent = `${movie.year} • ${movie.category}`;

        infoDiv.appendChild(movieTitle);
        infoDiv.appendChild(movieMeta);

        cardDiv.appendChild(img);
        cardDiv.appendChild(infoDiv);

        // Click handler - open modal
        cardDiv.onclick = () => {
            showMovieModal(movie);
        };

        containerDiv.appendChild(cardDiv);
    });

    rowDiv.appendChild(containerDiv);
    rowsContainer.appendChild(rowDiv);
}

// Setup search functionality
function setupSearch() {
    const searchInput = document.querySelector('.search-input');
    const searchIcon = document.querySelector('.search-icon');

    searchIcon.onclick = () => {
        const searchContainer = document.querySelector('.search-container');
        searchContainer.classList.toggle('active');
        if (searchContainer.classList.contains('active')) {
            searchInput.focus();
        }
    };

    searchInput.oninput = () => {
        const query = searchInput.value.toLowerCase().trim();
        if (query.length > 0) {
            const filteredMovies = allMovies.filter(movie =>
                movie.title.toLowerCase().includes(query) ||
                movie.category.toLowerCase().includes(query) ||
                (movie.genre && movie.genre.some(g => g.toLowerCase().includes(query)))
            );
            showSearchResults(filteredMovies, query);
        } else {
            hideSearchResults();
        }
    };

    searchInput.onblur = () => {
        setTimeout(() => {
            hideSearchResults();
            document.querySelector('.search-container').classList.remove('active');
        }, 200);
    };
}

// Show search results
function showSearchResults(movies, query) {
    hideSearchResults();

    const searchResults = document.createElement('div');
    searchResults.className = 'search-results';
    searchResults.id = 'search-results';

    const title = document.createElement('h2');
    title.className = 'search-title';
    title.textContent = `Search results for "${query}"`;
    searchResults.appendChild(title);

    if (movies.length === 0) {
        const noResults = document.createElement('div');
        noResults.className = 'no-results';
        noResults.textContent = 'No movies found matching your search.';
        searchResults.appendChild(noResults);
    } else {
        const container = document.createElement('div');
        container.className = 'search-results-container';

        movies.forEach(movie => {
            const cardDiv = document.createElement('div');
            cardDiv.className = 'movie-card';

            const img = document.createElement('img');
            img.src = `${API_BASE.replace('/api', '')}/${movie.poster}`;
            img.alt = movie.title;
            img.loading = 'lazy';

            const infoDiv = document.createElement('div');
            infoDiv.className = 'movie-info';

            const movieTitle = document.createElement('h3');
            movieTitle.textContent = movie.title;

            const movieMeta = document.createElement('p');
            movieMeta.textContent = `${movie.year} • ${movie.category}`;

            infoDiv.appendChild(movieTitle);
            infoDiv.appendChild(movieMeta);

            cardDiv.appendChild(img);
            cardDiv.appendChild(infoDiv);

            cardDiv.onclick = () => {
                showMovieModal(movie);
            };

            container.appendChild(cardDiv);
        });

        searchResults.appendChild(container);
    }

    // Insert after hero
    hero.insertAdjacentElement('afterend', searchResults);
}

// Hide search results
function hideSearchResults() {
    const existing = document.getElementById('search-results');
    if (existing) {
        existing.remove();
    }
}

// Setup header scroll effect
function setupHeaderScroll() {
    const header = document.querySelector('.netflix-header');

    window.onscroll = () => {
        if (window.scrollY > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    };
}

// Show error message
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.9);
        color: #fff;
        padding: 20px;
        border-radius: 8px;
        text-align: center;
        z-index: 10000;
    `;
    errorDiv.innerHTML = `
        <h3>Error</h3>
        <p>${message}</p>
        <button onclick="location.reload()" style="margin-top: 10px; padding: 8px 16px; background: #e50914; color: white; border: none; border-radius: 4px; cursor: pointer;">Retry</button>
    `;
    document.body.appendChild(errorDiv);
}

// Show movie modal (Netflix-style)
function showMovieModal(movie) {
    // Create modal elements
    const modal = document.createElement('div');
    modal.className = 'movie-modal';
    modal.innerHTML = `
        <div class="modal-backdrop"></div>
        <div class="modal-content">
            <button class="modal-close">×</button>
            <div class="modal-banner">
                <img src="${API_BASE.replace('/api', '')}/${movie.poster}" alt="${movie.title}" class="modal-poster">
                <div class="modal-banner-overlay"></div>
                <div class="modal-play-overlay">
                    <button class="modal-play-btn">
                        <span class="play-icon">▶</span> Play
                    </button>
                    <button class="modal-add-btn">
                        <span class="add-icon">+</span> My List
                    </button>
                    <button class="modal-like-btn">
                        <span class="like-icon">👍</span> Like
                    </button>
                </div>
            </div>
            <div class="modal-details">
                <div class="modal-left">
                    <div class="modal-meta">
                        <span class="match-percent">98% Match</span>
                        <span class="release-year">${movie.year}</span>
                        <span class="hd-badge">HD</span>
                        <span class="age-rating">13+</span>
                    </div>
                    <div class="modal-tags">
                        <span class="tag">${movie.category}</span>
                    </div>
                    <p class="modal-description">${movie.description || 'No description available.'}</p>
                </div>
                <div class="modal-right">
                    <div class="modal-info-section">
                        <span class="info-label">Cast:</span>
                        <span class="info-value">Cast information not available</span>
                    </div>
                    <div class="modal-info-section">
                        <span class="info-label">Genres:</span>
                        <span class="info-value">${movie.genre ? movie.genre.join(', ') : movie.category}</span>
                    </div>
                    <div class="modal-info-section">
                        <span class="info-label">This movie is:</span>
                        <span class="info-value">Exciting, Action-packed</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Add modal to body
    document.body.appendChild(modal);

    // Add event listeners
    const closeBtn = modal.querySelector('.modal-close');
    const backdrop = modal.querySelector('.modal-backdrop');
    const playBtn = modal.querySelector('.modal-play-btn');

    closeBtn.onclick = () => modal.remove();
    backdrop.onclick = () => modal.remove();

    playBtn.onclick = () => {
        window.location.href = `watch.html?video=${encodeURIComponent(movie.video)}`;
    };

    // Show modal with animation
    setTimeout(() => modal.classList.add('active'), 10);
}

// Logout functionality
document.getElementById('logout-btn').addEventListener('click', logout);

async function logout() {
    try {
        // Clear local storage
        localStorage.removeItem('userId');

        // If using Firebase auth, sign out here
        // For now, just redirect to login
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Error during logout:', error);
        // Fallback: redirect anyway
        window.location.href = 'login.html';
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
