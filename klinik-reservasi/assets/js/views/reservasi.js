/* ============================================================
   View: Reservasi
   ============================================================ */
window.ViewReservasi = (function () {

  const filter = { q: '', status: '', dokterId: '', tanggal: '', page: 1 };
  const PER_HALAMAN = 15;
  let root = null;

  const STATUS = {
    menunggu:    { label: 'Menunggu',    cls: 'b-menunggu' },
    dikonfirmasi:{ label: 'Dikonfirmasi',cls: 'b-dikonfirmasi' },
    selesai:     { label: 'Selesai',     cls: 'b-selesai' },
    batal:       { label: 'Batal',       cls: 'b-batal' }
  };

  function render(container) {
    root = container;
    const s = Store.get();
    const semua = filterData(s);
    const totalHal = Math.max(1, Math.ceil(semua.length / PER_HALAMAN));
    if (filter.page > totalHal) filter.page = totalHal;
    const list = semua.slice((filter.page - 1) * PER_HALAMAN, filter.page * PER_HALAMAN);

    container.innerHTML =
      '<div class="card">' +
        '<div class="card-head">' +
          '<div><div class="card-title"><span class="dot"></span> Data Reservasi</div>' +
          '<div class="card-sub">' + semua.length + ' dari ' + s.reservasi.length + ' reservasi ditampilkan</div></div>' +
          '<div class="flex gap-8">' +
            '<button class="btn btn-ghost btn-sm" id="btnExportRes">' + UI.icon('download', 15) + ' Ekspor CSV</button>' +
            '<button class="btn btn-primary btn-sm" id="btnNewRes">' + UI.icon('plus', 15) + ' Reservasi Baru</button>' +
          '</div>' +
        '</div>' +

        '<div class="filter-bar">' +
          '<div class="search-mini" style="flex:1;min-width:220px">' + UI.icon('search', 16) +
            '<input class="input" id="fQ" placeholder="Cari nama pasien, kode, atau dokter..." value="' + UI.esc(filter.q) + '" />' +
          '</div>' +
          '<select class="select" id="fStatus">' +
            '<option value="">Semua Status</option>' +
            Object.keys(STATUS).map(k => '<option value="' + k + '"' + (filter.status === k ? ' selected' : '') + '>' + STATUS[k].label + '</option>').join('') +
          '</select>' +
          '<select class="select" id="fDokter">' +
            '<option value="">Semua Dokter</option>' +
            s.dokter.map(d => '<option value="' + d.id + '"' + (filter.dokterId === d.id ? ' selected' : '') + '>' + UI.esc(d.nama) + '</option>').join('') +
          '</select>' +
          '<input type="date" class="input" id="fTanggal" value="' + UI.esc(filter.tanggal) + '" />' +
          '<button class="btn btn-ghost btn-sm" id="fReset">Reset</button>' +
        '</div>' +

        (list.length ? '<div class="table-wrap"><table><thead><tr>' +
            '<th>Pasien</th><th>Jadwal</th><th>Dokter</th><th>Poli</th><th>Status</th><th>Kode</th><th class="t-actions">Aksi</th>' +
          '</tr></thead><tbody>' +
          list.map(rowHTML).join('') +
          '</tbody></table></div>' + UI.pagination(semua.length, filter.page, PER_HALAMAN)
          : UI.emptyState('inbox', 'Tidak ada reservasi', 'Belum ada data yang cocok dengan filter. Coba ubah kata kunci atau buat reservasi baru.',
            '<button class="btn btn-primary btn-sm mt-8" id="btnNewRes2">' + UI.icon('plus', 15) + ' Reservasi Baru</button>')) +
      '</div>';

    // event
    const q = container.querySelector('#fQ');
    q.addEventListener('input', debounce(() => {
      filter.q = q.value; filter.page = 1; render(container);
      const el = container.querySelector('#fQ');
      if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
    }, 220));
    container.querySelector('#fStatus').addEventListener('change', e => { filter.status = e.target.value; filter.page = 1; render(container); });
    container.querySelector('#fDokter').addEventListener('change', e => { filter.dokterId = e.target.value; filter.page = 1; render(container); });
    container.querySelector('#fTanggal').addEventListener('change', e => { filter.tanggal = e.target.value; filter.page = 1; render(container); });
    container.querySelector('#fReset').addEventListener('click', () => {
      filter.q = ''; filter.status = ''; filter.dokterId = ''; filter.tanggal = ''; filter.page = 1;
      render(container);
    });
    container.querySelector('#btnNewRes').addEventListener('click', () => openForm());
    const btnNewRes2 = container.querySelector('#btnNewRes2');
    if (btnNewRes2) btnNewRes2.addEventListener('click', () => openForm());
    container.querySelector('#btnExportRes').addEventListener('click', exportCSV);
    container.querySelectorAll('[data-page]').forEach(b => b.addEventListener('click', () => {
      if (b.disabled) return;
      filter.page = Number(b.dataset.page);
      render(container);
    }));

    container.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => openForm(b.dataset.edit)));
    container.querySelectorAll('[data-slip]').forEach(b => b.addEventListener('click', () => cetakSlip(b.dataset.slip)));
    container.querySelectorAll('[data-hapus]').forEach(b => b.addEventListener('click', () => hapus(b.dataset.hapus)));
    container.querySelectorAll('[data-aksi]').forEach(b => b.addEventListener('click', () => ubahStatus(b.dataset.aksi, b.dataset.id)));
  }

  function rowHTML(r) {
    const ps = Store.pasien(r.pasienId), dk = Store.dokter(r.dokterId), pl = Store.poli(r.poliId);
    return '<tr>' +
      '<td><div class="cell-user">' + UI.avatar(ps ? ps.nama : '?', 'sm') +
        '<div><div class="cell-main">' + UI.esc(ps ? ps.nama : 'Pasien dihapus') + '</div>' +
        '<div class="cell-sub">' + UI.esc(ps ? ps.noRm : '-') + '</div></div></div></td>' +
      '<td><div class="cell-main mono">' + r.waktu + '</div><div class="cell-sub">' + UI.fmtTanggalPendek(r.tanggal) + '</div></td>' +
      '<td><div class="cell-main">' + UI.esc(dk ? dk.nama : '-') + '</div><div class="cell-sub">' + UI.esc(dk ? dk.spesialisasi : '') + '</div></td>' +
      '<td><span class="badge b-lilac">' + UI.esc(pl ? pl.nama : '-') + '</span></td>' +
      '<td>' + badge(r.status) + '</td>' +
      '<td><span class="t-code">' + UI.esc(r.kode) + '</span></td>' +
      '<td><div class="t-actions">' +
        aksiButtons(r) +
        '<button class="icon-btn" data-slip="' + r.id + '" title="Bukti reservasi">' + UI.icon('printer', 15) + '</button>' +
        '<button class="icon-btn" data-edit="' + r.id + '" title="Ubah">' + UI.icon('edit', 15) + '</button>' +
        '<button class="icon-btn" data-hapus="' + r.id + '" title="Hapus">' + UI.icon('trash', 15) + '</button>' +
      '</div></td>' +
    '</tr>';
  }

  function aksiButtons(r) {
    if (r.status === 'menunggu') {
      return '<button class="btn btn-soft btn-sm" data-aksi="dikonfirmasi" data-id="' + r.id + '">Konfirmasi</button>';
    }
    if (r.status === 'dikonfirmasi') {
      return '<button class="btn btn-ghost btn-sm" data-aksi="selesai" data-id="' + r.id + '">Selesai</button>' +
             '<button class="btn btn-danger btn-sm" data-aksi="batal" data-id="' + r.id + '">Batal</button>';
    }
    if (r.status === 'batal') {
      return '<button class="btn btn-ghost btn-sm" data-aksi="menunggu" data-id="' + r.id + '">Aktifkan</button>';
    }
    return '<button class="btn btn-ghost btn-sm" data-aksi="batal" data-id="' + r.id + '">Batalkan</button>';
  }

  function badge(st) {
    const s = STATUS[st] || STATUS.menunggu;
    return '<span class="badge ' + s.cls + '"><span class="pip"></span>' + s.label + '</span>';
  }

  function filterData(s) {
    const q = filter.q.toLowerCase().trim();
    return s.reservasi.filter(r => {
      if (filter.status && r.status !== filter.status) return false;
      if (filter.dokterId && r.dokterId !== filter.dokterId) return false;
      if (filter.tanggal && r.tanggal !== filter.tanggal) return false;
      if (q) {
        const ps = Store.pasien(r.pasienId), dk = Store.dokter(r.dokterId);
        const hay = ((ps ? ps.nama + ' ' + ps.noRm : '') + ' ' + (r.kode || '') + ' ' +
          (dk ? dk.nama : '') + ' ' + (r.catatan || '')).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    }).sort((a, b) => (b.tanggal + b.waktu).localeCompare(a.tanggal + a.waktu));
  }

  /* ---------------- FORM ---------------- */
  function openForm(id) {
    const s = Store.get();
    const r = id ? Store.reservasi(id) : null;
    const hariIni = UI.todayISO();
    const tanggalAwal = r ? r.tanggal : hariIni;
    // reservasi baru tidak boleh bertanggal lampau; reservasi lama dibatasi pada tanggalnya sendiri
    const minTanggal = r ? (r.tanggal < hariIni ? r.tanggal : hariIni) : hariIni;

    const optionsPasien = s.pasien.map(p =>
      '<option value="' + p.id + '"' + (r && r.pasienId === p.id ? ' selected' : '') + '>' +
      UI.esc(p.nama + ' (' + p.noRm + ')') + '</option>').join('');
    const optionsDokter = s.dokter.filter(d => d.aktif !== false).map(d =>
      '<option value="' + d.id + '"' + (r && r.dokterId === d.id ? ' selected' : '') + '>' +
      UI.esc(d.nama + ' — ' + d.spesialisasi) + '</option>').join('');

    const body =
      (s.pasien.length === 0 ? '<div class="info-box danger mb-16"><span class="ico">' + UI.icon('alert', 17) + '</span><div>Belum ada data pasien. Tambahkan pasien terlebih dahulu di menu Pasien.</div></div>' : '') +
      '<div class="form-grid">' +
        '<div class="field full"><label class="label">Pasien <span class="req">*</span></label>' +
          '<select class="select" id="f_pasien">' + optionsPasien + '</select>' +
          '<span class="field-hint">Pasien baru? Tutup dulu form ini dan tambahkan di menu Pasien.</span></div>' +

        '<div class="field"><label class="label">Dokter <span class="req">*</span></label>' +
          '<select class="select" id="f_dokter">' + optionsDokter + '</select></div>' +
        '<div class="field"><label class="label">Poli</label>' +
          '<select class="select" id="f_poli"></select></div>' +

        '<div class="field"><label class="label">Tanggal <span class="req">*</span></label>' +
          '<input type="date" class="input" id="f_tanggal" value="' + tanggalAwal + '" min="' + minTanggal + '" /></div>' +
        '<div class="field"><label class="label">Jam <span class="req">*</span></label>' +
          '<select class="select" id="f_waktu"></select></div>' +

        '<div class="field"><label class="label">Status</label>' +
          '<select class="select" id="f_status">' +
            Object.keys(STATUS).map(k => '<option value="' + k + '"' + ((r ? r.status === k : k === 'menunggu') ? ' selected' : '') + '>' + STATUS[k].label + '</option>').join('') +
          '</select></div>' +
        '<div class="field"><label class="label">Cara Bayar</label>' +
          '<select class="select" id="f_bayar">' +
            ['Tunai', 'BPJS', 'Asuransi', 'Debit'].map(c => '<option' + (r && r.caraBayar === c ? ' selected' : '') + '>' + c + '</option>').join('') +
          '</select></div>' +

        '<div class="field"><label class="label">Deposit (DP)</label>' +
          '<input type="number" class="input" id="f_dp" min="0" step="10000" value="' + (r ? r.dp || 0 : 0) + '" placeholder="0" /></div>' +
        '<div class="field full"><label class="label">Catatan</label>' +
          '<textarea class="textarea" id="f_catatan" placeholder="Keluhan, catatan khusus...">' + UI.esc(r ? r.catatan || '' : '') + '</textarea></div>' +
      '</div>' +
      '<div id="f_info" class="mt-16"></div>';

    const m = UI.modal({
      title: r ? 'Ubah Reservasi' : 'Reservasi Baru',
      sub: r ? 'Kode ' + r.kode : 'Lengkapi data di bawah ini untuk membuat jadwal kunjungan',
      body: body,
      footer:
        (r ? '<button class="btn btn-danger spacer" data-hapus-modal>' + UI.icon('trash', 15) + ' Hapus</button>' : '') +
        '<button class="btn btn-ghost" data-close>Batal</button>' +
        '<button class="btn btn-primary" data-simpan>' + UI.icon('check', 16) + ' Simpan Reservasi</button>',
      onMount: (ov, close) => {
        const elDokter = ov.querySelector('#f_dokter');
        const elPoli = ov.querySelector('#f_poli');
        const elTanggal = ov.querySelector('#f_tanggal');
        const elWaktu = ov.querySelector('#f_waktu');
        const elInfo = ov.querySelector('#f_info');

        function isiPoli() {
          const dk = Store.dokter(elDokter.value);
          const opsi = s.poli.filter(p => !dk || p.nama === dk.poli);
          const list = opsi.length ? opsi : s.poli;
          elPoli.innerHTML = list.map(p => '<option value="' + p.id + '">' + UI.esc(p.nama) + ' — ' + UI.rupiah(p.harga) + '</option>').join('');
          if (r) {
            const p = s.poli.find(x => x.id === r.poliId);
            if (p && list.some(x => x.id === p.id)) elPoli.value = p.id;
          }
        }

        function isiSlot() {
          const slots = Store.slotTersedia(elDokter.value, elTanggal.value, r ? r.id : null);
          const namaDk = (Store.dokter(elDokter.value) || {}).nama || 'dokter';
          if (!slots.length) {
            elWaktu.innerHTML = '<option value="">— tidak ada slot —</option>';
            elInfo.innerHTML = '<div class="info-box warn"><span class="ico">' + UI.icon('info', 17) + '</span><div>Dokter <b>' +
              UI.esc(namaDk) + '</b> tidak praktik pada tanggal tersebut. Silakan pilih tanggal lain.</div></div>';
            return;
          }
          const current = r ? r.waktu : '';
          elWaktu.innerHTML = slots.map(sl =>
            '<option value="' + sl.jam + '"' + (sl.jam === current ? ' selected' : '') + (sl.tersedia ? '' : ' disabled') + '>' +
            sl.jam + (sl.tersedia ? '' : ' — terisi') + '</option>').join('');
          if (!slots.some(sl => sl.jam === current && sl.tersedia)) {
            const firstFree = slots.find(sl => sl.tersedia);
            if (firstFree) elWaktu.value = firstFree.jam;
          }
          const dk = Store.dokter(elDokter.value);
          const pl = s.poli.find(p => p.nama === (dk ? dk.poli : ''));
          const mulai = (dk && dk.jamKerja && dk.jamKerja.mulai) || s.pengaturan.jamBuka;
          const selesai = (dk && dk.jamKerja && dk.jamKerja.selesai) || s.pengaturan.jamTutup;
          elInfo.innerHTML = '<div class="info-box"><span class="ico">' + UI.icon('clock', 17) + '</span><div>' +
            'Praktik <b>' + UI.esc(namaDk) + '</b> pukul <b>' + mulai + '–' + selesai + '</b>' +
            (pl ? ' · ' + UI.esc(pl.nama) + ' (' + pl.durasi + ' menit, ' + UI.rupiah(pl.harga) + ')' : '') + '</div></div>';
        }

        elDokter.addEventListener('change', () => { isiPoli(); isiSlot(); });
        elTanggal.addEventListener('change', isiSlot);
        isiPoli(); isiSlot();

        const btnSimpan = ov.querySelector('[data-simpan]');
        btnSimpan.addEventListener('click', () => {
          const form = {
            pasienId: ov.querySelector('#f_pasien').value,
            dokterId: elDokter.value,
            poliId: elPoli.value,
            tanggal: elTanggal.value,
            waktu: elWaktu.value,
            status: ov.querySelector('#f_status').value,
            caraBayar: ov.querySelector('#f_bayar').value,
            dp: Number(ov.querySelector('#f_dp').value || 0),
            catatan: ov.querySelector('#f_catatan').value
          };

          // validasi
          const errs = [];
          const hariIni = UI.todayISO();
          // reservasi historis (tanggal lampau yang tidak diubah) tetap boleh diperbarui status/catatannya
          const historis = !!(r && form.tanggal === r.tanggal && r.tanggal < hariIni && form.pasienId === r.pasienId);
          if (!form.pasienId) errs.push('Pasien wajib dipilih.');
          if (!form.dokterId) errs.push('Dokter wajib dipilih.');
          if (!form.tanggal) errs.push('Tanggal wajib diisi.');
          if (form.tanggal && form.tanggal < hariIni && !historis) {
            errs.push('Tanggal reservasi tidak boleh di masa lalu.');
          }
          if (!form.waktu) errs.push('Jam wajib dipilih.');
          const bentrok = form.dokterId && form.tanggal && form.waktu
            ? Store.cekBentrok(Object.assign({ id: r ? r.id : null }, form)) : null;
          if (bentrok) errs.push(bentrok);
          const batas = form.pasienId && !historis
            ? Store.cekBatasPasien(form.pasienId, r ? r.id : null) : null;
          if (batas) errs.push(batas);

          if (errs.length) {
            elInfo.innerHTML = '<div class="info-box danger"><span class="ico">' + UI.icon('alert', 17) + '</span><div>' +
              errs.map(e => UI.esc(e)).join('<br/>') + '</div></div>';
            elInfo.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            return;
          }

          if (r) {
            Store.update(st => {
              const target = st.reservasi.find(x => x.id === r.id);
              Object.assign(target, form, { updatedAt: new Date().toISOString() });
            });
            UI.toast('Reservasi ' + r.kode + ' diperbarui');
          } else {
            Store.update(st => {
              st.reservasi.push(Object.assign({}, form, {
                id: Store.uid('RV'),
                kode: Store.generasiKodeReservasi(form.tanggal),
                dp: form.dp,
                dibuatPada: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              }));
            });
            UI.toast('Reservasi berhasil dibuat');
          }
          close();
          App.rerender();
        });

        const btnHapus = ov.querySelector('[data-hapus-modal]');
        if (btnHapus) btnHapus.addEventListener('click', () => { close(); hapus(r.id); });
      }
    });
    return m;
  }

  function ubahStatus(aksi, id) {
    Store.update(st => {
      const r = st.reservasi.find(x => x.id === id);
      if (r) { r.status = aksi; r.updatedAt = new Date().toISOString(); }
    });
    UI.toast('Status diubah menjadi ' + (STATUS[aksi] ? STATUS[aksi].label : aksi));
    App.rerender();
  }

  function hapus(id) {
    const r = Store.reservasi(id);
    if (!r) return;
    UI.konfirmasi({
      teks: 'Reservasi <b>' + UI.esc(r.kode) + '</b> atas nama <b>' + UI.esc((Store.pasien(r.pasienId) || {}).nama || '-') +
            '</b> akan dihapus permanen.',
      ok: 'Ya, hapus'
    }).then(ya => {
      if (!ya) return;
      Store.update(st => { st.reservasi = st.reservasi.filter(x => x.id !== id); });
      UI.toast('Reservasi dihapus', 'info');
      App.rerender();
    });
  }

  function exportCSV() {
    const list = filterData(Store.get());
    const baris = [['Kode', 'Tanggal', 'Jam', 'Pasien', 'No RM', 'Dokter', 'Poli', 'Status', 'Cara Bayar', 'DP', 'Catatan']];
    list.forEach(r => {
      const ps = Store.pasien(r.pasienId) || {}, dk = Store.dokter(r.dokterId) || {}, pl = Store.poli(r.poliId) || {};
      baris.push([r.kode, r.tanggal, r.waktu, ps.nama || '', ps.noRm || '', dk.nama || '', pl.nama || '',
        (STATUS[r.status] || {}).label || r.status, r.caraBayar || '', r.dp || 0, r.catatan || '']);
    });
    UI.unduhCSV('reservasi-klinik-' + UI.todayISO() + '.csv', baris);
    UI.toast('File CSV diunduh');
  }

  /* ---------------- BUKTI RESERVASI ---------------- */
  function cetakSlip(id) {
    const r = Store.reservasi(id);
    if (!r) return;
    const s = Store.get();
    const p = s.pengaturan;
    const ps = Store.pasien(r.pasienId) || {};
    const dk = Store.dokter(r.dokterId) || {};
    const pl = Store.poli(r.poliId) || {};
    const biaya = pl.harga || 0;
    const dp = r.dp || 0;
    const sisa = Math.max(0, biaya - dp);
    const labelStatus = (STATUS[r.status] || STATUS.menunggu).label;

    const baris = (k, v) => '<div class="slip-row"><span class="k">' + k + '</span><span class="v">' + UI.esc(v) + '</span></div>';

    const slip =
      '<div class="slip">' +
        '<div class="slip-head">' +
          '<div class="slip-mark">' + UI.icon('heart', 22) + '</div>' +
          '<div class="nama">' + UI.esc(p.namaKlinik) + '</div>' +
          '<div class="alamat">' + UI.esc(p.alamat) + '<br>' + UI.esc(p.telepon) + ' · ' + UI.esc(p.email) + '</div>' +
          '<div class="slip-kode">' + UI.esc(r.kode) + '</div>' +
        '</div>' +
        '<div class="slip-judul">Bukti Reservasi</div>' +
        '<div class="slip-rows">' +
          baris('Nama Pasien', ps.nama || '-') +
          baris('No. Rekam Medis', ps.noRm || '-') +
          baris('Dokter', dk.nama || '-') +
          baris('Poli', pl.nama || '-') +
          baris('Tanggal', UI.fmtTanggal(r.tanggal, 'day')) +
          baris('Jam', r.waktu + ' WIB') +
          baris('Status', labelStatus) +
          baris('Cara Bayar', r.caraBayar || '-') +
        '</div>' +
        '<div class="slip-total"><span>Total Biaya Konsultasi</span><span>' + UI.rupiah(biaya) + '</span></div>' +
        '<div class="slip-rows" style="margin-top:8px">' +
          baris('DP Dibayar', UI.rupiah(dp)) +
          baris('Sisa Pembayaran', UI.rupiah(sisa)) +
        '</div>' +
        (r.catatan ? '<div class="slip-note"><b>Catatan:</b> ' + UI.esc(r.catatan) + '</div>' : '') +
        '<div class="slip-foot">Simpan bukti ini sebagai pengingat jadwal kunjungan Anda.<br>' +
        'Hubungi klinik bila ingin mengubah jadwal. Bukti ini sah tanpa tanda tangan.</div>' +
      '</div>';

    UI.modal({
      title: 'Bukti Reservasi',
      sub: r.kode + ' · ' + UI.fmtTanggal(r.tanggal, 'withDayShort') + ' ' + r.waktu,
      body: '<div id="slipArea">' + slip + '</div>',
      footer: '<button class="btn btn-ghost" data-close>Tutup</button>' +
              '<button class="btn btn-primary" data-cetak>' + UI.icon('printer', 15) + ' Cetak Bukti</button>',
      onMount: (ov) => {
        ov.querySelector('[data-cetak]').addEventListener('click', () => {
          document.body.classList.add('cetak-slip');
          const bersihkan = () => {
            document.body.classList.remove('cetak-slip');
            window.removeEventListener('afterprint', bersihkan);
          };
          window.addEventListener('afterprint', bersihkan);
          window.print();
          setTimeout(bersihkan, 2000);
        });
      }
    });
  }

  function debounce(fn, ms) {
    let t; return function () { clearTimeout(t); t = setTimeout(fn, ms); };
  }

  return { render: render, openForm: openForm, cetakSlip: cetakSlip, badge: badge, STATUS: STATUS };
})();
