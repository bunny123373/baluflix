// script.js - Admin Panel Logic

let allMovies = [];

document.addEventListener('DOMContentLoaded', () => {
    loadStats();
    loadMovies();
    setupUploadForm();
});

function loadStats() {
    fetch('/api/movies')
        .then(res => res.json())
        .then(movies => {
            const total = movies.length;
            const views = movies.reduce((sum, m) => sum + (m.views || 0), 0);
            const latest = movies.filter(m => m.isLatest).length;

            document.getElementById('stats-grid').innerHTML = `
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-film"></i></div>
                    <div class="stat-info"><h3>${total}</h3><p>Total Movies</p></div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-eye"></i></div>
                    <div class="stat-info"><h3>${views.toLocaleString()}</h3><p>Total Views</p></div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-star"></i></div>
                    <div class="stat-info"><h3>${latest}</h3><p>Latest Movies</p></div>
                </div>
            `;
        });
}

function loadMovies() {
    fetch('/api/movies')
        .then(res => res.json())
        .then(movies => {
            allMovies = movies;
            const tbody = document.getElementById('movie-list-body');
            tbody.innerHTML = '';
            movies.slice().reverse().forEach(movie => {
                tbody.innerHTML += `
                    <tr>
                        <td><img src="${movie.thumbnail}" class="movie-poster-sm" onerror="this.src='https://via.placeholder.com/60x90/111/fff?text=N/A'"></td>
                        <td>${movie.title}</td>
                        <td>${movie.language}</td>
                        <td>${movie.views || 0}</td>
                        <td class="action-btns">
                            <button class="edit-btn" onclick="openEditModal(${movie.id})" title="Edit"><i class="fas fa-edit"></i></button>
                            <button class="delete-btn" onclick="deleteMovie(${movie.id})" title="Delete"><i class="fas fa-trash"></i></button>
                        </td>
                    </tr>
                `;
            });
        });
}

function setupUploadForm() {
    document.getElementById('upload-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        // Show progress modal (you can build this UI)
        console.log("Uploading...");

        fetch('/api/upload', { method: 'POST', body: formData })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    alert('Movie uploaded successfully!');
                    e.target.reset();
                    loadStats();
                    loadMovies();
                } else {
                    alert('Upload failed!');
                }
            });
    });
}

function openEditModal(id) {
    const movie = allMovies.find(m => m.id === id);
    if (!movie) return;
    // Populate and show modal
    alert(`Edit movie: ${movie.title} (Modal UI needs to be built)`);
}

function deleteMovie(id) {
    if (confirm('Are you sure?')) {
        fetch(`/api/movies/${id}`, { method: 'DELETE' })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    alert('Movie deleted!');
                    loadStats();
                    loadMovies();
                }
            });
    }
}