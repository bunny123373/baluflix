'use strict';

let allMovies = [];
let currentTab = 'all';

const grid = document.getElementById('grid');
const q = document.getElementById('q');
const hdr = document.getElementById('hdr');

window.addEventListener('scroll', () => {
  if (window.scrollY > 80) hdr.classList.add('scrolled');
  else hdr.classList.remove('scrolled');
});

function scrollToMovies() {
  document.getElementById('movies').scrollIntoView({ behavior: 'smooth' });
}

function setActiveButtons(tab) {
  document.querySelectorAll('.tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.navlink').forEach(a => a.classList.toggle('active', a.dataset.tab === tab));
}

function setTab(tab) {
  currentTab = tab;
  setActiveButtons(tab);
  render();
  scrollToMovies();
}

function applyFilter(list) {
  let out = [...list];

  if (currentTab === 'latest') out = out.filter(m => m.isLatest === true);
  if (currentTab === 'trending') out = out.filter(m => m.isTrending === true);
  if (currentTab === 'telugu') out = out.filter(m => (m.language || '').toLowerCase() === 'telugu');

  const term = (q.value || '').trim().toLowerCase();
  if (term) out = out.filter(m => (m.title || '').toLowerCase().includes(term));

  return out;
}

function safePoster(movie) {
  const t = encodeURIComponent(movie.title || 'IBOMMA');
  return (movie.thumbnail && String(movie.thumbnail).trim()) || `https://via.placeholder.com/300x450/111/fff?text=${t}`;
}

function absoluteVideoUrl(videoUrl) {
  if (!videoUrl) return '';
  const s = String(videoUrl);
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  return '/' + s.replace(/^\/+/, '');
}

function render() {
  const list = applyFilter(allMovies);

  if (!list.length) {
    grid.innerHTML = `<div class="empty" style="grid-column:1/-1;">No movies found.</div>`;
    return;
  }

  grid.innerHTML = '';
  for (const m of list) {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <img class="poster" src="${safePoster(m)}" alt="${(m.title || '').replace(/"/g, '')}"
           onerror="this.src='https://via.placeholder.com/300x450/111/fff?text=IBOMMA'">
      <div class="overlay">
        <div class="playBubble"><i class="fa-solid fa-play"></i></div>
      </div>
      <div class="info">
        <div class="title">${m.title || 'Untitled'}</div>
        <div class="meta">
          <span>${m.language || 'Telugu'}</span>
          <span><i class="fa-solid fa-eye"></i> ${m.views || 0}</span>
        </div>
      </div>
    `;
    card.addEventListener('click', () => openModal(m));
    grid.appendChild(card);
  }
}

async function fetchMovies() {
  const res = await fetch('/api/movies');
  const movies = await res.json();
  allMovies = Array.isArray(movies) ? movies : [];
  render();
}

q.addEventListener('input', () => render());

const modal = document.getElementById('modal');
const player = document.getElementById('player');
const mtitle = document.getElementById('mtitle');
const mdesc = document.getElementById('mdesc');

function modalOutside(e) {
  if (e.target === modal) closeModal();
}

function closeModal() {
  modal.classList.remove('active');
  player.pause();
  player.removeAttribute('src');
  player.load();
}

function openModal(movie) {
  mtitle.textContent = movie.title || 'Movie';
  mdesc.textContent = movie.description || '';
  const src = absoluteVideoUrl(movie.videoUrl);

  // increment view count (best effort)
  if (movie.id) fetch(`/api/movies/${movie.id}/view`, { method: 'POST' }).catch(() => {});

  player.pause();
  player.removeAttribute('src');
  player.load();

  player.src = src;
  modal.classList.add('active');

  player.play().catch(() => {
    // If autoplay blocked, user can press play
  });
}

fetchMovies();