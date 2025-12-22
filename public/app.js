const grid = document.getElementById("grid");
const modal = document.getElementById("videoModal");
const player = document.getElementById("videoPlayer");
const closeBtn = document.getElementById("videoClose");

function loadMovies(){
  fetch("/videos")
    .then(r=>r.json())
    .then(render)
    .catch(()=>{
      grid.innerHTML = "<p>Cannot get videos</p>";
    });
}

function render(list){
  grid.innerHTML = "";

  list.forEach(m=>{
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <div class="poster" style="background-image:url('${m.posterUrl}')"></div>
      <div class="play-overlay">
        <div class="play-btn" data-video="${m.videoUrl}">▶</div>
      </div>
    `;

    card.querySelector(".play-btn").onclick = ()=>{
      playVideo(m.videoUrl);
    };

    grid.appendChild(card);
  });
}

function playVideo(url){
  player.src = url;
  modal.style.display = "flex";
  player.play();
}

/* Close popup */
closeBtn.onclick = ()=>{
  player.pause();
  player.src = "";
  modal.style.display = "none";
};

loadMovies();
