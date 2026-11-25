/* Nối từ EN ↔ nghĩa VN. Route: #/noi-tu[/uN] */
Views.matching = function (root, args) {
  const unit = +(args[0] || 0);
  const pool = DATA.vocab.filter(v => (!unit || v.unit === unit) && v.vi.length < 60);
  let round = 0, picked = null, matched = 0, wrongs = 0, items;
  function start() {
    items = U.sample(pool, 10);
    picked = null; matched = 0; wrongs = 0; round++;
    const left = U.shuffle(items), right = U.shuffle(items);
    root.innerHTML = `
    <div class="page-head"><div><div class="eyebrow">Ôn tập · Nối từ</div><h1 class="page-title">Nối từ</h1>
      <p class="page-sub">Chọn từ tiếng Anh bên trái rồi chọn nghĩa tiếng Việt tương ứng bên phải.</p></div>
      <div class="chips"><span class="chip" id="score">Đúng 0/10 · Sai 0</span><button class="btn sm" id="again">Lượt mới</button><a class="btn sm" href="#/on-tap">Thoát</a></div></div>
    <div class="card"><div class="match"><div class="mcol" id="L">${left.map(v => `<button class="mitem" data-id="${v.id}">${U.esc(v.en)}</button>`).join('')}</div>
    <div class="mcol" id="R">${right.map(v => `<button class="mitem" data-id="${v.id}">${U.esc(v.vi)}</button>`).join('')}</div></div></div>`;
    root.querySelector('#again').onclick = start;
    const L = root.querySelectorAll('#L .mitem'), R = root.querySelectorAll('#R .mitem');
    const upd = () => root.querySelector('#score').textContent = `Đúng ${matched}/10 · Sai ${wrongs}`;
    L.forEach(b => b.onclick = () => { L.forEach(x => x.classList.remove('sel')); b.classList.add('sel'); picked = b; });
    R.forEach(b => b.onclick = () => {
      if (!picked) { U.toast('Hãy chọn từ tiếng Anh bên trái trước'); return; }
      if (picked.dataset.id === b.dataset.id) {
        picked.classList.remove('sel'); picked.classList.add('ok'); b.classList.add('ok'); picked = null; matched++; Store.markWrong('m:' + b.dataset.id, true);
        if (matched === 10) { Store.addHistory({ t: Date.now(), title: 'Nối từ', type: 'matching', pct: Math.max(0, Math.round((10 - wrongs) / 10 * 100)), score: 10, total: 10 + wrongs }); U.toast('Hoàn thành! 🎉'); }
      } else { b.classList.add('bad'); setTimeout(() => b.classList.remove('bad'), 350); wrongs++; Store.markWrong('v:' + picked.dataset.id, false); }
      upd();
    });
  }
  start();
};
