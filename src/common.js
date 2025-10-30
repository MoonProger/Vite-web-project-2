export function el(tag, cls, txt){
    const e = document.createElement(tag);
    if(cls) e.className = cls;
    if(txt !== undefined) e.textContent = txt;
    return e;
  }
  
  export async function safeFetch(url, opts = {}){
    const r = await fetch(url, opts);
    const text = await r.text().catch(()=>null);
    const isJson = (() => {
      try { JSON.parse(text); return true; } catch(e){ return false; }
    })();
    if(!r.ok){
      throw new Error(`HTTP ${r.status}: ${text || r.statusText}`);
    }
    return isJson ? JSON.parse(text) : text;
  }
  
  export function showMsg(container, text){
    if(!container) return;
    container.textContent = text;
  }
  
  export function setImageFallback(img, fallback){
    img.addEventListener('error', ()=> {
      if(img.src === fallback) return;
      img.src = fallback;
    });
  }
  