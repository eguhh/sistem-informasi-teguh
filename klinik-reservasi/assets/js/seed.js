/* ============================================================
   Seed — data contoh klinik (dibuat relatif terhadap hari ini)
   ============================================================ */
window.Seed = (function () {
  const DOKTER = [
    { nama: 'dr. Ratna Kusuma',   spesialisasi: 'Penyakit Dalam',      poli: 'Poli Dalam',    warna: '#6f8bf7', telepon: '0812-3344-1122' },
    { nama: 'dr. Bagus Pratama',  spesialisasi: 'Anak & Kandungan',    poli: 'Poli Anak',     warna: '#f49ec2', telepon: '0813-5566-7788' },
    { nama: 'dr. Citra Lestari',  spesialisasi: 'Kulit & Estetika',   poli: 'Poli Kulit',    warna: '#a58cf0', telepon: '0857-2211-4409' },
    { nama: 'dr. Doni Saputra',   spesialisasi: 'Penyakit Dalam',      poli: 'Poli Dalam',    warna: '#4fc3a1', telepon: '0819-9080-5512' },
    { nama: 'dr. Eka Wulandari',  spesialisasi: 'Gigi & Mulut',        poli: 'Poli Gigi',     warna: '#f0b45c', telepon: '0878-3320-9941' }
  ];

  const POLI = [
    { nama: 'Poli Dalam',    deskripsi: 'Konsultasi penyakit dalam, diabetes, hipertensi', durasi: 30, harga: 150000, warna: '#6f8bf7' },
    { nama: 'Poli Anak',     deskripsi: 'Immunisasi, tumbuh kembang, anemia, dengue', durasi: 30, harga: 120000, warna: '#f49ec2' },
    { nama: 'Poli Kulit',    deskripsi: 'Konsultasi kulit, alergi, secondhand acne', durasi: 20, harga: 100000, warna: '#a58cf0' },
    { nama: 'Poli Gigi',     deskripsi: 'Scaling, tambal, cek kesehatan gigi',                    durasi: 45, harga: 180000, warna: '#f0b45c' }
  ];

  const PASIEN = [
    { nama: 'Siti Nurhaliza',   nik: '3273014502900123', jk: 'P', lahir: '1990-02-14', telp: '0812-3456-7890', gold: 'Gold' },
    { nama: 'Ahmad Fauzi',       nik: '3273011207880045', jk: 'L', lahir: '1988-07-12', telp: '0813-9876-5432', gold: 'Silver' },
    { nama: 'Dewi Anggraini',   nik: '3273015511950011', jk: 'P', lahir: '1995-11-05', telp: '0857-1122-3344', gold: 'Regular' },
    { nama: 'Budi Santoso',     nik: '3273010803850018', jk: 'L', lahir: '1985-03-08', telp: '0878-5544-6677', gold: 'Gold' },
    { nama: 'Rina Marlina',     nik: '3273012201900022', jk: 'P', lahir: '1990-01-22', telp: '0819-2233-4455', gold: 'Regular' },
    { nama: 'Andi Wijaya',       nik: '3273011012770041', jk: 'L', lahir: '1977-10-10', telp: '0821-7788-9900', gold: 'Silver' },
    { nama: 'Maya Puspita',      nik: '3273016506950012', jk: 'P', lahir: '1995-06-15', telp: '0812-6677-1122', gold: 'Regular' },
    { nama: 'Hendra Gunawan',   nik: '3273012905820033', jk: 'L', lahir: '1982-05-29', telp: '0852-9911-2233', gold: 'Gold' },
    { nama: 'Lia Permata',      nik: '3273014408930044', jk: 'P', lahir: '1993-08-04', telp: '0815-4433-2211', gold: 'Silver' },
    { nama: 'Rizky Ramadhan',    nik: '3273011709000055', jk: 'L', lahir: '1990-09-17', telp: '0895-1122-7788', gold: 'Regular' },
    { nama: 'Nur Aisyah',       nik: '3273012512840066', jk: 'P', lahir: '1984-12-25', telp: '0811-3322-5566', gold: 'Silver' },
    { nama: 'Joko Susilo',      nik: '3273010605760077', jk: 'L', lahir: '1976-05-06', telp: '0877-2211-3344', gold: 'Regular' },
    { nama: 'Putri Ayu',        nik: '3273014501020088', jk: 'P', lahir: '2002-01-45', telp: '0856-9988-7766', gold: 'Regular' },
    { nama: 'Fajar Nugroho',    nik: '3273013107930099', jk: 'L', lahir: '1993-07-31', telp: '0822-4455-6677', gold: 'Silver' },
    { nama: 'Intan Permatasari',nik: '3273011903980100', jk: 'P', lahir: '1998-03-19', telp: '0813-2211-9900', gold: 'Regular' }
  ];

  const CARA_BAYAR = ['Tunai', 'BPJS', 'Asuransi', 'Debit'];
  const GOLD = ['Regular', 'Silver', 'Gold'];

  // ---- util tanggal (waktu lokal, bukan UTC) ----
  function iso(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function addDays(base, n) { const d = new Date(base); d.setDate(d.getDate() + n); return d; }

  function build() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const dokter = DOKTER.map((d, i) => ({
      id: 'DK' + String(i + 1).padStart(3, '0'),
      nama: d.nama, spesialisasi: d.spesialisasi, poli: d.poli, telepon: d.telepon, warna: d.warna,
      aktif: true,
      hariKerja: [1, 2, 3, 4, 5],
      jamKerja: { mulai: d.poli === 'Poli Gigi' ? '09:00' : '08:00', selesai: d.poli === 'Poli Gigi' ? '15:00' : '16:00' }
    }));

    const poli = POLI.map((p, i) => ({
      id: 'PL' + String(i + 1).padStart(3, '0'),
      nama: p.nama, deskripsi: p.deskripsi, durasi: p.durasi, harga: p.harga, warna: p.warna
    }));

    const pasien = PASIEN.map((p, i) => ({
      id: 'PS' + String(i + 1).padStart(4, '0'),
      noRm: 'RM-' + String(1001 + i),
      nama: p.nama, nik: p.nik, jenisKelamin: p.jk,
      tanggalLahir: p.lahir, telepon: p.telp, email: p.nama.toLowerCase().replace(/[^a-z]/g, '.') + '@mail.com',
      alamat: 'Jl. Melati No.' + (i + 1) + ', Bandung',
      golonganDarah: ['A', 'B', 'O', 'AB'][i % 4],
      golongan: GOLD.indexOf(p.gold),
      allergies: i === 2 ? 'Penicillin' : (i === 5 ? 'Ibuprofen' : ''),
      penyakit: i === 0 ? 'Diabetes Tipe 2' : (i === 3 ? 'Hipertensi' : (i === 6 ? 'Asma' : '')),
      status: 'aktif',
      dibuatPada: new Date(today.getTime() - (40 - i) * 86400000).toISOString()
    }));

    // ---- generator reservasi ----
    const reservasi = [];
    const durasiSlot = 30;
    let seq = 1;

    // slot yang valid untuk seorang dokter (menghormati jam & hari praktik)
    function slotDokter(dk) {
      const out = [];
      const [sh, sm] = dk.jamKerja.mulai.split(':').map(Number);
      const [eh, em] = dk.jamKerja.selesai.split(':').map(Number);
      for (let m = sh * 60 + sm; m + durasiSlot <= eh * 60 + em; m += durasiSlot) {
        out.push(String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'));
      }
      return out;
    }
    const slotPerDokter = {};
    dokter.forEach(d => { slotPerDokter[d.id] = slotDokter(d); });

    for (let offset = -14; offset <= 21; offset++) {
      const d = addDays(today, offset);
      const dow = d.getDay() === 0 ? 7 : d.getDay();

      const jumlah = offset === 0 ? 9 : Math.floor(Math.random() * 7) + 2;
      const slotTerpakai = {};

      for (let k = 0; k < jumlah; k++) {
        // hanya dokter yang praktik pada hari tersebut
        const kandidat = dokter.filter(dk => dk.hariKerja.indexOf(dow) !== -1);
        if (!kandidat.length) break;
        const dk = kandidat[Math.floor(Math.random() * kandidat.length)];
        const jam = slotPerDokter[dk.id][Math.floor(Math.random() * slotPerDokter[dk.id].length)];
        if (!jam) continue;
        const key = dk.id + '|' + jam;
        if (slotTerpakai[key]) continue;
        slotTerpakai[key] = true;

        const ps = pasien[Math.floor(Math.random() * pasien.length)];
        let status;
        if (offset < 0) status = Math.random() > 0.22 ? 'selesai' : 'batal';
        else if (offset === 0) status = k < 3 ? 'selesai' : (k < 6 ? 'dikonfirmasi' : 'menunggu');
        else if (offset <= 3) status = Math.random() > 0.45 ? 'dikonfirmasi' : 'menunggu';
        else status = 'menunggu';

        const p = poli.find(x => x.nama === dk.poli);
        reservasi.push({
          id: 'RV' + String(seq).padStart(4, '0'),
          kode: 'RSV-' + iso(d).replace(/-/g, '') + '-' + String(seq).padStart(3, '0'),
          tanggal: iso(d),
          waktu: jam,
          dokterId: dk.id,
          poliId: p.id,
          pasienId: ps.id,
          status: status,
          caraBayar: CARA_BAYAR[Math.floor(Math.random() * CARA_BAYAR.length)],
          catatan: Math.random() > 0.75 ? 'Kontrol rutin, bawa hasil lab terakhir' : '',
          dp: status === 'batal' ? 0 : (Math.random() > 0.6 ? 50000 : 0),
          dibuatPada: new Date(d.getTime() - 86400000).toISOString(),
          updatedAt: new Date().toISOString()
        });
        seq++;
      }
    }

    const pengaturan = {
      namaKlinik: 'Sehat Klinik Bandung',
      alamat: 'Jl. Asia Afrika No. 112, Bandung 40111',
      telepon: '(022) 420-5511',
      email: 'admin@sehatklinik.id',
      jamBuka: '08:00',
      jamTutup: '17:00',
      durasiSlot: durasiSlot,
      maksReservasiPerPasien: 3,
      estimasiMenit: 30,
      tema: 'light',
      namaAdmin: 'Admin Klinik',
      jabatanAdmin: 'Petugas Registrasi'
    };

    return {
      versi: 1,
      dibuatPada: new Date().toISOString(),
      diperbaruiPada: new Date().toISOString(),
      pengaturan: pengaturan,
      dokter: dokter,
      poli: poli,
      pasien: pasien,
      reservasi: reservasi
    };
  }

  return { build: build };
})();
