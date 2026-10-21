/* ============================================================
   View: Pasien
   ============================================================ */
window.ViewPasien = (function () {

  let filter = { q: '', golongan: '', page: 1 };
  const PER_HALAMAN = 12;
  let root = null;

  const GOLONGAN = [
    { key: '', label: 'Semua Golongan' },
    { key: 'Reguler', label: 'Reguler' },
    { key: 'Silver', label: 'Silver' },
    { key: 'Gold', label: 'Gold' }
  ];

  function render(container) {
    root = container;
    const s = Store.get();
    const semua = filterData(s);
    const totalHal = Math.max(1, Math.ceil(semua.length / PER_HALAMAN));
    if (filter.page > totalHal) filter.page = totalHal;
    const list = semua.slice((filter.page - 1) * PER_HALAMAN, filter.page * PER_HALAMAN);

    container.innerHTML =
      '<div class="grid grid-4 mb-16">' +
        stat('p', 'users', 'Total Pasien', s.pasien.length) +
        stat('g', 'heart', 'Pasien Aktif', s.pasien.filter(p => p.status === 'aktif').length) +
        stat('k', 'star', 'Member Gold', s.pasien.filter(p => p.golongan === 'Gold').length) +
        stat('o', 'calendar', 'Kunjungan Bulan Ini', kunjunganBulanIni(s)) +
      '</div>' +

      '<div class="card">' +
        '<div class="card-head">' +
          '<div><div class="card-title"><span class="dot"></span> Data Pasien</div>' +
          '<div class="card-sub">' + semua.length + ' pasien ditampilkan</div></div>' +
          '<div class="flex gap-8">' +
            '<button class="btn btn-ghost btn-sm" id="btnExpPs">' + UI.icon('download', 15) + ' Ekspor CSV</button>' +
            '<button class="btn btn-primary btn-sm" id="btnNewPs">' + UI.icon('plus', 15) + ' Pasien Baru</button>' +
          '</div>' +
        '</div>' +

        '<div class="filter-bar">' +
          '<div class="search-mini" style="flex:1;min-width:220px">' + UI.icon('search', 16) +
            '<input class="input" id="pQ" placeholder="Cari nama, NIK, atau no. RM..." value="' + UI.esc(filter.q) + '" /></div>' +
          '<select class="select" id="pGol">' + GOLONGAN.map(g =>
            '<option value="' + g.key + '"' + (filter.golongan === g.key ? ' selected' : '') + '>' + g.label + '</option>').join('') +
          '</select>' +
        '</div>' +

        (list.length ? '<div class="table-wrap"><table><thead><tr>' +
            '<th>Pasien</th><th>No. RM</th><th>Jenis Kelamin</th><th>Umur</th><th>Telepon</th><th>Golongan</th><th>Alergi</th><th class="t-actions">Aksi</th>' +
          '</tr></thead><tbody>' + list.map(row).join('') + '</tbody></table></div>' +
          UI.pagination(semua.length, filter.page, PER_HALAMAN)
          : UI.emptyState('users', 'Belum ada pasien', 'Tambahkan data pasien untuk mulai membuat reservasi.',
            '<button class="btn btn-primary btn-sm mt-8" id="btnNewPs2">' + UI.icon('plus', 15) + ' Tambah Pasien</button>')) +
      '</div>';

    const q = container.querySelector('#pQ');
    q.addEventListener('input', debounce(() => {
      filter.q = q.value; filter.page = 1; render(container);
      const el = container.querySelector('#pQ');
      if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
    }, 220));
    container.querySelector('#pGol').addEventListener('change', e => { filter.golongan = e.target.value; filter.page = 1; render(container); });
    container.querySelector('#btnNewPs').addEventListener('click', () => openForm());
    const b2 = container.querySelector('#btnNewPs2'); if (b2) b2.addEventListener('click', () => openForm());
    container.querySelector('#btnExpPs').addEventListener('click', exportCSV);
    container.querySelectorAll('[data-page]').forEach(b => b.addEventListener('click', () => {
      if (b.disabled) return;
      filter.page = Number(b.dataset.page);
      render(container);
    }));
    container.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => openForm(b.dataset.edit)));
    container.querySelectorAll('[data-hapus]').forEach(b => b.addEventListener('click', () => hapus(b.dataset.hapus)));
    container.querySelectorAll('[data-riwayat]').forEach(b => b.addEventListener('click', () => lihatRiwayat(b.dataset.riwayat)));
  }

  function stat(warna, ico, label, nilai) {
    return '<div class="stat"><div class="stat-top"><div><div class="stat-label">' + label + '</div>' +
      '<div class="stat-value">' + nilai + '</div></div>' +
      '<div class="stat-ico ' + warna + '">' + UI.icon(ico, 21) + '</div></div></div>';
  }

  function umur(tanggalLahir) {
    const d = UI.parseISO(tanggalLahir);
    if (!d) return '-';
    const now = new Date();
    let u = now.getFullYear() - d.getFullYear();
    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) u--;
    return u + ' th';
  }

  function row(p) {
    const selAllergi = p.allergies ? '<span class="badge b-batal">' + UI.esc(p.allergies) + '</span>' : '<span class="muted">—</span>';
    return '<tr>' +
      '<td><div class="cell-user">' + UI.avatar(p.nama, 'sm') +
        '<div><div class="cell-main">' + UI.esc(p.nama) + '</div><div class="cell-sub">' + UI.esc(p.nik || '-') + '</div></div></div></td>' +
      '<td><span class="t-code">' + UI.esc(p.noRm) + '</span></td>' +
      '<td>' + (p.jenisKelamin === 'P' ? 'Perempuan' : 'Laki-laki') + '</td>' +
      '<td class="mono">' + umur(p.tanggalLahir) + '</td>' +
      '<td class="mono small">' + UI.esc(p.telepon || '-') + '</td>' +
      '<td><span class="badge ' + (p.golongan === 'Gold' ? 'b-menunggu' : p.golongan === 'Silver' ? 'b-lilac' : 'b-netral') + '">' +
        UI.esc(p.golongan || 'Reguler') + '</span></td>' +
      '<td>' + selAllergi + '</td>' +
      '<td><div class="t-actions">' +
        '<button class="btn btn-ghost btn-sm" data-riwayat="' + p.id + '">Riwayat</button>' +
        '<button class="icon-btn" data-edit="' + p.id + '" title="Ubah">' + UI.icon('edit', 15) + '</button>' +
        '<button class="icon-btn" data-hapus="' + p.id + '" title="Hapus">' + UI.icon('trash', 15) + '</button>' +
      '</div></td></tr>';
  }

  function filterData(s) {
    const q = filter.q.toLowerCase().trim();
    return s.pasien.filter(p => {
      if (filter.golongan && p.golongan !== filter.golongan) return false;
      if (q) {
        const hay = (p.nama + ' ' + (p.nik || '') + ' ' + (p.noRm || '') + ' ' + (p.telepon || '') + ' ' +
          (p.penyakit || '') + ' ' + (p.allergies || '')).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    }).sort((a, b) => a.nama.localeCompare(b.nama));
  }

  /* ---------------- FORM ---------------- */
  function openForm(id) {
    const s = Store.get();
    const p = id ? Store.pasien(id) : null;
    const nextNo = 'RM-' + (1001 + s.pasien.length);

    const body = '<div class="form-grid">' +
      '<div class="field full"><label class="label">Nama Lengkap <span class="req">*</span></label>' +
        '<input class="input" id="p_nama" placeholder="Nama sesuai KTP" value="' + UI.esc(p ? p.nama : '') + '" /></div>' +
      '<div class="field"><label class="label">No. Rekam Medis</label>' +
        '<input class="input" id="p_rm" value="' + UI.esc(p ? p.noRm : nextNo) + '" /></div>' +
      '<div class="field"><label class="label">NIK</label>' +
        '<input class="input" id="p_nik" maxlength="16" placeholder="16 digit NIK" value="' + UI.esc(p ? p.nik || '' : '') + '" /></div>' +
      '<div class="field"><label class="label">Jenis Kelamin</label>' +
        '<select class="select" id="p_jk"><option value="L"' + (p && p.jenisKelamin === 'L' ? ' selected' : '') + '>Laki-laki</option>' +
        '<option value="P"' + (p && p.jenisKelamin === 'P' ? ' selected' : '') + '>Perempuan</option></select></div>' +
      '<div class="field"><label class="label">Tanggal Lahir</label>' +
        '<input type="date" class="input" id="p_lahir" value="' + UI.esc(p ? p.tanggalLahir || '' : '') + '" /></div>' +
      '<div class="field"><label class="label">Golongan Darah</label>' +
        '<select class="select" id="p_golDarah">' + ['', 'A', 'B', 'AB', 'O'].map(g =>
          '<option value="' + g + '"' + (p && p.golonganDarah === g ? ' selected' : '') + '>' + (g || '-') + '</option>').join('') + '</select></div>' +
      '<div class="field"><label class="label">Golongan Pasien</label>' +
        '<select class="select" id="p_gol">' + ['Reguler', 'Silver', 'Gold'].map(g =>
          '<option' + (p && p.golongan === g ? ' selected' : (!p && g === 'Reguler' ? ' selected' : '')) + '>' + g + '</option>').join('') + '</select></div>' +
      '<div class="field"><label class="label">No. Telepon</label>' +
        '<input class="input" id="p_telp" placeholder="08xx-xxxx-xxxx" value="' + UI.esc(p ? p.telepon || '' : '') + '" /></div>' +
      '<div class="field"><label class="label">Email</label>' +
        '<input type="email" class="input" id="p_email" value="' + UI.esc(p ? p.email || '' : '') + '" /></div>' +
      '<div class="field full"><label class="label">Alamat</label>' +
        '<textarea class="textarea" id="p_alamat" style="min-height:64px">' + UI.esc(p ? p.alamat || '' : '') + '</textarea></div>' +
      '<div class="field"><label class="label">Riwayat Penyakit</label>' +
        '<input class="input" id="p_penyakit" placeholder="cth: Diabetes Tipe 2" value="' + UI.esc(p ? p.penyakit || '' : '') + '" /></div>' +
      '<div class="field"><label class="label">Alergi</label>' +
        '<input class="input" id="p_alergi" placeholder="cth: Penicillin" value="' + UI.esc(p ? p.allergies || '' : '') + '" /></div>' +
      '<div class="field full"><label class="switch"><input type="checkbox" id="p_aktif"' + (!p || p.status === 'aktif' ? ' checked' : '') + ' />' +
        '<span class="track"><span class="thumb"></span></span><span class="txt">Status aktif</span></label></div>' +
    '</div><div id="p_info" class="mt-16"></div>';

    UI.modal({
      title: p ? 'Ubah Data Pasien' : 'Pasien Baru',
      sub: p ? p.noRm : 'Lengkapi data pasien untuk membuat reservasi',
      body: body,
      footer:
        (p ? '<button class="btn btn-danger spacer" data-hapus-modal>' + UI.icon('trash', 15) + ' Hapus</button>' : '') +
        '<button class="btn btn-ghost" data-close>Batal</button>' +
        '<button class="btn btn-primary" data-simpan>' + UI.icon('check', 16) + ' Simpan</button>',
      onMount: (ov, close) => {
        ov.querySelector('[data-simpan]').addEventListener('click', () => {
          const form = {
            nama: ov.querySelector('#p_nama').value.trim(),
            noRm: ov.querySelector('#p_rm').value.trim() || ('RM-' + (1001 + Store.get().pasien.length)),
            nik: ov.querySelector('#p_nik').value.trim(),
            jenisKelamin: ov.querySelector('#p_jk').value,
            tanggalLahir: ov.querySelector('#p_lahir').value,
            golonganDarah: ov.querySelector('#p_golDarah').value,
            golongan: ov.querySelector('#p_gol').value,
            telepon: ov.querySelector('#p_telp').value.trim(),
            email: ov.querySelector('#p_email').value.trim(),
            alamat: ov.querySelector('#p_alamat').value.trim(),
            penyakit: ov.querySelector('#p_penyakit').value.trim(),
            allergies: ov.querySelector('#p_alergi').value.trim(),
            status: ov.querySelector('#p_aktif').checked ? 'aktif' : 'nonaktif'
          };
          const errs = [];
          if (!form.nama) errs.push('Nama lengkap wajib diisi.');
          if (form.nik && form.nik.length !== 16) errs.push('NIK harus terdiri dari 16 digit.');
          if (form.email && form.email.indexOf('@') === -1) errs.push('Format email tidak valid.');
          if (errs.length) {
            ov.querySelector('#p_info').innerHTML = '<div class="info-box danger"><span class="ico">' + UI.icon('alert', 17) +
              '</span><div>' + errs.map(UI.esc).join('<br/>') + '</div></div>';
            return;
          }
          if (p) {
            Store.update(st => {
              const t = st.pasien.find(x => x.id === p.id);
              Object.assign(t, form);
            });
            UI.toast('Data pasien diperbarui');
          } else {
            Store.update(st => {
              st.pasien.push(Object.assign({}, form, {
                id: Store.uid('PS'), dibuatPada: new Date().toISOString()
              }));
            });
            UI.toast('Pasien baru ditambahkan');
          }
          close();
          App.rerender();
        });
        const hb = ov.querySelector('[data-hapus-modal]');
        if (hb) hb.addEventListener('click', () => { close(); hapus(p.id); });
      }
    });
  }

  function hapus(id) {
    const p = Store.pasien(id); if (!p) return;
    const dipakai = Store.get().reservasi.filter(r => r.pasienId === id).length;
    UI.konfirmasi({
      teks: 'Data <b>' + UI.esc(p.nama) + '</b> akan dihapus.' +
        (dipakai ? '<br/><br/>Catatan: ada <b>' + dipakai + ' reservasi</b> terkait pasien ini dan tidak akan ikut terhapus.' : ''),
      ok: 'Ya, hapus'
    }).then(ya => {
      if (!ya) return;
      Store.update(st => { st.pasien = st.pasien.filter(x => x.id !== id); });
      UI.toast('Data pasien dihapus', 'info');
      App.rerender();
    });
  }

  function lihatRiwayat(id) {
    const p = Store.pasien(id); if (!p) return;
    const list = Store.get().reservasi.filter(r => r.pasienId === id).sort((a, b) => b.tanggal.localeCompare(a.tanggal));
    UI.modal({
      title: 'Riwayat Kunjungan',
      sub: p.nama + ' · ' + p.noRm,
      body: (p.allergies ? '<div class="info-box danger mb-16"><span class="ico">' + UI.icon('alert', 17) + '</span><div><b>Alergi:</b> ' + UI.esc(p.allergies) + '</div></div>' : '') +
        (list.length ? '<div class="list">' + list.map(r => {
          const dk = Store.dokter(r.dokterId);
          return '<div class="list-item">' + UI.avatar(dk ? dk.nama : '?', 'sm') +
            '<div class="li-main"><div class="li-title">' + UI.fmtTanggal(r.tanggal, 'withDayShort') + ' · ' + r.waktu + '</div>' +
            '<div class="li-sub">' + UI.esc(dk ? dk.nama : '-') + ' · ' + UI.esc(r.catatan || 'Tanpa catatan') + '</div></div>' +
            ViewReservasi.badge(r.status) + '</div>';
        }).join('') + '</div>'
        : UI.emptyState('inbox', 'Belum ada riwayat', 'Pasien ini belum pernah melakukan reservasi.')),
      footer: '<button class="btn btn-ghost" data-close>Tutup</button>'
    });
  }

  function exportCSV() {
    const list = filterData(Store.get());
    const baris = [['No RM', 'Nama', 'NIK', 'JK', 'Tanggal Lahir', 'Umur', 'Telepon', 'Email', 'Alamat', 'Golongan', 'Golongan Darah', 'Penyakit', 'Alergi', 'Status']];
    list.forEach(p => baris.push([p.noRm, p.nama, p.nik || '', p.jenisKelamin, p.tanggalLahir || '', umur(p.tanggalLahir),
      p.telepon || '', p.email || '', p.alamat || '', p.golongan || '', p.golonganDarah || '', p.penyakit || '', p.allergies || '', p.status]));
    UI.unduhCSV('pasien-klinik-' + UI.todayISO() + '.csv', baris);
    UI.toast('File CSV diunduh');
  }

  function kunjunganBulanIni(s) {
    const bulan = UI.todayISO().slice(0, 7);
    return s.reservasi.filter(r => r.tanggal.slice(0, 7) === bulan && r.status !== 'batal').length;
  }

  function debounce(fn, ms) { let t; return function () { clearTimeout(t); t = setTimeout(fn, ms); }; }

  return { render: render, openForm: openForm };
})();
