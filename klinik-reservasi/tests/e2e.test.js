const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// Jalankan dari folder proyek klinik-reservasi:
//   npm i -D playwright && npx playwright install chromium
//   node tests/e2e.test.js
// Override lokasi proyek dengan env var bila dijalankan dari direktori lain:
//   KLINIK_ROOT=/path/ke/klinik-reservasi node tests/e2e.test.js
const ROOT = process.env.KLINIK_ROOT ? path.resolve(process.env.KLINIK_ROOT) : path.resolve(__dirname, '..');
const TARGET = 'file:///' + path.resolve(ROOT, 'index.html').replace(/\\/g, '/');
const OUT = path.resolve(ROOT, 'tests', 'screenshots');
const ok = [], bad = [];
const cek = (n, v) => { (v ? ok : bad).push(n); console.log(`  ${v ? 'PASS' : 'FAIL'}  ${n}`); };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 950 }, acceptDownloads: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });

  await page.goto(TARGET, { waitUntil: 'load' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(700);

  console.log('\n=== 1. NAVIGASI 7 MENU ===');
  for (const r of ['dashboard', 'reservasi', 'pasien', 'dokter', 'jadwal', 'laporan', 'pengaturan']) {
    await page.click(`[data-route="${r}"]`);
    await page.waitForTimeout(420);
    const judul = await page.textContent('#pageTitle');
    const isi = await page.locator('#view').innerHTML();
    cek(`menu ${r} -> "${judul}", konten ${isi.length} bita`, judul.length > 0 && isi.length > 200);
  }

  console.log('\n=== 2. TABEL PASIEN (regresi selAllergi) ===');
  await page.click('[data-route="pasien"]'); await page.waitForTimeout(450);
  cek('pasien dipaginasi (12 per halaman)', await page.locator('#view tbody tr').count() === 12);
  cek('kontrol paginasi tampil', await page.locator('.pagination .pager').count() === 1);
  const infoP = await page.textContent('.pagination .pinfo');
  cek('info paginasi benar (' + infoP.trim() + ')', infoP.includes('dari 15 data'));
  await page.locator('.pagination .pager button.on + button, .pagination .pager button[data-page="2"]').first().click();
  await page.waitForTimeout(400);
  cek('pindah ke halaman 2', (await page.textContent('.pagination .pager button.on')).trim() === '2');
  await page.locator('.pagination .pager button[data-page="1"]').first().click();
  await page.waitForTimeout(400);
  await page.fill('#pQ', 'Penicillin'); await page.waitForTimeout(450);
  cek('cari alergi "Penicillin" -> 1 baris', await page.locator('#view tbody tr').count() === 1);
  await page.fill('#pQ', ''); await page.waitForTimeout(400);

  console.log('\n=== 3. BUAT RESERVASI ===');
  await page.click('[data-route="reservasi"]'); await page.waitForTimeout(450);
  const sebelum = await page.evaluate(() => Store.get().reservasi.length);
  await page.click('#btnNewRes');
  await page.waitForSelector('.modal', { timeout: 5000 });
  await page.waitForTimeout(300);
  cek('modal terbuka', await page.locator('.modal').count() === 1);
  cek('dropdown pasien terisi', await page.locator('#f_pasien option').count() === 15);
  const jmlSlot = await page.locator('#f_waktu option').count();
  cek('slot jam terisi (' + jmlSlot + ')', jmlSlot > 5);

  await page.selectOption('#f_pasien', { index: 0 });
  await page.fill('#f_catatan', 'Cek otomatis playwright');
  // batas reservasi per pasien diuji terpisah di bagian 4b; naikkan dulu agar data contoh tidak menghalangi
  await page.evaluate(() => Store.update(st => { st.pengaturan.maksReservasiPerPasien = 20; }));
  await page.click('[data-simpan]');
  await page.waitForTimeout(800);
  cek('modal tertutup setelah simpan', await page.locator('.modal').count() === 0);
  await page.evaluate(() => Store.update(st => { st.pengaturan.maksReservasiPerPasien = 3; }));
  const sesudah = await page.evaluate(() => Store.get().reservasi.length);
  cek('data bertambah (' + sebelum + ' -> ' + sesudah + ')', sesudah === sebelum + 1);
  cek('tabel dipaginasi (15 per halaman)', await page.locator('#view tbody tr').count() === 15);
  await page.fill('#fQ', 'Cek otomatis playwright'); await page.waitForTimeout(500);
  cek('pencarian catatan menemukan 1 baris', await page.locator('#view tbody tr').count() === 1);
  await page.fill('#fQ', ''); await page.waitForTimeout(400);

  console.log('\n=== 4. DETEKSI BENTROK SLOT ===');
  await page.click('#btnNewRes'); await page.waitForSelector('.modal'); await page.waitForTimeout(300);
  await page.selectOption('#f_pasien', { index: 1 });
  await page.selectOption('#f_dokter', { index: 0 });
  await page.fill('#f_tanggal', await page.inputValue('#f_tanggal'));
  await page.waitForTimeout(300);
  // paksa jam yang sama dengan slot terisi pertama
  await page.evaluate(() => {
    const sel = document.querySelector('#f_waktu');
    const opt = Array.from(sel.options).find(o => !o.disabled && o.value);
    const occupied = Array.from(sel.options).find(o => o.textContent.includes('terisi'));
    sel.value = occupied ? occupied.value : opt.value;
    sel.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.click('[data-simpan]');
  await page.waitForTimeout(600);
  const adaErr = await page.locator('#f_info .info-box.danger').count();
  cek('bentrok slot ditolak dengan pesan error', adaErr === 1);
  await page.click('[data-close]'); await page.waitForTimeout(400);

  console.log('\n=== 4b. BATAS MAKS RESERVASI / PASIEN ===');
  // helper: cari satu slot kosong (dokter + tanggal + jam) untuk pengujian
  const cariSlot = async () => page.evaluate(() => {
    const s = Store.get();
    const now = new Date();
    for (let i = 0; i < 10; i++) {
      const x = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
      const iso = x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
      for (const dk of s.dokter.filter(d => d.aktif !== false)) {
        const free = Store.slotTersedia(dk.id, iso, null).filter(sl => sl.tersedia);
        if (free.length) return { tanggal: iso, dokterId: dk.id, jam: free[0].jam };
      }
    }
    return null;
  });
  const isiFormSlot = async (t) => {
    await page.fill('#f_tanggal', t.tanggal);
    await page.selectOption('#f_dokter', t.dokterId);
    await page.waitForTimeout(350);
    await page.selectOption('#f_waktu', t.jam);
  };
  const aktifPasien = async (id) => page.evaluate((pid) => {
    const s = Store.get();
    const d = new Date();
    const hariIni = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    return s.reservasi.filter(r => r.pasienId === pid &&
      (r.status === 'menunggu' || r.status === 'dikonfirmasi') && r.tanggal >= hariIni).length;
  }, id);

  const pasienUji = await page.evaluate(() => Store.get().pasien[0].id);
  await page.evaluate(() => Store.update(st => { st.pengaturan.maksReservasiPerPasien = 20; }));
  const idSebelum = await page.evaluate(() => Store.get().reservasi.map(r => r.id));
  const slotA = await cariSlot();
  await page.click('#btnNewRes'); await page.waitForSelector('.modal'); await page.waitForTimeout(300);
  await page.selectOption('#f_pasien', pasienUji);
  await isiFormSlot(slotA);
  await page.click('[data-simpan]'); await page.waitForTimeout(800);
  cek('reservasi uji untuk satu pasien berhasil dibuat', await page.locator('.modal').count() === 0);
  const kodeUji = await page.evaluate((ids) => {
    const r = Store.get().reservasi.find(x => ids.indexOf(x.id) === -1);
    return r ? r.kode : '';
  }, idSebelum);
  const jmlAktif = await aktifPasien(pasienUji);

  // turunkan batas -> reservasi berikutnya untuk pasien yang sama harus ditolak
  await page.evaluate(() => Store.update(st => { st.pengaturan.maksReservasiPerPasien = 1; }));
  const sebelumBatas = await page.evaluate((pid) => Store.get().reservasi.filter(r => r.pasienId === pid).length, pasienUji);
  const slotB = await cariSlot();
  await page.click('#btnNewRes'); await page.waitForSelector('.modal'); await page.waitForTimeout(300);
  await page.selectOption('#f_pasien', pasienUji);
  await isiFormSlot(slotB);
  await page.click('[data-simpan]'); await page.waitForTimeout(700);
  cek('reservasi kedua untuk pasien yang sama ditolak', await page.locator('#f_info .info-box.danger').count() === 1);
  const pesanBatas = await page.locator('#f_info .info-box.danger').count()
    ? (await page.textContent('#f_info .info-box.danger')).trim() : '';
  cek('pesan batas maksimal tampil ("' + pesanBatas.slice(0, 60) + '...")',
    pesanBatas.includes('Maksimal') && pesanBatas.includes('reservasi aktif per pasien'));
  const sesudahBatas = await page.evaluate((pid) => Store.get().reservasi.filter(r => r.pasienId === pid).length, pasienUji);
  cek('jumlah reservasi tidak bertambah setelah ditolak', sesudahBatas === sebelumBatas);
  await page.click('[data-close]'); await page.waitForTimeout(400);

  // reservasi yang sedang diedit tidak dihitung terhadap batas
  await page.evaluate((n) => Store.update(st => { st.pengaturan.maksReservasiPerPasien = n; }), jmlAktif);
  await page.fill('#fQ', kodeUji); await page.waitForTimeout(500);
  await page.locator('[data-edit]').first().click();
  await page.waitForSelector('.modal'); await page.waitForTimeout(400);
  await page.selectOption('#f_status', 'dikonfirmasi');
  await page.click('[data-simpan]'); await page.waitForTimeout(800);
  cek('reservasi yang sedang diedit tidak dihitung terhadap batas', await page.locator('.modal').count() === 0);
  await page.fill('#fQ', ''); await page.waitForTimeout(400);
  await page.evaluate(() => Store.update(st => { st.pengaturan.maksReservasiPerPasien = 3; }));

  console.log('\n=== 4c. TANGGAL LAMPAU DITOLAK ===');
  await page.click('#btnNewRes'); await page.waitForSelector('.modal'); await page.waitForTimeout(300);
  const hariIni = await page.evaluate(() => UI.todayISO());
  const minTanggal = await page.getAttribute('#f_tanggal', 'min');
  cek('input tanggal reservasi baru memakai min = hari ini (' + minTanggal + ')', minTanggal === hariIni);
  const kemarin = await page.evaluate(() => UI.addDays(UI.todayISO(), -1));
  const sebelumLama = await page.evaluate(() => Store.get().reservasi.length);
  await page.fill('#f_tanggal', kemarin); await page.waitForTimeout(350);
  await page.click('[data-simpan]'); await page.waitForTimeout(700);
  cek('reservasi bertanggal lampau ditolak', await page.locator('#f_info .info-box.danger').count() === 1);
  const pesanLama = await page.locator('#f_info .info-box.danger').count()
    ? (await page.textContent('#f_info .info-box.danger')).trim() : '';
  cek('pesan tanggal lampau tampil ("' + pesanLama.slice(0, 60) + '...")', pesanLama.includes('masa lalu'));
  cek('reservasi lampau tidak tersimpan', await page.evaluate(() => Store.get().reservasi.length) === sebelumLama);
  await page.click('[data-close]'); await page.waitForTimeout(400);

  // data historis tetap boleh diperbarui (status & catatan)
  const lama = await page.evaluate(() => {
    const s = Store.get();
    const d = new Date();
    const hariIni = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    const r = s.reservasi.find(x => x.tanggal < hariIni && x.status !== 'batal');
    return r ? { id: r.id, kode: r.kode } : null;
  });
  if (lama) {
    await page.fill('#fQ', lama.kode); await page.waitForTimeout(500);
    await page.locator('[data-edit]').first().click();
    await page.waitForSelector('.modal'); await page.waitForTimeout(400);
    await page.selectOption('#f_status', 'selesai');
    await page.fill('#f_catatan', 'Uji riwayat historis');
    await page.click('[data-simpan]'); await page.waitForTimeout(800);
    cek('reservasi lama (tanggal lampau) tetap bisa diubah status & catatan', await page.locator('.modal').count() === 0);
    const catLama = await page.evaluate((id) => (Store.get().reservasi.find(r => r.id === id) || {}).catatan, lama.id);
    cek('catatan reservasi lama tersimpan', catLama === 'Uji riwayat historis');
    await page.fill('#fQ', ''); await page.waitForTimeout(400);
  }

  console.log('\n=== 5. UBAH STATUS RESERVASI ===');
  await page.fill('#fQ', 'Cek otomatis playwright'); await page.waitForTimeout(450);
  const btnKonf = page.locator('[data-aksi="dikonfirmasi"]').first();
  const adaTombol = await btnKonf.count();
  cek('tombol Konfirmasi tersedia', adaTombol > 0);
  if (adaTombol) {
    await btnKonf.click(); await page.waitForTimeout(600);
    // badge di baris: [0]=poli, [1]=status
    const badge = await page.locator('#view tbody tr').first().locator('.badge').nth(1).textContent();
    cek('status -> Dikonfirmasi (' + badge.trim() + ')', badge.includes('Dikonfirmasi'));
  }
  await page.fill('#fQ', ''); await page.waitForTimeout(400);

  console.log('\n=== 6. HAPUS RESERVASI ===');
  await page.fill('#fQ', 'Cek otomatis playwright'); await page.waitForTimeout(450);
  await page.locator('[data-hapus]').first().click();
  await page.waitForSelector('.overlay'); await page.waitForTimeout(400);
  await page.click('[data-ok]'); await page.waitForTimeout(700);
  await page.fill('#fQ', 'Cek otomatis playwright'); await page.waitForTimeout(500);
  cek('reservasi terhapus', await page.locator('#view tbody tr').count() === 0);
  await page.fill('#fQ', ''); await page.waitForTimeout(400);

  console.log('\n=== 7. CRUD PASIEN ===');
  await page.click('[data-route="pasien"]'); await page.waitForTimeout(450);
  const pSebelum = await page.evaluate(() => Store.get().pasien.length);
  await page.click('#btnNewPs'); await page.waitForSelector('.modal'); await page.waitForTimeout(300);
  await page.fill('#p_nama', 'Uji Coba Pasien');
  await page.fill('#p_nik', '1234567890123456');
  await page.fill('#p_telp', '0812-9999-0000');
  await page.click('[data-simpan]'); await page.waitForTimeout(700);
  const pSesudah = await page.evaluate(() => Store.get().pasien.length);
  cek('pasien baru ditambahkan (' + pSebelum + ' -> ' + pSesudah + ')', pSesudah === pSebelum + 1);
  await page.fill('#pQ', 'Uji Coba'); await page.waitForTimeout(450);
  cek('pasien baru ditemukan lewat pencarian', await page.locator('#view tbody tr').count() === 1);
  await page.fill('#pQ', ''); await page.waitForTimeout(400);
  // validasi NIK salah
  await page.click('#btnNewPs'); await page.waitForSelector('.modal'); await page.waitForTimeout(300);
  await page.fill('#p_nama', 'Salah NIK');
  await page.fill('#p_nik', '123');
  await page.click('[data-simpan]'); await page.waitForTimeout(400);
  cek('validasi NIK 16 digit', await page.locator('#p_info .info-box.danger').count() === 1);
  await page.click('[data-close]'); await page.waitForTimeout(400);
  // riwayat
  await page.locator('[data-riwayat]').first().click();
  await page.waitForSelector('.modal'); await page.waitForTimeout(400);
  cek('modal riwayat kunjungan terbuka', await page.locator('.modal').count() === 1);
  await page.click('[data-close]'); await page.waitForTimeout(400);

  console.log('\n=== 8. DOKTER & POLI ===');
  await page.click('[data-route="dokter"]'); await page.waitForTimeout(450);
  cek('5 kartu dokter', await page.locator('#view .card.hoverable').count() === 5);
  await page.click('[data-tab="poli"]'); await page.waitForTimeout(400);
  cek('4 kartu poli', await page.locator('#view .card.hoverable').count() === 4);
  await page.click('[data-tab="dokter"]'); await page.waitForTimeout(400);
  await page.locator('[data-ekd]').first().click();
  await page.waitForSelector('.modal'); await page.waitForTimeout(300);
  cek('form ubah dokter terisi', (await page.inputValue('#d_nama')).length > 3);
  await page.click('[data-close]'); await page.waitForTimeout(400);

  console.log('\n=== 9. JADWAL MINGGUAN ===');
  await page.click('[data-route="jadwal"]'); await page.waitForTimeout(450);
  cek('grid jadwal terisi', await page.locator('.wg-cell').count() > 10);
  await page.locator('.wg-cell:not(.empty-cell)').first().click();
  await page.waitForSelector('.modal'); await page.waitForTimeout(400);
  cek('detail harian terbuka', await page.locator('.modal').count() === 1);
  await page.click('[data-close]'); await page.waitForTimeout(400);

  console.log('\n=== 10. LAPORAN + EKSPOR CSV ===');
  await page.click('[data-route="laporan"]'); await page.waitForTimeout(500);
  cek('tabel rincian terisi', await page.locator('#view tbody tr').count() > 10);
  const [dl] = await Promise.all([
    page.waitForEvent('download', { timeout: 20000 }).catch(() => null),
    page.click('#lCsv')
  ]);
  cek('ekspor CSV terunduh (' + (dl ? dl.suggestedFilename() : 'gagal') + ')', !!dl);

  console.log('\n=== 11. PENGATURAN + BACKUP ===');
  await page.click('[data-route="pengaturan"]'); await page.waitForTimeout(450);
  await page.fill('#g_nama', 'Klinik Uji Coba');
  await page.click('#gSimpan'); await page.waitForTimeout(600);
  const namaBaru = await page.evaluate(() => Store.get().pengaturan.namaKlinik);
  cek('profil klinik tersimpan (' + namaBaru + ')', namaBaru === 'Klinik Uji Coba');
  const namaJudul = await page.evaluate(() => document.title);
  cek('judul tab ikut berubah', namaJudul.includes('Klinik Uji Coba'));
  await page.click('[data-tab="sistem"]'); await page.waitForTimeout(400);
  const [dl2] = await Promise.all([
    page.waitForEvent('download', { timeout: 20000 }).catch(() => null),
    page.click('#sExport')
  ]);
  cek('backup JSON terunduh (' + (dl2 ? dl2.suggestedFilename() : 'gagal') + ')', !!dl2);
  if (dl2) {
    const p = path.join(OUT, 'backup-test.json');
    await dl2.saveAs(p);
    const j = JSON.parse(fs.readFileSync(p, 'utf8'));
    cek('isi backup valid (pasien=' + j.pasien.length + ', reservasi=' + j.reservasi.length + ')',
      Array.isArray(j.pasien) && Array.isArray(j.reservasi));
  }
  await page.click('[data-tab="tentang"]'); await page.waitForTimeout(400);
  cek('tab tentang tampil', (await page.locator('#view').innerHTML()).includes('Pintasan Keyboard'));

  console.log('\n=== 12. PENCARIAN GLOBAL + TEMA ===');
  await page.click('[data-route="dashboard"]'); await page.waitForTimeout(400);
  cek('tombol X sidebar tersembunyi di desktop', await page.evaluate(() =>
    getComputedStyle(document.getElementById('sidebarClose')).display === 'none'));
  await page.fill('#globalSearch', 'Siti'); await page.waitForTimeout(500);
  cek('pencarian global menemukan hasil', await page.locator('#searchResults .sr-item').count() > 0);
  await page.keyboard.press('Escape');
  await page.click('#themeToggle'); await page.waitForTimeout(500);
  cek('tema gelap aktif', await page.getAttribute('html', 'data-theme') === 'dark');
  await page.click('#themeToggle'); await page.waitForTimeout(400);
  cek('tema terang kembali', await page.getAttribute('html', 'data-theme') === 'light');

  console.log('\n=== 13. SHORTCUT KEYBOARD ===');
  await page.keyboard.press('/'); await page.waitForTimeout(300);
  cek('tekan "/" fokus ke pencarian', await page.evaluate(() => document.activeElement.id) === 'globalSearch');
  await page.keyboard.press('Escape');
  await page.keyboard.press('Control+n'); await page.waitForTimeout(600);
  cek('Ctrl+N membuka form reservasi', await page.locator('.modal').count() === 1);
  await page.keyboard.press('Escape'); await page.waitForTimeout(500);

  console.log('\n=== 14. SCREENSHOT ===');
  const shot = async (n, f) => { await page.screenshot({ path: `${OUT}/${n}.png`, fullPage: !!f }); console.log('  -> ' + n + '.png'); };
  await page.click('[data-route="dashboard"]'); await page.waitForTimeout(500); await shot('klinik-1-dashboard', true);
  await page.click('[data-route="reservasi"]'); await page.waitForTimeout(450); await shot('klinik-2-reservasi', true);
  await page.click('#btnNewRes'); await page.waitForSelector('.modal'); await page.waitForTimeout(500); await shot('klinik-3-form', false);
  await page.click('[data-close]'); await page.waitForTimeout(400);
  await page.click('[data-route="pasien"]'); await page.waitForTimeout(450); await shot('klinik-4-pasien', true);
  await page.click('[data-route="dokter"]'); await page.waitForTimeout(450); await shot('klinik-5-dokter', true);
  await page.click('[data-route="jadwal"]'); await page.waitForTimeout(450); await shot('klinik-6-jadwal', true);
  await page.click('[data-route="laporan"]'); await page.waitForTimeout(450); await shot('klinik-7-laporan', true);
  await page.click('[data-route="pengaturan"]'); await page.waitForTimeout(450); await shot('klinik-8-pengaturan', true);
  await page.click('#themeToggle'); await page.waitForTimeout(500);
  await page.click('[data-route="dashboard"]'); await page.waitForTimeout(500); await shot('klinik-9-gelap', true);
  await page.click('#themeToggle'); await page.waitForTimeout(400);

  console.log('\n=== 14b. MODE CETAK ===');
  await page.click('[data-route="laporan"]'); await page.waitForTimeout(500);
  await page.emulateMedia({ media: 'print' });
  await page.waitForTimeout(300);
  const navTersembunyi = await page.evaluate(() =>
    getComputedStyle(document.querySelector('.sidebar')).display === 'none' &&
    getComputedStyle(document.querySelector('.topbar')).display === 'none');
  cek('sidebar & topbar disembunyikan saat dicetak', navTersembunyi);
  cek('judul laporan tampil saat dicetak', await page.locator('.print-head').isVisible());
  await shot('klinik-12-cetak', true);
  await page.emulateMedia({ media: 'screen' });
  await page.waitForTimeout(200);

  console.log('\n=== 14c. BUKTI RESERVASI (SLIP) ===');
  await page.click('[data-route="reservasi"]'); await page.waitForTimeout(500);
  await page.locator('[data-slip]').first().click();
  await page.waitForSelector('.slip', { timeout: 5000 });
  await page.waitForTimeout(500);
  cek('slip bukti reservasi terbuka', await page.locator('.slip').count() === 1);
  cek('kode reservasi tampil di slip', (await page.textContent('.slip-kode')).trim().startsWith('RSV-'));
  cek('data pasien & dokter tampil', (await page.textContent('.slip-rows')).length > 30);
  await shot('klinik-13-slip', false);
  await page.emulateMedia({ media: 'print' });
  await page.evaluate(() => document.body.classList.add('cetak-slip'));
  await page.waitForTimeout(300);
  cek('mode cetak slip: app-shell disembunyikan', await page.evaluate(() =>
    getComputedStyle(document.querySelector('.app-shell')).display === 'none'));
  cek('mode cetak slip: slip tetap tampil', await page.locator('.slip').isVisible());
  await shot('klinik-14-slip-cetak', true);
  await page.evaluate(() => document.body.classList.remove('cetak-slip'));
  await page.emulateMedia({ media: 'screen' });
  await page.waitForTimeout(200);
  await page.click('[data-close]'); await page.waitForTimeout(400);

  console.log('\n=== 15. RESPONSIF 390px ===');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => { location.hash = '#/dashboard'; window.scrollTo(0, 0); });
  const sidebarHidden = await page.waitForFunction(() => {
    const s = document.getElementById('sidebar');
    return s.getBoundingClientRect().right < 10;
  }, null, { timeout: 4000 }).then(() => true).catch(() => false);
  cek('sidebar tersembunyi di mobile', sidebarHidden);
  await page.click('#menuBtn'); await page.waitForTimeout(600);
  cek('drawer terbuka saat menu diklik', await page.evaluate(() => document.getElementById('sidebar').classList.contains('open')));
  cek('tombol X sidebar tampil di mobile', await page.evaluate(() =>
    getComputedStyle(document.getElementById('sidebarClose')).display !== 'none'));
  await page.locator('[data-route="laporan"]').first().click();
  await page.waitForTimeout(600);
  cek('navigasi dari drawer mobile bekerja', (await page.textContent('#pageTitle')) === 'Laporan');
  await shot('klinik-10-mobile', false);
  await page.evaluate(() => { location.hash = '#/dashboard'; });
  await page.waitForTimeout(500);
  await shot('klinik-11-mobile-dashboard', false);

  console.log('\n=== 16. KONDISI DATA KOSONG & PEMULIHAN ===');
  await page.setViewportSize({ width: 1440, height: 950 });
  await page.evaluate(() => { location.hash = '#/pengaturan'; });
  await page.waitForTimeout(600);
  await page.click('[data-tab="sistem"]'); await page.waitForTimeout(400);
  await page.click('#sKosong'); await page.waitForSelector('.overlay'); await page.waitForTimeout(400);
  await page.click('[data-ok]'); await page.waitForTimeout(900);
  const sisa = await page.evaluate(() => ({
    r: Store.get().reservasi.length, p: Store.get().pasien.length,
    d: Store.get().dokter.length, pl: Store.get().poli.length
  }));
  cek('data dikosongkan (reservasi=' + sisa.r + ', pasien=' + sisa.p + ', dokter=' + sisa.d + ')', sisa.r === 0 && sisa.p === 0);
  await page.evaluate(() => { location.hash = '#/dashboard'; });
  await page.waitForTimeout(600);
  cek('dashboard tetap berjalan saat data kosong', (await page.locator('#view').innerHTML()).length > 300);
  await page.evaluate(() => { location.hash = '#/reservasi'; });
  await page.waitForTimeout(600);
  cek('halaman reservasi menampilkan empty state', await page.locator('#view .empty').count() === 1);
  await page.evaluate(() => { location.hash = '#/pengaturan'; });
  await page.waitForTimeout(600);
  await page.click('[data-tab="sistem"]'); await page.waitForTimeout(400);
  await page.click('#sSeed'); await page.waitForSelector('.overlay'); await page.waitForTimeout(400);
  await page.click('[data-ok]'); await page.waitForTimeout(1200);
  const pulih = await page.evaluate(() => ({
    r: Store.get().reservasi.length, p: Store.get().pasien.length, d: Store.get().dokter.length
  }));
  cek('data contoh berhasil dipulihkan (reservasi=' + pulih.r + ', pasien=' + pulih.p + ')',
    pulih.r > 100 && pulih.p === 15 && pulih.d === 5);

  console.log('\n=== RINGKASAN ===');
  console.log('  PASS: ' + ok.length + ' | FAIL: ' + bad.length);
  if (bad.length) bad.forEach(b => console.log('  GAGAL -> ' + b));
  console.log('\n=== ERROR RUNTIME ===');
  console.log(errors.length ? errors.join('\n') : '  tidak ada error runtime');

  await page.evaluate(() => localStorage.clear());
  await browser.close();
  process.exit(bad.length || errors.length ? 1 : 0);
})().catch(e => { console.error('FATAL', e.message, '\n', e.stack); process.exit(2); });
