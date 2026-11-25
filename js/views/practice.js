/* Trung tâm ôn tập: bài kiểm tra tổng hợp + luyện từng kỹ năng */
Views.practice = function (root) {
  const D = DATA, esc = U.esc;
  const wrong = Object.keys(Store.get().wrong).length;
  const TOPIC = { performance: 'Báo cáo hiệu quả', problem: 'Báo cáo vấn đề', complaint: 'Thư khiếu nại' };
  let unit = 0;
  const unitChips = () => `<div class="chips" style="margin:14px 0 4px"><button class="chip ${!unit ? 'on' : ''}" data-u="0">Tất cả Unit</button>${D.units.filter(u => u.id <= 6).map(u => `<button class="chip ${unit === u.id ? 'on' : ''}" data-u="${u.id}">Unit ${u.id}</button>`).join('')}</div>`;
  const item = (kind, route, id, label) => `<a class="chip ${Store.isSeen(kind, id) ? 'done' : ''}" href="#/lam-bai/${route}/${id}" title="${esc(label)}">${Store.isSeen(kind, id) ? '✓ ' : ''}${esc(label)}</a>`;
  const prog = (kind, arr) => `${arr.filter(x => Store.isSeen(kind, x.id)).length}/${arr.length} bài đã làm`;
  function draw() {
    const q = unit ? '/' + unit : '';
    root.innerHTML = `
    <div class="page-head"><div><div class="eyebrow">Ôn tập</div><h1 class="page-title">Luyện thi 4 kỹ năng</h1>
      <p class="page-sub">Giao diện làm bài mô phỏng bài thi IELTS trên máy tính: có đồng hồ, bảng số câu, đánh dấu câu cần xem lại. Mỗi lần làm, hệ thống ưu tiên bài bạn chưa làm để tránh lặp đề.</p></div></div>

    <div class="card hero-test">
      <div class="hero-l"><div class="kicker" style="color:var(--teal)">Bài kiểm tra tổng hợp · 100 điểm · 100 phút</div><h2>Nghe – Đọc – Trắc nghiệm – Viết</h2>
        <p class="muted">Mô phỏng đề thi cuối kỳ: Nghe 25 · Đọc 25 · Trắc nghiệm 30 · Viết 20 điểm. Phần nghe được nghe tối đa 5 lần. Phần viết bạn tự chấm theo thang điểm và đối chiếu bài mẫu.</p>
        <a class="btn primary" href="#/lam-bai/kiem-tra">Bắt đầu làm bài →</a></div>
      <div class="hero-r">
        <div class="skill-row"><span>🎧 Nghe</span><b>20 câu</b><em>5 trắc nghiệm · 5 đúng/sai · 10 điền từ</em><i>25đ</i></div>
        <div class="skill-row"><span>📖 Đọc</span><b>20 câu</b><em>10 đục lỗ · 5 trắc nghiệm · 5 đúng/sai/không có</em><i>25đ</i></div>
        <div class="skill-row"><span>🔘 Trắc nghiệm</span><b>30 câu</b><em>tổng hợp 6 Unit</em><i>30đ</i></div>
        <div class="skill-row"><span>✍️ Viết</span><b>1 bài</b><em>báo cáo hoặc thư khiếu nại</em><i>20đ</i></div>
      </div></div>

    <h2 class="sec-t">Luyện từng kỹ năng</h2>
    <div class="grid g2">
      <div class="card skill"><div class="skill-h"><span class="ico">🎧</span><div><h3>Nghe</h3><div class="kicker">${D.listening.length} bài · ${prog('listen', D.listening)}</div></div></div>
        <p class="muted">Nghe bài giảng ngắn (trình duyệt tự đọc bằng giọng tiếng Anh), làm 20 câu. Có thể đổi tốc độ và giọng; xem transcript sau khi làm bài.</p>
        <a class="btn sm primary" href="#/lam-bai/phan-nghe">Làm bài chưa làm →</a>
        <div class="chips">${D.listening.map(l => item('listen', 'phan-nghe', l.id, l.id.toUpperCase() + ' · ' + l.title)).join('')}</div></div>

      <div class="card skill"><div class="skill-h"><span class="ico">📖</span><div><h3>Đọc</h3><div class="kicker">${D.readtest.length} bài đọc × ${D.cloze.length} bài đục lỗ · ${prog('readtest', D.readtest)}</div></div></div>
        <p class="muted">20 câu: 10 chỗ trống (Word Bank) + bài đọc với 5 trắc nghiệm và 5 câu True / False / Not Given.</p>
        <a class="btn sm primary" href="#/lam-bai/phan-doc">Làm bài chưa làm →</a>
        <div class="chips">${D.readtest.map(r => item('readtest', 'phan-doc', r.id, r.id.toUpperCase() + ' · ' + r.title)).join('')}</div></div>

      <div class="card skill"><div class="skill-h"><span class="ico">🔘</span><div><h3>Trắc nghiệm</h3><div class="kicker">${D.mcq.length} câu · 20 câu mỗi lượt</div></div></div>
        <p class="muted">Chọn đáp án đúng nhất, xem giải thích ngay sau mỗi câu. Lọc theo Unit.</p>
        ${unitChips()}
        <a class="btn sm primary" href="#/lam-bai/trac-nghiem${q}">Làm 20 câu →</a>
        <a class="btn sm" href="#/lam-bai/unit/${unit || 1}" ${unit ? '' : 'title="Chọn Unit trước (mặc định Unit 1)"'}>Kiểm tra Unit ${unit || 1} (30 câu)</a></div>

      <div class="card skill"><div class="skill-h"><span class="ico">✍️</span><div><h3>Viết</h3><div class="kicker">${D.writing.tasks.length} đề · ${prog('write', D.writing.tasks)}</div></div></div>
        <p class="muted">Hai chủ đề: <b>Business Report</b> (báo cáo hiệu quả, báo cáo vấn đề) và <b>Complaint Letter</b> (thư khiếu nại). Mỗi đề có thang chấm 20 điểm và bài mẫu.</p>
        <a class="btn sm primary" href="#/lam-bai/phan-viet">Làm đề chưa làm →</a>
        <div class="chips">${D.writing.tasks.map(w => item('write', 'phan-viet', w.id, w.id.toUpperCase() + ' · ' + TOPIC[w.topic])).join('')}</div></div>
    </div>

    <h2 class="sec-t">Bài tập khác</h2>
    <div class="grid g4">
      <a class="card mode" href="#/noi-tu${q}"><span class="ico">🔗</span><div class="kicker">${D.vocab.length} từ</div><h3>Nối từ</h3><span class="muted">Nối từ tiếng Anh với nghĩa tiếng Việt, 10 cặp mỗi lượt.</span></a>
      <a class="card mode" href="#/lam-bai/duc-lo"><span class="ico">🧩</span><div class="kicker">${D.cloze.length} bài</div><h3>Đục lỗ</h3><span class="muted">Điền từ trong Word Bank vào đoạn văn.</span></a>
      <a class="card mode" href="#/lam-bai/doc-hieu"><span class="ico">📰</span><div class="kicker">${D.reading.length} bài</div><h3>Đọc & khoanh</h3><span class="muted">Bài đọc 5 câu, xem giải thích ngay.</span></a>
      <a class="card mode" href="#/lam-bai/cau-sai"><span class="ico">♻️</span><div class="kicker">${wrong} câu</div><h3>Ôn câu đã sai</h3><span class="muted">Luyện lại các câu bạn từng làm sai.</span></a>
    </div>`;
    root.querySelectorAll('[data-u]').forEach(b => b.onclick = () => { unit = +b.dataset.u; draw(); });
  }
  draw();
};
