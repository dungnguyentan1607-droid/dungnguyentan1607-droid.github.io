/* Lộ trình: sidebar 6 Unit + các node 01, 02… (mỗi node = nhóm 10 từ) */
Views.roadmap = function (root, args) {
  const units = DATA.units.filter(u => u.id <= 6);
  let uid = +args[0] || 1;
  const s = Store.get();
  const groups = id => {
    const list = DATA.vocab.filter(v => v.unit === id), g = [];
    for (let i = 0; i < list.length; i += 10) g.push(list.slice(i, i + 10));
    return g;
  };
  const prog = id => { const l = DATA.vocab.filter(v => v.unit === id); return { k: l.filter(v => s.known[v.id]).length, n: l.length }; };
  function draw() {
    const u = units.find(x => x.id === uid), gs = groups(uid), pr = prog(uid);
    root.innerHTML = `
    <div class="page-head"><div>
      <div class="eyebrow">Lộ trình từ vựng</div>
      <h1 class="page-title">Unit ${uid}</h1>
      <p class="page-sub">${U.esc(u.vi)}</p></div>
      <div class="tabs"><a class="on" href="#/lo-trinh/${uid}">Theo Unit</a><a href="#/hoc-lieu">Tất cả từ vựng</a></div></div>
    <div class="split">
      <aside class="side">
        <div class="side-head"><div class="kicker" style="color:var(--teal)">Lộ trình</div><h2>Chọn chặng học</h2><div>6 chặng từ vận hành đến chiến lược</div></div>
        <div class="side-list">${units.map(x => { const p = prog(x.id); return `<div class="lvl ${x.id === uid ? 'on' : ''}" data-u="${x.id}"><div class="badge">U${x.id}</div><div style="flex:1"><b>${U.esc(x.title)}</b><small>${p.k}/${p.n} từ đã thuộc</small><div class="bar"><i style="width:${p.n ? p.k / p.n * 100 : 0}%"></i></div></div></div>`; }).join('')}</div>
      </aside>
      <section class="panel">
        <div class="panel-head"><div class="badge">U${uid}</div><div><h2>${U.esc(u.title)}</h2><div class="muted">${pr.n} từ · ${gs.length} chủ điểm trong chặng này</div></div></div>
        <div class="test-banner"><div><h3>Kiểm tra Unit ${uid}</h3><div class="muted">30 câu trắc nghiệm, thời gian 30 phút, lấy từ các câu thuộc chặng này.</div></div><a class="btn" href="#/lam-bai/unit/${uid}">Làm bài kiểm tra →</a></div>
        <div class="path">${gs.map((g, i) => {
          const k = g.filter(v => s.known[v.id]).length, p = Math.round(k / g.length * 100);
          return `<div class="node ${p === 100 ? 'done' : ''}"><div class="ring" style="--p:${p}"><span>${U.pad(i + 1)}</span></div>
          <a class="node-card" href="#/hoc-lieu/u${uid}/g${i}"><div class="kicker">Nhóm từ</div><h3>${U.esc(g[0].en)} … ${U.esc(g[g.length - 1].en)}</h3><span class="pill-link">Học ${g.length} từ · ${k}/${g.length} đã thuộc →</span></a></div>`;
        }).join('')}</div>
      </section>
    </div>`;
    root.querySelectorAll('.lvl').forEach(el => el.onclick = () => { uid = +el.dataset.u; history.replaceState(null, '', '#/lo-trinh/' + uid); draw(); });
  }
  draw();
};
