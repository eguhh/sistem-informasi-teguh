/* ============================================================
   View: Dashboard
   ============================================================ */
window.ViewDashboard = (function () {

  function render(root) {
    const s = Store.get();
    const hariIni = UI.todayISO();
    const semua = s.reservasi;
    const hariIniRes = semua.filter(r => r.tanggal === hariIni);
    // hanya yang akan datang & belum diproses
    const menunggu = semua
      .filter(r => r.status === 'menunggu' && r.tanggal >= hariIni)
      .sort((a, b) => (a.tanggal + a.waktu).localeCompare(b.tanggal + b.waktu));
    const menungguLalu = semua.filter(r => r.status === 'menunggu' && r.tanggal < hariIni).length;
    const selesaiBulanIni = semua.filter(r => r.status === 'selesai' &&
      r.tanggal.slice(0, 7) === hariIni.slice(0, 7)).length;

    const kemarin = UI.addDays(hariIni, -1);
    const kemarinRes = semua.filter(r => r.tanggal === kemarin && r.status !== 'batal').length;
    const hariIniAktif = hariIniRes.filter(r => r.status !== 'batal').length;
    const tren = kemarinRes === 0 ? 0 : Math.round((hariIniAktif - kemarinRes) / kemarinRes * 100);

    const totalPasien = s.pasien.length;
    const totalDokter = s.dokter.filter(d => d.aktif !== false).length;
    const okupansi = hitungOkupansi(s, hariIni);
    const dapat = s.reservasi.filter(r => r.tanggal >= hariIni && r.tanggal <= UI.addDays(hariIni, 7) && r.status !== 'batal').length;
    const ok7 = okupansi7(s, hariIni);

    // grafik 7 hari
    const grafik = [];
    for (let i = 6; i >= 0; i--) {
      const d = UI.addDays(hariIni, -i);
      grafik.push({
        label: UI.HARI_SHORT[UI.parseISO(d).getDay()],
        nilai: semua.filter(r => r.tanggal === d && r.status !== 'batal').length,
        today: d === hariIni
      });
    }

    // status
    const sektor = [
      { label: 'Selesai', nilai: semua.filter(r => r.status === 'selesai').length, warna: '#4fc3a1' },
      { label: 'Dikonfirmasi', nilai: semua.filter(r => r.status === 'dikonfirmasi').length, warna: '#6f8bf7' },
      { label: 'Menunggu', nilai: semua.filter(r => r.status === 'menunggu').length, warna: '#f0b45c' },
      { label: 'Batal', nilai: semua.filter(r => r.status === 'batal').length, warna: '#f0718d' }
    ];

    root.innerHTML =
      '<div class="grid grid-4 mb-16">' +
        statCard('p', 'calendar', 'Reservasi Hari Ini', hariIniAktif,
          '<span class="trend ' + (tren > 0 ? 'up' : tren < 0 ? 'down' : 'flat') + '">' +
          (tren > 0 ? '▲' : tren < 0 ? '▼' : '—') + ' ' + Math.abs(tren) + '%</span><span>vs kemarin</span>') +
        statCard('o', 'clock', 'Menunggu Konfirmasi', menunggu.length,
          '<span>' + (semua.length ? Math.round(menunggu.length / semua.length * 100) : 0) + '%</span><span>dari total reservasi</span>') +
        statCard('g', 'users', 'Pasien Terdaftar', totalPasien,
          '<span>' + s.pasien.filter(p => p.status === 'aktif').length + '</span><span>pasien aktif</span>') +
        statCard('k', 'activity', 'Okupansi Hari Ini', okupansi.persen + '%',
          '<span>' + okupansi.terpakai + '/' + okupansi.total + '</span><span>slot terpakai</span>') +
      '</div>' +

      '<div class="split mb-16">' +
        '<div class="card">' +
          '<div class="card-head">' +
            '<div><div class="card-title"><span class="dot"></span> Tren Reservasi 7 Hari</div>' +
            '<div class="card-sub">Jumlah reservasi per hari (kecuali pembatalan)</div></div>' +
            '<div class="pill-row">' +
              '<span class="badge b-netral">' + UI.icon('calendar', 13) + ' 7 hari</span>' +
            '</div>' +
          '</div>' +
          UI.barChart(grafik) +
        '</div>' +

        '<div class="card">' +
          '<div class="card-head"><div><div class="card-title"><span class="dot" style="background:var(--mint);box-shadow:0 0 0 4px var(--mint-soft)"></span> Komposisi Status</div>' +
          '<div class="card-sub">Seluruh periode</div></div></div>' +
          '<div class="donut-wrap">' + UI.donut(sektor) + UI.legenda(sektor) + '</div>' +
          '<hr class="divider" />' +
          '<div class="flex items-center justify-between small mb-8">' +
            '<span class="muted">Okupansi 7 hari ke depan</span>' +
            '<b>' + ok7.terpakai + ' / ' + ok7.total + ' slot (' + ok7.persen + '%)</b>' +
          '</div>' +
          '<div class="progress mt-8"><i style="width:' + ok7.persen + '%"></i></div>' +
          '<div class="small muted mt-8">' + dapat + ' reservasi terjadwal dalam 7 hari ke depan</div>' +
        '</div>' +
      '</div>' +

      '<div class="split-2">' +
        '<div class="card">' +
          '<div class="card-head">' +
            '<div><div class="card-title"><span class="dot" style="background:var(--lilac);box-shadow:0 0 0 4px var(--lilac-soft)"></span> Jadwal Hari Ini</div>' +
            '<div class="card-sub">' + UI.fmtTanggal(hariIni, 'day') + '</div></div>' +
            '<a class="btn btn-ghost btn-sm" href="#/reservasi">Lihat semua</a>' +
          '</div>' +
          (hariIniRes.length ? '<div class="list">' + hariIniRes
            .sort((a, b) => a.waktu.localeCompare(b.waktu))
            .map(r => {
              const ps = Store.pasien(r.pasienId), dk = Store.dokter(r.dokterId);
              return '<div class="list-item">' +
                UI.avatar(ps ? ps.nama : '?', 'sm') +
                '<div class="li-main"><div class="li-title">' + UI.esc(ps ? ps.nama : 'Pasien dihapus') + '</div>' +
                '<div class="li-sub">' + UI.esc(dk ? dk.nama : '-') + ' · ' + UI.esc((Store.poli(r.poliId) || {}).nama || '') + '</div></div>' +
                '<div class="li-time">' + r.waktu + '</div>' +
                badgeStatus(r.status) +
              '</div>';
            }).join('') + '</div>'
            : UI.emptyState('calendar', 'Belum ada jadwal hari ini', 'Klik "Reservasi Baru" untuk membuat jadwal pasien.', '<button class="btn btn-primary btn-sm mt-8" data-act="new">Tambah Reservasi</button>')) +
        '</div>' +

        '<div class="card">' +
          '<div class="card-head">' +
            '<div><div class="card-title"><span class="dot" style="background:var(--amber);box-shadow:0 0 0 4px var(--amber-soft)"></span> Perlu Konfirmasi</div>' +
            '<div class="card-sub">Reservasi menunggu persetujuan</div></div>' +
            '<span class="badge b-menunggu">' + menunggu.length + (menungguLalu ? ' (+' + menungguLalu + ' lewat)' : '') + '</span>' +
          '</div>' +
          (menunggu.length ? '<div class="timeline">' + menunggu.slice(0, 6).map(r => {
            const ps = Store.pasien(r.pasienId), dk = Store.dokter(r.dokterId);
            return '<div class="tl-item">' +
              '<div class="flex items-center justify-between gap-8">' +
                '<div><div class="li-title">' + UI.esc(ps ? ps.nama : '-') + '</div>' +
                '<div class="li-sub">' + UI.fmtTanggalPendek(r.tanggal) + ' · ' + r.waktu + ' · ' + UI.esc(dk ? dk.nama : '') + '</div></div>' +
                '<button class="btn btn-soft btn-sm" data-konfirmasi="' + r.id + '">Konfirmasi</button>' +
              '</div></div>';
          }).join('') + '</div>' +
          (menunggu.length > 6 ? '<a class="btn btn-ghost btn-sm btn-block mt-12" href="#/reservasi">Lihat ' + (menunggu.length - 6) + ' lainnya</a>' : '')
            : UI.emptyState('check', 'Semua sudah dikonfirmasi', 'Tidak ada reservasi yang menunggu persetujuan.')) +
        '</div>' +
      '</div>' +

      '<div class="grid grid-3 mt-16">' +
        '<div class="card"><div class="card-title mb-12"><span class="dot" style="background:var(--sky)"></span> Poli Teramai</div>' +
          poliTeramai(s).map(p =>
            '<div class="mb-12"><div class="flex justify-between small mb-8"><b>' + UI.esc(p.nama) + '</b><span class="muted">' + p.jumlah + ' reservasi</span></div>' +
            '<div class="progress"><i style="width:' + p.persen + '%;background:linear-gradient(90deg,' + p.warna + ',' + p.warna + '88)"></i></div></div>'
          ).join('') + '</div>' +

        '<div class="card"><div class="card-title mb-12"><span class="dot" style="background:var(--pink)"></span> Pasien Sering Datang</div>' +
          patientsTop(s).map(p =>
            '<div class="list-item"><div>' + UI.avatar(p.nama, 'sm') + '</div>' +
            '<div class="li-main"><div class="li-title">' + UI.esc(p.nama) + '</div>' +
            '<div class="li-sub">' + p.jumlah + 'x kunjungan · terakhir ' + UI.fmtTanggalPendek(p.terakhir) + '</div></div></div>'
          ).join('') + '</div>' +

        '<div class="card"><div class="card-title mb-12"><span class="dot" style="background:var(--mint)"></span> Info Klinik</div>' +
          '<div class="kv mb-12"><span class="k">Nama Klinik</span><span class="v">' + UI.esc(s.pengaturan.namaKlinik) + '</span></div>' +
          '<div class="kv mb-12"><span class="k">Jam Praktik</span><span class="v">' + s.pengaturan.jamBuka + ' — ' + s.pengaturan.jamTutup + '</span></div>' +
          '<div class="kv mb-12"><span class="k">Durasi Slot</span><span class="v">' + s.pengaturan.durasiSlot + ' menit</span></div>' +
          '<div class="kv"><span class="k">Kontak</span><span class="v">' + UI.esc(s.pengaturan.telepon) + '</span></div>' +
          '<hr class="divider" />' +
          '<a class="btn btn-ghost btn-sm btn-block" href="#/pengaturan">' + UI.icon('settings', 15) + ' Pengaturan Klinik</a>' +
        '</div>' +
      '</div>';

    // aksi
    root.querySelectorAll('[data-act="new"]').forEach(b => b.addEventListener('click', () => ViewReservasi.openForm()));
    root.querySelectorAll('[data-konfirmasi]').forEach(b => b.addEventListener('click', () => {
      Store.update(st => {
        const r = st.reservasi.find(x => x.id === b.dataset.konfirmasi);
        if (r) { r.status = 'dikonfirmasi'; r.updatedAt = new Date().toISOString(); }
      });
      UI.toast('Reservasi dikonfirmasi');
      ViewDashboard.render(root);
    }));
  }

  function statCard(warna, ico, label, nilai, foot) {
    return '<div class="stat"><div class="stat-top">' +
      '<div><div class="stat-label">' + label + '</div><div class="stat-value">' + nilai + '</div></div>' +
      '<div class="stat-ico ' + warna + '">' + UI.icon(ico, 21) + '</div>' +
      '</div><div class="stat-foot">' + foot + '</div></div>';
  }

  function badgeStatus(st) {
    const label = { menunggu: 'Menunggu', dikonfirmasi: 'Dikonfirmasi', selesai: 'Selesai', batal: 'Batal' }[st] || st;
    return '<span class="badge b-' + st + '"><span class="pip"></span>' + label + '</span>';
  }

  function hitungOkupansi(s, tanggal) {
    const total = s.dokter.filter(d => d.aktif !== false).reduce((acc, d) => {
      const dur = s.pengaturan.durasiSlot;
      const [sh, sm] = ((d.jamKerja && d.jamKerja.mulai) || s.pengaturan.jamBuka).split(':').map(Number);
      const [eh, em] = ((d.jamKerja && d.jamKerja.selesai) || s.pengaturan.jamTutup).split(':').map(Number);
      const dow = UI.parseISO(tanggal).getDay() === 0 ? 7 : UI.parseISO(tanggal).getDay();
      if (d.hariKerja && d.hariKerja.length && d.hariKerja.indexOf(dow) === -1) return acc;
      return acc + Math.max(0, Math.floor(((eh * 60 + em) - (sh * 60 + sm)) / dur));
    }, 0);
    const terpakai = s.reservasi.filter(r => r.tanggal === tanggal && r.status !== 'batal').length;
    return { total: total, terpakai: terpakai, persen: total ? Math.round(terpakai / total * 100) : 0 };
  }

  function okupansi7(s, mulai) {
    let total = 0, terpakai = 0;
    for (let i = 0; i < 7; i++) {
      const o = hitungOkupansi(s, UI.addDays(mulai, i));
      total += o.total; terpakai += o.terpakai;
    }
    return { total: total, terpakai: terpakai, persen: total ? Math.round(terpakai / total * 100) : 0 };
  }

  function poliTeramai(s) {
    const map = {};
    s.reservasi.forEach(r => {
      if (r.status === 'batal') return;
      const p = Store.poli(r.poliId); if (!p) return;
      map[p.nama] = map[p.nama] || { nama: p.nama, jumlah: 0, warna: p.warna };
      map[p.nama].jumlah++;
    });
    const arr = Object.values(map).sort((a, b) => b.jumlah - a.jumlah).slice(0, 4);
    const max = arr.length ? arr[0].jumlah : 1;
    return arr.map(p => ({ nama: p.nama, jumlah: p.jumlah, warna: p.warna, persen: Math.round(p.jumlah / max * 100) }));
  }

  function patientsTop(s) {
    const map = {};
    s.reservasi.forEach(r => {
      const ps = Store.pasien(r.pasienId); if (!ps) return;
      map[ps.id] = map[ps.id] || { nama: ps.nama, jumlah: 0, terakhir: r.tanggal };
      map[ps.id].jumlah++;
      if (r.tanggal > map[ps.id].terakhir) map[ps.id].terakhir = r.tanggal;
    });
    return Object.values(map).sort((a, b) => b.jumlah - a.jumlah).slice(0, 5);
  }

  return { render: render, badgeStatus: badgeStatus };
})();
