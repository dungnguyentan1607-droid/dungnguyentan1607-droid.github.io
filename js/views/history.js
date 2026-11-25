Views.history = function (root) {
  const h = Store.get().history;
  const avg = h.length ? Math.round(h.reduce((a, x) => a + x.pct, 0) / h.length) : 0;
  root.innerHTML = `
  <div class="page-head"><div><div class="eyebrow">Lịch sử</div><h1 class="page-title">Lịch sử làm bài</h1>
    <p class="page-sub">${h.length} lần làm · điểm trung bình ${avg}%</p></div></div>
  <div class="card" style="padding:8px">${h.map(x => `<div class="vrow" style="grid-template-columns:1.6fr 1fr 1fr 1fr"><div class="en">${U.esc(x.title)}</div><div class="muted">${U.fmtDate(x.t)}</div><div>${x.score}/${x.total} ${x.unit || 'câu'}</div><div style="font-weight:800;color:${x.pct >= 80 ? 'var(--ok)' : x.pct >= 50 ? 'var(--warn)' : 'var(--bad)'}">${x.pct}%</div></div>`).join('') || '<p class="muted" style="padding:20px">Chưa có bài nào. <a class="pill-link" href="#/on-tap">Bắt đầu ôn tập →</a></p>'}</div>`;
};
