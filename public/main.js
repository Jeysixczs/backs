const API_BASE = "/api"; // Vercel rewrites /api/* to serverless

const mangaListEl = document.getElementById('manga-list');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const detailsModal = document.getElementById('details-modal');
const detailsTitle = document.getElementById('details-title');
const detailsCover = document.getElementById('details-cover');
const detailsAuthor = document.getElementById('details-author');
const detailsYear = document.getElementById('details-year');
const detailsDescription = document.getElementById('details-description');
const detailsGenres = document.getElementById('details-genres');
const chapterList = document.getElementById('chapter-list');
const closeModal = document.getElementById('close-modal');

async function apiGet(path) {
    const resp = await fetch(path);
    if (!resp.ok) throw new Error('API error: ' + resp.status);
    return resp.json();
}
async function getMangaList(query) {
  const params = new URLSearchParams();
  if (query) params.append('title', query);
  params.append('includes[]', 'cover_art');
  const url = `/api/manga?${params.toString()}`;
  const resp = await fetch(url);
  const data = await resp.json();
  return data.data || [];
}

function getCoverUrl(manga) {
  const PLACEHOLDER = "https://mangadex.org/img/cover-placeholder.png";
  if (!manga || !manga.id) return PLACEHOLDER;
  
  // Find cover art relationship
  const cover = manga.relationships?.find(rel => rel.type === "cover_art");
  if (!cover || !cover.attributes?.fileName) return PLACEHOLDER;
  
  // Remove .256.jpg suffix if present and build proper URL
  const fileName = cover.attributes.fileName.replace(/\.\d+\.jpg$/, '');
  return `https://uploads.mangadex.org/covers/${manga.id}/${fileName}.256.jpg`;
}

function getMainTitle(attr) {
    if (!attr || !attr.title) return 'No Title';
    return attr.title.en || attr.title['en-us'] || Object.values(attr.title)[0] || 'No Title';
}

function getDescription(attr) {
    if (!attr || !attr.description) return '';
    return attr.description.en || Object.values(attr.description)[0] || '';
}

async function showMangaList(query = "") {
  const mangaListEl = document.getElementById('manga-list');
  mangaListEl.innerHTML = "Loading...";
  try {
    const mangas = await getMangaList(query);
    if (!mangas.length) {
      mangaListEl.innerHTML = "No manga found.";
      return;
    }
    mangaListEl.innerHTML = "";
    mangas.forEach(manga => {
      const attr = manga.attributes;
      const card = document.createElement('div');
      card.className = 'manga-card';
      const coverUrl = getCoverUrl(manga);
      card.innerHTML = `
        <img src="${coverUrl}" alt="cover" onerror="this.src='https://mangadex.org/img/cover-placeholder.png'">
        <div class="manga-title">${escapeHTML(attr.title?.en || Object.values(attr.title)[0] || "Untitled")}</div>
        <div class="manga-desc">${escapeHTML(attr.description?.en || Object.values(attr.description)[0] || "").slice(0, 100)}...</div>
      `;
      card.onclick = () => showDetails(manga.id);
      mangaListEl.appendChild(card);
    });
  } catch (e) {
    mangaListEl.innerHTML = "Failed to load manga.";
    console.error(e);
  }
}
function escapeHTML(str) {
    const div = document.createElement('div');
    div.innerText = str || '';
    return div.innerHTML;
}

async function showMangaList(query = "") {
    mangaListEl.innerHTML = "Loading...";
    try {
        const mangas = await getMangaList(query);
        if (!mangas.length) {
            mangaListEl.innerHTML = "No manga found.";
            return;
        }
        mangaListEl.innerHTML = "";
        mangas.forEach(manga => {
            const attr = manga.attributes;
            const card = document.createElement('div');
            card.className = 'manga-card';
            const coverUrl = getCoverUrl(manga);
            card.innerHTML = `
        <img src="${coverUrl}" alt="cover" onerror="this.src='placeholder.png'">
        <div class="manga-title">${escapeHTML(getMainTitle(attr))}</div>
        <div class="manga-desc">${escapeHTML(getDescription(attr)).slice(0, 100)}...</div>
      `;
            card.onclick = () => showDetails(manga.id);
            mangaListEl.appendChild(card);
        });
    } catch (e) {
        mangaListEl.innerHTML = "Failed to load manga.";
        console.error(e);
    }
}

async function showDetails(mangaId) {
    detailsModal.style.display = "flex";
    detailsTitle.textContent = "";
 
    detailsCover.src = "";
    detailsAuthor.textContent = "";
    detailsYear.textContent = "";
    detailsDescription.textContent = "";
    chapterList.innerHTML = "Loading...";
    try {

        const data = await apiGet(`${API_BASE}/manga/${mangaId}`);
        const manga = data.data;
        const attr = manga.attributes;
        detailsTitle.textContent = getMainTitle(attr);
        
        // Get cover URL
        const coverUrl = getCoverUrl(manga);
        detailsCover.src = coverUrl;
        detailsCover.style.display = coverUrl.includes('placeholder') ? "none" : "block";


        
        detailsCover.src = getCoverUrl(manga);
        detailsCover.style.display = detailsCover.src ? "block" : "none";
        detailsAuthor.textContent = "Author: " + (manga.relationships?.find(r => r.type === "author")?.attributes?.name || "Unknown");
        detailsYear.textContent = "Year: " + (attr.year || "Unknown");
        detailsDescription.textContent = getDescription(attr);
        detailsGenres.textContent = "Genres: " + (attr.tags || []).map(t => t.attributes?.name?.en).filter(Boolean).join(", ");

        // Chapters
        const chData = await apiGet(`${API_BASE}/chapter?manga=${mangaId}&limit=100&translatedLanguage[]=en&order[chapter]=asc&contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica`);
        if (!chData.data.length) {
            chapterList.innerHTML = "No chapters.";
        } else {
            chapterList.innerHTML = "";
            chData.data.forEach(ch => {
                const title = ch.attributes.title ?
                    `Ch. ${ch.attributes.chapter}: ${ch.attributes.title}` :
                    `Ch. ${ch.attributes.chapter || "Oneshot"}`;
                const item = document.createElement('div');
                item.className = 'chapter-item';
                item.textContent = title;
                item.onclick = () => readChapter(ch.id, title);
                chapterList.appendChild(item);
            });
        }
    } catch (e) {
        detailsDescription.innerHTML = "Failed to load details.";
        chapterList.innerHTML = "";
        console.error(e);
    }
}

async function readChapter(chapterId, chTitle) {
    const data = await apiGet(`${API_BASE}/at-home/server/${chapterId}`);
    const chapter = data.chapter;
    let pages = Array.isArray(chapter.data) && chapter.data.length ? chapter.data : chapter.dataSaver;
    const baseUrl = data.baseUrl;
    const hash = chapter.hash;
    detailsDescription.innerHTML = `<b>${escapeHTML(chTitle)}</b><br><br>` + pages.map((page, i) =>
        `<img src="${baseUrl}/data/${hash}/${page}" alt="page${i + 1}" style="display:block;max-width:100%;background:#222;margin-bottom:10px;">`
    ).join('');
    chapterList.innerHTML = `<button onclick="document.getElementById('details-modal').style.display = 'none'">Close</button>`;
}

closeModal.onclick = () => (detailsModal.style.display = "none");
detailsModal.onclick = (e) => { if (e.target === detailsModal) detailsModal.style.display = "none"; };

document.getElementById('search-btn').onclick = () => {
  const query = document.getElementById('search-input').value.trim();
  showMangaList(query);
};

searchInput.onkeydown = e => { if (e.key === "Enter") showMangaList(searchInput.value.trim()); };

showMangaList();