/* ============================================================
   App — router, navigasi, pencarian global, tema
   ============================================================ */
window.App = (function () {

  const ROUTES = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', sub: 'Ringkasan aktivitas klinik hari ini', view: () => ViewDashboard },
    { id: 'reservasi', label: 'Reservasi', icon: 'calendar', sub: 'Kelola seluruh jadwal kunjungan pasien', view: () => ViewReservasi },
    { id: 'pasien', label: 'Pasien', icon: 'users', sub: 'Data master pasien klinik', view: () => ViewPasien },
    { id: 'dokter', label: 'Dokter & Poli', icon: 'stethoscope', sub: 'Kelola dokter, jadwal praktik, dan layanan poli', view: () => ViewDokter },
    { id: 'jadwal', label: 'Jadwal', icon: 'clock', sub: 'Kalender ketersediaan dokter mingguan', view: () => ViewJadwal },
    { id: 'laporan', label: 'Laporan', icon: 'chart', sub: 'Rekap dan ekspor data reservasi', view: () => ViewLaporan },
    { id: 'pengaturan', label: 'Pengaturan', icon: 'settings', sub: 'Profil klinik, backup, dan pemulihan data', view: () => ViewPengaturan }
  ];

  let current = 'dashboard';

  /* ---------------- Router ---------------- */
  function routeId() {
    const h = (location.hash || '').replace(/^#\/?/, '').split('?')[0];
    return ROUTES.some(r => r.id === h) ? h : 'dashboard';
  }

  function navigate() {
    const id = routeId();
    current = id;
    const r = ROUTES.find(x => x.id === id);
    document.getElementById('pageTitle').textContent = r.label;
    document.getElementById('pageSub').textContent = r.sub;
    markActive();
    const view = document.getElementById('view');
    view.innerHTML = '';
    view.scrollIntoView ? window.scrollTo({ top: 0, behavior: 'smooth' }) : null;
    try {
      r.view().render(view);
    } catch (e) {
      console.error(e);
      view.innerHTML = '<div class="card">' + UI.emptyState('alert', 'Terjadi kesalahan', String(e && e.message || e)) + '</div>';
    }
    closeSidebar();
  }

  function rerender() { navigate(); }

  /* ---------------- Sidebar ---------------- */
  function buildNav() {
    const nav = document.getElementById('nav');
    nav.innerHTML =
      '<div class="nav-label">Menu Utama</div>' +
      ROUTES.slice(0, 5).map(r => navItem(r)).join('') +
      '<div class="nav-label">Laporan & Sistem</div>' +
      ROUTES.slice(5).map(r => navItem(r)).join('');
  }

  function navItem(r) {
    return '<button class="nav-item" data-route="' + r.id + '">' +
      UI.icon(r.icon, 19) + '<span>' + r.label + '</span></button>';
  }

  function markActive() {
    document.querySelectorAll('.nav-item').forEach(b => {
      b.classList.toggle('active', b.dataset.route === current);
    });
  }

  function openSidebar() {
    document.getElementById('sidebar').classList.add('open');
    document.getElementById('sidebarScrim').classList.add('show');
  }
  function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarScrim').classList.remove('show');
  }

  /* ---------------- Identitas / tema ---------------- */
  function applyIdentity() {
    const p = Store.get().pengaturan;
    document.title = p.namaKlinik + ' — Sistem Reservasi';
    const av = document.getElementById('profileAvatar');
    av.textContent = UI.inisial(p.namaAdmin || 'Admin');
    av.style.background = 'linear-gradient(140deg,' + UI.warnaDariNama(p.namaAdmin) + ',#ffffff55)';
    document.getElementById('profileSub').textContent = p.jabatanAdmin || 'Petugas Registrasi';
    document.getElementById('todayChip').textContent = UI.hariIniLabel();
  }

  function applyTheme(tema) {
    document.documentElement.setAttribute('data-theme', tema);
    Store.update(st => { st.pengaturan.tema = tema; });
  }

  /* ---------------- Pencarian global ---------------- */
  function setupSearch() {
    const input = document.getElementById('globalSearch');
    const box = document.getElementById('searchResults');

    function close() { box.classList.remove('open'); box.innerHTML = ''; }

    function cari(q) {
      const s = Store.get();
      q = q.toLowerCase().trim();
      if (q.length < 2) { close(); return; }

      const hasilPs = s.pasien.filter(p => (p.nama + ' ' + (p.nik || '') + ' ' + (p.noRm || '')).toLowerCase().indexOf(q) !== -1).slice(0, 6);
      const hasilRes = s.reservasi.filter(r => {
        const ps = Store.pasien(r.pasienId);
        const dk = Store.dokter(r.dokterId);
        return ((r.kode || '') + ' ' + (ps ? ps.nama : '') + ' ' + (dk ? dk.nama : '')).toLowerCase().indexOf(q) !== -1;
      }).slice(0, 6);

      let html = '';
      if (hasilPs.length) {
        html += '<div class="sr-group">Pasien</div>' + hasilPs.map(p =>
          '<div class="sr-item" data-nav="pasien"><div>' + UI.avatar(p.nama, 'sm') + '</div>' +
          '<div style="flex:1;min-width:0"><div class="sr-main">' + UI.esc(p.nama) + '</div>' +
          '<div class="sr-sub">' + UI.esc(p.noRm) + ' · ' + UI.esc(p.telepon || '-') + '</div></div>' +
          '<span class="badge b-netral">' + UI.esc(p.golongan || 'Reguler') + '</span></div>').join('');
      }
      if (hasilRes.length) {
        html += '<div class="sr-group">Reservasi</div>' + hasilRes.map(r => {
          const ps = Store.pasien(r.pasienId), dk = Store.dokter(r.dokterId);
          return '<div class="sr-item" data-nav="reservasi"><div class="stat-ico" style="width:32px;height:32px;border-radius:11px;background:linear-gradient(140deg,var(--primary),var(--lilac))">' +
            UI.icon('calendar', 15) + '</div>' +
            '<div style="flex:1;min-width:0"><div class="sr-main">' + UI.esc(ps ? ps.nama : '-') + '</div>' +
            '<div class="sr-sub">' + UI.esc(r.kode) + ' · ' + UI.fmtTanggalPendek(r.tanggal) + ' ' + r.waktu + ' · ' + UI.esc(dk ? dk.nama : '') + '</div></div>' +
            ViewReservasi.badge(r.status) + '</div>';
        }).join('');
      }
      if (!html) html = '<div class="sr-item" style="justify-content:center;color:var(--muted);font-size:12.5px">Tidak ada hasil untuk "' + UI.esc(q) + '"</div>';

      box.innerHTML = html;
      box.classList.add('open');
      box.querySelectorAll('.sr-item[data-nav]').forEach(it => it.addEventListener('click', () => {
        location.hash = '#/' + it.dataset.nav;
        input.value = ''; close();
      }));
    }

    let t;
    input.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => cari(input.value), 200); });
    input.addEventListener('focus', () => { if (input.value.trim().length >= 2) cari(input.value); });
    document.addEventListener('click', e => { if (!e.target.closest('.search-wrap')) close(); });
    input.addEventListener('keydown', e => { if (e.key === 'Escape') { input.value = ''; close(); input.blur(); } });
  }

  /* ---------------- Shortcut ---------------- */
  function setupShortcuts() {
    document.addEventListener('keydown', e => {
      const tag = (e.target.tagName || '').toLowerCase();
      const ketik = tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable;
      if (e.key === '/' && !ketik) {
        e.preventDefault();
        document.getElementById('globalSearch').focus();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n' && !ketik) {
        e.preventDefault();
        ViewReservasi.openForm();
      }
    });
  }

  /* ---------------- Init ---------------- */
  function init() {
    Store.load();

    const tema = (Store.get().pengaturan && Store.get().pengaturan.tema) ||
      (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', tema);

    buildNav();
    applyIdentity();
    setupSearch();
    setupShortcuts();

    document.getElementById('nav').addEventListener('click', e => {
      const b = e.target.closest('[data-route]');
      if (b) location.hash = '#/' + b.dataset.route;
    });

    document.getElementById('menuBtn').addEventListener('click', openSidebar);
    document.getElementById('sidebarClose').addEventListener('click', closeSidebar);
    document.getElementById('sidebarScrim').addEventListener('click', closeSidebar);
    document.getElementById('btnNewReservasi').addEventListener('click', () => ViewReservasi.openForm());

    document.getElementById('themeToggle').addEventListener('click', () => {
      const now = document.documentElement.getAttribute('data-theme');
      applyTheme(now === 'dark' ? 'light' : 'dark');
    });

    window.addEventListener('hashchange', navigate);
    if (!location.hash) location.hash = '#/dashboard';
    navigate();
  }

  document.addEventListener('DOMContentLoaded', init);

  return { rerender: rerender, navigate: navigate, applyIdentity: applyIdentity };
})();
