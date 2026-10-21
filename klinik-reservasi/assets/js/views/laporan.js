/* ============================================================
   View: Laporan
   ============================================================ */
window.ViewLaporan = (function () {

  let dari = null, sampai = null;

  function render(container) {
    const s = Store.get();
    if (!dari) dari = UI.addDays(UI.todayISO(), -29);
    if (!sampai) sampai = UI.todayISO();

    const data = s.reservasi.filter(r => r.tanggal >= dari && r.tanggal <= sampai);
    const aktif = data.filter(r => r.status !== 'batal');
    const selesai = data.filter(r => r.status === 'selesai');

    // per dokter
    const perDokter = {};
    aktif.forEach(r => {
      const d = Store.dokter(r.dokterId); if (!d) return;
      perDokter[d.id] = perDokter[d.id] || { nama: d.nama, warna: d.warna, jumlah: 0, dp: 0 };
      perDokter[d.id].jumlah++;
      perDokter[d.id].dp += r.dp || 0;
    });
    const listDokter = Object.values(perDokter).sort((a, b) => b.jumlah - a.jumlah);
    const maxDokter = listDokter.length ? listDokter[0].jumlah : 1;

    // per poli
    const perPoli = {};
    aktif.forEach(r => {
      const p = Store.poli(r.poliId); if (!p) return;
      perPoli[p.id] = perPoli[p.id] || { nama: p.nama, warna: p.warna, jumlah: 0, nilai: 0 };
      perPoli[p.id].jumlah++;
      perPoli[p.id].nilai += p.harga;
    });
    const listPoli = Object.values(perPoli).sort((a, b) => b.nilai - a.nilai);
    const maxPoli = listPoli.length ? listPoli[0].jumlah : 1;

    // status
    const sektor = [
      { label: 'Selesai', nilai: data.filter(r => r.status === 'selesai').length, warna: '#4fc3a1' },
      { label: 'Dikonfirmasi', nilai: data.filter(r => r.status === 'dikonfirmasi').length, warna: '#6f8bf7' },
      { label: 'Menunggu', nilai: data.filter(r => r.status === 'menunggu').length, warna: '#f0b45c' },
      { label: 'Batal', nilai: data.filter(r => r.status === 'batal').length, warna: '#f0718d' }
    ];

    // tren harian (diagregasi per minggu bila periode terlalu panjang)
    const harian = [];
    let cur = dari;
    let guard = 0;
    while (cur <= sampai && guard < 120) {
      harian.push({
        label: UI.parseISO(cur).getDate() + ' ' + UI.BULAN_SHORT[UI.parseISO(cur).getMonth()],
        nilai: aktif.filter(r => r.tanggal === cur).length
      });
      cur = UI.addDays(cur, 1); guard++;
    }
    let tren = harian;
    let trenMingguan = false;
    if (harian.length > 16) {
      trenMingguan = true;
      const minggu = {};
      harian.forEach((h, i) => {
        const tgl = UI.addDays(dari, i);
        const d = UI.parseISO(tgl);
        const dow = d.getDay() === 0 ? 7 : d.getDay();
        const kunci = UI.addDays(tgl, -(dow - 1));
        minggu[kunci] = minggu[kunci] || { label: UI.parseISO(kunci).getDate() + ' ' + UI.BULAN_SHORT[UI.parseISO(kunci).getMonth()], nilai: 0 };
        minggu[kunci].nilai += h.nilai;
      });
      tren = Object.keys(minggu).sort().map(k => minggu[k]);
    }

    const totalDP = aktif.reduce((a, r) => a + (r.dp || 0), 0);
    const tingkatBatal = data.length ? Math.round(data.filter(r => r.status === 'batal').length / data.length * 100) : 0;

    container.innerHTML =
      '<div class="print-head"><h2 style="font-weight:800">Laporan Reservasi Klinik</h2>' +
        '<p class="muted small">' + UI.esc(s.pengaturan.namaKlinik) + ' · Periode ' + UI.fmtTanggal(dari, 'short') + ' — ' + UI.fmtTanggal(sampai, 'short') + '</p></div>' +

      '<div class="card mb-16 no-print">' +
        '<div class="card-head"><div><div class="card-title"><span class="dot"></span> Filter Laporan</div>' +
        '<div class="card-sub">Atur periode pelaporan</div></div></div>' +
        '<div class="filter-bar" style="margin-bottom:0">' +
          '<div class="field" style="min-width:170px"><label class="label">Dari Tanggal</label>' +
            '<input type="date" class="input" id="lDari" value="' + dari + '" /></div>' +
          '<div class="field" style="min-width:170px"><label class="label">Sampai Tanggal</label>' +
            '<input type="date" class="input" id="lSampai" value="' + sampai + '" /></div>' +
          '<button class="btn btn-ghost btn-sm" data-preset="7">7 Hari</button>' +
          '<button class="btn btn-ghost btn-sm" data-preset="30">30 Hari</button>' +
          '<button class="btn btn-ghost btn-sm" data-preset="90">3 Bulan</button>' +
          '<div class="grow"></div>' +
          '<button class="btn btn-ghost btn-sm" id="lPrint">' + UI.icon('printer', 15) + ' Cetak</button>' +
          '<button class="btn btn-primary btn-sm" id="lCsv">' + UI.icon('download', 15) + ' Ekspor CSV</button>' +
        '</div>' +
      '</div>' +

      '<div class="grid grid-4 mb-16">' +
        kpi('p', 'calendar', 'Total Reservasi', data.length, dalamPeriode(dari, sampai)) +
        kpi('g', 'check', 'Reservasi Selesai', selesai.length, Math.round(selesai.length / Math.max(1, data.length) * 100) + '% dari total') +
        kpi('k', 'wallet', 'Total DP Masuk', UI.rupiah(totalDP), 'penerimaan deposit') +
        kpi('r', 'alert', 'Tingkat Pembatalan', tingkatBatal + '%', data.length + ' reservasi tercatat') +
      '</div>' +

      '<div class="split mb-16">' +
        '<div class="card">' +
          '<div class="card-head"><div><div class="card-title"><span class="dot"></span> Tren Reservasi ' +
          (trenMingguan ? 'Mingguan' : 'Harian') + '</div>' +
          '<div class="card-sub">Periode terpilih' + (trenMingguan ? ' (diagregasi per minggu)' : '') + '</div></div></div>' +
          UI.barChart(tren) +
        '</div>' +
        '<div class="card">' +
          '<div class="card-head"><div class="card-title"><span class="dot" style="background:var(--mint);box-shadow:0 0 0 4px var(--mint-soft)"></span> Status Reservasi</div></div>' +
          '<div class="donut-wrap">' + UI.donut(sektor) + UI.legenda(sektor) + '</div>' +
        '</div>' +
      '</div>' +

      '<div class="split-2 mb-16">' +
        '<div class="card">' +
          '<div class="card-head"><div class="card-title"><span class="dot" style="background:var(--lilac)"></span> Rekap per Dokter</div></div>' +
          (listDokter.length ? listDokter.map(d =>
            '<div class="mb-12"><div class="flex justify-between small mb-8"><b>' + UI.esc(d.nama) + '</b>' +
            '<span class="muted">' + d.jumlah + ' reservasi · ' + UI.rupiah(d.dp) + ' DP</span></div>' +
            '<div class="progress"><i style="width:' + Math.round(d.jumlah / maxDokter * 100) + '%;background:linear-gradient(90deg,' + d.warna + ',' + d.warna + '88)"></i></div></div>'
          ).join('') : '<p class="small muted">Tidak ada data.</p>') +
        '</div>' +
        '<div class="card">' +
          '<div class="card-head"><div class="card-title"><span class="dot" style="background:var(--pink)"></span> Rekap per Poli</div></div>' +
          (listPoli.length ? listPoli.map(p =>
            '<div class="mb-12"><div class="flex justify-between small mb-8"><b>' + UI.esc(p.nama) + '</b>' +
            '<span class="muted">' + p.jumlah + ' kunjungan · estimasi ' + UI.rupiah(p.nilai) + '</span></div>' +
            '<div class="progress"><i style="width:' + Math.round(p.jumlah / maxPoli * 100) + '%;background:linear-gradient(90deg,' + p.warna + ',' + p.warna + '88)"></i></div></div>'
          ).join('') : '<p class="small muted">Tidak ada data.</p>') +
        '</div>' +
      '</div>' +

      '<div class="card">' +
        '<div class="card-head"><div><div class="card-title"><span class="dot"></span> Rincian Reservasi</div>' +
        '<div class="card-sub">' + data.length + ' baris data</div></div></div>' +
        (data.length ? '<div class="table-wrap"><table><thead><tr>' +
          '<th>Kode</th><th>Tanggal</th><th>Jam</th><th>Pasien</th><th>Dokter</th><th>Poli</th><th>Status</th><th class="t-num">DP</th>' +
        '</tr></thead><tbody>' + data
          .sort((a, b) => (b.tanggal + b.waktu).localeCompare(a.tanggal + a.waktu))
          .map(r => {
            const ps = Store.pasien(r.pasienId), dk = Store.dokter(r.dokterId), pl = Store.poli(r.poliId);
            return '<tr><td><span class="t-code">' + UI.esc(r.kode) + '</span></td>' +
              '<td>' + UI.fmtTanggalPendek(r.tanggal) + '</td><td class="mono">' + r.waktu + '</td>' +
              '<td>' + UI.esc(ps ? ps.nama : '-') + '</td><td>' + UI.esc(dk ? dk.nama : '-') + '</td>' +
              '<td>' + UI.esc(pl ? pl.nama : '-') + '</td><td>' + ViewReservasi.badge(r.status) + '</td>' +
              '<td class="t-num mono">' + UI.rupiah(r.dp || 0) + '</td></tr>';
          }).join('') + '</tbody></table></div>'
          : UI.emptyState('chart', 'Tidak ada data pada periode ini', 'Ubah rentang tanggal untuk melihat laporan.')) +
      '</div>';

    // events
    container.querySelector('#lDari').addEventListener('change', e => { dari = e.target.value; render(container); });
    container.querySelector('#lSampai').addEventListener('change', e => { sampai = e.target.value; render(container); });
    container.querySelectorAll('[data-preset]').forEach(b => b.addEventListener('click', () => {
      const n = Number(b.dataset.preset);
      sampai = UI.todayISO(); dari = UI.addDays(sampai, -(n - 1));
      render(container);
    }));
    container.querySelector('#lPrint').addEventListener('click', () => window.print());
    container.querySelector('#lCsv').addEventListener('click', exportCSV);
  }

  function kpi(warna, ico, label, nilai, sub) {
    return '<div class="stat"><div class="stat-top"><div><div class="stat-label">' + label + '</div>' +
      '<div class="stat-value" style="font-size:' + (String(nilai).length > 10 ? '20px' : '28px') + '">' + nilai + '</div></div>' +
      '<div class="stat-ico ' + warna + '">' + UI.icon(ico, 21) + '</div></div>' +
      '<div class="stat-foot"><span>' + sub + '</span></div></div>';
  }

  function dalamPeriode(a, b) {
    const hari = Math.round((UI.parseISO(b) - UI.parseISO(a)) / 86400000) + 1;
    return 'periode ' + hari + ' hari';
  }

  function exportCSV() {
    const data = Store.get().reservasi.filter(r => r.tanggal >= dari && r.tanggal <= sampai);
    const baris = [['Kode', 'Tanggal', 'Jam', 'Pasien', 'No RM', 'Dokter', 'Poli', 'Status', 'Cara Bayar', 'DP', 'Catatan']];
    data.forEach(r => {
      const ps = Store.pasien(r.pasienId) || {}, dk = Store.dokter(r.dokterId) || {}, pl = Store.poli(r.poliId) || {};
      baris.push([r.kode, r.tanggal, r.waktu, ps.nama || '', ps.noRm || '', dk.nama || '', pl.nama || '',
        r.status, r.caraBayar || '', r.dp || 0, r.catatan || '']);
    });
    UI.unduhCSV('laporan-reservasi-' + dari + '_' + sampai + '.csv', baris);
    UI.toast('File CSV diunduh');
  }

  return { render: render };
})();
