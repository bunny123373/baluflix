const grid = document.getElementById("grid");

function loadMovies(){
  fetch("/videos")
    .then(r => r.json())
    .then(render)
    .catch(()=>{
      grid.innerHTML = "<p>Cannot get videos</p>";
    });
}

function render(list){
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
      location.href = "movie.html?id=" + movie.id;
    };

    grid.appendChild(card);
  });
}

loadMovies();
