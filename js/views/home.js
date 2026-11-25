Views.home = function (root) {
  const s = Store.get();
  const total = DATA.vocab.length, known = Object.keys(s.known).length;
  const last = s.history[0];
  const wrongN = Object.keys(s.wrong).length;
  root.innerHTML = `
  <div class="page-head"><div>
    <div class="eyebrow">Business English</div>
    <h1 class="page-title">Chào mừng trở lại</h1>
    <p class="page-sub">Ôn từ vựng kinh tế – kinh doanh – quản trị và luyện đủ 4 kỹ năng Nghe – Đọc – Trắc nghiệm – Viết theo phong cách thi IELTS.</p>
  </div><a class="btn primary" href="#/lam-bai/kiem-tra">Làm bài kiểm tra tổng hợp →</a></div>
  <div class="grid g4">
    <div class="card"><div class="kicker">Chuỗi ngày học</div><div class="stat">${Store.streak()}</div><div class="muted">ngày liên tiếp</div></div>
    <div class="card"><div class="kicker">Từ đã thuộc</div><div class="stat">${known}<span class="muted" style="font-size:22px">/${total}</span></div><div class="bar"><i style="width:${total ? known / total * 100 : 0}%"></i></div></div>
    <div class="card"><div class="kicker">Điểm gần nhất</div><div class="stat">${last ? last.pct + '%' : '—'}</div><div class="muted">${last ? U.esc(last.title) : 'Chưa có bài nào'}</div></div>
    <div class="card"><div class="kicker">Câu hay sai</div><div class="stat">${wrongN}</div><a class="pill-link" href="#/lam-bai/cau-sai">Ôn lại câu sai →</a></div>
  </div>
  <div class="grid g3" style="margin-top:20px">
    <a class="card mode" href="#/lo-trinh"><span class="ico">🧭</span><h3>Lộ trình 6 Unit</h3><span class="muted">Học theo từng chặng, mỗi chặng có bài kiểm tra riêng.</span></a>
    <a class="card mode" href="#/on-tap"><span class="ico">✍️</span><h3>Ôn tập</h3><span class="muted">Nghe · Đọc · Trắc nghiệm · Viết · Nối từ · Kiểm tra tổng hợp 100 điểm.</span></a>
    <a class="card mode" href="#/hoc-lieu"><span class="ico">📚</span><h3>Học liệu</h3><span class="muted">${total} từ/cụm từ, flashcard, tự kiểm tra bằng cách ẩn nghĩa.</span></a>
  </div>`;
};
