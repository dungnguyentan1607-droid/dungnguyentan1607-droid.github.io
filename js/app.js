/* Router đơn giản bằng hash:  #/route/arg1/arg2?... */
window.Views = window.Views || {};
(function () {
  const app = document.getElementById('app');
  const routes = {
    '': 'home', 'lo-trinh': 'roadmap', 'on-tap': 'practice', 'hoc-lieu': 'vocab',
    'cong-cu': 'tools', 'lich-su': 'history', 'lam-bai': 'exam', 'noi-tu': 'matching'
  };
  let cleanup = null;
  window.go = h => { location.hash = h; };
  function render() {
    if (cleanup) { try { cleanup(); } catch (e) { } cleanup = null; }
    const parts = location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
    const name = routes[parts[0] || ''] || 'home';
    document.body.classList.toggle('exam-mode', name === 'exam');
    document.querySelectorAll('#nav a').forEach(a => {
      const r = a.dataset.r; const cur = parts[0] || 'home';
      const active = r === cur || (r === 'home' && !parts[0]) || (r === 'on-tap' && (cur === 'lam-bai' || cur === 'noi-tu'));
      a.classList.toggle('active', active);
    });
    window.scrollTo(0, 0);
    app.innerHTML = '';
    const v = Views[name];
    if (!v) { app.innerHTML = '<p class="muted">Màn hình chưa có.</p>'; return; }
    try { cleanup = v(app, parts.slice(1)) || null; } catch (e) { console.error(e); app.innerHTML = '<div class="card"><h3>Có lỗi xảy ra</h3><pre class="muted">' + U.esc(e.stack || e) + '</pre></div>'; }
  }
  window.addEventListener('hashchange', render);
  render();
})();
