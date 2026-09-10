const API_KEY = 'e1a538b5';
const API_URL = 'https://www.omdbapi.com/';

const state = {
 query: '',
 page: 1,
 totalPages: 0,
 results: [],
 type: '',
 year: ''
};

const el = id => document.getElementById(id);
const searchInput = el('movieInput') || el('searchInput');
const searchBtn = el('searchBtn');
const searchForm = el('searchForm');
const resultsEl = el('results') || el('result');
const statusText = el('statusText');
const pager = el('pager');
const modalBackdrop = el('modalBackdrop');
const modalPoster = el('modalPoster');
const modalTitle = el('modalTitle');
const modalMeta = el('modalMeta');
const modalPlot = el('modalPlot');
const modalExtra = el('modalExtra');
const closeModal = el('closeModal');
const typeFilter = el('typeFilter');
const yearFilter = el('yearFilter');
const themeToggle = el('themeToggle');
const apiStatus = el('apiStatus');

function safeText(node, value) {
 if (node) node.textContent = value;
}

function updateApiStatus() {
 if (!apiStatus) return;
 apiStatus.textContent = API_KEY && API_KEY !== 'PASTE_YOUR_OMDB_API_KEY_HERE'
   ? 'Live OMDb data enabled'
   : 'Update script.js with your OMDb API key to enable live search';
}

function debounce(fn, wait) {
 let timer;
 return (...args) => {
   clearTimeout(timer);
   timer = setTimeout(() => fn(...args), wait);
 };
}

async function fetchMovies(query, page = 1, type = '', year = '') {
 if (!query) return { Search: [], totalResults: 0 };

 if (!API_KEY) {
   return {
     Search: [],
     totalResults: 0,
     Error: 'Add your OMDb API key to search live movie data.'
   };
 }

 const params = new URLSearchParams({ apikey: API_KEY, s: query, page });
 if (type) params.set('type', type);
 if (year) params.set('y', year);

 const response = await fetch(`${API_URL}?${params.toString()}`);
 if (!response.ok) throw new Error('Network error. Please try again.');

 const data = await response.json();
 if (data.Response === 'False') {
   return { Search: [], totalResults: 0, Error: data.Error || 'No results found.' };
 }

 return {
   Search: data.Search || [],
   totalResults: parseInt(data.totalResults || '0', 10)
 };
}

function createPoster(item) {
 const poster = document.createElement('div');
 poster.className = 'poster';

 if (item.Poster && item.Poster !== 'N/A') {
   poster.style.backgroundImage = `url(${item.Poster})`;
 } else {
   poster.classList.add('placeholder');
   poster.textContent = 'Poster';
 }

 poster.setAttribute('aria-hidden', 'true');
 return poster;
}

function renderResults(items) {
 if (!resultsEl) return;

 resultsEl.innerHTML = '';

 if (!items.length) {
   resultsEl.innerHTML = '<div class="empty-state">No results found. Try another title or adjust your filters.</div>';
   return;
 }

 for (const item of items) {
   const card = document.createElement('article');
   card.className = 'movie-card';
   card.tabIndex = 0;
   card.setAttribute('role', 'button');
   card.setAttribute('aria-label', `View details for ${item.Title}`);

   const poster = createPoster(item);
   const content = document.createElement('div');
   content.className = 'card-content';

   const title = document.createElement('h3');
   title.className = 'title';
   title.textContent = item.Title;

   const meta = document.createElement('div');
   meta.className = 'meta';
   meta.textContent = `${item.Year || 'N/A'} • ${item.Type || 'Unknown'}`;

   const detailsBtn = document.createElement('button');
   detailsBtn.type = 'button';
   detailsBtn.className = 'details-btn';
   detailsBtn.textContent = 'Details';
   detailsBtn.addEventListener('click', () => openDetail(item.imdbID));

   card.addEventListener('click', (event) => {
     if (event.target !== detailsBtn) {
       openDetail(item.imdbID);
     }
   });

   content.appendChild(title);
   content.appendChild(meta);
   content.appendChild(detailsBtn);

   card.appendChild(poster);
   card.appendChild(content);
   resultsEl.appendChild(card);
 }
}

async function openDetail(imdbID) {
 try {
   if (!modalBackdrop || !modalTitle || !modalMeta || !modalPlot || !modalExtra) return;

   modalBackdrop.style.display = 'flex';
   modalBackdrop.setAttribute('aria-hidden', 'false');
   modalTitle.textContent = 'Loading...';
   modalMeta.textContent = '';
   modalPlot.textContent = 'Fetching movie details...';
   modalExtra.textContent = '';
   modalPoster.style.backgroundImage = 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(34, 211, 238, 0.18))';

   if (!API_KEY) {
     modalTitle.textContent = 'API key required';
     modalMeta.textContent = 'Live data is disabled';
     modalPlot.textContent = 'Add your OMDb API key in the top-right menu to load detailed information.';
     modalExtra.textContent = 'Search results still work once your API key is active.';
     return;
    }

   const params = new URLSearchParams({ apikey: API_KEY, i: imdbID, plot: 'full' });
   const response = await fetch(`${API_URL}?${params.toString()}`);
   if (!response.ok) throw new Error('Unable to load details right now.');

   const data = await response.json();
   if (data.Response === 'False') {
     modalTitle.textContent = 'Not found';
     modalMeta.textContent = 'Movie details unavailable';
     modalPlot.textContent = data.Error || 'No details were found for this selection.';
     modalExtra.textContent = '';
     return;
   }

   const posterUrl = data.Poster && data.Poster !== 'N/A' ? data.Poster : '';
   modalPoster.style.backgroundImage = posterUrl ? `url(${posterUrl})` : 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(34, 211, 238, 0.18))';

   modalTitle.textContent = `${data.Title || 'Untitled'} (${data.Year || 'N/A'})`;
   modalMeta.textContent = `${data.Runtime || 'N/A'} • ${data.Genre || 'N/A'} • IMDb ${data.imdbRating || 'N/A'}`;
   modalPlot.textContent = data.Plot || 'No plot summary available.';
   modalExtra.textContent = `Director: ${data.Director || 'N/A'} • Actors: ${data.Actors || 'N/A'}`;
 } catch (error) {
   if (modalTitle) modalTitle.textContent = 'Error';
   if (modalPlot) modalPlot.textContent = error.message || 'Failed to load details.';
   if (modalMeta) modalMeta.textContent = '';
   if (modalExtra) modalExtra.textContent = '';
 }
}

function closeDetail() {
 if (modalBackdrop) {
   modalBackdrop.style.display = 'none';
   modalBackdrop.setAttribute('aria-hidden', 'true');
 }
}

async function doSearch(page = 1) {
 if (!searchInput || !resultsEl || !statusText || !pager) return;

 const q = state.query = searchInput.value.trim();
 state.type = typeFilter ? typeFilter.value : '';
 state.year = yearFilter ? yearFilter.value : '';

 if (!q) {
   safeText(statusText, 'Enter a movie title to begin.');
   resultsEl.innerHTML = '';
   pager.innerHTML = '';
   return;
 }

 safeText(statusText, 'Searching...');
 resultsEl.innerHTML = '<div class="empty-state">Searching for matches...</div>';
 pager.innerHTML = '';

 try {
   const response = await fetchMovies(q, page, state.type, state.year);
   state.results = response.Search || [];
   state.page = page;
   state.totalPages = Math.ceil((response.totalResults || 0) / 10) || 0;

   if (response.Error) {
     safeText(statusText, response.Error);
   } else {
     safeText(statusText, `Found ${response.totalResults || state.results.length} result(s)`);
   }

   renderResults(state.results);
   renderPager();
 } catch (error) {
   safeText(statusText, 'An error occurred while searching.');
   resultsEl.innerHTML = `<div class="empty-state">${error.message}</div>`;
   pager.innerHTML = '';
 }
}

function renderPager() {
 if (!pager) return;

 pager.innerHTML = '';
 if (state.totalPages <= 1) return;

 const createButton = (label, nextPage, disabled = false, active = false) => {
   const button = document.createElement('button');
   button.type = 'button';
   button.className = 'pager-btn';
   if (active) button.classList.add('is-active');
   button.textContent = label;
   button.disabled = disabled;
   button.addEventListener('click', () => doSearch(nextPage));
   return button;
 };

 pager.appendChild(createButton('Prev', Math.max(1, state.page - 1), state.page === 1));

 const start = Math.max(1, state.page - 2);
 const end = Math.min(state.totalPages, start + 4);

 for (let page = start; page <= end; page += 1) {
   pager.appendChild(createButton(String(page), page, false, page === state.page));
 }

 pager.appendChild(createButton('Next', Math.min(state.totalPages, state.page + 1), state.page === state.totalPages));
}

if (searchBtn) {
 searchBtn.addEventListener('click', (event) => {
   event.preventDefault();
   doSearch(1);
 });
}

if (searchForm) {
 searchForm.addEventListener('submit', (event) => {
   event.preventDefault();
   doSearch(1);
 });
}

if (typeFilter) {
 typeFilter.addEventListener('change', () => doSearch(1));
}

if (yearFilter) {
 yearFilter.addEventListener('change', () => doSearch(1));
}

if (closeModal) {
 closeModal.addEventListener('click', closeDetail);
}

if (modalBackdrop) {
 modalBackdrop.addEventListener('click', (event) => {
   if (event.target === modalBackdrop) closeDetail();
 });
}

document.addEventListener('keydown', (event) => {
 if (event.key === 'Escape') closeDetail();
});

if (searchInput) {
 searchInput.addEventListener('input', debounce(() => {
   if (searchInput.value.trim().length >= 3) {
     doSearch(1);
   } else if (!searchInput.value.trim()) {
     if (resultsEl) resultsEl.innerHTML = '';
     if (statusText) statusText.textContent = 'Enter a movie title to begin.';
     if (pager) pager.innerHTML = '';
   }
 }, 450));
}

function applyTheme(theme) {
 const nextTheme = theme === 'dark' ? 'dark' : 'light';
 document.documentElement.setAttribute('data-theme', nextTheme);
 localStorage.setItem('theme', nextTheme);

 if (themeToggle) {
   themeToggle.textContent = nextTheme === 'dark' ? '☀️' : '🌙';
   themeToggle.setAttribute('aria-pressed', String(nextTheme === 'dark'));
 }
}

if (themeToggle) {
 themeToggle.addEventListener('click', () => {
   const activeTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
   applyTheme(activeTheme);
 });
}

(function initTheme() {
 const savedTheme = localStorage.getItem('theme') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
 applyTheme(savedTheme);
})();

(function init() {
 updateApiStatus();
 if (statusText) {
   statusText.textContent = API_KEY && API_KEY !== 'PASTE_YOUR_OMDB_API_KEY_HERE'
     ? 'Ready to search live titles.'
     : 'Update script.js with your OMDb API key to enable live results.';
 }
})();
