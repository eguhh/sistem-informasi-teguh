/* ============================================================
   Store — state management + persistensi lokal (JSON di localStorage)
   ============================================================ */
window.Store = (function () {
  const KEY = 'sehatklinik.reservasi.v1';
  const listeners = [];
  let state = null;

  function uid(prefix) {
    return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function hariIniISO() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.reservasi) { state = parsed; return state; }
      }
    } catch (e) {
      console.warn('[Store] gagal membaca penyimpanan lokal:', e);
    }
    state = window.Seed.build();
    persist();
    return state;
  }

  function persist() {
    try {
      state.diperbaruiPada = new Date().toISOString();
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      console.error('[Store] gagal menyimpan:', e);
      if (window.UI) window.UI.toast('Penyimpanan penuh — data belum tersimpan', 'danger');
    }
  }

  function get() { return state || load(); }

  function update(mutator) {
    const s = get();
    const result = mutator(s);
    persist();
    listeners.forEach(fn => { try { fn(s); } catch (e) { console.error(e); } });
    return result;
  }

  function subscribe(fn) { listeners.push(fn); return () => listeners.splice(listeners.indexOf(fn), 1); }

  function reset() {
    state = window.Seed.build();
    persist();
    listeners.forEach(fn => fn(state));
  }

  function kosongkan() {
    const s = get();
    s.reservasi = [];
    s.pasien = [];
    s.dokter = [];
    s.poli = [];
    persist();
    listeners.forEach(fn => fn(s));
  }

  function exportJSON() {
    return JSON.stringify(get(), null, 2);
  }

  function importJSON(text) {
    const parsed = JSON.parse(text);
    if (!parsed || !Array.isArray(parsed.reservasi) || !Array.isArray(parsed.pasien)) {
      throw new Error('Format file tidak valid');
    }
    state = parsed;
    state.diperbaruiPada = new Date().toISOString();
    persist();
    listeners.forEach(fn => fn(state));
    return true;
  }

  function unduh(namaFile, konten, tipe) {
    const blob = new Blob([konten], { type: tipe || 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = namaFile;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  /* ---------- helper domain ---------- */
  function dokter(id) { return get().dokter.find(d => d.id === id); }
  function poli(id) { return get().poli.find(p => p.id === id); }
  function pasien(id) { return get().pasien.find(p => p.id === id); }
  function reservasi(id) { return get().reservasi.find(r => r.id === id); }

  function slotTersedia(dokterId, tanggal, ExceptId) {
    const s = get();
    const dk = dokter(dokterId);
    if (!dk) return [];
    const dur = s.pengaturan.durasiSlot || 30;
    const mulai = (dk.jamKerja && dk.jamKerja.mulai) || s.pengaturan.jamBuka;
    const akhir = (dk.jamKerja && dk.jamKerja.selesai) || s.pengaturan.jamTutup;
    const hari = new Date(tanggal + 'T00:00:00');
    const dow = hari.getDay() === 0 ? 7 : hari.getDay();
    if (dk.hariKerja && dk.hariKerja.length && dk.hariKerja.indexOf(dow) === -1) return [];

    const [sh, sm] = mulai.split(':').map(Number);
    const [eh, em] = akhir.split(':').map(Number);
    const booked = {};
    s.reservasi.forEach(r => {
      if (r.dokterId === dokterId && r.tanggal === tanggal && r.status !== 'batal' && r.id !== ExceptId) {
        booked[r.waktu] = true;
      }
    });

    const out = [];
    for (let m = sh * 60 + sm; m + dur <= eh * 60 + em; m += dur) {
      const jam = String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
      out.push({ jam: jam, tersedia: !booked[jam] });
    }
    return out;
  }

  function cekBentrok(data) {
    const s = get();
    const bentrok = s.reservasi.find(r =>
      r.dokterId === data.dokterId &&
      r.tanggal === data.tanggal &&
      r.waktu === data.waktu &&
      r.status !== 'batal' &&
      r.id !== data.id
    );
    if (!bentrok) return null;
    const ps = pasien(bentrok.pasienId);
    return 'Slot ' + data.waktu + ' sudah dipakai oleh ' + (ps ? ps.nama : 'pasien lain') + '.';
  }

  /* batas reservasi aktif per pasien (status menunggu/dikonfirmasi, tanggal hari ini ke depan) */
  function cekBatasPasien(pasienId, exceptId) {
    const s = get();
    const maks = Number(s.pengaturan && s.pengaturan.maksReservasiPerPasien) || 0;
    if (!pasienId || maks < 1) return null;
    const hariIni = hariIniISO();
    const aktif = s.reservasi.filter(r =>
      r.pasienId === pasienId &&
      (r.status === 'menunggu' || r.status === 'dikonfirmasi') &&
      r.tanggal >= hariIni &&
      r.id !== exceptId
    ).length;
    if (aktif < maks) return null;
    const ps = pasien(pasienId);
    return 'Maksimal ' + maks + ' reservasi aktif per pasien sudah tercapai untuk ' +
      (ps ? ps.nama : 'pasien ini') + '. Batalkan atau ubah status reservasi sebelumnya, ' +
      'atau naikkan batas di Pengaturan.';
  }

  function generasiKodeReservasi(tanggal) {
    const s = get();
    const prefix = 'RSV-' + tanggal.replace(/-/g, '');
    let n = s.reservasi.filter(r => r.kode && r.kode.indexOf(prefix) === 0).length + 1;
    let kode = prefix + '-' + String(n).padStart(3, '0');
    while (s.reservasi.some(r => r.kode === kode)) {
      n++; kode = prefix + '-' + String(n).padStart(3, '0');
    }
    return kode;
  }

  return {
    KEY: KEY, uid: uid, load: load, get: get, update: update, subscribe: subscribe,
    reset: reset, kosongkan: kosongkan,
    exportJSON: exportJSON, importJSON: importJSON, unduh: unduh,
    dokter: dokter, poli: poli, pasien: pasien, reservasi: reservasi,
    slotTersedia: slotTersedia, cekBentrok: cekBentrok, cekBatasPasien: cekBatasPasien,
    generasiKodeReservasi: generasiKodeReservasi
  };
})();
