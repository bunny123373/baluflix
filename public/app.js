const grid = document.getElementById("grid");
const search = document.getElementById("search");
const language = document.getElementById("language");
const category = document.getElementById("category");

const modal = document.getElementById("playerModal");
const player = document.getElementById("player");
const closeBtn = document.getElementById("close");

const continueSection = document.getElementById("continueSection");
const continueRow = document.getElementById("continueRow");

let currentMovie = null;

/* ---------- LOAD MOVIES ---------- */
function load(){
  let url = "/videos?";
  if (search.value) url += "search=" + search.value + "&";
  if (language.value) url += "language=" + language.value + "&";
  if (category.value) url += "category=" + category.value;

  fetch(url).then(r=>r.json()).then(show);
}

/* ---------- SHOW GRID ---------- */
function show(list){
  grid.innerHTML = "";
  list.forEach(v=>{
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <div class="poster" style="background-image:url('/posters/${v.poster}')"></div>
      <div class="title">${v.title}</div>
    `;
    div.onclick = ()=>play(v);
    grid.appendChild(div);
  });
}

/* ---------- PLAY VIDEO ---------- */
function play(movie){
  currentMovie = movie;
  player.src = "/stream/" + movie.video;
  player.currentTime = localStorage.getItem(movie.id) || 0;
  modal.style.display = "block";
}

/* ---------- SAVE PROGRESS ---------- */
player.ontimeupdate = ()=>{
  if(currentMovie){
    localStorage.setItem(currentMovie.id, player.currentTime);
    localStorage.setItem("continue_"+currentMovie.id, JSON.stringify(currentMovie));
    loadContinue();
  }
};

closeBtn.onclick = ()=>{
  player.pause();
  modal.style.display = "none";
};

/* ---------- CONTINUE WATCHING ---------- */
function loadContinue(){
  continueRow.innerHTML = "";
  let found = false;

  Object.keys(localStorage).forEach(k=>{
    if(k.startsWith("continue_")){
      const m = JSON.parse(localStorage.getItem(k));
      found = true;
      const div = document.createElement("div");
      div.className = "card";
      div.innerHTML = `
        <div class="poster" style="background-image:url('/posters/${m.poster}')"></div>
        <div class="title">${m.title}</div>
      `;
      div.onclick = ()=>play(m);
      continueRow.appendChild(div);
    }
  });

  continueSection.style.display = found ? "block" : "none";
}

/* ---------- EVENTS ---------- */
search.oninput = load;
language.onchange = load;
category.onchange = load;

load();
loadContinue();
