/* =========================
   CONFIG
========================= */
const API = "https://baluflix-backend.onrender.com"; 
// Local testing kosam:
// const API = "http://localhost:5000";

const movieList = document.getElementById("movie-list");
const searchInput = document.getElementById("search-input");
const searchForm = document.getElementById("search-form");

let allMovies = [];

/* =========================
   FETCH MOVIES
========================= */
fetch(API + "/movies")
  .then(res => res.json())
  .then(data => {
    allMovies = data;
    renderMovies(allMovies);
  })
  .catch(err => {
    movieList.innerHTML =
      "<p style='color:#aaa'>Backend not reachable</p>";
  });

/* =========================
   RENDER MOVIES (HORIZONTAL ROW)
========================= */
function renderMovies(list) {
  movieList.innerHTML = "";

  if (!list || list.length === 0) {
    movieList.innerHTML =
      "<p style='color:#888'>No movies available</p>";
    return;
  }

  list.forEach(movie => {
    const card = document.createElement("div");
    card.className = "movie-card";

    card.innerHTML = `
      <img src="${API}/${movie.poster}" alt="${movie.title}">
      <div class="movie-info">
        <div class="movie-title">${movie.title}</div>
        <div class="movie-meta">${movie.category || "Movie"}</div>
      </div>
    `;

    card.onclick = () => {
      window.location.href =
        "watch.html?path=" + encodeURIComponent(movie.video);
    };

    movieList.appendChild(card);
  });
}

/* =========================
   SEARCH LOGIC
========================= */
searchForm.addEventListener("submit", e => {
  e.preventDefault();
  doSearch();
});

searchInput.addEventListener("input", doSearch);

function doSearch() {
  const q = searchInput.value.toLowerCase().trim();

  if (!q) {
    renderMovies(allMovies);
    return;
  }

  const filtered = allMovies.filter(m =>
    m.title.toLowerCase().includes(q)
  );

  renderMovies(filtered);
}

/* =========================
   OPTIONAL: AUTO REFRESH
   (admin upload chesina 1 min lo reflect)
========================= */
setInterval(() => {
  fetch(API + "/movies")
    .then(res => res.json())
    .then(data => {
      allMovies = data;
      renderMovies(allMovies);
    });
}, 60000);
