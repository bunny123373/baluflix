const grid = document.getElementById("grid");
const modal = document.getElementById("playerModal");
const player = document.getElementById("player");
const closeBtn = document.getElementById("close");

const searchInput = document.getElementById("search");
const langSelect = document.getElementById("lang");
const catSelect = document.getElementById("cat");

let allMovies = [];
let currentMovie = null;

/* =========================
   LOAD MOVIES
   ========================= */
function loadMovies(){
  fetch("/videos")
    .then(r => r.json())
    .then(data=>{
      allMovies = data;
      renderMovies(allMovies);
      renderContinueWatching();
    })
    .catch(()=>{
      grid.innerHTML = "<p>Cannot get videos</p>";
    });
}

/* =========================
   RENDER MOVIES GRID
   ========================= */
function renderMovies(list){
  grid.innerHTML = "";

  if(list.length === 0){
    grid.innerHTML = "<p>No movies found</p>";
    return;
  }

  list.forEach(movie=>{
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <div class="poster" style="background-image:url('${movie.posterUrl}')"></div>
      <div class="title">${movie.title}</div>
    `;

    card.onclick = ()=>{
      playMovie(movie);
    };

    grid.appendChild(card);
  });
}

/* =========================
   SEARCH + FILTER
   ========================= */
function applyFilters(){
  const q = searchInput.value.toLowerCase();
  const lang = langSelect.value;
  const cat = catSelect.value;

  const filtered = allMovies.filter(m=>{
    return (
      m.title.toLowerCase().includes(q) &&
      (!lang || m.language === lang) &&
      (!cat || m.category === cat)
    );
  });

  renderMovies(filtered);
}

searchInput.oninput = applyFilters;
langSelect.onchange = applyFilters;
catSelect.onchange = applyFilters;

/* =========================
   VIDEO PLAYER + RESUME
   ========================= */
function playMovie(movie){
  currentMovie = movie;
  player.src = movie.videoUrl;

  const savedTime = localStorage.getItem("watch_" + movie.id);
  if(savedTime){
    player.currentTime = Number(savedTime);
  }

  modal.style.display = "flex";
  player.play();
}

player.ontimeupdate = ()=>{
  if(currentMovie){
    localStorage.setItem(
      "watch_" + currentMovie.id,
      Math.floor(player.currentTime)
    );
  }
};

/* =========================
   CONTINUE WATCHING
   ========================= */
function renderContinueWatching(){
  const watched = allMovies.filter(m =>
    localStorage.getItem("watch_" + m.id)
  );

  if(watched.length === 0) return;

  const row = document.createElement("div");
  row.innerHTML = `<h3 style="margin:20px">Continue Watching</h3>`;
  row.className = "grid";

  watched.forEach(movie=>{
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="poster" style="background-image:url('${movie.posterUrl}')"></div>
      <div class="title">${movie.title}</div>
    `;
    card.onclick = ()=> playMovie(movie);
    row.appendChild(card);
  });

  document.body.insertBefore(row, grid);
}

/* =========================
   CLOSE MODAL
   ========================= */
closeBtn.onclick = ()=>{
  player.pause();
  modal.style.display = "none";
};

loadMovies();
