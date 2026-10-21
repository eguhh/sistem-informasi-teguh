/* ============================================================
   UI — helper: format, ikon, modal, toast, grafik
   ============================================================ */
window.UI = (function () {

  const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const HARI_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const BULAN_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  const ICONS = {
    dashboard: '<path d="M4 13h6a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1z"/><path d="M14 20h6a1 1 0 0 0 1-1v-7a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1z"/><path d="M4 20h6a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1z"/><path d="M14 8h6a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1z"/>',
    calendar: '<rect x="3" y="4" width="18" height="17" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    stethoscope: '<path d="M6 2v6a5 5 0 0 0 10 0V2"/><path d="M6 3H4M16 3h2"/><path d="M11 13v3a5 5 0 0 0 10 0v-1"/><circle cx="20" cy="11" r="2"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
    chart: '<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.2.5.66.85 1.2 1.01H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/>',
    trash: '<path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5M12 15V3"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5M12 3v12"/>',
    printer: '<path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="3"/><path d="m2 7 10 6 10-6"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
    heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1L12 21l7.7-7.6 1.1-1a5.5 5.5 0 0 0 0-7.8z"/>',
    alert: '<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>',
    inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.7 1.1z"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 3v6h-6"/>',
    chevronL: '<path d="m15 18-6-6 6-6"/>',
    chevronR: '<path d="m9 18 6-6-6-6"/>',
    wallet: '<path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0 0 4h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5"/><path d="M16 12h.01"/>',
    activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
    star: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',
    sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"/>'
  };

  function icon(name, size) {
    const p = ICONS[name] || ICONS.info;
    return '<svg viewBox="0 0 24 24" width="' + (size || 18) + '" height="' + (size || 18) +
      '" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>';
  }

  function esc(v) {
    if (v === null || v === undefined) return '';
    return String(v).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  /* ---------- tanggal ---------- */
  function parseISO(iso) {
    if (!iso) return null;
    const d = new Date(iso + 'T00:00:00');
    return isNaN(d.getTime()) ? null : d;
  }
  function todayISO() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function isoOf(date) {
    return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
  }
  function addDays(iso, n) {
    const d = parseISO(iso) || new Date();
    d.setDate(d.getDate() + n);
    return isoOf(d);
  }
  function fmtTanggal(iso, style) {
    const d = parseISO(iso); if (!d) return '-';
    if (style === 'short') return d.getDate() + ' ' + BULAN_SHORT[d.getMonth()] + ' ' + d.getFullYear();
    if (style === 'day') return HARI[d.getDay()] + ', ' + d.getDate() + ' ' + BULAN[d.getMonth()] + ' ' + d.getFullYear();
    if (style === 'withDayShort') return HARI_SHORT[d.getDay()] + ', ' + d.getDate() + ' ' + BULAN_SHORT[d.getMonth()] + ' ' + d.getFullYear();
    return d.getDate() + ' ' + BULAN[d.getMonth()] + ' ' + d.getFullYear();
  }
  function fmtTanggalPendek(iso) {
    const d = parseISO(iso); if (!d) return '-';
    return d.getDate() + ' ' + BULAN_SHORT[d.getMonth()];
  }
  function hariIniLabel() {
    const d = new Date();
    return HARI[d.getDay()] + ', ' + d.getDate() + ' ' + BULAN[d.getMonth()] + ' ' + d.getFullYear();
  }
  function selisihHari(isoA, isoB) {
    const a = parseISO(isoA), b = parseISO(isoB);
    if (!a || !b) return 0;
    return Math.round((a - b) / 86400000);
  }

  /* ---------- angka ---------- */
  function rupiah(n) {
    const v = Number(n || 0);
    return 'Rp' + v.toLocaleString('id-ID');
  }
  function angka(n) { return Number(n || 0).toLocaleString('id-ID'); }

  function inisial(nama) {
    if (!nama) return '?';
    return nama.replace(/^dr\.\s*/i, '').split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }
  function warnaDariNama(nama) {
    const palet = ['#6f8bf7', '#f49ec2', '#a58cf0', '#4fc3a1', '#f0b45c', '#5cc0e8', '#f0718d'];
    let h = 0; const s = String(nama || '');
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return palet[h % palet.length];
  }
  function avatar(nama, cls) {
    return '<div class="avatar ' + (cls || '') + '" style="background:linear-gradient(140deg,' +
      warnaDariNama(nama) + ',#ffffff55)">' + esc(inisial(nama)) + '</div>';
  }

  /* ---------- toast ---------- */
  function toast(pesan, tipe) {
    const root = document.getElementById('toastRoot');
    const t = document.createElement('div');
    t.className = 'toast ' + (tipe || 'success');
    t.innerHTML = '<span class="tdot"></span><span>' + esc(pesan) + '</span>';
    root.appendChild(t);
    setTimeout(() => {
      t.classList.add('out');
      setTimeout(() => t.remove(), 260);
    }, 3200);
  }

  /* ---------- modal ---------- */
  function modal(opts) {
    const root = document.getElementById('modalRoot');
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    const size = opts.size === 'wide' ? ' wide' : (opts.size === 'slim' ? ' slim' : '');
    overlay.innerHTML =
      '<div class="modal' + size + '" role="dialog" aria-modal="true">' +
        '<div class="modal-head">' +
          '<div class="mt"><h3>' + (opts.title || '') + '</h3>' +
          (opts.sub ? '<p>' + opts.sub + '</p>' : '') + '</div>' +
          '<button class="icon-btn" data-close aria-label="Tutup">' + icon('x', 17) + '</button>' +
        '</div>' +
        '<div class="modal-body">' + (opts.body || '') + '</div>' +
        (opts.footer === null ? '' : '<div class="modal-foot">' + (opts.footer || '') + '</div>') +
      '</div>';
    root.appendChild(overlay);

    const close = () => {
      overlay.style.animation = 'fade .18s reverse';
      setTimeout(() => overlay.remove(), 170);
      document.removeEventListener('keydown', onKey);
    };
    const onKey = e => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    overlay.addEventListener('click', e => {
      if (e.target === overlay || e.target.closest('[data-close]')) close();
    });
    if (opts.onMount) opts.onMount(overlay, close);
    return { overlay: overlay, close: close };
  }

  function konfirmasi(pesan, judul) {
    return new Promise(resolve => {
      const m = modal({
        title: judul || 'Konfirmasi',
        size: 'slim',
        body: '<div class="info-box ' + (pesan.tipe || '') + '"><span class="ico">' + icon('alert', 17) + '</span><div>' + pesan.teks + '</div></div>',
        footer: '<button class="btn btn-ghost" data-close>Batal</button>' +
                '<button class="btn btn-primary" data-ok>' + (pesan.ok || 'Ya, lanjutkan') + '</button>',
        onMount: (ov, close) => {
          ov.querySelector('[data-ok]').addEventListener('click', () => { close(); resolve(true); });
          ov.addEventListener('click', e => { if (e.target === ov || e.target.closest('[data-close]')) resolve(false); });
        }
      });
      return m;
    });
  }

  /* ---------- grafik ---------- */
  function barChart(data, opts) {
    opts = opts || {};
    const max = Math.max(1, ...data.map(d => d.nilai));
    return '<div class="chart">' + data.map(d =>
      '<div class="col" title="' + esc(d.label + ': ' + d.nilai) + '">' +
        '<div class="bar" style="height:' + Math.max(4, (d.nilai / max) * 100) + '%' +
          (d.warna ? ';background:linear-gradient(180deg,' + d.warna + ',#ffffff44)' : '') + '">' +
          '<span class="bv">' + d.nilai + '</span></div>' +
        '<span class="xlabel ' + (d.today ? 'today' : '') + '">' + esc(d.label) + '</span>' +
      '</div>').join('') + '</div>';
  }

  function donut(sektor) {
    const total = sektor.reduce((a, s) => a + s.nilai, 0);
    if (!total) return '<div class="empty"><p>Belum ada data</p></div>';
    let acc = 0;
    const stops = sektor.map(s => {
      const start = acc / total * 360;
      acc += s.nilai;
      const end = acc / total * 360;
      return s.warna + ' ' + start.toFixed(2) + 'deg ' + end.toFixed(2) + 'deg';
    }).join(', ');
    return '<div class="donut" style="background:conic-gradient(' + stops + ')">' +
      '<div class="donut-center"><div><b>' + total + '</b><span>Total</span></div></div></div>';
  }

  function legenda(sektor) {
    const total = sektor.reduce((a, s) => a + s.nilai, 0) || 1;
    return '<div class="legend">' + sektor.map(s =>
      '<div class="legend-row"><span class="lcolor" style="background:' + s.warna + '"></span>' +
      '<span class="lname">' + esc(s.label) + '</span>' +
      '<span class="lval">' + s.nilai + ' <span class="muted small">(' + Math.round(s.nilai / total * 100) + '%)</span></span></div>'
    ).join('') + '</div>';
  }

  function emptyState(ico, judul, pesan, aksi) {
    return '<div class="empty"><div class="eico">' + icon(ico || 'inbox', 28) + '</div>' +
      '<h4>' + esc(judul) + '</h4><p>' + esc(pesan || '') + '</p>' +
      (aksi || '') + '</div>';
  }

  /* ---------- paginasi ---------- */
  function pagination(total, halaman, perHalaman) {
    if (total <= perHalaman) return '';
    const totalHal = Math.ceil(total / perHalaman);
    const hal = Math.min(Math.max(1, halaman), totalHal);
    const dari = (hal - 1) * perHalaman + 1;
    const sampai = Math.min(total, hal * perHalaman);

    const nomor = [];
    const tambah = n => { if (nomor.indexOf(n) === -1 && n >= 1 && n <= totalHal) nomor.push(n); };
    tambah(1); tambah(2);
    for (let i = hal - 1; i <= hal + 1; i++) tambah(i);
    tambah(totalHal - 1); tambah(totalHal);
    nomor.sort((a, b) => a - b);

    let html = '<div class="pager">';
    html += '<button data-page="' + (hal - 1) + '"' + (hal === 1 ? ' disabled' : '') + ' aria-label="Sebelumnya">' +
      icon('chevronL', 15) + '</button>';
    nomor.forEach((n, i) => {
      if (i > 0 && n - nomor[i - 1] > 1) html += '<span class="gap">…</span>';
      html += '<button data-page="' + n + '"' + (n === hal ? ' class="on"' : '') + '>' + n + '</button>';
    });
    html += '<button data-page="' + (hal + 1) + '"' + (hal === totalHal ? ' disabled' : '') + ' aria-label="Berikutnya">' +
      icon('chevronR', 15) + '</button>';
    html += '</div>';

    return '<div class="pagination"><div class="pinfo">Menampilkan ' + dari + '–' + sampai + ' dari ' + total + ' data</div>' + html + '</div>';
  }

  /* ---------- unduh CSV ---------- */
  function unduhCSV(nama, baris) {
    const isi = baris.map(r => r.map(c => {
      const s = String(c === null || c === undefined ? '' : c);
      return /[",;\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    }).join(';')).join('\r\n');
    Store.unduh(nama, '\ufeff' + isi, 'text/csv;charset=utf-8');
  }

  return {
    HARI: HARI, HARI_SHORT: HARI_SHORT, BULAN: BULAN, BULAN_SHORT: BULAN_SHORT,
    icon: icon, esc: esc, toast: toast, modal: modal, konfirmasi: konfirmasi,
    parseISO: parseISO, todayISO: todayISO, isoOf: isoOf, addDays: addDays,
    fmtTanggal: fmtTanggal, fmtTanggalPendek: fmtTanggalPendek, hariIniLabel: hariIniLabel,
    selisihHari: selisihHari, rupiah: rupiah, angka: angka,
    inisial: inisial, warnaDariNama: warnaDariNama, avatar: avatar,
    barChart: barChart, donut: donut, legenda: legenda, emptyState: emptyState, unduhCSV: unduhCSV,
    pagination: pagination
  };
})();
