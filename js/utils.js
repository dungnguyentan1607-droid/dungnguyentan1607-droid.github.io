/* Tiện ích dùng chung */
window.U = (function () {
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const sample = (a, n) => shuffle(a).slice(0, n);
  const pad = n => String(n).padStart(2, '0');
  const fmtTime = s => { s = Math.max(0, Math.round(s)); const m = Math.floor(s / 60); return pad(m) + ':' + pad(s % 60); };
  const fmtDate = t => { const d = new Date(t); return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()); };
  let tt;
  const toast = msg => { const el = document.getElementById('toast'); el.textContent = msg; el.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => el.classList.remove('show'), 2200); };
  const unitName = id => { const u = (DATA.units || []).find(x => x.id === id); return u ? 'Unit ' + id + ': ' + u.title : ''; };
  const vocabByEn = () => { const m = {}; (DATA.vocab || []).forEach(v => m[v.en.toLowerCase()] = v); return m; };
  const L = ['A', 'B', 'C', 'D', 'E', 'F'];
  return { esc, shuffle, sample, pad, fmtTime, fmtDate, toast, unitName, vocabByEn, L };
})();
window.Views = window.Views || {};
window.DATA = window.DATA || {};
DATA.mcq = DATA.mcq || []; DATA.cloze = DATA.cloze || []; DATA.reading = DATA.reading || [];
DATA.listening = DATA.listening || []; DATA.readtest = DATA.readtest || []; DATA.writing = DATA.writing || { rubrics: {}, tasks: [] };
