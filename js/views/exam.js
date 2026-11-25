/* Engine làm bài kiểu IELTS (computer-delivered). Route: #/lam-bai/<kind>[/arg]
   kind: trac-nghiem[/unit] | duc-lo[/id] | doc-hieu[/id] | kiem-tra | unit/N | cau-sai
         phan-nghe[/lNN] | phan-doc[/tNN] | phan-viet[/wNN] */
Views.exam = function (root, args) {
  const kind = args[0] || 'kiem-tra', arg = args[1];
  const D = DATA;
  const NOSHUF = /^(all|both|none|neither)\b/i;
  const SPEECH = 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
  const TFNG = ['T', 'F', 'NG'], TFO = ['True', 'False', 'Not Given'];
  const SUBH = { mcq: 'Choose the best answer, A, B, C or D.', tf: 'Decide if each statement is True or False.', tfng: 'Decide if each statement is True, False or Not Given.', gap: 'Complete the notes. Write ONE WORD ONLY for each answer.' };
  const fmt = U.esc, fmt1 = n => (Math.round(n * 10) / 10).toString();

  /* ---------- Dựng đề ---------- */
  function mcqQ(m) {
    let opts = m.options.map((t, i) => ({ t, ok: i === m.answer }));
    if (!opts.some(o => NOSHUF.test(o.t))) opts = U.shuffle(opts);
    return { key: 'm:' + m.id, kind: 'mcq', stem: m.stem, options: opts.map(o => o.t), answer: opts.findIndex(o => o.ok), explain: m.explain, extra: m.extra || [], unit: m.unit };
  }
  function readParts(r) {
    return {
      type: 'read', title: r.title, passage: r.passage, extra: r.extra || [],
      qs: r.questions.map((q, i) => { const m = mcqQ({ id: r.id + ':' + i, stem: q.stem, options: q.options, answer: q.answer, explain: q.explain, unit: r.unit }); m.key = 'r:' + r.id + ':' + i; m.kind = 'read'; return m; })
    };
  }
  function clozePart(c, limit) {
    const nums = Object.keys(c.answers);
    const use = limit ? nums.slice(0, limit) : nums;
    const qs = use.map(n => ({ key: 'c:' + c.id + ':' + n, kind: 'cloze', n, answer: c.answers[n], explain: (c.explain || {})[n] || '', extra: [], unit: c.unit }));
    return { type: 'cloze', label: 'Reading – Gap fill', title: c.title, text: c.text, answers: c.answers, wordBank: U.shuffle(c.wordBank.concat(c.distractors || [])), qs, extra: c.extra || [] };
  }
  function mcqPart(n, label) { return { type: 'mcq', label, title: 'Chọn đáp án đúng nhất', qs: U.sample(D.mcq, n).map(mcqQ), extra: [] }; }
  function listenPart(l) {
    const qs = [], sents = l.script.split(/(?<=[.!?])\s+/);
    l.mcq.forEach((m, i) => { const q = mcqQ({ id: l.id + ':m' + i, stem: m.q, options: m.o, answer: m.a, explain: m.e, unit: l.unit }); q.key = 'l:' + l.id + ':m' + i; q.sub = 'mcq'; qs.push(q); });
    l.tf.forEach((t, i) => qs.push({ key: 'l:' + l.id + ':t' + i, kind: 'mcq', sub: 'tf', stem: t.q, options: ['True', 'False'], answer: t.a ? 0 : 1, explain: t.e, extra: [], unit: l.unit }));
    let gi = 0;
    const notes = l.notes.replace(/\{\{([^}]+)\}\}/g, (m, w) => {
      const re = new RegExp('\\b' + w + '\\b', 'i');
      qs.push({ key: 'l:' + l.id + ':g' + gi, kind: 'gap', sub: 'gap', gi, answer: w, explain: 'Trong bài nghe: "' + (sents.find(s => re.test(s)) || '') + '"', extra: [], unit: l.unit });
      return '{{' + (gi++) + '}}';
    });
    const segs = notes.split(/(?<=[.;])\s+/);
    qs.filter(q => q.kind === 'gap').forEach(q => { q.stem = (segs.find(s => s.includes('{{' + q.gi + '}}')) || '').replace(/\{\{(\d+)\}\}/g, (m, n) => +n === q.gi ? '_____' : '___'); });
    return { type: 'listen', label: 'Listening', title: l.title, lesson: l, notes, qs, extra: l.extra || [] };
  }
  function readTestPart(r) {
    const qs = [];
    r.mcq.forEach((m, i) => { const q = mcqQ({ id: r.id + ':m' + i, stem: m.q, options: m.o, answer: m.a, explain: m.e, unit: r.unit }); q.key = 'rt:' + r.id + ':m' + i; q.kind = 'read'; q.sub = 'mcq'; qs.push(q); });
    r.tf.forEach((t, i) => qs.push({ key: 'rt:' + r.id + ':t' + i, kind: 'read', sub: 'tfng', stem: t.q, options: TFO, answer: TFNG.indexOf(t.a), explain: t.e, extra: [], unit: r.unit }));
    return { type: 'read', label: 'Reading', title: r.title, passage: r.passage, extra: r.extra || [], qs };
  }
  function writePart(t) {
    return { type: 'write', label: 'Writing', title: t.title, task: t, extra: [], qs: [{ key: 'w:' + t.id, kind: 'write', stem: t.title, explain: '', extra: [], unit: 0 }] };
  }
  const pick = (k, arr, id) => { const want = id && arr.find(x => x.id === id); if (want) return want; const pid = Store.pickUnseen(k, arr.map(y => y.id)); return arr.find(x => x.id === pid); };
  const pickUnit = u => D.mcq.filter(m => !u || m.unit === u);
  function build() {
    let title, parts = [], mins = 0, instant = false, grades = null, seen = [], maxPlays = 0;
    if (kind === 'trac-nghiem') {
      const u = +arg || 0; title = 'Trắc nghiệm' + (u ? ' – Unit ' + u : '');
      parts.push({ type: 'mcq', title: 'Chọn đáp án đúng nhất', qs: U.sample(pickUnit(u), 20).map(mcqQ), extra: [] }); instant = true;
    } else if (kind === 'duc-lo') {
      const c = arg ? D.cloze.find(x => x.id === arg) : U.sample(D.cloze, 1)[0]; title = 'Bài đọc đục lỗ'; if (c) parts.push(clozePart(c));
    } else if (kind === 'doc-hieu') {
      const r = arg ? D.reading.find(x => x.id === arg) : U.sample(D.reading, 1)[0]; title = 'Đọc hiểu'; instant = true; if (r) parts.push(readParts(r));
    } else if (kind === 'unit') {
      const u = +arg; title = 'Kiểm tra Unit ' + u; mins = 30;
      parts.push({ type: 'mcq', title: 'Trắc nghiệm', qs: U.sample(pickUnit(u), 30).map(mcqQ), extra: [] });
    } else if (kind === 'cau-sai') {
      const ids = Object.keys(Store.get().wrong).filter(k => k[0] === 'm').map(k => k.slice(2)); title = 'Ôn câu đã sai'; instant = true;
      parts.push({ type: 'mcq', title: 'Các câu từng làm sai', qs: U.sample(D.mcq.filter(m => ids.includes(m.id)), 30).map(mcqQ), extra: [] });
    } else if (kind === 'phan-nghe') {
      const l = pick('listen', D.listening, arg); title = 'Luyện nghe'; if (l) { parts.push(listenPart(l)); seen.push(['listen', l.id]); }
    } else if (kind === 'phan-doc') {
      const c = pick('cloze', D.cloze), r = pick('readtest', D.readtest, arg); title = 'Luyện đọc (20 câu)'; mins = 25;
      if (c && r) { parts.push(clozePart(c, 10), readTestPart(r)); seen.push(['cloze', c.id], ['readtest', r.id]); }
    } else if (kind === 'phan-viet') {
      const w = pick('write', D.writing.tasks, arg); title = 'Luyện viết'; mins = 30;
      if (w) { parts.push(writePart(w)); seen.push(['write', w.id]); grades = [{ name: 'Writing', pts: 20, parts: [0], write: true }]; }
    } else { // kiem-tra tổng hợp: Nghe – Đọc – Trắc nghiệm – Viết
      title = 'Bài kiểm tra tổng hợp'; mins = 100; maxPlays = 5;
      const l = pick('listen', D.listening), c = pick('cloze', D.cloze), r = pick('readtest', D.readtest), w = pick('write', D.writing.tasks);
      if (l) { parts.push(listenPart(l)); seen.push(['listen', l.id]); }
      if (c) { parts.push(clozePart(c, 10)); seen.push(['cloze', c.id]); }
      if (r) { parts.push(readTestPart(r)); seen.push(['readtest', r.id]); }
      parts.push(mcqPart(30, 'Language Knowledge'));
      if (w) { parts.push(writePart(w)); seen.push(['write', w.id]); }
      const ix = t => parts.map((p, i) => p.type === t ? i : -1).filter(i => i >= 0);
      grades = [{ name: 'Listening', pts: 25, parts: ix('listen') }, { name: 'Reading', pts: 25, parts: ix('cloze').concat(ix('read')) }, { name: 'Language Knowledge', pts: 30, parts: ix('mcq') }, { name: 'Writing', pts: 20, parts: ix('write'), write: true }];
    }
    parts = parts.filter(p => p.qs.length);
    let no = 1; parts.forEach((p, pi) => p.qs.forEach(q => { q.no = no++; q.part = pi; }));
    return { title, parts, secs: mins * 60, instant, grades, max: grades ? grades.reduce((a, g) => a + g.pts, 0) : 0, seen, maxPlays };
  }
  const S = build();
  const all = S.parts.flatMap(p => p.qs);
  const autoQs = all.filter(q => q.kind !== 'write');
  if (!all.length) { root.innerHTML = `<div class="card"><h3>Chưa có câu hỏi cho dạng bài này.</h3><p class="muted">Dữ liệu chưa được nạp hoặc bạn chưa có câu sai nào.</p><a class="btn" href="#/on-tap">← Về Ôn tập</a></div>`; return; }

  /* ---------- Trạng thái ---------- */
  const ans = {}, flag = {}; let cur = 0, active = null, fs = 17, left = S.secs, t0 = Date.now(), iv = null, done = false, locked = {};
  const isText = q => q.kind === 'cloze' || q.kind === 'gap';
  const isFilled = q => q.kind === 'write' ? String(ans[q.key] || '').trim().length > 0 : (ans[q.key] != null && String(ans[q.key]).trim() !== '');

  /* ---------- Âm thanh (Web Speech API) ---------- */
  const A = { state: 'idle', idx: 0, plays: 0, gen: 0, rate: 1, voice: '', sents: [] };
  const lessonPart = S.parts.find(p => p.type === 'listen');
  if (lessonPart) A.sents = lessonPart.lesson.script.split(/(?<=[.!?])\s+/);
  const enVoices = () => SPEECH ? speechSynthesis.getVoices().filter(v => /^en/i.test(v.lang)) : [];
  function pickVoice() { const vs = enVoices(); return vs.find(v => v.voiceURI === A.voice) || vs.find(v => /en-GB/i.test(v.lang)) || vs.find(v => /en-US/i.test(v.lang)) || vs[0]; }
  function stopAudio() { A.gen++; A.state = 'idle'; A.idx = 0; if (SPEECH) speechSynthesis.cancel(); }
  function speakFrom(i) {
    speechSynthesis.cancel(); A.idx = i; A.state = 'play'; const gen = ++A.gen;
    (function next() {
      if (gen !== A.gen) return;
      if (A.idx >= A.sents.length) { A.state = 'idle'; A.idx = 0; audUI(); return; }
      const u = new SpeechSynthesisUtterance(A.sents[A.idx]), v = pickVoice();
      if (v) u.voice = v; u.lang = v ? v.lang : 'en-GB'; u.rate = A.rate;
      u.onend = () => { if (gen === A.gen) { A.idx++; next(); } };
      u.onerror = () => { if (gen === A.gen) { A.state = 'idle'; audUI(); } };
      speechSynthesis.speak(u); audUI();
    })();
  }
  function audPlay() {
    if (!SPEECH) return;
    if (A.state === 'play') { A.gen++; speechSynthesis.cancel(); A.state = 'pause'; }
    else if (A.state === 'pause') { speakFrom(A.idx); }
    else { if (S.maxPlays && A.plays >= S.maxPlays) { U.toast('Bạn đã dùng hết lượt nghe'); return; } A.plays++; speakFrom(0); }
    audUI();
  }
  function audStop() { if (A.state !== 'idle') { stopAudio(); } audUI(); }
  function audUI() {
    const b = root.querySelector('#aplay'); if (!b) return;
    b.textContent = A.state === 'play' ? '⏸ Tạm dừng' : A.state === 'pause' ? '▶ Tiếp tục' : (A.plays ? '↻ Nghe lại' : '▶ Phát');
    b.disabled = A.state === 'idle' && S.maxPlays && A.plays >= S.maxPlays;
    const st = root.querySelector('#astat'); if (st) st.textContent = S.maxPlays ? `Lượt nghe: ${A.plays}/${S.maxPlays}` : (A.plays ? `Đã nghe ${A.plays} lần` : '');
    const pg = root.querySelector('#aprog'); if (pg) pg.style.width = (A.state === 'idle' ? 0 : A.idx / A.sents.length * 100) + '%';
  }
  function voiceOpts() { const sel = root.querySelector('#avoice'); if (!sel) return; const vs = enVoices(), cv = pickVoice(); sel.innerHTML = vs.map(v => `<option value="${fmt(v.voiceURI)}" ${cv && cv.voiceURI === v.voiceURI ? 'selected' : ''}>${fmt(v.name)} (${fmt(v.lang)})</option>`).join('') || '<option>Không có giọng tiếng Anh</option>'; }
  if (SPEECH) speechSynthesis.onvoiceschanged = voiceOpts;

  /* ---------- Giao diện ---------- */
  function qHTML(q) {
    if (q.kind === 'cloze' || q.kind === 'gap' || q.kind === 'write') return '';
    const lk = locked[q.key];
    return `<div class="q ${flag[q.key] ? 'flagged' : ''}" id="q${q.no}" data-k="${q.key}">
      <div class="q-head"><span class="qno">${q.no}</span><span class="qstem">${fmt(q.stem)}</span><button class="flagbtn ${flag[q.key] ? 'on' : ''}" data-f="${q.key}" title="Đánh dấu xem lại (F)">⚑</button></div>
      <div class="opts">${q.options.map((o, i) => {
        let c = ans[q.key] === i ? 'sel' : '';
        if (lk) c += i === q.answer ? ' right' : (ans[q.key] === i ? ' wrong' : '');
        return `<label class="opt ${c}" data-k="${q.key}" data-i="${i}"><span class="ol">${U.L[i]}</span><span>${fmt(o)}</span></label>`;
      }).join('')}</div>
      ${lk ? `<div class="fb ${ans[q.key] === q.answer ? 'ok' : 'no'}"><b>${ans[q.key] === q.answer ? 'Chính xác!' : 'Chưa đúng — đáp án: ' + U.L[q.answer] + '. ' + fmt(q.options[q.answer])}</b><div>${fmt(q.explain)}</div></div>` : ''}</div>`;
  }
  function qsHTML(qs) { // chèn tiêu đề nhóm (MCQ / True-False / điền từ)
    let last = null, out = '';
    qs.forEach(q => {
      if (q.sub && q.sub !== last) { const g = qs.filter(x => x.sub === q.sub); out += `<div class="sub-h">${SUBH[q.sub]}<span>Questions ${g[0].no}–${g[g.length - 1].no}</span></div>`; last = q.sub; }
      out += qHTML(q);
    });
    return out;
  }
  function clozeHTML(p) {
    const text = fmt(p.text).replace(/\n/g, '<br>').replace(/\{\{(\d+)\}\}/g, (m, n) => {
      const q = p.qs.find(x => x.n === n); if (!q) return `<b>${fmt((p.answers || {})[n] || '')}</b>`;
      return `<span class="blank ${active === q.key ? 'act' : ''} ${isFilled(q) ? 'fill' : ''}" data-b="${q.key}"><i>${q.no}</i>${isFilled(q) ? fmt(ans[q.key]) : ''}</span>`;
    });
    return { passage: `<div class="passage"><h2>${fmt(p.title)}</h2><p>${text}</p></div>`, bank: `<div class="bank"><div class="bank-t">Word Bank</div><div class="bank-w">${p.wordBank.map(w => `<button class="word ${Object.values(ans).includes(w) ? 'used' : ''}" data-w="${fmt(w)}">${fmt(w)}</button>`).join('')}</div><p class="hint">Bấm vào ô trống, rồi bấm từ để điền. Mỗi từ chỉ dùng một lần. Bấm lại ô đã điền để xóa.</p></div>` };
  }
  /* Bảng phát âm nổi: kéo được, thu nhỏ được, không chiếm chỗ của câu hỏi */
  let awMin = false, awPos = null, hideBanner = false;
  function audioHTML(p) {
    if (!SPEECH) return `<div class="aw-h" id="awh"><span class="aw-grip">⠿</span><span class="aw-t">🎧 Không hỗ trợ đọc tự động – dùng Chrome/Edge hoặc đọc transcript</span><button class="aw-x" id="awmin">${awMin ? '+' : '–'}</button></div><div class="aw-b"><div class="aud-script">${fmt(p.lesson.script)}</div></div>`;
    return `<div class="aw-h" id="awh"><span class="aw-grip" title="Kéo để di chuyển">⠿</span><button class="abtn main sm" id="aplay">▶ Phát</button><span class="aw-t">🎧 ${fmt(p.title)}</span><span id="astat" class="astat"></span><button class="aw-x" id="awmin" title="Thu nhỏ / mở rộng">${awMin ? '+' : '–'}</button></div>
      <div class="aw-b"><div class="aud-c"><button class="abtn sm" id="astop">⏹ Dừng</button>
        <label>Tốc độ <select id="aspd">${[0.8, 0.9, 1, 1.1, 1.25].map(r => `<option value="${r}" ${A.rate === r ? 'selected' : ''}>${r}×</option>`).join('')}</select></label>
        <label>Giọng <select id="avoice"></select></label></div>
        <div class="aud-bar"><i id="aprog"></i></div>
        ${S.maxPlays ? '' : `<details class="aud-d"><summary>Xem transcript (nên xem sau khi làm bài)</summary><div class="aud-script">${fmt(p.lesson.script)}</div></details>`}</div>`;
  }
  function renderAud() {
    const aw = root.querySelector('#aw'); if (!aw || !lessonPart) return;
    aw.innerHTML = audioHTML(lessonPart); aw.classList.toggle('min', awMin);
    if (awPos) { aw.style.left = awPos.x + 'px'; aw.style.top = awPos.y + 'px'; aw.style.right = 'auto'; aw.style.bottom = 'auto'; }
    const g = id => aw.querySelector(id);
    if (g('#aplay')) { g('#aplay').onclick = audPlay; g('#astop').onclick = audStop; g('#aspd').onchange = e => { A.rate = +e.target.value; }; g('#avoice').onchange = e => { A.voice = e.target.value; }; voiceOpts(); audUI(); }
    g('#awmin').onclick = () => { awMin = !awMin; aw.classList.toggle('min', awMin); g('#awmin').textContent = awMin ? '+' : '–'; };
    g('#awh').onpointerdown = e => {
      if (e.target.closest('button')) return;
      const r = aw.getBoundingClientRect(), dx = e.clientX - r.left, dy = e.clientY - r.top;
      const mv = ev => { awPos = { x: Math.max(0, Math.min(innerWidth - 80, ev.clientX - dx)), y: Math.max(0, Math.min(innerHeight - 40, ev.clientY - dy)) }; aw.style.left = awPos.x + 'px'; aw.style.top = awPos.y + 'px'; aw.style.right = 'auto'; aw.style.bottom = 'auto'; };
      const up = () => { removeEventListener('pointermove', mv); removeEventListener('pointerup', up); };
      addEventListener('pointermove', mv); addEventListener('pointerup', up); e.preventDefault();
    };
  }
  function gapsHTML(p) {
    const gq = p.qs.filter(q => q.kind === 'gap'); if (!gq.length) return '';
    const html = fmt(p.notes).replace(/\n/g, '<br>').replace(/\{\{(\d+)\}\}/g, (m, n) => { const q = gq[+n]; return `<span class="gapw"><i>${q.no}</i><input class="gap" data-gk="${q.key}" value="${fmt(ans[q.key] || '')}" autocomplete="off" autocapitalize="off" spellcheck="false"></span>`; });
    return `<div class="sub-h">${SUBH.gap}<span>Questions ${gq[0].no}–${gq[gq.length - 1].no}</span></div><div class="q notes">${html}</div>`;
  }
  function writeHTML(p) {
    const t = p.task, rub = D.writing.rubrics[t.topic], q = p.qs[0];
    const info = `<table class="wtab">${t.info.map(r => `<tr><th>${fmt(r[0])}</th><td>${fmt(r[1])}</td></tr>`).join('')}</table>`;
    const tips = `<details class="aud-d"><summary>Cấu trúc chấm điểm & cụm từ gợi ý</summary><ul class="wtips">${rub.items.map(i => `<li><b>${fmt(i.name)}</b> (${i.marks}) – ${fmt(i.hint)}</li>`).join('')}</ul><div class="wph">${rub.phrases.map(x => `<span>${fmt(x)}</span>`).join('')}</div></details>`;
    return { left: `<div class="passage"><h2>${fmt(t.title)}</h2><p>${fmt(t.brief)}</p>${info}${tips}</div>`, right: `<div class="wr"><div class="wr-meta"><b>Your answer</b><span id="wcount">0 từ</span><span>Gợi ý tối thiểu ${rub.minWords} từ</span></div><textarea id="wta" class="wta" spellcheck="false" placeholder="Viết bài của bạn tại đây (title, introduction, body, conclusion)…">${fmt(ans[q.key] || '')}</textarea></div>` };
  }
  function partHTML(p, pi) {
    const first = p.qs[0].no, rng = p.type === 'write' ? 'Writing task' : 'Questions ' + first + '–' + p.qs[p.qs.length - 1].no;
    const instr = p.type === 'cloze' ? 'Choose the correct word from the Word Bank for each gap. Use each word only once (some words are extra).' : p.type === 'read' ? 'Read the passage and answer the questions below.' : p.type === 'listen' ? 'Listen to the recording and answer the questions. Use the player below.' : p.type === 'write' ? 'Write your answer in the box on the right. Use the information in the task.' : 'Choose the best answer, A, B, C or D.';
    const head = hideBanner ? '' : `<div class="part-banner slim"><span><b>Part ${pi + 1}</b>${p.label ? ' · ' + fmt(p.label) : ''} · ${rng}</span><span class="instr">${instr}</span><button class="bn-x" id="bnx" title="Ẩn (hiện lại bằng nút ⓘ trên thanh trên)">✕</button></div>`;
    if (p.type === 'mcq') return head + `<div class="one-col">${qsHTML(p.qs)}</div>`;
    if (p.type === 'listen') return head + `<div class="one-col">${qsHTML(p.qs.filter(q => q.kind !== 'gap'))}${gapsHTML(p)}</div>`;
    if (p.type === 'cloze') { const c = clozeHTML(p); return head + `<div class="split-pane"><div class="pane left">${c.passage}</div><div class="gutter"></div><div class="pane right">${c.bank}</div></div>`; }
    if (p.type === 'write') { const w = writeHTML(p); return head + `<div class="split-pane"><div class="pane left wl">${w.left}</div><div class="gutter"></div><div class="pane right">${w.right}</div></div>`; }
    return head + `<div class="split-pane"><div class="pane left"><div class="passage"><h2>${fmt(p.title)}</h2>${p.passage.split(/\n+/).map(t => `<p>${fmt(t)}</p>`).join('')}</div></div><div class="gutter"></div><div class="pane right">${qsHTML(p.qs)}</div></div>`;
  }
  function paletteHTML() {
    return S.parts.map((p, pi) => `<div class="pal-part ${pi === cur ? 'on' : ''}"><span class="pal-l" data-p="${pi}">${p.label ? fmt(p.label.split(' ')[0]) : 'Part ' + (pi + 1)}</span>${p.qs.map(q => `<button class="pn ${isFilled(q) ? 'done' : ''} ${flag[q.key] ? 'fl' : ''}" data-go="${q.no}" data-p="${pi}">${q.kind === 'write' ? '✎' : q.no}</button>`).join('')}</div>`).join('');
  }
  function shell() {
    root.innerHTML = `<div class="ex" style="--fs:${fs}px">
      <div class="ex-top"><div class="ex-l"><b>biz.</b> <span>ENGLISH HUB</span></div><div class="ex-c">${fmt(S.title)}</div>
        <div class="ex-r"><span class="timer" id="timer"></span><button class="tbtn" id="tbn" title="Ẩn/hiện tiêu đề Part">ⓘ</button><button class="tbtn" id="fm" title="Giảm cỡ chữ">A−</button><button class="tbtn" id="fp" title="Tăng cỡ chữ">A+</button><button class="btn sm submit" id="submit">Nộp bài ✓</button><button class="tbtn" id="quit" title="Thoát">✕</button></div></div>
      <div class="ex-main" id="main"></div><div class="aud-float" id="aw" style="display:none"></div>
      <div class="ex-bot"><div class="pal" id="pal"></div><div class="nav2"><button class="tbtn" id="pv">←</button><button class="tbtn" id="nx">→</button></div></div></div>`;
    root.querySelector('#fm').onclick = () => { fs = Math.max(13, fs - 1); root.querySelector('.ex').style.setProperty('--fs', fs + 'px'); };
    root.querySelector('#fp').onclick = () => { fs = Math.min(26, fs + 1); root.querySelector('.ex').style.setProperty('--fs', fs + 'px'); };
    root.querySelector('#quit').onclick = () => { if (confirm('Thoát bài làm? Kết quả sẽ không được lưu.')) { stopAudio(); go('/on-tap'); } };
    root.querySelector('#submit').onclick = confirmSubmit;
    root.querySelector('#tbn').onclick = () => { hideBanner = !hideBanner; showPart(cur); };
    renderAud();
    root.querySelector('#pv').onclick = () => showPart(cur - 1);
    root.querySelector('#nx').onclick = () => showPart(cur + 1);
    showPart(0);
  }
  function showPart(i, scrollNo) {
    if (i < 0 || i >= S.parts.length) return; cur = i;
    const main = root.querySelector('#main'); main.innerHTML = partHTML(S.parts[i], i); bind(); pal();
    const aw = root.querySelector('#aw'); if (aw) { const isL = S.parts[i].type === 'listen'; aw.style.display = isL ? '' : 'none'; if (!isL && A.state === 'play') audPlay(); }
    if (scrollNo) { const el = main.querySelector('#q' + scrollNo); if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
    root.querySelector('#pv').disabled = i === 0; root.querySelector('#nx').disabled = i === S.parts.length - 1;
  }
  function pal() { root.querySelector('#pal').innerHTML = paletteHTML(); root.querySelectorAll('#pal [data-go]').forEach(b => b.onclick = () => { const p = +b.dataset.p; if (p !== cur) showPart(p, +b.dataset.go); else { const el = root.querySelector('#q' + b.dataset.go); if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' }); } }); root.querySelectorAll('#pal [data-p].pal-l').forEach(b => b.onclick = () => showPart(+b.dataset.p)); }
  function refresh() { const sc = root.querySelectorAll('.pane,.one-col'); const tops = [...sc].map(e => e.scrollTop), wy = scrollY; showPart(cur); root.querySelectorAll('.pane,.one-col').forEach((e, i) => e.scrollTop = tops[i] || 0); scrollTo(0, wy); }
  const wc = s => (String(s).trim().match(/\S+/g) || []).length;
  function bind() {
    const q = k => all.find(x => x.key === k);
    root.querySelectorAll('.opt').forEach(el => el.onclick = () => {
      const k = el.dataset.k; if (locked[k]) return; ans[k] = +el.dataset.i; active = k; if (S.instant) locked[k] = true; refresh();
    });
    root.querySelectorAll('.q').forEach(el => el.addEventListener('click', () => active = el.dataset.k));
    root.querySelectorAll('[data-f]').forEach(b => b.onclick = e => { e.stopPropagation(); flag[b.dataset.f] = !flag[b.dataset.f]; refresh(); });
    root.querySelectorAll('[data-b]').forEach(b => b.onclick = () => { const k = b.dataset.b; if (isFilled(q(k)) && active === k) { delete ans[k]; } active = k; refresh(); });
    root.querySelectorAll('.word').forEach(b => b.onclick = () => {
      const w = b.dataset.w, p = S.parts[cur];
      let k = active && p.qs.some(x => x.key === active) ? active : (p.qs.find(x => !isFilled(x)) || {}).key; if (!k) return;
      Object.keys(ans).forEach(x => { if (ans[x] === w) delete ans[x]; }); ans[k] = w;
      const nxt = p.qs.find(x => !isFilled(x)); active = nxt ? nxt.key : k; refresh();
    });
    root.querySelectorAll('.gap').forEach(inp => inp.oninput = () => { const was = isFilled(q(inp.dataset.gk)); ans[inp.dataset.gk] = inp.value; if (was !== isFilled(q(inp.dataset.gk))) pal(); });
    const ta = root.querySelector('#wta');
    if (ta) { const cnt = () => root.querySelector('#wcount').textContent = wc(ta.value) + ' từ'; cnt(); ta.oninput = () => { const k = S.parts[cur].qs[0].key, was = isFilled(q(k)); ans[k] = ta.value; cnt(); if (was !== isFilled(q(k))) pal(); }; }
    const bx = root.querySelector('#bnx'); if (bx) bx.onclick = () => { hideBanner = true; showPart(cur); };
    const g =root.querySelector('.gutter'); if (g) { // kéo chia đôi
      g.onmousedown = e => { const sp = g.parentElement, l = sp.querySelector('.left'); const mv = ev => { const r = sp.getBoundingClientRect(); l.style.flex = '0 0 ' + Math.min(75, Math.max(25, (ev.clientX - r.left) / r.width * 100)) + '%'; }; const up = () => { removeEventListener('mousemove', mv); removeEventListener('mouseup', up); }; addEventListener('mousemove', mv); addEventListener('mouseup', up); e.preventDefault(); };
    }
  }
  const onKey = e => {
    if (done || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    const k = e.key.toLowerCase(), q = all.find(x => x.key === active);
    if (q && q.options && 'abcd'.includes(k) && k.length === 1) { const i = 'abcd'.indexOf(k); if (i < q.options.length && !locked[q.key]) { ans[q.key] = i; if (S.instant) locked[q.key] = true; refresh(); } }
    else if (k === 'f' && q) { flag[q.key] = !flag[q.key]; refresh(); }
    else if (e.key === 'ArrowRight') showPart(cur + 1); else if (e.key === 'ArrowLeft') showPart(cur - 1);
  };
  addEventListener('keydown', onKey);

  /* ---------- Đồng hồ ---------- */
  function tick() {
    const el = root.querySelector('#timer'); if (!el) return;
    if (S.secs) { left = S.secs - (Date.now() - t0) / 1000; el.textContent = '⏱ ' + U.fmtTime(left) + ' còn lại'; el.classList.toggle('low', left < 300); if (left <= 0) { finish(); } }
    else el.textContent = '⏱ ' + U.fmtTime((Date.now() - t0) / 1000);
  }
  iv = setInterval(tick, 500); tick();

  /* ---------- Nộp bài & kết quả ---------- */
  function confirmSubmit() {
    const blank = all.filter(q => !isFilled(q)).length, fl = all.filter(q => flag[q.key]).length;
    const m = document.createElement('div'); m.className = 'modal';
    m.innerHTML = `<div class="modal-box"><h3>Nộp bài?</h3><p>${blank ? `Bạn còn <b>${blank}</b> câu/phần chưa trả lời.` : 'Bạn đã trả lời tất cả các câu.'}${fl ? ` Có <b>${fl}</b> câu đang đánh dấu xem lại.` : ''}</p><div class="mb"><button class="btn sm" id="no">Tiếp tục làm</button><button class="btn sm primary" id="yes">Nộp bài</button></div></div>`;
    document.body.appendChild(m); m.querySelector('#no').onclick = () => m.remove(); m.querySelector('#yes').onclick = () => { m.remove(); finish(); };
  }
  function norm(s) { return String(s || '').trim().toLowerCase(); }
  const correct = q => isText(q) ? String(q.answer).split('|').map(norm).includes(norm(ans[q.key])) : q.kind === 'write' ? false : ans[q.key] === q.answer;
  let rec = null, wmarks = 0, wGraded = false;
  const gradeGot = g => { if (g.write) return g.pts * wmarks / 20; const qs = g.parts.flatMap(i => S.parts[i].qs); return qs.length ? qs.filter(correct).length / qs.length * g.pts : 0; };
  const totalPts = () => S.grades.reduce((a, g) => a + gradeGot(g), 0);
  const verdictOf = pct => pct >= 85 ? 'Xuất sắc!' : pct >= 65 ? 'Khá tốt' : pct >= 45 ? 'Cần ôn thêm' : 'Hãy ôn lại từ vựng';
  function recUpdate() { if (rec && S.grades) { const t = totalPts(); rec.score = Math.round(t * 10) / 10; rec.total = S.max; rec.unit = 'điểm'; rec.pct = Math.round(t / S.max * 100); Store.save(); } }
  function finish() {
    if (done) return; done = true; clearInterval(iv); removeEventListener('keydown', onKey); stopAudio();
    const ok = autoQs.filter(correct).length, used = Math.round((Date.now() - t0) / 1000);
    autoQs.forEach(q => Store.markWrong(q.key, correct(q)));
    S.seen.forEach(s => Store.markSeen(s[0], s[1]));
    rec = { t: Date.now(), title: S.title, type: kind, pct: autoQs.length ? Math.round(ok / autoQs.length * 100) : 0, score: ok, total: autoQs.length, secs: used };
    Store.addHistory(rec); recUpdate();
    document.body.classList.remove('exam-mode'); results(ok, used);
  }
  function scoreHead(ok) {
    if (S.grades) return `<span>${fmt1(totalPts())}</span>/${S.max} <span style="color:var(--teal)">điểm</span>`;
    return `${ok}/${autoQs.length} <span style="color:var(--teal)">${autoQs.length ? Math.round(ok / autoQs.length * 100) : 0}%</span>`;
  }
  function gradeCards() {
    if (S.grades) return S.grades.map(g => { const got = gradeGot(g); return `<div class="card"><div class="kicker">${fmt(g.name)}</div><div class="stat">${fmt1(got)}/${g.pts}</div><div class="bar"><i style="width:${got / g.pts * 100}%"></i></div>${g.write && !wGraded ? '<div class="muted" style="margin-top:8px;font-size:14px">Chưa tự chấm — chấm ở phần Writing bên dưới</div>' : ''}</div>`; }).join('');
    return S.parts.map((p, i) => { const c = p.qs.filter(correct).length; return `<div class="card"><div class="kicker">Part ${i + 1}${p.label ? ' · ' + fmt(p.label) : ''}</div><div class="stat">${c}/${p.qs.length}</div><div class="bar"><i style="width:${c / p.qs.length * 100}%"></i></div></div>`; }).join('');
  }
  function writeReview(p) {
    const t = p.task, rub = D.writing.rubrics[t.topic], my = ans[p.qs[0].key] || '';
    return `<div class="card wr-res"><div class="kicker">Writing · ${fmt(rub.name)}</div><h3 style="margin:6px 0 12px;font-size:22px">${fmt(t.title)}</h3>
      <div class="muted" style="margin-bottom:8px">Bài của bạn · ${wc(my)} từ</div><pre class="wr-text">${my.trim() ? fmt(my) : '(bỏ trống)'}</pre>
      <h4 style="margin:22px 0 8px">Tự chấm điểm theo thang chấm</h4><p class="muted" style="margin-bottom:10px">So bài của bạn với bài mẫu, rồi chọn điểm cho từng mục. Điểm sẽ được cộng vào tổng và lưu vào lịch sử.</p>
      <table class="rub">${rub.items.map((it, i) => `<tr><td><b>${fmt(it.name)}</b><div class="muted">${fmt(it.hint)}</div></td><td class="rs"><select data-ri="${i}">${(() => { let o = ''; for (let v = 0; v <= it.marks; v += 0.5) o += `<option value="${v}">${v}</option>`; return o; })()}</select> / ${it.marks}</td></tr>`).join('')}</table>
      <div class="wsum">Điểm Writing: <b id="wsum">0</b> / 20</div>
      <details class="model" open><summary>Bài mẫu</summary><pre class="wr-text">${fmt(t.model)}</pre></details></div>`;
  }
  function results(ok, used) {
    const extras = []; const seen = {};
    S.parts.forEach(p => { (p.extra || []).concat(...p.qs.map(q => q.extra || [])).forEach(x => { if (!seen[x.en]) { seen[x.en] = 1; extras.push(x); } }); });
    const head = S.grades ? 'Điểm' : verdictOf(autoQs.length ? ok / autoQs.length * 100 : 0);
    root.innerHTML = `<div class="res">
      <div class="page-head"><div><div class="eyebrow">Kết quả</div><h1 class="page-title" id="sc">${scoreHead(ok)}</h1><p class="page-sub" id="verdict">${S.grades ? '' : head + ' · '}Thời gian: ${U.fmtTime(used)}</p></div>
        <div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn primary" onclick="location.reload()">Làm lại đề mới</button><a class="btn" href="#/on-tap">Về Ôn tập</a></div></div>
      <div class="grid g3" id="gc" style="margin-bottom:24px">${gradeCards()}</div>
      ${extras.length ? `<div class="card" style="margin-bottom:24px;background:#103c39;border-color:#1f6b63"><div class="kicker" style="color:var(--teal)">Cụm từ nên học thêm</div><div class="extras">${extras.slice(0, 16).map(x => `<div class="ex-item"><b>${fmt(x.en)}</b><span>${fmt(x.vi)}</span><button class="btn sm" data-add="${fmt(x.en)}" data-vi="${fmt(x.vi)}">+ Thêm vào sổ</button></div>`).join('')}</div></div>` : ''}
      ${autoQs.length ? '<div class="chips" style="margin-bottom:16px"><button class="chip on" data-fl="all">Tất cả</button><button class="chip" data-fl="bad">Chỉ câu sai</button></div>' : ''}
      <div id="rv">${S.parts.map((p, pi) => {
        const h = `<h3 style="margin:26px 0 12px;font-size:24px">Part ${pi + 1}${p.label ? ' · ' + fmt(p.label) : ''}: ${fmt(p.title)}</h3>`;
        if (p.type === 'write') return h + writeReview(p);
        const tr = p.type === 'listen' ? `<details class="card transcript"><summary>Transcript bài nghe</summary><p>${fmt(p.lesson.script)}</p></details>` : '';
        return h + tr + p.qs.map(q => {
          const good = correct(q), my = ans[q.key];
          const mine = isText(q) ? (isFilled(q) ? fmt(my) : '(bỏ trống)') : (my != null ? U.L[my] + '. ' + fmt(q.options[my]) : '(bỏ trống)');
          const right = isText(q) ? fmt(String(q.answer).split('|')[0]) : U.L[q.answer] + '. ' + fmt(q.options[q.answer]);
          const label = q.kind === 'cloze' ? `Chỗ trống (${q.n})` : fmt(q.stem);
          return `<div class="card rv ${good ? 'good' : 'bad'}" data-good="${good ? 1 : 0}"><div class="rv-h"><span class="qno ${good ? 'g' : 'b'}">${q.no}</span><span>${label}</span></div>
          <div class="rv-a"><div>Bạn chọn: <b class="${good ? 'tg' : 'tb'}">${mine}</b></div>${good ? '' : `<div>Đáp án đúng: <b class="tg">${right}</b></div>`}</div>
          <div class="rv-e"><b>${good ? 'Giải thích' : 'Vì sao sai / đúng'}:</b> ${fmt(q.explain || 'Chưa có giải thích.')}</div>
          <button class="btn sm" data-rep="${q.key}">⚠ Báo lỗi câu này</button></div>`;
        }).join('');
      }).join('')}</div></div>`;
    root.querySelectorAll('[data-add]').forEach(b => b.onclick = () => { U.toast(Store.addNotebook({ en: b.dataset.add, vi: b.dataset.vi }) ? 'Đã thêm vào sổ' : 'Đã có trong sổ'); });
    root.querySelectorAll('[data-rep]').forEach(b => b.onclick = () => { Store.report(b.dataset.rep, ''); U.toast('Đã ghi nhận để rà soát'); });
    root.querySelectorAll('[data-fl]').forEach(b => b.onclick = () => { root.querySelectorAll('[data-fl]').forEach(x => x.classList.toggle('on', x === b)); root.querySelectorAll('.rv').forEach(c => c.classList.toggle('hidden', b.dataset.fl === 'bad' && c.dataset.good === '1')); });
    root.querySelectorAll('[data-ri]').forEach(sel => sel.onchange = () => {
      wmarks = [...root.querySelectorAll('[data-ri]')].reduce((a, s) => a + +s.value, 0); wGraded = true;
      root.querySelector('#wsum').textContent = fmt1(wmarks);
      root.querySelector('#sc').innerHTML = scoreHead(ok); root.querySelector('#gc').innerHTML = gradeCards(); recUpdate();
      const vd = root.querySelector('#verdict'); if (vd && S.grades) vd.textContent = verdictOf(totalPts() / S.max * 100) + ' · Thời gian: ' + U.fmtTime(used);
    });
    scrollTo(0, 0);
  }
  shell();
  return () => { clearInterval(iv); removeEventListener('keydown', onKey); stopAudio(); };
};
