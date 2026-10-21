# Sehat Klinik — Sistem Informasi Reservasi Klinik Kesehatan

Aplikasi Sistem Informasi Reservasi Klinik yang dibangun dengan **HTML + CSS + JavaScript murni** (tanpa framework, tanpa build step) dan **penyimpanan lokal** di browser. Antarmuka dirancang dengan gaya **Soft UI**: panel kaca (*glassmorphism*), palet pastel, sudut membulat besar, bayangan lembut, dan animasi yang halus.

---

## Tujuan

**Masalah yang diselesaikan**
- Pencatatan reservasi manual (buku catatan/Excel) rawan bentrok jadwal — satu dokter bisa terjadwal dua pasien pada jam yang sama.
- Rekap harian/mingguan (jumlah kunjungan, status, DP masuk, tingkat pembatalan) sulit dihitung cepat dan sering tidak akurat.
- Data pasien, dokter, dan riwayat kunjungan tersebar di beberapa berkas sehingga sulit ditelusuri.

**Hasil yang diharapkan**
- Satu aplikasi untuk mencatat, mengubah, dan membatalkan reservasi dengan **validasi bentrok slot otomatis** serta **batas jumlah reservasi per pasien**.
- Dashboard dan laporan yang dihitung langsung dari data yang sama, siap dicetak dan diekspor CSV.
- Data dapat dicadangkan (ekspor JSON) dan dipulihkan (impor) tanpa server.

---

## Pengguna

- **Pengguna utama:** petugas registrasi / admin klinik yang memakai aplikasi harian di satu komputer di loket.
- **Pasien dan dokter tidak memiliki akses langsung ke aplikasi.** Data pasien, dokter, dan poli diinput oleh petugas; pasien hanya menerima bukti reservasi cetak, sedangkan dokter memakai data yang sudah dibukakan petugas.

---

## Batasan

- **Tanpa backend.** Aplikasi berjalan sepenuhnya di browser (client-side); tidak ada server, API, maupun basis data terpusat.
- **Tanpa login dan hak akses.** Tidak ada autentikasi; siapa pun yang membuka `index.html` pada peramban yang sama dapat melihat dan mengubah seluruh data.
- **Data hanya di localStorage satu browser/komputer.** Data terikat pada peramban dan profil komputer tersebut, tidak tersinkron antar perangkat, dan hilang bila cache/data situs dibersihkan.
- **Data sensitif tersimpan tanpa enkripsi.** NIK, nomor rekam medis, riwayat penyakit, dan alergi disimpan sebagai JSON plaintext di localStorage — dapat dibaca siapa pun yang punya akses ke peramban/perangkat.
- **Tidak ada notifikasi ke pasien.** Konfirmasi dan pengingat hanya berupa bukti reservasi cetak; tidak ada SMS, email, atau push notification.
- **Tidak untuk multi-user.** Dua petugas yang bekerja bersamaan pada peramban yang sama akan saling menimpa data.
- **Kuota localStorage.** Browser membatasi ukuran penyimpanan lokal (umumnya ±5 MB); data yang melebihi kuota gagal disimpan dan aplikasi menampilkan peringatan.

---

## Selesai jika (checklist)

- [ ] Ketujuh modul (Dashboard, Reservasi, Pasien, Dokter & Poli, Jadwal, Laporan, Pengaturan) dapat dibuka tanpa error di console.
- [ ] Reservasi dapat dibuat, diubah, dan dihapus.
- [ ] Slot bentrok ditolak saat penyimpanan.
- [ ] Reservasi yang melebihi batas maksimum per pasien ditolak.
- [ ] Reservasi baru bertanggal lampau ditolak.
- [ ] Backup JSON dapat diekspor lalu diimpor kembali dengan data utuh.
- [ ] Laporan dapat dicetak dan diekspor CSV.
- [ ] Tampilan tetap layak pada lebar 1440px, 768px, dan 390px.
- [ ] Seluruh test end-to-end lulus.

---

## Jalankan Aplikasi

Tidak ada yang perlu diinstal. Cukup buka `index.html` di browser:

```bash
# Windows: klik dua kali buka.cmd (atau index.html)
# macOS/Linux:
open index.html        # atau: xdg-open index.html

# cara opsional: jalankan server statis bila ingin diakses perangkat lain
cd klinik-reservasi
npx serve .            # atau: python -m http.server 8080
```

> Catatan: `file://` sudah berjalan penuh. Server statis hanya disarankan bila ingin menguji dari perangkat lain dalam satu jaringan.

---

## Fitur

### 1. Dashboard
- Empat KPI: reservasi hari ini (dengan tren vs kemarin), menunggu konfirmasi, pasien terdaftar, okupansi slot.
- Grafik tren reservasi 7 hari (SVG, tanpa library).
- Donut komposisi status: Selesai / Dikonfirmasi / Menunggu / Batal.
- Panel jadwal hari ini + antrean yang perlu dikonfirmasi (diurutkan dari yang terdekat).
- Rekap poli teramai, pasien paling sering datang, profil klinik, dan okupansi 7 hari ke depan.

### 2. Reservasi (modul inti)
- CRUD lengkap: nama pasien, dokter, poli, tanggal, jam, status, cara bayar, deposit, catatan.
- **Validasi bentrok slot** — satu dokter satu slot satu jam, dicek real-time saat menyimpan.
- **Batas maksimum reservasi per pasien** — diatur di Pengaturan (`maksReservasiPerPasien`, default 3). Reservasi aktif (status Menunggu/Dikonfirmasi, tanggal hari ini ke depan) dihitung per pasien; reservasi yang sedang diedit tidak ikut dihitung. Melebihi batas ditolak dengan pesan error di info-box.
  - Catatan: data contoh sengaja dibuat padat, sehingga sebagian pasien sudah melewati batas default. Naikkan batasnya di Pengaturan atau batalkan reservasi lama bila ingin mencoba reservasi baru.
- **Tanggal lampau ditolak** — reservasi baru tidak boleh bertanggal sebelum hari ini (input tanggal memakai `min` = hari ini). Reservasi lama tetap bisa diubah status/catatannya tanpa diblokir.
- Slot otomatis dihitung dari jam praktik dokter, hari kerja, dan durasi slot klinik.
- Alur status: `Menunggu → Dikonfirmasi → Selesai`, plus `Batal` dan pengembalian ke `Menunggu`.
- Kode reservasi otomatis (`RSV-YYYYMMDD-XXX`).
- Filter gabungan: kata kunci, status, dokter, tanggal.
- **Paginasi** 15 baris per halaman dengan navigasi halaman bertingkat.
- **Bukti Reservasi** yang bisa dicetak (slip berisi kode, pasien, dokter, jadwal, biaya, DP, dan sisa pembayaran).
- Ekspor CSV (mengikuti filter yang sedang aktif).

### 3. Pasien
- CRUD: NIK, no. rekam medis, data demografi, golongan darah, golongan pelanggan (Reguler/Silver/Gold).
- Pencatatan riwayat penyakit dan alergi (alergi ditampilkan peringatan di riwayat).
- Riwayat kunjungan per pasien dalam modal.
- **Paginasi** 12 baris per halaman.
- Pencarian mencakup NIK, no. RM, telepon, riwayat penyakit, dan alergi.

### 4. Dokter & Poli
- Data dokter: spesialisasi, poli, telepon, jam praktik, hari praktik, warna penanda, status aktif.
- Data poli: durasi slot, biaya konsultasi, deskripsi layanan.

### 5. Jadwal Mingguan
- Grid kalender 6 hari × N dokter dengan slot terisi per dokter per hari.
- Navigasi minggu sebelumnya / berikutnya / hari ini.
- Filter per dokter, dan panel detail harian (slot terisi + seluruh slot).

### 6. Laporan
- Filter rentang tanggal dengan preset 7 hari / 30 hari / 3 bulan.
- KPI: total reservasi, reservasi selesai, total DP masuk, tingkat pembatalan.
- Tren harian, distribusi status, rekap per dokter, rekap per poli.
- Grafik tren otomatis diagregasi mingguan bila periode > 16 hari agar tetap terbaca.
- Tabel rincian + **cetak (print-ready)** + ekspor CSV.

### 7. Pengaturan
- Profil klinik: nama, alamat, telepon, email.
- Operasional: jam buka/tutup, durasi slot, **batas reservasi per pasien** (langsung berlaku saat menyimpan reservasi baru).
- **Ekspor backup JSON**, **impor/pulihkan data**, muat ulang data contoh, kosongkan transaksi.
- Toggle **dark mode** (tersimpan otomatis).

---

## Struktur Berkas

```
klinik-reservasi/
├── index.html                  # Kerangka aplikasi + mount point
├── buka.cmd                    # Peluncur cepat di Windows
├── assets/
│   ├── css/
│   │   └── style.css           # Design system "Soft UI" (token, komponen, responsif, cetak)
│   └── js/
│       ├── seed.js             # Data contoh (relatif terhadap hari ini)
│       ├── store.js            # State, persistensi localStorage, validasi domain
│       ├── ui.js               # Format, ikon SVG, modal, toast, grafik, ekspor, paginasi
│       ├── app.js              # Router hash, sidebar, pencarian global, tema, shortcut
│       └── views/
│           ├── dashboard.js
│           ├── reservasi.js
│           ├── pasien.js
│           ├── dokter.js
│           ├── jadwal.js
│           ├── laporan.js
│           └── pengaturan.js
├── tests/
│   └── e2e.test.js             # Test end-to-end Playwright (71 pemeriksaan)
└── README.md
```

Semua skrip dimuat sebagai **script klasik** (bukan ES Module) supaya aplikasi tetap bisa dibuka langsung lewat `file://` tanpa masalah CORS.

---

## Arsitektur

**Model data** (disimpan sebagai JSON di `localStorage`, key `sehatklinik.reservasi.v1`):

```js
{
  versi: 1,
  pengaturan: { namaKlinik, alamat, telepon, jamBuka, jamTutup, durasiSlot, ... },
  dokter:      [ { id, nama, spesialisasi, poli, jamKerja:{mulai,selesai}, hariKerja:[1..7], warna, aktif } ],
  poli:        [ { id, nama, deskripsi, durasi, harga, warna } ],
  pasien:      [ { id, noRm, nama, nik, jenisKelamin, tanggalLahir, telepon, golongan, allergies, ... } ],
  reservasi:   [ { id, kode, tanggal, waktu, dokterId, poliId, pasienId, status, caraBayar, dp, catatan } ]
}
```

**Pola arsitektur:** *repository + presentational view*.
- `Store` menjadi satu-satunya sumber kebenaran. Semua mutasi melewati `Store.update(fn)`, yang otomatis melakukan persistensi dan memberi tahu seluruh listener.
- `UI` menyediakan primitif presentasi (modal, toast, format tanggal/rupiah, grafik SVG) tanpa mengetahui domain.
- Tiap file di `views/` hanya bertanggung jawab untuk render dan event handling satu halaman.
- `App` menjadi router (hash-based) dan kompositor shell (sidebar, topbar, pencarian global).

**Alur validasi reservasi:**
1. Slot dihitung dari `dokter.hariKerja` + `dokter.jamKerja` + `pengaturan.durasiSlot`.
2. Slot yang sudah terisi otomatis dinonaktifkan (dan diberi label "terisi").
3. Saat simpan, `Store.cekBentrok()` melakukan verifikasi ulang terhadap data terkini.
4. `Store.cekBatasPasien()` menghitung reservasi aktif per pasien (status Menunggu/Dikonfirmasi, tanggal hari ini ke depan, kecuali reservasi yang sedang diedit) lalu menolak bila melewati `pengaturan.maksReservasiPerPasien`.
5. Tanggal lampau ditolak untuk reservasi baru; data historis tetap bisa diperbarui (status/catatan).

---

## Design System

| Token | Nilai | Kegunaan |
|---|---|---|
| `--primary` | `#6f8bf7` | Aksen utama, tombol, sorotan |
| `--pink` | `#f49ec2` | Poli anak, badge sekunder |
| `--mint` | `#4fc3a1` | Status selesai, konfirmasi |
| `--lilac` | `#a58cf0` | Poli kulit, grafik |
| `--amber` | `#f0b45c` | Status menunggu |
| `--danger` | `#f0718d` | Status batal, hapus |
| `--r-xl` | `30px` | Sudut panel utama |
| `--r-lg` | `22px` | Sudut kartu |
| `--r-md` | `14px` | Sudut input & tombol |
| `--blur` | `saturate(170%) blur(20px)` | Efek kaca |

Tipografi: **Plus Jakarta Sans** (dengan fallback ke font sistem bila offline).
Mode gelap diaktifkan lewat atribut `data-theme="dark"` pada elemen `<html>`.

---

## Pintasan Keyboard

| Tombol | Fungsi |
|---|---|
| `/` | Fokus ke pencarian global |
| `Ctrl` + `N` | Reservasi baru |
| `Esc` | Tutup modal |
| `Ctrl` + `P` | Cetak halaman (aktif di menu Laporan) |

---

## Pengujian

Test end-to-end berbasis Playwright tersedia di `tests/e2e.test.js` — **71 pemeriksaan** yang mencakup navigasi 7 menu, CRUD pasien & reservasi, validasi bentrok slot, **batas maksimum reservasi per pasien**, **penolakan tanggal lampau**, pembaruan data historis, paginasi, ekspor CSV, backup JSON, tema, mode cetak, responsif, dan pemulihan data kosong.

```bash
npm i -D playwright
npx playwright install chromium
node tests/e2e.test.js
```

Screenshots hasil pengujian disimpan di `tests/screenshots/`.

---

## Catatan Teknis

- **Penyimpanan lokal.** Data hanya ada di peramban pada komputer ini. Gunakan **Pengaturan → Ekspor Semua Data (JSON)** secara berkala sebagai cadangan, dan **Impor** untuk memulihkan.
- **Validasi saat menyimpan reservasi.** Tiga aturan ditegakkan: bentrok slot (satu dokter satu jam), batas maksimum reservasi per pasien (dari Pengaturan), dan larangan tanggal lampau untuk reservasi baru. Reservasi historis tetap bisa diperbarui status/catatannya.
- **Tanpa backend.** Aplikasi 100% client-side, cocok untuk prototipe, tugas kuliah, atau klinik kecil satu komputer. Untuk multi-karyawan, pindahkan `Store` ke backend API (mis. Express + SQLite/PostgreSQL) — antarmuka `Store` sudah cukup kecil untuk dijadikan titik integrasi.
- **Responsif.** Diuji pada 1440px, 768px, dan 390px. Di layar kecil sidebar berubah menjadi drawer geser.
- **Cetak.** Halaman Laporan punya gaya `@media print` khusus yang menyembunyikan navigasi dan menghasilkan layout dokumen yang rapi. Bukti reservasi punya mode cetak tersendiri (kelas `cetak-slip`) yang hanya menyisakan slip-nya.

---

Dibuat dengan perhatian pada detail: animasi halus, umpan balik visual untuk setiap aksi, dan UI yang terasa lembut di mata.
