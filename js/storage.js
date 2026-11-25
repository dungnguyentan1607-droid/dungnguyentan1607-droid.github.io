/* Lưu tiến độ bằng localStorage (an toàn khi bị chặn) */
window.Store = (function () {
  const KEY = 'bizenglish.v1';
  let mem = null;
  const blank = () => ({ history: [], wrong: {}, known: {}, box: {}, notebook: [], reports: [], days: {}, nodeDone: {}, seen: {} });
  function load() {
    if (mem) return mem;
    try { mem = Object.assign(blank(), JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { mem = blank(); }
    return mem;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) { } }
  const api = {
    get: () => load(),
    save,
    touchDay() { const s = load(); const d = new Date().toISOString().slice(0, 10); s.days[d] = (s.days[d] || 0) + 1; save(); },
    streak() {
      const s = load(); let n = 0; const d = new Date();
      for (; ;) { const k = d.toISOString().slice(0, 10); if (s.days[k]) { n++; d.setDate(d.getDate() - 1); } else if (n === 0) { d.setDate(d.getDate() - 1); if (!s.days[d.toISOString().slice(0, 10)]) break; } else break; }
      return n;
    },
    addHistory(rec) { const s = load(); s.history.unshift(rec); s.history = s.history.slice(0, 200); api.touchDay(); save(); },
    markWrong(key, ok) { const s = load(); if (ok) { if (s.wrong[key]) { s.wrong[key]--; if (s.wrong[key] <= 0) delete s.wrong[key]; } } else s.wrong[key] = (s.wrong[key] || 0) + 1; save(); },
    isSeen(kind, id) { return (load().seen[kind] || []).includes(id); },
    markSeen(kind, id) { const s = load(); const a = s.seen[kind] = s.seen[kind] || []; if (!a.includes(id)) { a.push(id); save(); } },
    pickUnseen(kind, ids) { // chọn ngẫu nhiên bài chưa làm; hết thì làm mới vòng
      const s = load(); let pool = ids.filter(id => !(s.seen[kind] || []).includes(id));
      if (!pool.length) { s.seen[kind] = []; save(); pool = ids; }
      return pool[Math.floor(Math.random() * pool.length)];
    },
    toggleKnown(id) { const s = load(); if (s.known[id]) delete s.known[id]; else s.known[id] = 1; save(); return !!s.known[id]; },
    addNotebook(item) { const s = load(); if (!s.notebook.find(x => x.en.toLowerCase() === item.en.toLowerCase())) { s.notebook.push(item); save(); return true; } return false; },
    removeNotebook(en) { const s = load(); s.notebook = s.notebook.filter(x => x.en !== en); save(); },
    report(key, note) { const s = load(); s.reports.push({ key, note: note || '', t: Date.now() }); save(); },
    exportJSON() { return JSON.stringify(load(), null, 1); },
    importJSON(txt) { const o = JSON.parse(txt); mem = Object.assign(blank(), o); save(); },
    reset() { mem = blank(); save(); }
  };
  return api;
})();
