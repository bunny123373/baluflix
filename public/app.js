const grid = document.getElementById("grid");
const modal = document.getElementById("playerModal");
const player = document.getElementById("player");
const closeBtn = document.getElementById("close");

function loadMovies(){
  fetch("/videos")
    .then(r => r.json())
    .then(showMovies)
    .catch(()=> {
      grid.innerHTML = "<p style='color:white'>Cannot get videos</p>";
    });
}

function showMovies(list){
  grid.innerHTML = "";

  if(list.length === 0){
    grid.innerHTML = "<p style='color:white'>No movies uploaded</p>";
    return;
  }

  list.forEach(m => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <div class="poster" style="background-image:url('${m.posterUrl}')"></div>
      <div class="title">${m.title}</div>
    `;

    card.onclick = () => playMovie(m.videoUrl);
    grid.appendChild(card);
  });
}

function playMovie(url){
  player.src = url;
  modal.style.display = "block";
  player.play();
}

closeBtn.onclick = () => {
  player.pause();
  modal.style.display = "none";
};

loadMovies();
