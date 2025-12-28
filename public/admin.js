function fmtBytes(bytes) {
  if (!Number.isFinite(bytes)) return "";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
}

function setProgress(pct) {
  const p = Math.max(0, Math.min(100, Math.round(pct)));
  document.getElementById("progress-fill").style.width = p + "%";
  document.getElementById("progress-text").textContent = p + "%";
}

let allMovies = [];

async function loadStats() {
  const res = await fetch("/api/admin/stats");
  const data = await res.json();
  allMovies = data.movies || [];
  document.getElementById("stat-movies").textContent = String(data.totalMovies ?? allMovies.length);
  document.getElementById("stat-views").textContent = String(data.totalViews ?? 0);
  renderMovies(allMovies);
}

function renderMovies(list) {
  const q = (document.getElementById("filter")?.value || "").trim().toLowerCase();
  const filtered = q
    ? list.filter((m) => (m.title || "").toLowerCase().includes(q))
    : list;

  const tbody = document.getElementById("movies-tbody");
  tbody.innerHTML = "";
  filtered
    .slice()
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
    .forEach((m) => {
      const tr = document.createElement("tr");

      const tdPoster = document.createElement("td");
      const img = document.createElement("img");
      img.className = "poster-thumb";
      img.src = m.poster || "https://via.placeholder.com/80x120?text=B";
      img.alt = m.title || "poster";
      tdPoster.appendChild(img);

      const tdTitle = document.createElement("td");
      tdTitle.textContent = m.title || "";

      const tdLang = document.createElement("td");
      tdLang.textContent = m.language || "-";

      const tdYear = document.createElement("td");
      tdYear.textContent = m.year || "-";

      const tdViews = document.createElement("td");
      tdViews.textContent = String(m.views ?? 0);

      const tdActions = document.createElement("td");
      const actions = document.createElement("div");
      actions.className = "actions";

      const copyBtn = document.createElement("button");
      copyBtn.className = "action-btn";
      copyBtn.textContent = "Copy Link";
      copyBtn.onclick = async () => {
        const link = `${location.origin}/play.html?id=${encodeURIComponent(m.id)}`;
        try {
          await navigator.clipboard.writeText(link);
          alert("Copied!");
        } catch {
          prompt("Copy link:", link);
        }
      };

      const editBtn = document.createElement("button");
      editBtn.className = "action-btn";
      editBtn.textContent = "Edit";
      editBtn.onclick = async () => {
        const newTitle = prompt("Title", m.title || "");
        if (newTitle === null) return;
        const newLang = prompt("Language", m.language || "");
        if (newLang === null) return;

        const res = await fetch(`/api/movies/${encodeURIComponent(m.id)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: newTitle, language: newLang }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          alert(err.error || "Update failed");
          return;
        }
        await loadStats();
      };

      const delBtn = document.createElement("button");
      delBtn.className = "action-btn";
      delBtn.textContent = "Delete";
      delBtn.onclick = async () => {
        if (!confirm(`Delete "${m.title}" ?`)) return;
        const res = await fetch(`/api/movies/${encodeURIComponent(m.id)}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          alert(err.error || "Delete failed");
          return;
        }
        await loadStats();
      };

      actions.appendChild(copyBtn);
      actions.appendChild(editBtn);
      actions.appendChild(delBtn);
      tdActions.appendChild(actions);

      tr.appendChild(tdPoster);
      tr.appendChild(tdTitle);
      tr.appendChild(tdLang);
      tr.appendChild(tdYear);
      tr.appendChild(tdViews);
      tr.appendChild(tdActions);

      tbody.appendChild(tr);
    });
}

document.getElementById("filter")?.addEventListener("input", () => renderMovies(allMovies));

// Upload with real progress (XHR)
document.getElementById("upload-form")?.addEventListener("submit", (e) => {
  e.preventDefault();
  document.getElementById("upload-status").textContent = "";
  setProgress(0);

  const fd = new FormData(document.getElementById("upload-form"));

  const video = document.getElementById("movie-input").files?.[0];
  if (!video) {
    document.getElementById("upload-status").textContent = "Please choose a .mp4 file";
    return;
  }

  document.getElementById("upload-status").textContent = "Uploading...";

  const xhr = new XMLHttpRequest();
  xhr.open("POST", "/api/movies");

  xhr.upload.onprogress = (evt) => {
    if (evt.lengthComputable) {
      const pct = (evt.loaded / evt.total) * 100;
      setProgress(pct);
    }
  };

  xhr.onload = async () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      document.getElementById("upload-status").textContent = "Upload complete!";
      document.getElementById("upload-form").reset();
      document.getElementById("poster-size").textContent = "";
      document.getElementById("movie-size").textContent = "";
      setProgress(100);
      await loadStats();
      return;
    }
    let msg = "Upload failed";
    try {
      msg = JSON.parse(xhr.responseText)?.error || msg;
    } catch {}
    document.getElementById("upload-status").textContent = "Error: " + msg;
    setProgress(0);
  };

  xhr.onerror = () => {
    document.getElementById("upload-status").textContent = "Error: Network error";
    setProgress(0);
  };

  xhr.send(fd);
});

document.getElementById("poster-input")?.addEventListener("change", () => {
  const f = document.getElementById("poster-input").files?.[0];
  document.getElementById("poster-size").textContent = f ? `Poster size: ${fmtBytes(f.size)}` : "";
});
document.getElementById("movie-input")?.addEventListener("change", () => {
  const f = document.getElementById("movie-input").files?.[0];
  document.getElementById("movie-size").textContent = f ? `Video size: ${fmtBytes(f.size)}` : "";
});

loadStats();
