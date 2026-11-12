(function(){
 const key='dc-inspect-theme';
 function updateButton(){const b=document.getElementById('theme-toggle');if(!b)return;const dark=document.documentElement.dataset.theme==='dark';const label=dark?'Aktifkan mode terang':'Aktifkan mode gelap';b.title=label;b.setAttribute('aria-label',label);b.innerHTML=dark?'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2"/></svg>':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 15.5A9 9 0 0 1 8.5 4 9 9 0 1 0 20 15.5Z"/></svg>';}
 function apply(value){const mode=value==='dark'?'dark':'light';document.documentElement.dataset.theme=mode;document.querySelector('meta[name="theme-color"]')?.setAttribute('content',mode==='dark'?'#101c19':'#123c36');updateButton();return mode;}
 let initial='light';try{initial=localStorage.getItem(key)||'light';}catch{}apply(initial);
 window.DCITheme={set(value){const mode=apply(value);try{localStorage.setItem(key,mode);return true;}catch{return false;}}};
 document.addEventListener('DOMContentLoaded',()=>{const b=document.createElement('button');b.id='theme-toggle';b.type='button';b.className='theme-toggle';b.addEventListener('click',()=>window.DCITheme.set(document.documentElement.dataset.theme==='dark'?'light':'dark'));document.body.appendChild(b);updateButton();});
})();