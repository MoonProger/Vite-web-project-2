import { el, safeFetch, showMsg, setImageFallback } from './common.js';

const NEWSDATA_API_KEY = 'pub_259d54bf4a604f0991e8338ff56ce0de';
const NEWSDATA_BASE = 'https://newsdata.io/api/1/latest';
const COUNTRY = 'us';

const qInput = document.getElementById('q');
const searchBtn = document.getElementById('searchBtn');
const refreshBtn = document.getElementById('refreshBtn');
const categorySelect = document.getElementById('categorySelect');
const newsList = document.getElementById('newsList');
const newsMsg = document.getElementById('newsMsg');

const PLACEHOLDER = new URL('../default_image.png', import.meta.url).href;
const loadMoreBtn = document.createElement('button');
loadMoreBtn.textContent = 'Загрузить ещё';
loadMoreBtn.className = 'load-more-btn';
loadMoreBtn.style.display = 'none';
document.querySelector('.card').appendChild(loadMoreBtn);

let lastNextPageToken = null;
let allLoadedNews = [];

const STATIC_CATEGORIES = [
  'business',
  'crime',
  'domestic',
  'education',
  'entertainment',
  'environment',
  'food',
  'health',
  'lifestyle',
  'other',
  'politics',
  'science',
  'sports',
  'technology',
  'top',
  'tourism',
  'world',
];

function parseNewsdataResponse(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (raw.results && Array.isArray(raw.results)) return raw.results;
  return [];
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return '';
  const date = d.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const time = d.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return { date, time };
}

function createTag(text) {
  const t = el('span', 'tag', text);
  return t;
}

function createNewsCard(article) {
  const card = el('article', 'news-card');
  const img = el('img', 'news-img');
  img.loading = 'lazy';
  img.alt = article.title || 'Новость';
  img.src = article.image_url || article.image || PLACEHOLDER;
  setImageFallback(img, PLACEHOLDER);

  const info = el('div', 'news-info');
  const metaRow = el('div', 'meta-row');

  const { date, time } = formatDate(article.pubDate || article.date);
  const leftMeta = el('div', 'meta-left');
  const dateEl = el('div', 'meta-date', `🗓 ${date}`);
  const timeEl = el('div', 'meta-time', `⏱ ${time}`);
  const publisher = el(
    'div',
    'meta-publisher',
    article.source_name || article.source || 'Unknown'
  );

  leftMeta.append(dateEl, timeEl);
  metaRow.append(leftMeta, publisher);

  const title = el('h3', 'news-title', article.title || 'Без заголовка');

  const categoriesWrap = el('div', 'tags-row');
  const cats = Array.isArray(article.category)
    ? article.category
    : article.categories || [];
  if (cats && cats.length) {
    cats.forEach((c) => categoriesWrap.appendChild(createTag(c)));
  }

  info.append(metaRow, title, categoriesWrap);
  card.append(img, info);

  card.addEventListener('click', () => {
    if (article.link) window.open(article.link, '_blank', 'noopener');
  });

  return card;
}

function renderList(list, append = false) {
  if (!append) newsList.innerHTML = '';
  if (!list || list.length === 0) {
    if (!append) showMsg(newsMsg, 'Ничего не найдено.');
    return;
  }
  showMsg(newsMsg, '');
  list.forEach((a) => newsList.appendChild(createNewsCard(a)));
}

function populateCategoryOptions() {
  categorySelect.innerHTML = '<option value="">All Categories</option>';
  STATIC_CATEGORIES.forEach((c) => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c.charAt(0).toUpperCase() + c.slice(1);
    categorySelect.appendChild(opt);
  });
}

async function fetchFromNewsdata({ q = '', category = '', pageToken = null } = {}) {
  const params = new URLSearchParams();
  params.set('apikey', NEWSDATA_API_KEY);
  params.set('country', COUNTRY);
  params.set('language', 'en');
  if (q) params.set('q', q);
  if (category) params.set('category', category);
  if (pageToken && typeof pageToken === 'string') params.set('page', pageToken);

  const url = `${NEWSDATA_BASE}?${params.toString()}`;
  console.log('Fetching:', url);
  const resp = await safeFetch(url);
  const results = parseNewsdataResponse(resp);
  const next = resp && resp.nextPage ? resp.nextPage : null;
  return { results, nextPage: next };
}

async function loadNews({ reset = true, pageToken = null } = {}) {
  if (reset) {
    newsList.innerHTML = '';
    allLoadedNews = [];
  }
  showMsg(newsMsg, 'Loading news...');

  try {
    const q = qInput.value.trim();
    const cat = categorySelect.value;
    const { results, nextPage } = await fetchFromNewsdata({
      q,
      category: cat,
      pageToken,
    });

    if (!results || results.length === 0) {
      showMsg(newsMsg, 'Ничего не найдено.');
      loadMoreBtn.style.display = 'none';
      return;
    }

    showMsg(newsMsg, '');
    lastNextPageToken = nextPage || null;

    allLoadedNews = [...allLoadedNews, ...results];
    renderList(results, true);

    loadMoreBtn.style.display = lastNextPageToken ? 'block' : 'none';
  } catch (err) {
    console.error('Ошибка NewsData:', err);
    showMsg(newsMsg, 'Ошибка загрузки: ' + err.message);
  }
}

loadMoreBtn.addEventListener('click', async () => {
  if (lastNextPageToken) {
    loadMoreBtn.disabled = true;
    loadMoreBtn.textContent = 'Загрузка...';
    await loadNews({ reset: false, pageToken: lastNextPageToken });
    loadMoreBtn.disabled = false;
    loadMoreBtn.textContent = 'Загрузить ещё';
  }
});

if (searchBtn) { searchBtn.addEventListener('click', () => loadNews()); }
refreshBtn.addEventListener('click', () => {
  qInput.value = '';
  categorySelect.value = '';
  loadNews();
});
categorySelect.addEventListener('change', () => loadNews());
qInput.addEventListener('keyup', (e) => {
  if (e.key === 'Enter') loadNews();
});

// старт
populateCategoryOptions();
loadNews();
