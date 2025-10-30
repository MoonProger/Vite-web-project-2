import { el, safeFetch, setImageFallback, showMsg } from './common.js';

const CAT_API_KEY = 'live_GoEF46RcwWwsh5P8iTYddqNnwQHAy7G2BvZzsEZ13zMHlJMBcJzszJ8f8XrCtOOU';
const BASE = 'https://api.thecatapi.com/v1';
const SUB_ID = 'user-123';
const favouriteByImageId = new Map();
let isShowingFavourites = false;

const catsList = document.getElementById('catsList');
const catsMsg = document.getElementById('catsMsg');
const refreshBtn = document.getElementById('refreshCats');
const favouritesBtn = document.getElementById('favouritesBtn');
const breedSelect = document.getElementById('breedSelect');
const PLACEHOLDER = 'https://via.placeholder.com/800x450?text=No+image';

function createCatCard(obj){
  const card = document.createElement('div');
  card.className = 'card-item';
  const img = document.createElement('img');
  img.className = 'card-media';
  img.loading = 'lazy';
  img.alt = obj.id || 'cat';
  img.src = obj.url || PLACEHOLDER;
  setImageFallback(img, PLACEHOLDER);

  const overlay = document.createElement('div');
  overlay.className = 'card-overlay';
  if(obj.breeds && obj.breeds[0] && obj.breeds[0].name){
    const title = document.createElement('div');
    title.className = 'title';
    title.textContent = obj.breeds[0].name;
    overlay.appendChild(title);
  }

  const actions = document.createElement('div');
  actions.className = 'card-actions';

  const left = document.createElement('div');
  left.className = 'left';

  const upBtn = document.createElement('button');
  upBtn.className = 'btn-icon';
  upBtn.type = 'button';
  upBtn.title = 'Нравится (палец вверх)';
  upBtn.textContent = '👍';
  upBtn.addEventListener('click', () => {
    upBtn.classList.toggle('active');
    downBtn.classList.remove('active');
  });

  const downBtn = document.createElement('button');
  downBtn.className = 'btn-icon';
  downBtn.type = 'button';
  downBtn.title = 'Не нравится (палец вниз)';
  downBtn.textContent = '👎';
  downBtn.addEventListener('click', () => {
    downBtn.classList.toggle('active');
    upBtn.classList.remove('active');
  });

  left.appendChild(upBtn);
  left.appendChild(downBtn);

  const likeBtn = document.createElement('button');
  likeBtn.className = 'btn-icon btn-like';
  likeBtn.type = 'button';
  likeBtn.title = 'В избранное';
  likeBtn.textContent = '❤';
  if(favouriteByImageId.has(obj.id)){
    likeBtn.classList.add('active');
  }
  likeBtn.addEventListener('click', async () => {
    if(likeBtn.dataset.loading === '1') return;
    try{
      likeBtn.dataset.loading = '1';
      if(favouriteByImageId.has(obj.id)){
        const favId = favouriteByImageId.get(obj.id);
        await safeFetch(`${BASE}/favourites/${encodeURIComponent(favId)}`, {
          method: 'DELETE',
          headers: { 'x-api-key': CAT_API_KEY }
        });
        favouriteByImageId.delete(obj.id);
        likeBtn.classList.remove('active');
        if(isShowingFavourites && card.parentElement){
          card.remove();
        }
      }else{
        const body = JSON.stringify({ image_id: obj.id, sub_id: SUB_ID });
        const res = await safeFetch(`${BASE}/favourites`, {
          method: 'POST',
          headers: { 'x-api-key': CAT_API_KEY, 'content-type': 'application/json' },
          body
        });
        const favId = res && (res.id || res.message?.id) ? (res.id || res.message.id) : null;
        if(favId !== null && favId !== undefined){
          favouriteByImageId.set(obj.id, favId);
        }else{
          await refreshFavouritesCache();
        }
        likeBtn.classList.add('active');
      }
    }catch(err){
      console.error('Ошибка добавления избранное', err);
    }finally{
      delete likeBtn.dataset.loading;
    }
  });

  actions.appendChild(left);
  actions.appendChild(likeBtn);
  overlay.appendChild(actions);
  card.appendChild(img);
  card.appendChild(overlay);
  return card;
}

async function loadBreeds(){
  try{
    const data = await safeFetch(`${BASE}/breeds`, { headers: { 'x-api-key': CAT_API_KEY }});
    data.forEach(b => {
      const opt = document.createElement('option');
      opt.value = b.id;
      opt.textContent = b.name;
      breedSelect.appendChild(opt);
    });
  }catch(err){
    console.error('Ошибка загрузки пород', err);
  }
}

async function loadCats(breedId = ''){
  isShowingFavourites = false;
  catsList.innerHTML = '';
  showMsg(catsMsg, 'Loading cats...');
  try{
    let url = `${BASE}/images/search?limit=30&size=med`;
    if(breedId) url += `&breed_ids=${encodeURIComponent(breedId)}`;
    const [data] = await Promise.all([
      safeFetch(url, { headers: { 'x-api-key': CAT_API_KEY }}),
      refreshFavouritesCache()
    ]);
    if(!Array.isArray(data)) throw new Error('Неверный формат ответа');
    showMsg(catsMsg, '');
    data.forEach(item => catsList.appendChild(createCatCard(item)));
  }catch(err){
    showMsg(catsMsg, `Error: ${err.message}`);
    console.error(err);
  }
}

async function loadFavourites(){
  isShowingFavourites = true;
  catsList.innerHTML = '';
  showMsg(catsMsg, 'Loading favourites...');
  try{
    const favs = await refreshFavouritesCache(true);
    if(!Array.isArray(favs)) throw new Error('Неверный формат ответа');
    catsList.innerHTML = '';
    if(favs.length === 0){
      showMsg(catsMsg, 'Favourites list is empty');
      return;
    }
    showMsg(catsMsg, '');
    favs.forEach(f => {
      const item = { id: f.image_id, url: f.image && f.image.url ? f.image.url : PLACEHOLDER };
      const card = createCatCard(item);
      const like = card.querySelector('.btn-like');
      if(like) like.classList.add('active');
      catsList.appendChild(card);
    });
  }catch(err){
    showMsg(catsMsg, `Error: ${err.message}`);
    console.error(err);
  }
}

async function refreshFavouritesCache(returnList = false){
  const url = `${BASE}/favourites?limit=100&order=DESC&attach_image=1&sub_id=${encodeURIComponent(SUB_ID)}`;
  const favs = await safeFetch(url, { headers: { 'x-api-key': CAT_API_KEY } });
  favouriteByImageId.clear();
  if(Array.isArray(favs)){
    favs.forEach(f => {
      if(f && f.image_id && f.id !== undefined){
        favouriteByImageId.set(f.image_id, f.id);
      }
    });
  }
  return returnList ? favs : void 0;
}

refreshBtn.addEventListener('click', ()=> {
  breedSelect.value = '';
  loadCats();
});
breedSelect.addEventListener('change', ()=> loadCats(breedSelect.value));
if(favouritesBtn){
  favouritesBtn.addEventListener('click', ()=> {
    breedSelect.value = '';
    loadFavourites();
  });
}

loadBreeds().then(()=> loadCats());
