# KAS RT — Login & Signup NIK (6.0)

Paket rilis: **KAS-RT-AUTH-V6.zip**. Gunakan seluruh source paket ini pada branch/proyek Workers yang sama; jangan campur dengan file API spesifik atau middleware dari paket lama yang dapat mengambil prioritas routing. Simpan backup source dan database sebelum memperbarui deployment.

Versi ini mengembalikan autentikasi nyata dan penyimpanan PostgreSQL. Paket STATIC V5 hanya demo; jangan digunakan untuk akun atau data keuangan produksi. Jangan mengunggah `.env`, `.next`, `.open-next`, atau ZIP ke GitHub. Perubahan sandbox tidak otomatis mengubah repository produksi Anda.

## Mekanisme akses

- `/login`: username/password diverifikasi di server. Tidak ada akun universal atau `admin123` bawaan.
- `/register`: cek NIK 16 digit yang sudah ada dan aktif pada `residents`; token verifikasi berlaku 10 menit. Satu NIK hanya satu akun. Signup selalu menghasilkan role `warga`.
- `/dashboard`: selalu memeriksa sesi database. Warga hanya menerima data dan tagihan miliknya. Data Warga, transaksi, pengaturan dan manajemen akun khusus admin.
- Password menggunakan scrypt dengan salt acak. Cookie HttpOnly hanya berisi token sesi acak; hash token disimpan di PostgreSQL. Sesi berakhir setelah 12 jam atau 7 hari untuk opsi Ingat saya. Logout mencabut sesi server.
- Tidak ada password di localStorage, query URL, kode frontend, atau respons API.
- Bukti transfer tidak otomatis melunasi tagihan. Pengurus memverifikasi bukti dan transaksi pemasukan dicatat sekali secara atomik.
- Pengecekan NIK mencocokkan daftar RT, bukan verifikasi Dukcapil atau OTP. Untuk verifikasi identitas lebih kuat, tambahkan OTP/aktivasi pengurus. Jangan mempublikasikan daftar NIK.

## Database

Salin `.env.example` menjadi `.env` di komputer pengurus. Isi `DATABASE_URL` dengan koneksi PostgreSQL/Neon lengkap, jangan dengan password bertanda bintang. Koneksi Neon menggunakan Drizzle Neon HTTP agar sesuai Workers. PostgreSQL lokal menggunakan Drizzle node-postgres. Koneksi tidak dibuat saat import/build.

Jalankan `npm install`, lalu `npm run db:migrate` dari komputer pengurus dengan DATABASE_URL yang menuju database yang benar. Alternatif database sandbox baru: `npm run db:push`. Jangan menjalankan perintah penghapusan tabel atau mengganti database yang sudah berisi data.

Skema auth baru memakai tabel `kasrt_auth_users`, `kasrt_auth_sessions`, `kasrt_signup_checks`, dan `kasrt_auth_limits`. Daftar NIK memakai `residents`. Akun dan kredensial dari aplikasi lain tidak otomatis dimigrasikan. Jika sebelumnya data Anda berada di tabel `warga`, gunakan `node scripts/import-residents.mjs` setelah migrasi untuk menyalin daftar warga secara non-destruktif. Cadangkan database terlebih dahulu. Script hanya membaca kolom standar aplikasi lama dan melewati NIK yang sudah ada; tabel sumber tidak dihapus.

## Admin pertama (tanpa password bawaan)

1. Buat string acak minimal 32 karakter, misalnya dengan `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"`.
2. Simpan nilainya sebagai secret `ADMIN_SETUP_KEY`, bukan variabel NEXT_PUBLIC.
3. Buka `/setup`, isi kunci tersebut, nama, username admin, dan password baru (10–128 karakter, huruf dan angka).
4. Pembuatan admin awal otomatis terkunci ketika satu admin sudah tersedia. Hapus secret ADMIN_SETUP_KEY setelah penyiapan berhasil.
5. Login sebagai admin, tambahkan NIK lewat Data Warga → Tambah Warga. Warga kemudian membuka `/register`.
6. Admin dapat membuat akun pengurus lain di Pengaturan → User Management. Dalam versi ini role pengurus adalah `admin` (akses penuh), bukan pembagian Ketua/Bendahara granular.

## Cloudflare — gunakan Workers, BUKAN Pages statis

Login, database dan API POST membutuhkan backend. Menambahkan folder dist atau menyajikan `.next` sebagai aset Pages tidak akan menjalankan backend.

Konfigurasi `wrangler.json` menargetkan Workers via OpenNext, dengan `nodejs_compat`, `.open-next/worker.js` dan `.open-next/assets`. Tidak ada lagi `pages_build_output_dir`.

Di Cloudflare: Workers & Pages → Create → Worker → Connect repository.

- Build command: `npm run build:cloudflare`
- Deploy command: `npm run deploy:cloudflare`
- Root: direktori yang berisi package.json
- Node: 22
- **Tidak ada** output directory `dist` untuk Worker ini.

Simpan `DATABASE_URL` dan (hanya untuk inisialisasi) `ADMIN_SETUP_KEY` sebagai **Secrets runtime** Worker. Bila memakai CLI: `npx wrangler secret put DATABASE_URL` dan `npx wrangler secret put ADMIN_SETUP_KEY`. Jangan menaruh secret pada wrangler.json atau public. Jika proxy mengubah Origin, atur APP_ORIGIN ke origin HTTPS website yang sebenarnya. Akses website di tab browser langsung untuk menghindari pemblokiran cookie pihak ketiga pada iframe.

Periksa batas CPU paket Worker: hashing password sengaja mahal untuk keamanan. Sesuaikan paket/limit CPU bila diperlukan; jangan menurunkan keamanan hash untuk mengatasi batas runtime.

Verifikasi `/api/health` menghasilkan `ok:true` dan `/api/version` berisi `6.0-nik-auth`.

## Node.js / pengujian lokal

- `npm run dev`
- `npm run build`, lalu `npm start`
- `npm run build:cloudflare` membangun Worker tanpa mengunggahnya.
- `npm run preview:cloudflare` menjalankan preview runtime Worker.

Tidak perlu menghubungkan Vercel. Validasi build lokal tidak sama dengan konfirmasi deployment di akun Cloudflare Anda.
