const grid = document.getElementById("grid");
const playModal = document.getElementById("playModal");
const playVideo = document.getElementById("playVideo");
const playClose = document.getElementById("playClose");

function loadMovies(){
  fetch("/videos")
    .then(r=>r.json())
    .then(render);
}

function render(list){
  grid.innerHTML = "";

  list.forEach(m=>{
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <div class="poster" style="background-image:url('${m.posterUrl}')"></div>

      <div class="overlay">
        <button onclick="playMovie('${m.videoUrl}')">▶ Play</button>
        <button onclick='showInfo(${JSON.stringify(m)})'>ℹ Info</button>
      </div>

      <div class="title">${m.title}</div>
    `;

    grid.appendChild(card);
  });
}

function playMovie(url){
  playVideo.src = url;
  playModal.style.display = "flex";
  playVideo.play();
}

playClose.onclick = ()=>{
  playVideo.pause();
  playModal.style.display = "none";
};

function showInfo(m){
  alert(
    `${m.title}\n\nYear: ${m.year}\nLanguage: ${m.language}\nCategory: ${m.category}`
  );
}

loadMovies();
