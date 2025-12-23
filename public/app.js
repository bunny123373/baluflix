const arrows=document.querySelectorAll(".arrow");
const movieLists=document.querySelectorAll(".movie-list");

arrows.forEach((arrow,i)=>{
  const itemNumber=movieLists[i].querySelectorAll("img").length;
  let clickCounter=0;
  arrow.addEventListener("click",()=>{
    const ratio=Math.floor(window.innerWidth/270);
    clickCounter++;
    if(itemNumber-(4+clickCounter)+(4-ratio)>=0){
      movieLists[i].style.transform=`translateX(${movieLists[i].computedStyleMap().get("transform")[0].x.value-300}px)`;
    }else{
      movieLists[i].style.transform="translateX(0)";
      clickCounter=0;
    }
  });
});

// THEME TOGGLE
const ball=document.querySelector(".toggle-ball");
const items=document.querySelectorAll(".container,.movie-list-title,.navbar-container,.sidebar,.left-menu-icon,.toggle");
ball.addEventListener("click",()=>{
  items.forEach(item=>item.classList.toggle("active"));
  ball.classList.toggle("active");
});

// VIDEO POPUP
const videoModal=document.createElement("div");
videoModal.innerHTML=`<span id="videoClose">✖</span><video id="videoPlayer" controls></video>`;
document.body.appendChild(videoModal);

videoModal.style.cssText="display:none;position:fixed;inset:0;background:rgba(0,0,0,.9);z-index:9999;justify-content:center;align-items:center";
const videoPlayer=videoModal.querySelector("#videoPlayer");
videoPlayer.style.cssText="width:85%;max-height:85%";
const videoClose=videoModal.querySelector("#videoClose");
videoClose.style.cssText="position:absolute;top:20px;right:30px;font-size:26px;color:#fff;cursor:pointer";

document.querySelectorAll(".movie-list-item").forEach(item=>{
  const img=item.querySelector(".movie-list-item-img");
  const overlay=document.createElement("div");
  overlay.className="play-overlay";
  overlay.innerHTML=`<div class="play-btn">▶</div>`;
  item.appendChild(overlay);

  overlay.onclick=()=>{
    const url=img.getAttribute("data-video");
    if(!url){alert("Video URL not found");return}
    videoPlayer.src=url;
    videoModal.style.display="flex";
    videoPlayer.play();
  };
});

videoClose.onclick=()=>{
  videoPlayer.pause();
  videoPlayer.src="";
  videoModal.style.display="none";
};
