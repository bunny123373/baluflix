const grid = document.getElementById("grid");
const modal = document.getElementById("playerModal");
const player = document.getElementById("player");
const closeBtn = document.getElementById("close");

function loadMovies(){
  fetch("/videos")
    .then(r => r.json())
    .then(renderMovies)
    .catch(()=>{
      grid.innerHTML = "<p>Cannot get videos</p>";
    });
}

function renderMovies(list){
  grid.innerHTML = "";

  if(list.length === 0){
    grid.innerHTML = "<p>No movies uploaded</p>";
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
      player.src = movie.videoUrl;
      modal.style.display = "flex";
      player.play();
    };

    grid.appendChild(card);
  });
}

closeBtn.onclick = ()=>{
  player.pause();
  modal.style.display = "none";
};

loadMovies();
