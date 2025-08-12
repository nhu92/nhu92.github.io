// Year in footer
const y = document.getElementById('year'); if (y) y.textContent = new Date().getFullYear();

// Theme toggle (remembers preference)
(function(){
  const btn = document.getElementById('themeToggle');
  const root = document.documentElement;
  const saved = localStorage.getItem('theme');
  if (saved) root.setAttribute('data-theme', saved);
  if (btn) btn.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  });
})();

// Mobile menu toggle
(function(){
  const t = document.querySelector('.nav-toggle');
  const m = document.getElementById('menu');
  if (!t || !m) return;
  t.addEventListener('click', () => {
    const open = m.classList.toggle('open');
    t.setAttribute('aria-expanded', String(open));
  });
})();

// Load selected pubs on home + full list on publications page
async function loadPubs(){
  try{
    const res = await fetch('/data/publications.json');
    const pubs = await res.json();
    const sel = document.getElementById('pubs');
    if (sel){
      // Show latest 5
      pubs.slice(0,5).forEach(p => sel.appendChild(renderPub(p)));
    }
    if (window.PAGE?.type === 'pubs'){
      const list = document.getElementById('pubList');
      const yearSel = document.getElementById('pubYear');
      if (!list) return;
      // years
      [...new Set(pubs.map(p=>p.year))].sort((a,b)=>b-a).forEach(y=>{
        const o=document.createElement('option');o.value=y;o.textContent=y;yearSel.appendChild(o);
      });
      function update(){
        const q = document.getElementById('pubFilter').value.toLowerCase();
        const fy = yearSel.value;
        list.innerHTML = '';
        pubs.filter(p => (!fy || String(p.year)===fy) && (p.title+ p.journal+ p.citation).toLowerCase().includes(q))
            .forEach(p => list.appendChild(renderPub(p)));
      }
      document.getElementById('pubFilter').addEventListener('input', update);
      yearSel.addEventListener('change', update);
      update();
    }
  }catch(e){ console.warn('Cannot load publications.json', e); }
}
function renderPub(p){
  const li = document.createElement('li');
  const a = p.url ? `<a href="${p.url}">${p.title}</a>` : p.title;
  li.innerHTML = `${a} <br><span class="muted">${p.authors} · ${p.journal} (${p.year})</span>` + (p.doi ? ` · <a href="https://doi.org/${p.doi}">doi:${p.doi}</a>` : '') + (p.pdf ? ` · <a href="${p.pdf}">PDF</a>` : '');
  return li;
}
loadPubs();
