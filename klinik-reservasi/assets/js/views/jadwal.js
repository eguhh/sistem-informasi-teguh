/* ============================================================
   View: Jadwal Mingguan
   ============================================================ */
window.ViewJadwal = (function () {

  let offsetMinggu = 0;   // 0 = minggu berjalan
  let dokterFilter = '';

  function render(container) {
    const s = Store.get();
    const hariIni = UI.todayISO();

    // awal minggu (Senin)
    const d0 = UI.parseISO(hariIni);
    const dow = d0.getDay() === 0 ? 7 : d0.getDay();
    const awalMinggu = UI.addDays(hariIni, -(dow - 1) + offsetMinggu * 7);
    const hari2 = [];
    for (let i = 0; i < 6; i++) hari2.push(UI.addDays(awalMinggu, i));

    const dokterList = s.dokter.filter(d => (!dokterFilter || d.id === dokterFilter) && d.aktif !== false);

    container.innerHTML =
      '<div class="card">' +
        '<div class="card-head">' +
          '<div><div class="card-title"><span class="dot"></span> Jadwal Mingguan</div>' +
          '<div class="card-sub">' + UI.fmtTanggal(hari2[0], 'short') + ' — ' + UI.fmtTanggal(hari2[5], 'short') + '</div></div>' +
          '<div class="flex gap-8 wrap items-center">' +
            '<select class="select" id="jDokter" style="width:auto">' +
              '<option value="">Semua Dokter</option>' +
              s.dokter.map(d => '<option value="' + d.id + '"' + (dokterFilter === d.id ? ' selected' : '') + '>' + UI.esc(d.nama) + '</option>').join('') +
            '</select>' +
            '<button class="icon-btn" id="jPrev" title="Minggu sebelumnya">' + UI.icon('chevronL', 17) + '</button>' +
            '<button class="btn btn-ghost btn-sm" id="jToday">Hari Ini</button>' +
            '<button class="icon-btn" id="jNext" title="Minggu berikutnya">' + UI.icon('chevronR', 17) + '</button>' +
          '</div>' +
        '</div>' +

        (dokterList.length ? '<div class="week-grid">' +
          '<div class="wg-head"></div>' +
          hari2.map(h => '<div class="wg-head' + (h === hariIni ? ' today' : '') + '">' +
            UI.HARI_SHORT[UI.parseISO(h).getDay()] + '<br><span class="mono" style="font-size:10px">' + UI.parseISO(h).getDate() + '</span></div>').join('') +
          dokterList.map(d => {
            return '<div class="wg-doc">' + UI.avatar(d.nama, 'sm') + '<div><div>' + UI.esc(d.nama.replace(/^dr\.\s*/i, '')) + '</div>' +
              '<div class="small muted">' + UI.esc(d.poli) + '</div></div></div>' +
              hari2.map(h => {
                const res = s.reservasi.filter(r => r.dokterId === d.id && r.tanggal === h && r.status !== 'batal')
                  .sort((a, b) => a.waktu.localeCompare(b.waktu));
                if (!res.length) return '<div class="wg-cell empty-cell" data-dk="' + d.id + '" data-tgl="' + h + '">kosong</div>';
                return '<div class="wg-cell" data-dk="' + d.id + '" data-tgl="' + h + '">' +
                  res.slice(0, 4).map(r => {
                    const ps = Store.pasien(r.pasienId);
                    return '<div class="wg-slot">' + r.waktu + '</div>' +
                      '<div class="wg-name">' + UI.esc(ps ? ps.nama : '-') + '</div>';
                  }).join('') +
                  (res.length > 4 ? '<div class="small muted">+' + (res.length - 4) + ' lagi</div>' : '') +
                '</div>';
              }).join('');
          }).join('') +
        '</div>' : UI.emptyState('calendar', 'Belum ada dokter', 'Tambahkan dokter terlebih dahulu untuk melihat jadwal.',
          '<a class="btn btn-primary btn-sm mt-8" href="#/dokter">Tambah Dokter</a>')) +

        '<hr class="divider" />' +
        '<div class="legend" style="flex-direction:row;flex-wrap:wrap;gap:16px">' +
          '<div class="legend-row"><span class="lcolor" style="background:var(--amber)"></span><span class="lname">Menunggu</span></div>' +
          '<div class="legend-row"><span class="lcolor" style="background:var(--primary)"></span><span class="lname">Dikonfirmasi</span></div>' +
          '<div class="legend-row"><span class="lcolor" style="background:var(--mint)"></span><span class="lname">Selesai</span></div>' +
        '</div>' +
      '</div>';

    container.querySelector('#jPrev').addEventListener('click', () => { offsetMinggu--; render(container); });
    container.querySelector('#jNext').addEventListener('click', () => { offsetMinggu++; render(container); });
    container.querySelector('#jToday').addEventListener('click', () => { offsetMinggu = 0; render(container); });
    container.querySelector('#jDokter').addEventListener('change', e => { dokterFilter = e.target.value; render(container); });
    container.querySelectorAll('.wg-cell').forEach(c => c.addEventListener('click', () =>
      detailHari(c.dataset.dk, c.dataset.tgl)));
  }

  function detailHari(dokterId, tanggal) {
    const s = Store.get();
    const dk = Store.dokter(dokterId);
    const list = s.reservasi.filter(r => r.dokterId === dokterId && r.tanggal === tanggal)
      .sort((a, b) => a.waktu.localeCompare(b.waktu));
    const slot = Store.slotTersedia(dokterId, tanggal, null);
    const terpakai = new Set(list.filter(r => r.status !== 'batal').map(r => r.waktu));

    UI.modal({
      title: (dk ? dk.nama : 'Dokter') + ' — ' + UI.fmtTanggal(tanggal, 'withDayShort'),
      sub: 'Detail jadwal harian',
      body:
        '<div class="mb-16"><div class="card-title mb-12"><span class="dot" style="background:var(--mint)"></span> Slot Terisi (' + terpakai.size + ')</div>' +
        (terpakai.size ? '<div class="list">' + list.filter(r => r.status !== 'batal').map(r => {
          const ps = Store.pasien(r.pasienId);
          return '<div class="list-item">' + UI.avatar(ps ? ps.nama : '?', 'sm') +
            '<div class="li-main"><div class="li-title">' + UI.esc(ps ? ps.nama : '-') + '</div>' +
            '<div class="li-sub">' + UI.esc((Store.poli(r.poliId) || {}).nama || '') + '</div></div>' +
            '<div class="li-time">' + r.waktu + '</div>' + ViewReservasi.badge(r.status) + '</div>';
        }).join('') + '</div>' : '<p class="small muted">Belum ada reservasi pada tanggal ini.</p>') + '</div>' +

        '<div><div class="card-title mb-12"><span class="dot" style="background:var(--primary)"></span> Seluruh Slot (' + slot.length + ')</div>' +
        '<div class="pill-row">' + (slot.length ? slot.map(sl =>
          '<span class="chip' + (sl.tersedia ? '' : ' active') + '"' + (sl.tersedia ? '' : ' style="opacity:.6"') + '>' + sl.jam + '</span>'
        ).join('') : '<span class="small muted">Dokter tidak praktik di hari ini.</span>') + '</div></div>',
      footer: '<button class="btn btn-ghost" data-close>Tutup</button>' +
              '<button class="btn btn-primary" data-tambah>Tambah Reservasi</button>',
      onMount: (ov, close) => {
        ov.querySelector('[data-tambah]').addEventListener('click', () => { close(); ViewReservasi.openForm(); });
      }
    });
  }

  return { render: render };
})();
