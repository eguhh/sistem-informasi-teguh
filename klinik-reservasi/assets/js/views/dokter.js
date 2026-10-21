/* ============================================================
   View: Dokter & Poli
   ============================================================ */
window.ViewDokter = (function () {

  let tab = 'dokter';

  function render(container) {
    const s = Store.get();

    container.innerHTML =
      '<div class="card mb-16">' +
        '<div class="flex items-center justify-between wrap gap-12">' +
          '<div class="pill-row">' +
            '<button class="chip' + (tab === 'dokter' ? ' active' : '') + '" data-tab="dokter">' + UI.icon('stethoscope', 15) + ' Dokter</button>' +
            '<button class="chip' + (tab === 'poli' ? ' active' : '') + '" data-tab="poli">' + UI.icon('heart', 15) + ' Poli Layanan</button>' +
          '</div>' +
          '<div class="flex gap-8">' +
            '<button class="btn btn-ghost btn-sm" id="btnExpDk">' + UI.icon('download', 15) + ' Ekspor CSV</button>' +
            '<button class="btn btn-primary btn-sm" id="btnNewDk">' + UI.icon('plus', 15) +
              (tab === 'dokter' ? ' Dokter Baru' : ' Poli Baru') + '</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
      (tab === 'dokter' ? renderDokter(s) : renderPoli(s));

    container.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => {
      tab = b.dataset.tab; render(container);
    }));
    container.querySelector('#btnNewDk').addEventListener('click', () => tab === 'dokter' ? openDokter() : openPoli());
    container.querySelector('#btnExpDk').addEventListener('click', exportCSV);
    container.querySelectorAll('[data-ekd]').forEach(b => b.addEventListener('click', () => openDokter(b.dataset.ekd)));
    container.querySelectorAll('[data-hd]').forEach(b => b.addEventListener('click', () => hapusDokter(b.dataset.hd)));
    container.querySelectorAll('[data-ekp]').forEach(b => b.addEventListener('click', () => openPoli(b.dataset.ekp)));
    container.querySelectorAll('[data-hp]').forEach(b => b.addEventListener('click', () => hapusPoli(b.dataset.hp)));
  }

  function renderDokter(s) {
    if (!s.dokter.length) {
      return '<div class="card">' + UI.emptyState('stethoscope', 'Belum ada dokter', 'Tambahkan dokter yang praktik di klinik ini.',
        '<button class="btn btn-primary btn-sm mt-8" id="btnNewDk2">' + UI.icon('plus', 15) + ' Tambah Dokter</button>') + '</div>';
    }
    return '<div class="grid grid-3">' + s.dokter.map(d => {
      const jml = s.reservasi.filter(r => r.dokterId === d.id && r.status !== 'batal').length;
      const hari = (d.hariKerja || []).map(x => UI.HARI_SHORT[x - 1]).join(', ') || '-';
      return '<div class="card hoverable">' +
        '<div class="flex items-center gap-12 mb-12">' +
          '<div class="avatar lg" style="background:linear-gradient(140deg,' + d.warna + ',#ffffff55)">' + UI.esc(UI.inisial(d.nama)) + '</div>' +
          '<div style="min-width:0;flex:1"><div style="font-weight:750;font-size:14.5px">' + UI.esc(d.nama) + '</div>' +
          '<div class="small muted">' + UI.esc(d.spesialisasi) + '</div></div>' +
          (d.aktif === false ? '<span class="badge b-batal">Nonaktif</span>' : '<span class="badge b-selesai"><span class="pip"></span>Aktif</span>') +
        '</div>' +
        '<div class="kv mb-8"><span class="k">Poli</span><span class="v">' + UI.esc(d.poli) + '</span></div>' +
        '<div class="kv mb-8"><span class="k">Jam Praktik</span><span class="v">' + UI.esc((d.jamKerja || {}).mulai || '-') + ' — ' + UI.esc((d.jamKerja || {}).selesai || '-') + '</span></div>' +
        '<div class="kv mb-12"><span class="k">Hari Praktik</span><span class="v small">' + UI.esc(hari) + '</span></div>' +
        '<div class="flex items-center justify-between mt-16">' +
          '<span class="badge b-lilac">' + jml + ' reservasi</span>' +
          '<div class="t-actions">' +
            '<button class="icon-btn" data-ekd="' + d.id + '" title="Ubah">' + UI.icon('edit', 15) + '</button>' +
            '<button class="icon-btn" data-hd="' + d.id + '" title="Hapus">' + UI.icon('trash', 15) + '</button>' +
          '</div>' +
        '</div></div>';
    }).join('') + '</div>';
  }

  function renderPoli(s) {
    if (!s.poli.length) {
      return '<div class="card">' + UI.emptyState('heart', 'Belum ada poli', 'Tambahkan layanan poli yang tersedia di klinik.') + '</div>';
    }
    return '<div class="grid grid-2">' + s.poli.map(p => {
      const jml = s.reservasi.filter(r => r.poliId === p.id && r.status !== 'batal').length;
      return '<div class="card hoverable">' +
        '<div class="flex items-center justify-between gap-12 mb-12">' +
          '<div class="flex items-center gap-12">' +
            '<div class="stat-ico" style="width:44px;height:44px;border-radius:15px;background:linear-gradient(140deg,' + p.warna + ',#ffffff44)">' + UI.icon('heart', 20) + '</div>' +
            '<div><div style="font-weight:750;font-size:14.5px">' + UI.esc(p.nama) + '</div>' +
            '<div class="small muted">' + p.durasi + ' menit · ' + UI.rupiah(p.harga) + '</div></div>' +
          '</div>' +
          '<div class="t-actions">' +
            '<button class="icon-btn" data-ekp="' + p.id + '" title="Ubah">' + UI.icon('edit', 15) + '</button>' +
            '<button class="icon-btn" data-hp="' + p.id + '" title="Hapus">' + UI.icon('trash', 15) + '</button>' +
          '</div>' +
        '</div>' +
        '<p class="small muted" style="line-height:1.6">' + UI.esc(p.deskripsi || '-') + '</p>' +
        '<div class="progress mt-16"><i style="width:' + Math.min(100, jml * 4) + '%;background:linear-gradient(90deg,' + p.warna + ',' + p.warna + '88)"></i></div>' +
        '<div class="small muted mt-8">' + jml + ' reservasi tercatat</div>' +
      '</div>';
    }).join('') + '</div>';
  }

  /* ---------------- form dokter ---------------- */
  function openDokter(id) {
    const s = Store.get();
    const d = id ? Store.dokter(id) : null;
    const palet = ['#6f8bf7', '#f49ec2', '#a58cf0', '#4fc3a1', '#f0b45c', '#5cc0e8', '#f0718d'];

    const body = '<div class="form-grid">' +
      '<div class="field full"><label class="label">Nama Lengkap <span class="req">*</span></label>' +
        '<input class="input" id="d_nama" placeholder="dr. Nama, Sp.MK" value="' + UI.esc(d ? d.nama : '') + '" /></div>' +
      '<div class="field"><label class="label">Spesialisasi</label>' +
        '<input class="input" id="d_spes" placeholder="cth: Penyakit Dalam" value="' + UI.esc(d ? d.spesialisasi : '') + '" /></div>' +
      '<div class="field"><label class="label">Poli</label>' +
        '<select class="select" id="d_poli">' +
          (s.poli.length ? s.poli.map(p => '<option value="' + UI.esc(p.nama) + '"' + (d && d.poli === p.nama ? ' selected' : '') + '>' + UI.esc(p.nama) + '</option>').join('')
            : '<option value="">— belum ada poli —</option>') +
        '</select></div>' +
      '<div class="field"><label class="label">No. Telepon</label>' +
        '<input class="input" id="d_telp" value="' + UI.esc(d ? d.telepon || '' : '') + '" /></div>' +
      '<div class="field"><label class="label">Warna Penanda</label>' +
        '<div class="pill-row" id="d_warna">' + palet.map(c =>
          '<button type="button" class="chip' + ((d ? d.warna : palet[0]) === c ? ' active' : '') + '" data-warna="' + c + '" style="background:' + c + ';border-color:' + c + ';width:32px;height:32px;padding:0"></button>').join('') +
        '</div></div>' +
      '<div class="field"><label class="label">Jam Mulai</label>' +
        '<input type="time" class="input" id="d_mulai" value="' + UI.esc(d ? (d.jamKerja || {}).mulai : '08:00') + '" /></div>' +
      '<div class="field"><label class="label">Jam Selesai</label>' +
        '<input type="time" class="input" id="d_selesai" value="' + UI.esc(d ? (d.jamKerja || {}).selesai : '16:00') + '" /></div>' +
      '<div class="field full"><label class="label">Hari Praktik</label>' +
        '<div class="pill-row" id="d_hari">' +
          [1, 2, 3, 4, 5, 6, 7].map(i => {
            const on = d ? (d.hariKerja || []).indexOf(i) !== -1 : i <= 5;
            return '<button type="button" class="chip' + (on ? ' active' : '') + '" data-hari="' + i + '">' + UI.HARI[i - 1] + '</button>';
          }).join('') +
        '</div></div>' +
      '<div class="field full"><label class="switch"><input type="checkbox" id="d_aktif"' + (!d || d.aktif !== false ? ' checked' : '') + ' />' +
        '<span class="track"><span class="thumb"></span></span><span class="txt">Dokter sedang praktik</span></label></div>' +
    '</div><div id="d_info" class="mt-16"></div>';

    UI.modal({
      title: d ? 'Ubah Data Dokter' : 'Dokter Baru',
      sub: d ? d.nama : 'Tambahkan dokter yang akan praktik',
      body: body,
      footer:
        (d ? '<button class="btn btn-danger spacer" data-hapus-modal>' + UI.icon('trash', 15) + ' Hapus</button>' : '') +
        '<button class="btn btn-ghost" data-close>Batal</button>' +
        '<button class="btn btn-primary" data-simpan>' + UI.icon('check', 16) + ' Simpan</button>',
      onMount: (ov, close) => {
        let warna = d ? d.warna : palet[0];
        const hariAktif = new Set(d ? (d.hariKerja || []) : [1, 2, 3, 4, 5]);

        ov.querySelectorAll('[data-warna]').forEach(b => b.addEventListener('click', () => {
          warna = b.dataset.warna;
          ov.querySelectorAll('[data-warna]').forEach(x => x.classList.toggle('active', x.dataset.warna === warna));
        }));
        ov.querySelectorAll('[data-hari]').forEach(b => b.addEventListener('click', () => {
          const v = Number(b.dataset.hari);
          if (hariAktif.has(v)) { hariAktif.delete(v); b.classList.remove('active'); }
          else { hariAktif.add(v); b.classList.add('active'); }
        }));

        ov.querySelector('[data-simpan]').addEventListener('click', () => {
          const form = {
            nama: ov.querySelector('#d_nama').value.trim(),
            spesialisasi: ov.querySelector('#d_spes').value.trim(),
            poli: ov.querySelector('#d_poli').value,
            telepon: ov.querySelector('#d_telp').value.trim(),
            warna: warna,
            jamKerja: { mulai: ov.querySelector('#d_mulai').value || '08:00', selesai: ov.querySelector('#d_selesai').value || '16:00' },
            hariKerja: Array.from(hariAktif).sort(),
            aktif: ov.querySelector('#d_aktif').checked
          };
          const errs = [];
          if (!form.nama) errs.push('Nama dokter wajib diisi.');
          if (form.jamKerja.selesai <= form.jamKerja.mulai) errs.push('Jam selesai harus lebih besar dari jam mulai.');
          if (!form.hariKerja.length) errs.push('Pilih minimal satu hari praktik.');
          if (errs.length) {
            ov.querySelector('#d_info').innerHTML = '<div class="info-box danger"><span class="ico">' + UI.icon('alert', 17) +
              '</span><div>' + errs.map(UI.esc).join('<br/>') + '</div></div>';
            return;
          }
          if (d) {
            Store.update(st => { Object.assign(st.dokter.find(x => x.id === d.id), form); });
            UI.toast('Data dokter diperbarui');
          } else {
            Store.update(st => { st.dokter.push(Object.assign({ id: Store.uid('DK') }, form)); });
            UI.toast('Dokter baru ditambahkan');
          }
          close();
          App.rerender();
        });
        const hb = ov.querySelector('[data-hapus-modal]');
        if (hb) hb.addEventListener('click', () => { close(); hapusDokter(d.id); });
      }
    });
  }

  function hapusDokter(id) {
    const d = Store.dokter(id); if (!d) return;
    const dipakai = Store.get().reservasi.filter(r => r.dokterId === id && r.status !== 'batal').length;
    UI.konfirmasi({
      teks: 'Dokter <b>' + UI.esc(d.nama) + '</b> akan dihapus.' +
        (dipakai ? '<br/><br/>Ada <b>' + dipakai + ' reservasi aktif</b> terkait. Pertimbangkan menonaktifkan dokter alih-alih menghapus.' : ''),
      ok: 'Ya, hapus'
    }).then(ya => {
      if (!ya) return;
      Store.update(st => { st.dokter = st.dokter.filter(x => x.id !== id); });
      UI.toast('Dokter dihapus', 'info');
      App.rerender();
    });
  }

  /* ---------------- form poli ---------------- */
  function openPoli(id) {
    const s = Store.get();
    const p = id ? Store.poli(id) : null;
    const palet = ['#6f8bf7', '#f49ec2', '#a58cf0', '#4fc3a1', '#f0b45c', '#5cc0e8', '#f0718d'];

    const body = '<div class="form-grid">' +
      '<div class="field full"><label class="label">Nama Poli <span class="req">*</span></label>' +
        '<input class="input" id="p_nama2" placeholder="cth: Poli Gigi" value="' + UI.esc(p ? p.nama : '') + '" /></div>' +
      '<div class="field full"><label class="label">Deskripsi Layanan</label>' +
        '<textarea class="textarea" id="p_desk" style="min-height:64px">' + UI.esc(p ? p.deskripsi || '' : '') + '</textarea></div>' +
      '<div class="field"><label class="label">Durasi Slot (menit)</label>' +
        '<input type="number" class="input" id="p_dur" min="5" step="5" value="' + (p ? p.durasi : 30) + '" /></div>' +
      '<div class="field"><label class="label">Biaya Konsultasi</label>' +
        '<input type="number" class="input" id="p_harga" min="0" step="5000" value="' + (p ? p.harga : 100000) + '" /></div>' +
      '<div class="field full"><label class="label">Warna Penanda</label>' +
        '<div class="pill-row" id="p_warna2">' + palet.map(c =>
          '<button type="button" class="chip' + ((p ? p.warna : palet[0]) === c ? ' active' : '') + '" data-warna2="' + c + '" style="background:' + c + ';border-color:' + c + ';width:32px;height:32px;padding:0"></button>').join('') +
        '</div></div>' +
    '</div><div id="p_info2" class="mt-16"></div>';

    UI.modal({
      title: p ? 'Ubah Poli' : 'Poli Baru',
      sub: p ? p.nama : 'Tambahkan layanan poli klinik',
      body: body,
      footer:
        (p ? '<button class="btn btn-danger spacer" data-hapus-modal">' + UI.icon('trash', 15) + ' Hapus</button>' : '') +
        '<button class="btn btn-ghost" data-close>Batal</button>' +
        '<button class="btn btn-primary" data-simpan>' + UI.icon('check', 16) + ' Simpan</button>',
      onMount: (ov, close) => {
        let warna = p ? p.warna : palet[0];
        ov.querySelectorAll('[data-warna2]').forEach(b => b.addEventListener('click', () => {
          warna = b.dataset.warna2;
          ov.querySelectorAll('[data-warna2]').forEach(x => x.classList.toggle('active', x.dataset.warna2 === warna));
        }));
        ov.querySelector('[data-simpan]').addEventListener('click', () => {
          const form = {
            nama: ov.querySelector('#p_nama2').value.trim(),
            deskripsi: ov.querySelector('#p_desk').value.trim(),
            durasi: Number(ov.querySelector('#p_dur').value || 30),
            harga: Number(ov.querySelector('#p_harga').value || 0),
            warna: warna
          };
          if (!form.nama) {
            ov.querySelector('#p_info2').innerHTML = '<div class="info-box danger"><span class="ico">' + UI.icon('alert', 17) +
              '</span><div>Nama poli wajib diisi.</div></div>';
            return;
          }
          if (p) {
            Store.update(st => { Object.assign(st.poli.find(x => x.id === p.id), form); });
            UI.toast('Data poli diperbarui');
          } else {
            Store.update(st => { st.poli.push(Object.assign({ id: Store.uid('PL') }, form)); });
            UI.toast('Poli baru ditambahkan');
          }
          close();
          App.rerender();
        });
        const hb = ov.querySelector('[data-hapus-modal]');
        if (hb) hb.addEventListener('click', () => { close(); hapusPoli(p.id); });
      }
    });
  }

  function hapusPoli(id) {
    const p = Store.poli(id); if (!p) return;
    UI.konfirmasi({ teks: 'Poli <b>' + UI.esc(p.nama) + '</b> akan dihapus.', ok: 'Ya, hapus' }).then(ya => {
      if (!ya) return;
      Store.update(st => { st.poli = st.poli.filter(x => x.id !== id); });
      UI.toast('Poli dihapus', 'info');
      App.rerender();
    });
  }

  function exportCSV() {
    const s = Store.get();
    let baris;
    if (tab === 'dokter') {
      baris = [['ID', 'Nama', 'Spesialisasi', 'Poli', 'Telepon', 'Jam Mulai', 'Jam Selesai', 'Hari Praktik', 'Status']];
      s.dokter.forEach(d => baris.push([d.id, d.nama, d.spesialisasi, d.poli, d.telepon || '',
        (d.jamKerja || {}).mulai, (d.jamKerja || {}).selesai, (d.hariKerja || []).map(x => UI.HARI[x - 1]).join(', '), d.aktif === false ? 'Nonaktif' : 'Aktif']));
    } else {
      baris = [['ID', 'Nama Poli', 'Deskripsi', 'Durasi (menit)', 'Biaya', 'Warna']];
      s.poli.forEach(p => baris.push([p.id, p.nama, p.deskripsi || '', p.durasi, p.harga, p.warna]));
    }
    UI.unduhCSV((tab === 'dokter' ? 'dokter' : 'poli') + '-' + UI.todayISO() + '.csv', baris);
    UI.toast('File CSV diunduh');
  }

  return { render: render, openDokter: openDokter, openPoli: openPoli };
})();
