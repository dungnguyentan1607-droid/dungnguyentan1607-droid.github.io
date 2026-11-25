/* Công cụ: sổ từ bổ sung, đồng hồ bấm giờ, sao lưu tiến độ */
Views.tools = function (root) {
  const s = Store.get();
  let t0 = 0, acc = 0, iv = null;
  root.innerHTML = `
  <div class="page-head"><div><div class="eyebrow">Công cụ</div><h1 class="page-title">Công cụ học</h1></div></div>
  <div class="grid g2">
    <div class="card"><div class="kicker">Sổ cụm từ bổ sung</div><h3 style="font-size:26px;margin:8px 0 14px">Cụm từ cần học thêm (${s.notebook.length})</h3>
      <div id="nb">${s.notebook.map(x => `<div class="vrow" style="grid-template-columns:1fr 1.3fr auto"><div class="en">${U.esc(x.en)}</div><div>${U.esc(x.vi)}</div><button class="btn sm" data-rm="${U.esc(x.en)}">Xóa</button></div>`).join('') || '<p class="muted">Chưa có. Sau mỗi bài làm, bấm “Thêm vào sổ” ở khung cụm từ bổ sung.</p>'}</div></div>
    <div class="card"><div class="kicker">Câu đã báo lỗi (${s.reports.length})</div><p class="muted">Các câu bạn thấy đáp án/giải thích chưa đúng. Có thể xuất để gửi cho Claude sửa.</p>
      <div style="max-height:160px;overflow:auto">${s.reports.map(r => `<div class="muted">${U.esc(r.key)} · ${U.fmtDate(r.t)}</div>`).join('') || '<span class="muted">Chưa có.</span>'}</div>
      <button class="btn sm" id="rep" style="margin-top:10px" ${s.reports.length ? '' : 'disabled'}>Sao chép danh sách</button></div>
    <div class="card"><div class="kicker">Đồng hồ bấm giờ</div><div class="stat" id="sw" style="font-size:64px;margin:10px 0">00:00</div>
      <div style="display:flex;gap:10px"><button class="btn primary" id="st">Bắt đầu</button><button class="btn" id="rs">Đặt lại</button></div>
      <hr style="border:0;border-top:1px solid var(--line);margin:26px 0">
      <div class="kicker">Sao lưu tiến độ</div><p class="muted">Dữ liệu lưu trong trình duyệt này. Xuất file để chuyển sang máy khác.</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn" id="ex">Xuất file</button><label class="btn" style="cursor:pointer">Nhập file<input type="file" id="im" accept=".json" hidden></label><button class="btn" id="rst">Xóa toàn bộ</button></div></div>
  </div>`;
  root.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => { Store.removeNotebook(b.dataset.rm); Views.tools(root); });
  root.querySelector('#rep').onclick = () => { navigator.clipboard && navigator.clipboard.writeText(s.reports.map(r => r.key).join('\n')); U.toast('Đã sao chép'); };
  const sw = root.querySelector('#sw'), st = root.querySelector('#st');
  const tick = () => sw.textContent = U.fmtTime(acc + (t0 ? (Date.now() - t0) / 1000 : 0));
  st.onclick = () => { if (t0) { acc += (Date.now() - t0) / 1000; t0 = 0; clearInterval(iv); st.textContent = 'Tiếp tục'; } else { t0 = Date.now(); iv = setInterval(tick, 500); st.textContent = 'Tạm dừng'; } };
  root.querySelector('#rs').onclick = () => { t0 = 0; acc = 0; clearInterval(iv); st.textContent = 'Bắt đầu'; tick(); };
  root.querySelector('#ex').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([Store.exportJSON()], { type: 'application/json' })); a.download = 'bizenglish-backup.json'; a.click(); };
  root.querySelector('#im').onchange = e => { const f = e.target.files[0]; if (!f) return; f.text().then(t => { try { Store.importJSON(t); U.toast('Đã nhập dữ liệu'); Views.tools(root); } catch (x) { U.toast('File không hợp lệ'); } }); };
  root.querySelector('#rst').onclick = () => { if (confirm('Xóa toàn bộ tiến độ và lịch sử?')) { Store.reset(); Views.tools(root); } };
  return () => clearInterval(iv);
};
