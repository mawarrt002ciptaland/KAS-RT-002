import type {
  DataBundle, Warga, AnggotaKK, Transaksi, Tagihan, Kegiatan, Pengumuman, Pengaduan,
  Kwitansi, Pengurus, Tautan, Marketplace, User,
} from "./types";
import { BULAN_ID } from "@/lib/format";

const iso = (y: number, m: number, d: number, h = 9) => new Date(y, m, d, h, 0, 0).toISOString();
const daysAgo = (n: number, h = 8) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(h, 15, 0, 0);
  return d.toISOString();
};

// ================= WARGA =================
type WargaSeed = {
  nama: string; nik: string; noKK: string; noRumah: string; role: "warga" | "pengurus";
  jabatan?: string; telepon: string; pekerjaan: string; jk: "L" | "P"; keluarga: string[];
};

const WARGA_SEED: WargaSeed[] = [
  { nama: "Bapak H. Sutrisno", nik: "7171040101800001", noKK: "7171040101180001", noRumah: "Mawar 01", role: "pengurus", jabatan: "Ketua RT 002", telepon: "081300000001", pekerjaan: "Wiraswasta", jk: "L", keluarga: ["Hj. Sutrisno (Istri)", "Ahmad Sutrisno (Anak)"] },
  { nama: "Ibu Endang Marliana", nik: "7171040202820002", noKK: "7171040202180002", noRumah: "Mawar 02", role: "pengurus", jabatan: "Bendahara RT 002", telepon: "081300000002", pekerjaan: "Ibu Rumah Tangga", jk: "P", keluarga: ["Bambang Marliana (Suami)"] },
  { nama: "Bapak Agus Santoso", nik: "7171040303850003", noKK: "7171040303180003", noRumah: "Mawar 03", role: "pengurus", jabatan: "Sekretaris RT 002", telepon: "081300000003", pekerjaan: "Karyawan Swasta", jk: "L", keluarga: ["Rina Santoso (Istri)", "Dewi Santoso (Anak)", "Raka Santoso (Anak)"] },
  { nama: "Bapak Joko Widodo", nik: "7171040404790004", noKK: "7171040404180004", noRumah: "Mawar 04", role: "pengurus", jabatan: "Koordinator Keamanan", telepon: "081300000004", pekerjaan: "Satpam", jk: "L", keluarga: [] },
  { nama: "Ibu Siti Aminah", nik: "7171040505880005", noKK: "7171040505180005", noRumah: "Mawar 05", role: "pengurus", jabatan: "Koordinator Kebersihan", telepon: "081300000005", pekerjaan: "Ibu Rumah Tangga", jk: "P", keluarga: ["Amin Saputra (Suami)", "Budi Aminah (Anak)"] },
  { nama: "Bapak Bayu J Putra", nik: "7171040606900006", noKK: "7171040606180006", noRumah: "Mawar 58", role: "warga", telepon: "081200000055", pekerjaan: "Karyawan Swasta", jk: "L", keluarga: ["Sari Putri (Istri)", "Naya Putra (Anak)", "Nadi Putra (Anak)"] },
  { nama: "Ibu Dewi Lestari", nik: "7171040707870007", noKK: "7171040707180007", noRumah: "Mawar 06", role: "warga", telepon: "081300000006", pekerjaan: "Guru", jk: "P", keluarga: ["Hendra Lestari (Suami)"] },
  { nama: "Bapak Rudi Hartono", nik: "7171040808820008", noKK: "7171040808180008", noRumah: "Mawar 07", role: "warga", telepon: "081300000007", pekerjaan: "PNS", jk: "L", keluarga: ["Maya Hartono (Istri)", "Andi Hartono (Anak)", "Budi Hartono (Anak)", "Citra Hartono (Anak)"] },
  { nama: "Ibu Wati Suryani", nik: "7171040909910009", noKK: "7171040909180009", noRumah: "Mawar 08", role: "warga", telepon: "081300000008", pekerjaan: "Pedagang", jk: "P", keluarga: ["Tono Suryani (Suami)"] },
  { nama: "Bapak Andi Pratama", nik: "7171041010860010", noKK: "7171041010180010", noRumah: "Mawar 09", role: "warga", telepon: "081300000009", pekerjaan: "Teknisi", jk: "L", keluarga: [] },
  { nama: "Ibu Rina Marlina", nik: "7171041111920011", noKK: "7171041111180011", noRumah: "Mawar 10", role: "warga", telepon: "081300000010", pekerjaan: "Ibu Rumah Tangga", jk: "P", keluarga: ["Eka Marlina (Suami)", "Lala Marlina (Anak)"] },
  { nama: "Bapak Eko Nugroho", nik: "7171041212830012", noKK: "7171041212180012", noRumah: "Mawar 11", role: "warga", telepon: "081300000011", pekerjaan: "Wiraswasta", jk: "L", keluarga: ["Rina Nugroho (Istri)", "Boni Nugroho (Anak)"] },
  { nama: "Ibu Lia Amalia", nik: "7171041313890013", noKK: "7171041313180013", noRumah: "Mawar 12", role: "warga", telepon: "081300000012", pekerjaan: "Perawat", jk: "P", keluarga: ["Fajar Amalia (Suami)", "Tiara Amalia (Anak)", "Rafi Amalia (Anak)"] },
  { nama: "Bapak Fajar Ramadhan", nik: "7171041414900014", noKK: "7171041414180014", noRumah: "Mawar 13", role: "warga", telepon: "081300000013", pekerjaan: "Karyawan Swasta", jk: "L", keluarga: [] },
  { nama: "Ibu Tika Permata", nik: "7171041515880015", noKK: "7171041515180015", noRumah: "Mawar 14", role: "warga", telepon: "081300000014", pekerjaan: "Guru", jk: "P", keluarga: ["Hendra Permata (Suami)", "Aldi Permata (Anak)"] },
  { nama: "Bapak Hendra Gunawan", nik: "7171041616850016", noKK: "7171041616180016", noRumah: "Mawar 15", role: "warga", telepon: "081300000015", pekerjaan: "PNS", jk: "L", keluarga: ["Rina Gunawan (Istri)", "Bella Gunawan (Anak)", "Bagas Gunawan (Anak)"] },
  { nama: "Ibu Nisa Anjani", nik: "7171041717920017", noKK: "7171041717180017", noRumah: "Mawar 16", role: "warga", telepon: "081300000016", pekerjaan: "Karyawan Swasta", jk: "P", keluarga: [] },
  { nama: "Bapak Rizki Ramadhan", nik: "7171041818870018", noKK: "7171041818180018", noRumah: "Mawar 17", role: "warga", telepon: "081300000017", pekerjaan: "Teknisi", jk: "L", keluarga: ["Lia Ramadhan (Istri)"] },
  { nama: "Ibu Maya Sari", nik: "7171041919900019", noKK: "7171041919180019", noRumah: "Mawar 18", role: "warga", telepon: "081300000018", pekerjaan: "Wiraswasta", jk: "P", keluarga: ["Dedi Sari (Suami)", "Aldo Sari (Anak)", "Sasa Sari (Anak)"] },
  { nama: "Bapak Dani Kurniawan", nik: "7171042020850020", noKK: "7171042020180020", noRumah: "Mawar 19", role: "warga", telepon: "081300000019", pekerjaan: "Karyawan Swasta", jk: "L", keluarga: ["Wati Kurniawan (Istri)", "Rani Kurniawan (Anak)"] },
];

function buildWarga(): Warga[] {
  return WARGA_SEED.map((w, i) => {
    const id = `w-${String(i + 1).padStart(2, "0")}`;
    const anggotaKK: AnggotaKK[] = w.keluarga.map((k, j) => {
      const m = k.match(/^(.*)\s\((.*)\)$/);
      const nama = m ? m[1] : k;
      const hubungan = m ? m[2] : "Anggota";
      const isFemale = hubungan === "Istri" || /a$|i$/.test(nama.split(" ")[0]) && hubungan === "Anak" && j % 2 === 0;
      return { id: `${id}-a${j + 1}`, nama, hubungan, jenisKelamin: isFemale ? "P" : "L" };
    });
    return {
      id,
      nama: w.nama,
      nik: w.nik,
      noKK: w.noKK,
      noRumah: w.noRumah,
      blok: "Mawar",
      alamat: `${w.noRumah}, Blok Mawar, Perumahan Ciptaland, Batam`,
      telepon: w.telepon,
      email: undefined,
      jenisKelamin: w.jk,
      pekerjaan: w.pekerjaan,
      statusKawin: w.keluarga.length ? "Kawin" : "Belum Kawin",
      agama: "Islam",
      role: w.role,
      jabatan: w.jabatan,
      status: "aktif",
      tanggalBergabung: iso(2024, 0, 1),
      createdAt: iso(2024, 0, 1),
      anggotaKK,
    };
  });
}

// ================= TRANSAKSI =================
type TrxSeed = { d: [number, number, number]; kategori: string; ket: string; nominal: number; pihak: string; metode?: string };

const PENGELUARAN_SEED: TrxSeed[] = [
  // Keamanan — total Rp 6.504.820
  { d: [2026, 0, 25], kategori: "Keamanan", ket: "Terali pengaman jendela pos", nominal: 680000, pihak: "Tim Keamanan RT" },
  { d: [2026, 1, 18], kategori: "Keamanan", ket: "Perbaikan lampu jalan blok Mawar", nominal: 1250000, pihak: "Tim Keamanan RT", metode: "Transfer" },
  { d: [2026, 3, 12], kategori: "Keamanan", ket: "Honor satpam malam Lebaran", nominal: 1500000, pihak: "Tim Keamanan RT" },
  { d: [2026, 4, 5], kategori: "Keamanan", ket: "Penggantian kunci gerbang utama", nominal: 850000, pihak: "Tim Keamanan RT" },
  { d: [2026, 5, 8], kategori: "Keamanan", ket: "Baterai & service CCTV pos satpam", nominal: 680000, pihak: "Tim Keamanan RT", metode: "Transfer" },
  { d: [2026, 6, 22], kategori: "Keamanan", ket: "Patroli malam tambahan (3 malam)", nominal: 544820, pihak: "Tim Keamanan RT" },
  { d: [2026, 7, 3], kategori: "Keamanan", ket: "Cat ulang rambu & marka jalan", nominal: 600000, pihak: "Tim Keamanan RT" },
  { d: [2026, 7, 10], kategori: "Keamanan", ket: "Pengadaan senter & HT patroli", nominal: 400000, pihak: "Tim Keamanan RT" },
  // Fasilitas — total Rp 2.689.000
  { d: [2026, 2, 10], kategori: "Fasilitas", ket: "Servis pompa air taman", nominal: 450000, pihak: "Tukang" },
  { d: [2026, 2, 12], kategori: "Fasilitas", ket: "Sparepart pompa air taman", nominal: 300000, pihak: "Toko Bangunan Jaya" },
  { d: [2026, 4, 14], kategori: "Fasilitas", ket: "Penggantian pipa air bocor", nominal: 689000, pihak: "Tukang" },
  { d: [2026, 5, 19], kategori: "Fasilitas", ket: "Perbaikan kanopi pos", nominal: 600000, pihak: "Tukang", metode: "Transfer" },
  { d: [2026, 6, 1], kategori: "Fasilitas", ket: "Cat ulang tugu RT 002", nominal: 650000, pihak: "Tukang" },
  // Kebersihan — total Rp 1.950.000
  { d: [2026, 0, 31], kategori: "Kebersihan", ket: "Honor petugas kebersihan Januari", nominal: 500000, pihak: "Petugas Kebersihan" },
  { d: [2026, 1, 28], kategori: "Kebersihan", ket: "Honor petugas kebersihan Februari", nominal: 500000, pihak: "Petugas Kebersihan" },
  { d: [2026, 3, 5], kategori: "Kebersihan", ket: "Sapu, serok, karung sampah", nominal: 350000, pihak: "Petugas Kebersihan" },
  { d: [2026, 6, 15], kategori: "Kebersihan", ket: "Sewa truck angkut sampah besar", nominal: 600000, pihak: "CV Angkut Bersih", metode: "Transfer" },
  // Sosial / Kematian — total Rp 1.500.000
  { d: [2026, 2, 22], kategori: "Sosial / Kematian", ket: "Bantuan duka warga Mawar 21", nominal: 1000000, pihak: "Keluarga Mawar 21" },
  { d: [2026, 6, 5], kategori: "Sosial / Kematian", ket: "Santunan anak yatim blok Mawar", nominal: 500000, pihak: "Warga" },
  // Operasional RT — total Rp 1.350.000
  { d: [2026, 0, 12], kategori: "Operasional RT", ket: "ATK administrasi RT (kertas, tinta print)", nominal: 350000, pihak: "Bendahara RT" },
  { d: [2026, 3, 18], kategori: "Operasional RT", ket: "Konsumsi rapat warga", nominal: 300000, pihak: "Bendahara RT" },
  { d: [2026, 5, 27], kategori: "Operasional RT", ket: "Konsumsi rapat koordinasi keamanan", nominal: 150000, pihak: "Bendahara RT" },
  { d: [2026, 6, 28], kategori: "Operasional RT", ket: "Iuran listrik taman & pos", nominal: 500000, pihak: "PLN", metode: "Transfer" },
  { d: [2026, 7, 31], kategori: "Operasional RT", ket: "Upah sebar lapkas", nominal: 50000, pihak: "Bendahara RT" },
  // Kegiatan Warga — total Rp 593.000
  { d: [2026, 7, 17], kategori: "Kegiatan Warga", ket: "Konsumsi 17an upacara bendera", nominal: 593000, pihak: "Panitia 17an" },
];

function buildPemasukanSeed(): TrxSeed[] {
  const list: TrxSeed[] = [
    { d: [2026, 0, 1], kategori: "Lain-lain", ket: "Saldo awal tahun 2026 (sisa kas tahun sebelumnya)", nominal: 8089133, pihak: "Kas Tahun 2025" },
  ];
  for (let m = 0; m < 8; m++) {
    list.push({ d: [2026, m, 5], kategori: "Iuran Bulanan Warga", ket: `Iuran bulanan warga ${BULAN_ID[m]} 2026`, nominal: 500000, pihak: "Warga RT 002", metode: m % 3 === 1 ? "Transfer" : "Tunai" });
    list.push({ d: [2026, m, 6], kategori: "Iuran Keamanan", ket: `Iuran keamanan ${BULAN_ID[m]} 2026`, nominal: 600000, pihak: "Warga RT 002" });
    list.push({ d: [2026, m, 7], kategori: "Iuran Kebersihan", ket: `Iuran kebersihan ${BULAN_ID[m]} 2026`, nominal: 400000, pihak: "Warga RT 002", metode: m % 2 === 0 ? "QRIS" : "Tunai" });
  }
  list.push({ d: [2026, 2, 15], kategori: "Donasi / Sumbangan", ket: "Sumbangan pembangunan pos keamanan", nominal: 1500000, pihak: "Donatur", metode: "Transfer" });
  list.push({ d: [2026, 5, 20], kategori: "Bantuan Eksternal", ket: "Bantuan RW untuk kegiatan 17an", nominal: 1000000, pihak: "Pengurus RW 014", metode: "Transfer" });
  return list;
}

function buildTransaksi(): Transaksi[] {
  const out: Transaksi[] = [];
  const byDate = (a: TrxSeed, b: TrxSeed) => new Date(...a.d).getTime() - new Date(...b.d).getTime();
  const pem = buildPemasukanSeed().sort(byDate);
  const peng = [...PENGELUARAN_SEED].sort(byDate);
  pem.forEach((t, i) => {
    const [y, m, d] = t.d;
    const yyyymm = `${y}${String(m + 1).padStart(2, "0")}`;
    out.push({
      id: `t-pem-${String(i + 1).padStart(3, "0")}`,
      kode: `TRX-PEM-${yyyymm}-${String(i + 1).padStart(3, "0")}`,
      jenis: "pemasukan",
      tanggal: iso(y, m, d, 10),
      kategori: t.kategori,
      keterangan: t.ket,
      nominal: t.nominal,
      sumber: t.pihak,
      metode: t.metode ?? "Tunai",
      status: "selesai",
      createdAt: iso(y, m, d, 10),
    });
  });
  peng.forEach((t, i) => {
    const [y, m, d] = t.d;
    const yyyymm = `${y}${String(m + 1).padStart(2, "0")}`;
    out.push({
      id: `t-peng-${String(i + 1).padStart(3, "0")}`,
      kode: `TRX-PENG-${yyyymm}-${String(i + 1).padStart(3, "0")}`,
      jenis: "pengeluaran",
      tanggal: iso(y, m, d, 14),
      kategori: t.kategori,
      keterangan: t.ket,
      nominal: t.nominal,
      penerima: t.pihak,
      metode: t.metode ?? "Tunai",
      status: "selesai",
      createdAt: iso(y, m, d, 14),
    });
  });
  return out.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
}

// ================= TAGIHAN =================
function buildTagihan(warga: Warga[]): Tagihan[] {
  const out: Tagihan[] = [];
  let seq = 1;
  warga.forEach((w, idx) => {
    if (w.role !== "warga") return;
    for (const m of [6, 7]) {
      const lunas = (idx * 7 + m) % 3 !== 0;
      const periode = `2026-${String(m + 1).padStart(2, "0")}`;
      out.push({
        id: `tag-${String(seq).padStart(3, "0")}`,
        kode: `TAG-${periode.replace("-", "")}-${String(seq).padStart(4, "0")}`,
        wargaId: w.id,
        jenis: "iuran_bulanan",
        periode,
        jumlah: 25000,
        tanggalJatuhTempo: iso(2026, m, 10),
        status: lunas ? "lunas" : m === 7 ? "belum_bayar" : "telat",
        tanggalBayar: lunas ? iso(2026, m, 8) : undefined,
        metode: lunas ? (idx % 2 ? "Transfer" : "Tunai") : undefined,
        denda: 0,
        keterangan: `Iuran bulanan warga ${BULAN_ID[m]} 2026`,
        createdAt: iso(2026, m, 1),
      });
      seq++;
    }
  });
  return out;
}

// ================= KEGIATAN =================
function buildKegiatan(): Kegiatan[] {
  const data = [
    { judul: "Kerja Bakti Bersih Lingkungan Blok Mawar", kategori: "Gotong Royong", d: [2026, 7, 24], jam: "07:00", lokasi: "Sepanjang Jalan Mawar", peserta: 35, status: "akan_datang" },
    { judul: "Pertemuan Rutin Warga Bulanan", kategori: "Pertemuan", d: [2026, 7, 28], jam: "20:00", lokasi: "Pos RT 002", peserta: 0, status: "akan_datang" },
    { judul: "Lomba 17an Anak-anak Mawar", kategori: "Sosial", d: [2026, 7, 17], jam: "08:00", lokasi: "Halaman Blok Mawar", peserta: 42, status: "selesai" },
    { judul: "Patroli Malam Keamanan", kategori: "Keamanan", d: [2026, 7, 15], jam: "22:00", lokasi: "Blok Mawar", peserta: 6, status: "selesai" },
    { judul: "Pengajian Warga Muslim", kategori: "Sosial", d: [2026, 6, 25], jam: "19:30", lokasi: "Rumah Bapak Sutrisno", peserta: 25, status: "selesai" },
    { judul: "Senam Sehat Pagi Warga", kategori: "Olahraga", d: [2026, 8, 7], jam: "06:30", lokasi: "Taman Mawar", peserta: 0, status: "akan_datang" },
  ] as const;
  return data.map((k, i) => ({
    id: `keg-${i + 1}`,
    judul: k.judul,
    deskripsi: `${k.judul} akan dilaksanakan di ${k.lokasi}. Diharapkan seluruh warga RT 002 Blok Mawar dapat berpartisipasi aktif.`,
    kategori: k.kategori,
    tanggalMulai: iso(k.d[0], k.d[1], k.d[2]),
    tanggalSelesai: k.status === "selesai" ? iso(k.d[0], k.d[1], k.d[2], 12) : undefined,
    jam: k.jam,
    lokasi: k.lokasi,
    status: k.status,
    jumlahPeserta: k.peserta,
    createdAt: iso(2026, 6, 1),
  }));
}

// ================= PENGUMUMAN =================
function buildPengumuman(): Pengumuman[] {
  const data: { judul: string; konten: string; kategori: string; prioritas: Pengumuman["prioritas"]; ago: number }[] = [
    { judul: "Pemberitahuan Kerja Bakti 24 Agustus 2026", konten: "Mengumumkan kepada seluruh warga RT 002 Blok Mawar akan diadakan kerja bakti membersihkan lingkungan pada hari Senin, 24 Agustus 2026 pukul 07.00 WIB. Mohon partisipasi aktif seluruh warga. Bawa alat kebersihan masing-masing.", kategori: "Penting", prioritas: "penting", ago: 1 },
    { judul: "Tagihan Iuran Agustus 2026", konten: "Tagihan iuran bulanan Agustus 2026 telah diterbitkan. Jatuh tempo 10 Agustus 2026. Mohon segera melakukan pembayaran kepada Bendahara Ibu Endang atau melalui QRIS/transfer bank RT.", kategori: "Mendesak", prioritas: "mendesak", ago: 2 },
    { judul: "Pertemuan Rutin Warga", konten: "Pertemuan rutin warga bulanan akan diadakan tanggal 28 Agustus 2026 pukul 20.00 WIB di Pos RT 002. Agenda: evaluasi iuran, agenda kegiatan, dan koordinasi keamanan.", kategori: "Acara", prioritas: "normal", ago: 4 },
    { judul: "Lomba 17an — Hasil & Pemenang", konten: "Selamat kepada para pemenang lomba 17an anak-anak Blok Mawar. Terima kasih kepada panitia dan seluruh warga yang berpartisipasi. Dokumentasi tersedia di channel YouTube RT 002.", kategori: "Umum", prioritas: "normal", ago: 9 },
    { judul: "Jadwal Ronda Malam September 2026", konten: "Jadwal ronda malam bulan September telah disusun oleh Koordinator Keamanan. Setiap KK mendapat giliran 1x per bulan. Jadwal lengkap dapat dilihat di papan pengumuman Pos RT 002.", kategori: "Umum", prioritas: "normal", ago: 0 },
  ];
  return data.map((p, i) => ({
    id: `png-${i + 1}`,
    judul: p.judul,
    konten: p.konten,
    kategori: p.kategori,
    prioritas: p.prioritas,
    status: "aktif",
    penulis: "Sekretaris RT 002",
    tanggal: daysAgo(p.ago),
    createdAt: daysAgo(p.ago),
  }));
}

// ================= PENGADUAN =================
function buildPengaduan(): Pengaduan[] {
  const data: { judul: string; kategori: string; pelapor: string; wargaId: string; status: Pengaduan["status"]; lokasi: string; tanggapan?: string; ago: number }[] = [
    { judul: "Lampu jalan depan Mawar 08 mati", kategori: "Keamanan", pelapor: "Bapak Bayu J Putra", wargaId: "w-06", status: "proses", lokasi: "Jalan Mawar depan no 08", tanggapan: "Sedang dijadwalkan perbaikan oleh Tim Keamanan minggu ini.", ago: 3 },
    { judul: "Saluran air tersumbat Mawar 12-14", kategori: "Fasilitas", pelapor: "Ibu Lia Amalia", wargaId: "w-13", status: "baru", lokasi: "Trotoar Mawar 12-14", ago: 1 },
    { judul: "Sampah menumpuk taman kecil", kategori: "Kebersihan", pelapor: "Ibu Rina Marlina", wargaId: "w-11", status: "selesai", lokasi: "Taman Mawar", tanggapan: "Sudah diangkut oleh petugas kebersihan pada 18 Agustus 2026.", ago: 6 },
    { judul: "Anjing liar berkeliaran malam", kategori: "Keamanan", pelapor: "Bapak Andi Pratama", wargaId: "w-10", status: "baru", lokasi: "Gerbang belakang Mawar", ago: 0 },
  ];
  return data.map((p, i) => ({
    id: `adu-${i + 1}`,
    kode: `ADU-2026-${String(i + 1).padStart(6, "0")}`,
    judul: p.judul,
    deskripsi: `${p.judul}. Mohon ditindaklanjuti secepatnya oleh pengurus RT terkait.`,
    kategori: p.kategori,
    lokasi: p.lokasi,
    status: p.status,
    pelapor: p.pelapor,
    wargaId: p.wargaId,
    tanggapan: p.tanggapan,
    createdAt: daysAgo(p.ago, 7 + i),
    updatedAt: daysAgo(Math.max(0, p.ago - 1), 10),
  }));
}

// ================= KWITANSI =================
function buildKwitansi(transaksi: Transaksi[]): Kwitansi[] {
  const latest = transaksi.filter((t) => t.jenis === "pemasukan").slice(0, 8);
  return latest.map((t, i) => ({
    id: `kw-${i + 1}`,
    kode: `KWI-2026-${String(8 - i).padStart(4, "0")}`,
    transaksiId: t.id,
    tanggal: t.tanggal,
    nominal: t.nominal,
    penerima: "Endang Marliana",
    pembayar: t.sumber ?? "Warga RT 002",
    keterangan: t.keterangan,
    createdAt: t.tanggal,
  }));
}

// ================= PENGURUS =================
function buildPengurus(): Pengurus[] {
  const data = [
    { nama: "H. Sutrisno", jabatan: "Ketua RT 002", telepon: "081300000001", bidang: "Pimpinan", urutan: 1 },
    { nama: "Endang Marliana", jabatan: "Bendahara RT 002", telepon: "081300000002", bidang: "Keuangan", urutan: 2 },
    { nama: "Agus Santoso", jabatan: "Sekretaris RT 002", telepon: "081300000003", bidang: "Administrasi", urutan: 3 },
    { nama: "Joko Widodo", jabatan: "Koordinator Keamanan", telepon: "081300000004", bidang: "Keamanan", urutan: 4 },
    { nama: "Siti Aminah", jabatan: "Koordinator Kebersihan", telepon: "081300000005", bidang: "Kebersihan", urutan: 5 },
    { nama: "Bayu J Putra", jabatan: "Koordinator Sosial", telepon: "081200000055", bidang: "Sosial", urutan: 6 },
  ];
  return data.map((p, i) => ({ id: `pg-${i + 1}`, ...p, periode: "2024-2027" }));
}

// ================= TAUTAN =================
function buildTautan(): Tautan[] {
  const data = [
    { judul: "YouTube RT 002 Mawar", url: "https://youtube.com/@rt002mawar", kategori: "Sosial Media", deskripsi: "Channel resmi dokumentasi kegiatan RT 002" },
    { judul: "Website Resmi RT 002", url: "https://rt002mawar.id", kategori: "Layanan", deskripsi: "Portal informasi resmi RT 002 Blok Mawar" },
    { judul: "WhatsApp Admin RT 002", url: "https://wa.me/6281234567890", kategori: "Kontak", deskripsi: "Hubungi admin/pengurus RT 002 langsung" },
    { judul: "Website Kelurahan Suka Maju", url: "https://kelurahan-sukamaju.batam.go.id", kategori: "Pemerintah", deskripsi: "Portal kelurahan setempat" },
    { judul: "Instagram RT 002 Mawar", url: "https://instagram.com/rt002mawar", kategori: "Sosial Media", deskripsi: "Update foto & video kegiatan" },
    { judul: "Grup WhatsApp Warga", url: "https://wa.me/6281234567890", kategori: "Kontak", deskripsi: "Grup WhatsApp warga RT 002 Blok Mawar" },
    { judul: "Pengaduan Online Kota Batam", url: "https://batam.go.id/layanan/pengaduan", kategori: "Pemerintah", deskripsi: "Layanan pengaduan resmi Pemkot Batam" },
    { judul: "TikTok RT 002 Mawar", url: "https://tiktok.com/@rt002mawar", kategori: "Sosial Media", deskripsi: "Konten pendek kegiatan warga" },
  ];
  return data.map((t, i) => ({ id: `lnk-${i + 1}`, ...t, urutan: i + 1 }));
}

// ================= MARKETPLACE =================
function buildMarketplace(): Marketplace[] {
  const data: Omit<Marketplace, "id" | "status" | "createdAt">[] = [
    { nama: "Kue Lapis Legit Rumahan", kategori: "Kuliner", harga: 75000, penjual: "Ibu Wati Suryani", telepon: "081300000008", deskripsi: "Kue lapis legit homemade, bisa pesan harian. Cocok untuk hantaran & acara keluarga.", kondisi: "baru", alamat: "Mawar 08" },
    { nama: "Jasa Service AC & Listrik", kategori: "Jasa", harga: 80000, penjual: "Bapak Andi Pratama", telepon: "081300000009", deskripsi: "Teknisi bersertifikat. Cuci AC, service, instalasi listrik rumah tangga.", kondisi: "baru", alamat: "Mawar 09" },
    { nama: "Catering Harian Warga", kategori: "Makanan", harga: 25000, penjual: "Ibu Rina Marlina", telepon: "081300000010", deskripsi: "Catering harian, menu berganti tiap hari. Pesan H-1.", kondisi: "baru", alamat: "Mawar 10" },
    { nama: "Sepeda Anak Bekas Layak", kategori: "Barang", harga: 350000, penjual: "Bapak Eko Nugroho", telepon: "081300000011", deskripsi: "Sepeda anak usia 5-8 tahun, kondisi baik, ban baru.", kondisi: "bekas", alamat: "Mawar 11" },
    { nama: "Laundry Kilogram Murah", kategori: "Jasa", harga: 6000, penjual: "Ibu Maya Sari", telepon: "081300000018", deskripsi: "Laundry kiloan, antar-jemput gratis area Mawar.", kondisi: "baru", alamat: "Mawar 18" },
    { nama: "Tanaman Hias Monstera", kategori: "Barang", harga: 150000, penjual: "Ibu Dewi Lestari", telepon: "081300000006", deskripsi: "Monstera deliciosa size medium, sudah berakar sehat.", kondisi: "baru", alamat: "Mawar 06" },
    { nama: "Servis HP & Ganti LCD", kategori: "Jasa", harga: 100000, penjual: "Bapak Rizki Ramadhan", telepon: "081300000017", deskripsi: "Service HP semua merek, ganti LCD, baterai, port cas.", kondisi: "baru", alamat: "Mawar 17" },
    { nama: "Kue Kering Lebaran", kategori: "Kuliner", harga: 50000, penjual: "Ibu Tika Permata", telepon: "081300000014", deskripsi: "Nastar, kastengel, putri salju. Toples isi 250gr.", kondisi: "baru", alamat: "Mawar 14" },
  ];
  return data.map((m, i) => ({ id: `mk-${i + 1}`, ...m, status: "tersedia", createdAt: daysAgo(12 - i) }));
}

// ================= USERS =================
function buildUsers(): User[] {
  const data: Omit<User, "id" | "createdAt" | "status">[] = [
    { email: "admin@rt002mawar.id", nama: "Administrator RT 002", role: "admin", telepon: "081234567890", lastLogin: daysAgo(0, 7) },
    { email: "ketua@rt002mawar.id", nama: "H. Sutrisno", role: "ketua", telepon: "081300000001", lastLogin: daysAgo(1) },
    { email: "bendahara@rt002mawar.id", nama: "Endang Marliana", role: "bendahara", telepon: "081300000002", lastLogin: daysAgo(0, 6) },
    { email: "sekretaris@rt002mawar.id", nama: "Agus Santoso", role: "pengurus", telepon: "081300000003", lastLogin: daysAgo(2) },
    { email: "keamanan@rt002mawar.id", nama: "Joko Widodo", role: "pengurus", telepon: "081300000004", lastLogin: daysAgo(5) },
    { email: "warga@rt002mawar.id", nama: "Bayu J Putra", role: "warga", telepon: "081200000055", lastLogin: daysAgo(0, 9) },
  ];
  return data.map((u, i) => ({ id: `u-${i + 1}`, ...u, status: "aktif", createdAt: iso(2024, 0, 1) }));
}

// ================= PENGATURAN =================
const PENGATURAN_SEED: Record<string, string> = {
  nama_rt: "RT 002 Blok Mawar",
  rt: "002",
  rw: "014",
  blok: "Mawar",
  perumahan: "Ciptaland",
  kota: "Batam",
  alamat: "Blok Mawar, Perumahan Ciptaland, Batam, Kepulauan Riau",
  periode_pengurus: "2024-2027",
  whatsapp_admin: "6281234567890",
  iuran_bulanan: "25000",
  iuran_keamanan: "30000",
  iuran_kebersihan: "20000",
  bank_nama: "Bank BRI",
  bank_rekening: "1234-5678-9012-3",
  bank_pemilik: "Endang Marliana",
  qris_url: "https://qris.id/rt002mawar",
  qris_image: "",
  logo_url: "",
  nama_ketua: "H. Sutrisno",
  nama_bendahara: "Endang Marliana",
  nama_sekretaris: "Agus Santoso",
  ttd_bendahara: "",
};

export function buildSeed(): DataBundle {
  const warga = buildWarga();
  const transaksi = buildTransaksi();
  return {
    warga,
    transaksi,
    tagihan: buildTagihan(warga),
    kegiatan: buildKegiatan(),
    pengumuman: buildPengumuman(),
    pengaduan: buildPengaduan(),
    kwitansi: buildKwitansi(transaksi),
    pengurus: buildPengurus(),
    tautan: buildTautan(),
    marketplace: buildMarketplace(),
    users: buildUsers(),
    pengaturan: { ...PENGATURAN_SEED },
  };
}
