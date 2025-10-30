import { el, safeFetch, showMsg, setImageFallback } from './common.js';

const BASE = 'https://www.themealdb.com/api/json/v1/1';
const mealsList = document.getElementById('mealsList');
const mealQ = document.getElementById('mealQ');
const mealSearch = document.getElementById('mealSearch');
const mealRandom = document.getElementById('mealRandom');
const mealMsg = document.getElementById('mealMsg');
const mealCategory = document.getElementById('mealCategory');
const mealArea = document.getElementById('mealArea');
const PLACEHOLDER = 'https://via.placeholder.com/800x450?text=No+image';

function openModal(htmlContent){
  const backdrop = el('div','modal-backdrop');
  const modal = el('div','modal');
  modal.innerHTML = htmlContent;
  const closeBtn = el('button','close-btn','✕');
  closeBtn.addEventListener('click', ()=> document.body.removeChild(backdrop));
  modal.appendChild(closeBtn);
  backdrop.appendChild(modal);
  backdrop.addEventListener('click', (e)=> { if(e.target === backdrop) document.body.removeChild(backdrop); });
  document.body.appendChild(backdrop);
}

function createMealCard(m){
  const card = document.createElement('div');
  card.className = 'card-item';
  const img = document.createElement('img');
  img.className = 'card-media';
  img.loading = 'lazy';
  img.alt = m.strMeal;
  img.src = m.strMealThumb || PLACEHOLDER;
  setImageFallback(img, PLACEHOLDER);

  const title = document.createElement('div');
  title.className = 'meal-title';
  title.textContent = m.strMeal;

  card.appendChild(img);
  card.appendChild(title);

  card.addEventListener('click', ()=> showDetail(m.idMeal));
  return card;
}

function renderMeals(items){
  mealsList.innerHTML = '';
  if(!items || items.length === 0){
    showMsg(mealMsg, 'Nothing found.');
    return;
  }
  showMsg(mealMsg, '');
  items.forEach(m => mealsList.appendChild(createMealCard(m)));
}

async function searchMeals(q){
  mealsList.innerHTML = '';
  showMsg(mealMsg,'Loading your meals...');
  try{
    const url = `${BASE}/search.php?s=${encodeURIComponent(q)}`;
    const data = await safeFetch(url);
    renderMeals(data.meals || []);
  }catch(err){
    showMsg(mealMsg,'Error: '+err.message);
    console.error(err);
  }
}

async function randomMeal(){
  mealsList.innerHTML = '';
  showMsg(mealMsg,'Loading random meal...');
  try{
    const data = await safeFetch(`${BASE}/random.php`);
    renderMeals(data.meals || []);
  }catch(err){
    showMsg(mealMsg,'Error: '+err.message);
    console.error(err);
  }
}

async function loadByFilters(){
  const c = (mealCategory && mealCategory.value) || '';
  const a = (mealArea && mealArea.value) || '';
  if(!c && !a){
    return searchMeals('');
  }
  mealsList.innerHTML = '';
  showMsg(mealMsg,'Loading special meals...');
  try{
    const params = new URLSearchParams();
    if(c) params.set('c', c);
    if(a) params.set('a', a);
    const url = `${BASE}/filter.php?${params.toString()}`;
    const data = await safeFetch(url);
    renderMeals((data && data.meals) || []);
  }catch(err){
    showMsg(mealMsg,'Error: '+err.message);
    console.error(err);
  }
}

async function showDetail(id){
  try{
    const data = await safeFetch(`${BASE}/lookup.php?i=${id}`);
    const m = data.meals && data.meals[0];
    if(!m) return alert('Детали не найдены');
    let ingredients = '';
    for(let i=1;i<=20;i++){
      const ing = m['strIngredient'+i];
      const measure = m['strMeasure'+i];
      if(ing && ing.trim()) ingredients += `<li>${ing} — ${measure || ''}</li>`;
    }
    const html = `
      <h2>${m.strMeal}</h2>
      <img src="${m.strMealThumb || PLACEHOLDER}" alt="${m.strMeal}" />
      <p><strong>Category:</strong> ${m.strCategory || ''} — <strong>Country:</strong> ${m.strArea || ''}</p>
      <h3>Ingridients</h3>
      <ul>${ingredients}</ul>
      <h3>Instructions</h3>
      <p style="white-space:pre-wrap">${m.strInstructions || ''}</p>
      ${m.strSource ? `<p>Source: <a href="${m.strSource}" target="_blank" rel="noopener">${m.strSource}</a></p>` : ''}
      ${m.strYoutube ? `<p>Video: <a href="${m.strYoutube}" target="_blank" rel="noopener">${m.strYoutube}</a></p>` : ''}
    `;
    openModal(html);
  }catch(err){
    alert('Ошибка: '+err.message);
  }
}

mealSearch.addEventListener('click', ()=> {
  const q = mealQ.value.trim();
  if(!q) return searchMeals('');
  searchMeals(q);
});
mealRandom.addEventListener('click', randomMeal);
if(mealCategory){
  mealCategory.addEventListener('change', ()=>{
    if(mealArea) mealArea.value = '';
    if(mealQ) mealQ.value = '';
    loadByFilters();
  });
}
if(mealArea){
  mealArea.addEventListener('change', ()=>{
    if(mealCategory) mealCategory.value = '';
    if(mealQ) mealQ.value = '';
    loadByFilters();
  });
}

mealQ.addEventListener('keyup', (e)=>{
  if(e.key === 'Enter'){
    const q = mealQ.value.trim();
    if(q){
      if(mealCategory) mealCategory.value = '';
      if(mealArea) mealArea.value = '';
    }
    searchMeals(q);
  }
});

// стартовый контент
searchMeals("");
