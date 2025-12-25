'use strict';

let movies = [];
let uploadStart = 0;

const pageTitle = document.getElementById('pageTitle');
const stats = document.getElementById('stats');
const movieBody = document.getElementById('movieBody');

const toast = document.getElementById('toast');
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

function setActiveSection(targetId, label) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.getElementById(targetId).classList.add('active');
  pageTitle.textContent = label;
}

document.querySelectorAll('.navlink').forEach(a => {
  a.addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelectorAll('.navlink').forEach(x => x.classList.remove('active'));
    a.classList.add('active');
    const target = a.dataset.target;
    const label = a.textContent.trim();
    setActiveSection(target, label);
  });
});

async function fetchMovies() {
  const res = await fetch('/api/movies');
  const data = await res.json();
  movies = Array.isArray(data) ? data : [];
}

function renderStats() {
  const total = movies.length;
  const totalViews = movies.reduce((s, m) => s + (m.views || 0), 0);
  const latest = movies.filter(m => m.isLatest).length;

  stats.innerHTML = `
    <div class="stat"><i class="fa-solid fa-film"></i><div><div class="n">${total}</div><div class="l">Total Movies</div></div></div>
    <div class="stat"><i class="fa-solid fa-eye"></i><div><div class="n">${totalViews.toLocaleString()}</div><div class="l">Total Views</div></div></div>
    <div class="stat"><i class="fa-solid fa-star"></i><div><div class="n">${latest}</div><div class="l">Latest</div></div></div>
  `;
}

function safePoster(thumbnail) {
  return thumbnail || 'https://via.placeholder.com/60x90/111/fff?text=IBOMMA';
}

function renderMovies() {
  movieBody.innerHTML = '';
  [...movies].reverse().forEach(m => {
    const video = m.videoUrl || '';
    movieBody.insertAdjacentHTML('beforeend', `
      <tr>
        <td><img class="poster" src="${safePoster(m.thumbnail)}" onerror="this.src='https://via.placeholder.com/60x90/111/fff?text=IBOMMA'"></td>
        <td>${escapeHtml(m.title || '')}</td>
        <td>${escapeHtml(m.language || '')}</td>
        <td>${m.views || 0}</td>
        <td><span class="small">${escapeHtml(video)}</span></td>
        <td class="actions">
          <button title="Edit" onclick="openEdit(${m.id})"><i class="fa-solid fa-pen-to-square"></i></button>
          <button title="Delete" class="danger" onclick="delMovie(${m.id})"><i class="fa-solid fa-trash"></i></button>
        </td>
      </tr>
    `);
  });
}

function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

// ---------- Upload with progress + time remaining
const uploadForm = document.getElementById('uploadForm');
const pmodal = document.getElementById('pmodal');
const pfill = document.getElementById('pfill');
const ptext = document.getElementById('ptext');
const pdetails = document.getElementById('pdetails');

uploadForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const fd = new FormData(uploadForm);
  pfill.style.width = '0%';
  ptext.textContent = 'Uploading 0%';
  pdetails.textContent = 'Starting...';
  pmodal.classList.add('active');
  uploadStart = Date.now();

  const xhr = new XMLHttpRequest();
  xhr.open('POST', '/api/upload', true);

  xhr.upload.onprogress = (ev) => {
    if (!ev.lengthComputable) return;

    const pct = Math.round((ev.loaded / ev.total) * 100);
    pfill.style.width = `${pct}%`;
    ptext.textContent = `Uploading ${pct}%`;

    const elapsed = (Date.now() - uploadStart) / 1000;
    if (elapsed > 0.5) {
      const speed = ev.loaded / elapsed; // bytes/s
      const remain = ev.total - ev.loaded;
      const left = remain / speed; // seconds
      const speedMB = (speed / (1024 * 1024)).toFixed(2);
      const leftTxt = left > 60 ? `${(left / 60).toFixed(1)} mins left` : `${left.toFixed(0)} secs left`;
      pdetails.textContent =
        `Uploaded ${(ev.loaded/(1024*1024)).toFixed(1)}MB / ${(ev.total/(1024*1024)).toFixed(1)}MB | ${speedMB} MB/s | ${leftTxt}`;
    }
  };

  xhr.onload = async () => {
    pmodal.classList.remove('active');
    if (xhr.status >= 200 && xhr.status < 300) {
      showToast('Uploaded successfully');
      uploadForm.reset();
      await refreshAll();
      // jump to Movies tab after upload (optional)
      document.querySelector(`.navlink[data-target="sec-movies"]`).click();
    } else {
      showToast('Upload failed');
    }
  };

  xhr.onerror = () => {
    pmodal.classList.remove('active');
    showToast('Network error');
  };

  xhr.send(fd);
});

// ---------- Edit modal
const emodal = document.getElementById('emodal');
const editForm = document.getElementById('editForm');
const eid = document.getElementById('eid');
const etitle = document.getElementById('etitle');
const edesc = document.getElementById('edesc');
const ethumb = document.getElementById('ethumb');
const elang = document.getElementById('elang');
const elatest = document.getElementById('elatest');
const etrending = document.getElementById('etrending');

function editOutside(e) {
  if (e.target === emodal) closeEdit();
}
function closeEdit() {
  emodal.classList.remove('active');
  editForm.reset();
}

window.openEdit = (id) => {
  const m = movies.find(x => x.id === id);
  if (!m) return;

  eid.value = m.id;
  etitle.value = m.title || '';
  edesc.value = m.description || '';
  ethumb.value = m.thumbnail || '';
  elang.value = m.language || 'Telugu';
  elatest.checked = !!m.isLatest;
  etrending.checked = !!m.isTrending;

  emodal.classList.add('active');
};

editForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(editForm);

  const res = await fetch('/api/update-movie', { method: 'POST', body: fd });
  const data = await res.json();

  if (data.success) {
    showToast('Updated');
    closeEdit();
    await refreshAll();
  } else {
    showToast('Update failed');
  }
});

// ---------- Delete
window.delMovie = async (id) => {
  const ok = confirm('Delete this movie?');
  if (!ok) return;

  const res = await fetch(`/api/movies/${id}`, { method: 'DELETE' });
  const data = await res.json();
  if (data.success) {
    showToast('Deleted');
    await refreshAll();
  } else {
    showToast('Delete failed');
  }
};

// ---------- Settings demo (localStorage)
window.saveSettings = () => {
  const t = document.getElementById('setTitle').value || 'IBOMMA';
  const l = document.getElementById('setLang').value || 'Telugu';
  localStorage.setItem('ib_settings', JSON.stringify({ title: t, lang: l }));
  showToast('Settings saved');
};

function loadSettings() {
  try {
    const raw = localStorage.getItem('ib_settings');
    if (!raw) return;
    const s = JSON.parse(raw);
    if (s.title) document.getElementById('setTitle').value = s.title;
    if (s.lang) document.getElementById('setLang').value = s.lang;
  } catch {}
}

async function refreshAll() {
  await fetchMovies();
  renderStats();
  renderMovies();
}

(async function init() {
  loadSettings();
  await refreshAll();
})();