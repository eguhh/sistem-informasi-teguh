/* ============================================================
   View: Pengaturan
   ============================================================ */
window.ViewPengaturan = (function () {

  let tab = 'umum';

  function render(container) {
    const s = Store.get();
    const p = s.pengaturan;

    container.innerHTML =
      '<div class="card mb-16 no-print">' +
        '<div class="pill-row">' +
          '<button class="chip' + (tab === 'umum' ? ' active' : '') + '" data-tab="umum">' + UI.icon('settings', 15) + ' Umum</button>' +
          '<button class="chip' + (tab === 'sistem' ? ' active' : '') + '" data-tab="sistem">' + UI.icon('file', 15) + ' Data & Backup</button>' +
          '<button class="chip' + (tab === 'tentang' ? ' active' : '') + '" data-tab="tentang">' + UI.icon('info', 15) + ' Tentang</button>' +
        '</div>' +
      '</div>' +
      (tab === 'umum' ? umum(p) : tab === 'sistem' ? sistem(s) : tentang(p));

    container.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => { tab = b.dataset.tab; render(container); }));

    if (tab === 'umum') bindUmum(container);
    if (tab === 'sistem') bindSistem(container);
  }

  /* ---------------- UMUM ---------------- */
  function umum(p) {
    return '<div class="split">' +
      '<div class="card">' +
        '<div class="card-head"><div><div class="card-title"><span class="dot"></span> Profil Klinik</div>' +
        '<div class="card-sub">Informasi yang tampil pada dokumen dan laporan</div></div></div>' +
        '<div class="form-grid">' +
          '<div class="field full"><label class="label">Nama Klinik</label>' +
            '<input class="input" id="g_nama" value="' + UI.esc(p.namaKlinik) + '" /></div>' +
          '<div class="field full"><label class="label">Alamat</label>' +
            '<textarea class="textarea" id="g_alamat" style="min-height:64px">' + UI.esc(p.alamat) + '</textarea></div>' +
          '<div class="field"><label class="label">Telepon</label>' +
            '<input class="input" id="g_telp" value="' + UI.esc(p.telepon) + '" /></div>' +
          '<div class="field"><label class="label">Email</label>' +
            '<input type="email" class="input" id="g_email" value="' + UI.esc(p.email) + '" /></div>' +
        '</div>' +
        '<hr class="divider" />' +
        '<div class="card-title mb-12"><span class="dot" style="background:var(--lilac)"></span> Operasional</div>' +
        '<div class="form-grid">' +
          '<div class="field"><label class="label">Jam Buka</label>' +
            '<input type="time" class="input" id="g_buka" value="' + UI.esc(p.jamBuka) + '" /></div>' +
          '<div class="field"><label class="label">Jam Tutup</label>' +
            '<input type="time" class="input" id="g_tutup" value="' + UI.esc(p.jamTutup) + '" /></div>' +
          '<div class="field"><label class="label">Durasi Slot (menit)</label>' +
            '<input type="number" class="input" id="g_durasi" min="5" step="5" value="' + p.durasiSlot + '" /></div>' +
          '<div class="field"><label class="label">Maks Reservasi / Pasien</label>' +
            '<input type="number" class="input" id="g_maks" min="1" max="20" value="' + p.maksReservasiPerPasien + '" />' +
            '<span class="field-hint">Dihitung dari reservasi aktif (Menunggu/Dikonfirmasi, tanggal hari ini ke depan).</span></div>' +
          '<div class="field"><label class="label">Nama Admin</label>' +
            '<input class="input" id="g_admin" value="' + UI.esc(p.namaAdmin) + '" /></div>' +
          '<div class="field"><label class="label">Jabatan</label>' +
            '<input class="input" id="g_jabatan" value="' + UI.esc(p.jabatanAdmin) + '" /></div>' +
        '</div>' +
        '<div class="flex gap-8 mt-16">' +
          '<button class="btn btn-primary" id="gSimpan">' + UI.icon('check', 16) + ' Simpan Pengaturan</button>' +
          '<button class="btn btn-ghost" id="gReset">Kembalikan Default</button>' +
        '</div>' +
      '</div>' +

      '<div class="stack">' +
        '<div class="card">' +
          '<div class="card-title mb-12"><span class="dot" style="background:var(--mint)"></span> Ringkasan Data</div>' +
          '<div class="kv mb-8"><span class="k">Pasien</span><span class="v">' + Store.get().pasien.length + '</span></div>' +
          '<div class="kv mb-8"><span class="k">Dokter</span><span class="v">' + Store.get().dokter.length + '</span></div>' +
          '<div class="kv mb-8"><span class="k">Poli</span><span class="v">' + Store.get().poli.length + '</span></div>' +
          '<div class="kv mb-12"><span class="k">Reservasi</span><span class="v">' + Store.get().reservasi.length + '</span></div>' +
          '<hr class="divider" />' +
          '<div class="kv"><span class="k">Terakhir diperbarui</span><span class="v small">' +
            new Date(Store.get().diperbaruiPada).toLocaleString('id-ID') + '</span></div>' +
        '</div>' +
        '<div class="card">' +
          '<div class="card-title mb-12"><span class="dot" style="background:var(--amber)"></span> Pintasan</div>' +
          '<div class="stack" style="gap:8px">' +
            '<a class="btn btn-ghost btn-block" href="#/dokter">' + UI.icon('stethoscope', 15) + ' Kelola Dokter & Poli</a>' +
            '<a class="btn btn-ghost btn-block" href="#/jadwal">' + UI.icon('calendar', 15) + ' Lihat Jadwal Mingguan</a>' +
            '<a class="btn btn-ghost btn-block" href="#/laporan">' + UI.icon('chart', 15) + ' Buka Laporan</a>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function bindUmum(container) {
    container.querySelector('#gSimpan').addEventListener('click', () => {
      const p = Store.get().pengaturan;
      const baru = {
        namaKlinik: container.querySelector('#g_nama').value.trim() || p.namaKlinik,
        alamat: container.querySelector('#g_alamat').value.trim(),
        telepon: container.querySelector('#g_telp').value.trim(),
        email: container.querySelector('#g_email').value.trim(),
        jamBuka: container.querySelector('#g_buka').value || p.jamBuka,
        jamTutup: container.querySelector('#g_tutup').value || p.jamTutup,
        durasiSlot: Math.max(5, Number(container.querySelector('#g_durasi').value || 30)),
        maksReservasiPerPasien: Math.max(1, Number(container.querySelector('#g_maks').value || 3)),
        namaAdmin: container.querySelector('#g_admin').value.trim() || p.namaAdmin,
        jabatanAdmin: container.querySelector('#g_jabatan').value.trim() || p.jabatanAdmin
      };
      if (baru.jamTutup <= baru.jamBuka) {
        UI.toast('Jam tutup harus lebih besar dari jam buka', 'danger');
        return;
      }
      Store.update(st => { st.pengaturan = Object.assign({}, st.pengaturan, baru); });
      App.applyIdentity();
      UI.toast('Pengaturan disimpan');
      App.rerender();
    });
    container.querySelector('#gReset').addEventListener('click', () => {
      UI.konfirmasi({
        teks: 'Seluruh pengaturan akan dikembalikan ke nilai default. Data pasien, dokter, dan reservasi <b>tidak</b> terpengaruh.',
        ok: 'Ya, kembalikan'
      }).then(ya => {
        if (!ya) return;
        const def = window.Seed.build().pengaturan;
        Store.update(st => { st.pengaturan = def; });
        App.applyIdentity();
        UI.toast('Pengaturan dikembalikan ke default');
        App.rerender();
      });
    });
  }

  /* ---------------- DATA & BACKUP ---------------- */
  function sistem(s) {
    return '<div class="grid grid-2">' +
      '<div class="card">' +
        '<div class="card-title mb-12"><span class="dot" style="background:var(--mint)"></span> Ekspor & Impor</div>' +
        '<p class="small muted mb-16">Data tersimpan secara lokal di peramban ini (localStorage). ' +
        'Ekspor secara berkala agar data tidak hilang saat cache browser dibersihkan.</p>' +
        '<div class="stack" style="gap:10px">' +
          '<button class="btn btn-primary btn-block" id="sExport">' + UI.icon('download', 15) + ' Ekspor Semua Data (JSON)</button>' +
          '<button class="btn btn-ghost btn-block" id="sImport">' + UI.icon('upload', 15) + ' Impor / Pulihkan Data (JSON)</button>' +
          '<input type="file" id="sFile" accept="application/json,.json" class="hidden-input" style="display:none" />' +
        '</div>' +
        '<hr class="divider" />' +
        '<div class="kv mb-8"><span class="k">Ukuran Penyimpanan</span><span class="v small mono">' +
          Math.round(new Blob([JSON.stringify(s)]).size / 1024) + ' KB</span></div>' +
        '<div class="kv"><span class="k">Lokasi</span><span class="v small">localStorage · ' + UI.esc(Store.KEY) + '</span></div>' +
      '</div>' +

      '<div class="card">' +
        '<div class="card-title mb-12"><span class="dot" style="background:var(--danger);box-shadow:0 0 0 4px var(--danger-soft)"></span> Area Berisiko</div>' +
        '<div class="info-box warn mb-16"><span class="ico">' + UI.icon('alert', 17) + '</span>' +
          '<div>Tindakan berikut menghapus data secara permanen. Pastikan Anda sudah melakukan ekspor cadangan.</div></div>' +
        '<div class="stack" style="gap:10px">' +
          '<button class="btn btn-ghost btn-block" id="sSeed">' + UI.icon('refresh', 15) + ' Muat Ulang Data Contoh</button>' +
          '<button class="btn btn-danger btn-block" id="sKosong">' + UI.icon('trash', 15) + ' Kosongkan Semua Transaksi</button>' +
        '</div>' +
        '<hr class="divider" />' +
        '<div class="small muted">Data contoh berisi 5 dokter, 4 poli, 15 pasien, dan hundreds reservasi pada periode ±3 minggu dari hari ini.</div>' +
      '</div>' +
    '</div>';
  }

  function bindSistem(container) {
    container.querySelector('#sExport').addEventListener('click', () => {
      Store.unduh('backup-klinik-' + UI.todayISO() + '.json', Store.exportJSON());
      UI.toast('Backup berhasil diunduh');
    });
    const file = container.querySelector('#sFile');
    container.querySelector('#sImport').addEventListener('click', () => file.click());
    file.addEventListener('change', e => {
      const f = e.target.files[0]; if (!f) return;
      const reader = new FileReader();
      reader.onload = () => {
        UI.konfirmasi({
          teks: 'Data saat ini akan <b>diganti</b> oleh isi file <b>' + UI.esc(f.name) + '</b>. Lanjutkan?',
          ok: 'Ya, pulihkan'
        }).then(ya => {
          if (!ya) { file.value = ''; return; }
          try {
            Store.importJSON(reader.result);
            UI.toast('Data berhasil dipulihkan');
            App.applyIdentity();
            App.rerender();
          } catch (err) {
            UI.toast('Gagal membaca file: ' + err.message, 'danger');
          }
          file.value = '';
        });
      };
      reader.readAsText(f);
    });
    container.querySelector('#sSeed').addEventListener('click', () => {
      UI.konfirmasi({ teks: 'Seluruh data akan diganti dengan <b>data contoh baru</b>. Lanjutkan?', ok: 'Ya, muat ulang' }).then(ya => {
        if (!ya) return;
        Store.reset();
        UI.toast('Data contoh dimuat ulang');
        App.rerender();
      });
    });
    container.querySelector('#sKosong').addEventListener('click', () => {
      UI.konfirmasi({
        teks: 'Semua <b>pasien, dokter, poli, dan reservasi</b> akan dihapus. Tindakan ini tidak bisa dibatalkan.',
        ok: 'Ya, kosongkan'
      }).then(ya => {
        if (!ya) return;
        Store.kosongkan();
        UI.toast('Semua data transaksi dikosongkan', 'info');
        App.rerender();
      });
    });
  }

  /* ---------------- TENTANG ---------------- */
  function tentang(p) {
    return '<div class="card">' +
      '<div class="flex items-center gap-16 mb-24" style="flex-wrap:wrap">' +
        '<div class="stat-ico" style="width:64px;height:64px;border-radius:22px;background:linear-gradient(140deg,var(--primary),var(--pink))">' +
          UI.icon('heart', 30) + '</div>' +
        '<div><h3 style="font-weight:800;font-size:20px;letter-spacing:-.4px">' + UI.esc(p.namaKlinik) + '</h3>' +
        '<p class="muted small">Sistem Informasi Reservasi Klinik Kesehatan · Versi 1.0</p></div>' +
      '</div>' +
      '<div class="grid grid-3">' +
        '<div class="card" style="background:var(--surface-2)"><div class="card-title mb-12"><span class="dot"></span> Modul</div>' +
          '<ul class="small muted" style="padding-left:18px;line-height:2">' +
            '<li>Dashboard &amp; ringkasan</li><li>Manajemen Reservasi</li><li>Bukti Reservasi cetak</li><li>Data Pasien</li>' +
            '<li>Data Dokter &amp; Poli</li><li>Jadwal Mingguan</li><li>Laporan &amp; Ekspor</li><li>Backup &amp; Pemulihan Data</li>' +
          '</ul></div>' +
        '<div class="card" style="background:var(--surface-2)"><div class="card-title mb-12"><span class="dot" style="background:var(--mint)"></span> Teknologi</div>' +
          '<div class="kv mb-8"><span class="k">Front-end</span><span class="v small">HTML5 · CSS3 · Vanilla JS</span></div>' +
          '<div class="kv mb-8"><span class="k">Penyimpanan</span><span class="v small">localStorage (JSON)</span></div>' +
          '<div class="kv mb-8"><span class="k">Backend</span><span class="v small">Tidak ada (client-side)</span></div>' +
          '<div class="kv"><span class="k">Dukungan</span><span class="v small">Chrome · Edge · Firefox · Safari</span></div></div>' +
        '<div class="card" style="background:var(--surface-2)"><div class="card-title mb-12"><span class="dot" style="background:var(--amber)"></span> Pintasan Keyboard</div>' +
          '<div class="kv mb-8"><span class="k">Cari</span><span class="v small mono">/</span></div>' +
          '<div class="kv mb-8"><span class="k">Reservasi Baru</span><span class="v small mono">Ctrl + N</span></div>' +
          '<div class="kv mb-8"><span class="k">Cetak Laporan</span><span class="v small mono">Ctrl + P</span></div>' +
          '<div class="kv"><span class="k">Tutup Modal</span><span class="v small mono">Esc</span></div></div>' +
      '</div>' +
      '<hr class="divider" />' +
      '<div class="info-box"><span class="ico">' + UI.icon('info', 17) + '</span>' +
        '<div>Aplikasi ini berjalan sepenuhnya di browser Anda. Data tersimpan lokal dan <b>tidak</b> dikirim ke server mana pun. ' +
        'Untuk penggunaan multi-karyawan, disarankan memakai backend API dan database terpusat.</div></div>' +
    '</div>';
  }

  return { render: render };
})();
