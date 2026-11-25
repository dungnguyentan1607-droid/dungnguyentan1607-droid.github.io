/* Học liệu: danh sách từ + flashcard. Route: #/hoc-lieu[/uN[/gM]] */
Views.vocab = function (root, args) {
  let unit = args[0] ? +args[0].replace('u', '') : 0;
  let grp = args[1] != null && args[1] !== '' ? +String(args[1]).replace('g', '') : null;
  let q = '', hideVi = false, mode = 'list', fi = 0, flip = false, onlyUnknown = false, shuffled = false, order = null;
  const s = Store.get();
  const filtered = () => {
    let l = DATA.vocab.filter(v => !unit || v.unit === unit);
    if (grp != null && unit) l = l.slice(grp * 10, grp * 10 + 10);
    if (onlyUnknown) l = l.filter(v => !s.known[v.id]);
    if (q) { const t = q.toLowerCase(); l = l.filter(v => v.en.toLowerCase().includes(t) || v.vi.toLowerCase().includes(t)); }
    if (shuffled && mode === 'flash') { if (!order) order = {}; l = l.slice().sort((a, b) => (order[a.id] = order[a.id] || Math.random()) - (order[b.id] = order[b.id] || Math.random())); }
    return l;
  };
  function draw() {
    const list = filtered();
    root.innerHTML = `
    <div class="page-head"><div><div class="eyebrow">Học liệu</div><h1 class="page-title">Từ vựng</h1>
      <p class="page-sub">${DATA.vocab.length} từ/cụm từ. Bấm vào dòng để đánh dấu đã thuộc.</p></div>
      <div class="tabs"><button class="${mode === 'list' ? 'on' : ''}" data-m="list">Danh sách</button><button class="${mode === 'flash' ? 'on' : ''}" data-m="flash">Flashcard</button></div></div>
    <div class="card" style="margin-bottom:20px;display:flex;gap:12px;flex-wrap:wrap;align-items:center">
      <input class="field" id="q" placeholder="Tìm từ hoặc nghĩa…" value="${U.esc(q)}">
      <div class="chips">
        <button class="chip ${!unit ? 'on' : ''}" data-u="0">Tất cả</button>
        ${DATA.units.map(u => `<button class="chip ${unit === u.id ? 'on' : ''}" data-u="${u.id}">${u.id === 7 ? 'Bổ sung' : 'Unit ' + u.id}</button>`).join('')}
      </div>
      <button class="chip ${hideVi ? 'on' : ''}" id="hide">Ẩn nghĩa</button>
      <button class="chip ${onlyUnknown ? 'on' : ''}" id="unk">Chỉ từ chưa thuộc</button>
    </div>
    <div class="card ${hideVi ? 'hide-vi' : ''}" id="body" style="padding:8px"></div>`;
    const body = root.querySelector('#body');
    if (mode === 'list') {
      body.innerHTML = list.map(v => `<div class="vrow" data-id="${v.id}"><div class="en">${U.esc(v.en)} ${v.pos ? `<span class="muted" style="font-weight:400">(${U.esc(v.pos)})</span>` : ''} <span class="ipa">${U.esc(v.ipa)}</span></div><div class="vi">${U.esc(v.vi)}</div><button class="btn sm ${s.known[v.id] ? 'primary' : ''}" data-k="${v.id}">${s.known[v.id] ? '✓ Đã thuộc' : 'Chưa thuộc'}</button></div>`).join('') || '<p class="muted" style="padding:20px">Không có từ nào.</p>';
      body.querySelectorAll('[data-k]').forEach(b => b.onclick = e => { e.stopPropagation(); const on = Store.toggleKnown(b.dataset.k); b.classList.toggle('primary', on); b.textContent = on ? '✓ Đã thuộc' : 'Chưa thuộc'; });
      body.querySelectorAll('.vi').forEach(el => el.onclick = () => el.style.filter = el.style.filter ? '' : 'none');
    } else {
      if (fi >= list.length) fi = 0;
      const v = list[fi];
      body.style.padding = '30px';
      body.innerHTML = v ? `<div class="flash"><div class="muted" style="text-align:center">${fi + 1} / ${list.length}</div>
        <div class="flash-card" id="fc">${flip ? U.esc(v.vi) : U.esc(v.en) + (v.ipa ? `<small>${U.esc(v.ipa)}</small>` : '')}</div>
        <div style="display:flex;justify-content:center;gap:12px;margin-top:20px;flex-wrap:wrap">
          <button class="btn" id="prev">← Trước</button><button class="btn" id="shuf">Xáo trộn</button>
          <button class="btn ${s.known[v.id] ? 'primary' : ''}" id="kn">${s.known[v.id] ? '✓ Đã thuộc' : 'Đã thuộc'}</button><button class="btn" id="next">Sau →</button></div></div>` : '<p class="muted">Không có từ nào.</p>';
      if (v) {
        body.querySelector('#fc').onclick = () => { flip = !flip; draw(); };
        body.querySelector('#prev').onclick = () => { fi = (fi - 1 + list.length) % list.length; flip = false; draw(); };
        body.querySelector('#next').onclick = () => { fi = (fi + 1) % list.length; flip = false; draw(); };
        body.querySelector('#shuf').onclick = () => { shuffled = !shuffled; fi = 0; flip = false; draw(); };
        body.querySelector('#kn').onclick = () => { Store.toggleKnown(v.id); draw(); };
      }
    }
    root.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { mode = b.dataset.m; fi = 0; flip = false; draw(); });
    root.querySelectorAll('[data-u]').forEach(b => b.onclick = () => { unit = +b.dataset.u; grp = null; fi = 0; draw(); });
    root.querySelector('#hide').onclick = () => { hideVi = !hideVi; draw(); };
    root.querySelector('#unk').onclick = () => { onlyUnknown = !onlyUnknown; draw(); };
    const qi = root.querySelector('#q'); qi.oninput = () => { q = qi.value; const pos = qi.selectionStart; draw(); const n = root.querySelector('#q'); n.focus(); n.setSelectionRange(pos, pos); };
  }
  draw();
};
