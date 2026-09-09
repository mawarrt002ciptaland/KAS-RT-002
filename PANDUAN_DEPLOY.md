# Panduan Deploy KAS RT — Blok Mawar RT 002

## ⚠️ Penting: Jenis Hosting yang Dibutuhkan

Aplikasi ini adalah **fullstack Next.js** (server Node.js + database PostgreSQL).
Aplikasi ini TIDAK BISA berjalan di hosting statis.

Deployment Git di hosting web Hostinger (hostingersite.com) adalah **hosting
statis** — log build-nya meminta folder `dist` dan memakai Wrangler/Cloudflare.
Itu sebabnya deploy gagal dengan `Output directory "dist" not found`, meskipun
build Next.js sendiri sudah sukses.

## ✅ Rekomendasi: Deploy ke Vercel (GRATIS, 10 menit)

Vercel adalah pembuat Next.js — aplikasi ini jalan tanpa perubahan apa pun.

### Langkah 1 — Buat database PostgreSQL gratis di Neon
1. Buka https://neon.tech → daftar (bisa pakai akun GitHub)
2. Create Project → beri nama `kas-rt`
3. Salin **connection string**, contohnya:
   `postgresql://user:pass@ep-xxxx.aws.neon.tech/neondb?sslmode=require`

### Langkah 2 — Deploy ke Vercel
1. Buka https://vercel.com → daftar dengan akun GitHub Anda
2. Klik **Add New → Project**
3. Pilih repo **KAS-RT-002** → Import
4. Di bagian **Environment Variables**, tambahkan:
   - `DATABASE_URL` = connection string Neon dari Langkah 1
   - `AUTH_SECRET`  = teks acak bebas (contoh: `kasrt-mawar-rahasia-2026`)
5. Klik **Deploy** → tunggu ± 2 menit → selesai!

### Langkah 3 — Buka website
- Vercel memberi URL: `https://kas-rt-002.vercel.app` (bisa custom domain)
- Saat pertama dibuka, sistem **auto-bootstrap** membuat semua tabel + data awal
- Login: `admin` / `admin123` (Admin) atau `budi` / `warga123` (Warga)
- Domain milik Anda di Hostinger bisa diarahkan ke Vercel (menu Domains di
  Vercel → ikuti instruksi DNS)

## Alternatif Lain

| Platform | Cocok? | Catatan |
|----------|--------|---------|
| **Vercel** | ✅ Terbaik | Gratis, native Next.js, zero config |
| **Railway / Render** | ✅ Bisa | Node.js + PostgreSQL managed |
| **Hostinger VPS** | ✅ Bisa | Perlu setup manual: Node.js 22, PostgreSQL, `npm run build && npm start`, reverse proxy |
| Hosting web statis Hostinger (Git deploy) | ❌ Tidak bisa | Hanya file statis; tidak ada server Node.js/database |

## Setup di VPS (jika pilih Hostinger VPS)

```bash
# 1. Install Node.js 22 dan PostgreSQL
# 2. Buat database: createdb kas_rt
# 3. Clone repo lalu:
npm install
echo 'DATABASE_URL=postgresql://user:pass@localhost:5432/kas_rt' > .env
echo 'AUTH_SECRET=teks-acak-anda' >> .env
npm run build
npm start   # jalan di port 3000, arahkan Nginx/Apache ke sini
```

## Akun Default (dibuat otomatis oleh auto-bootstrap)

| Role | Username | Password |
|------|----------|----------|
| Admin RT | `admin` | `admin123` |
| Warga | `budi` | `warga123` |

> Segera ganti password akun demo setelah website live.

## Troubleshooting

| Gejala | Solusi |
|--------|--------|
| `Output directory "dist" not found` | Hosting statis — pindah ke Vercel/VPS (lihat atas) |
| Login gagal: "Database tidak terjangkau" | `DATABASE_URL` belum diset / salah — periksa environment variables |
| Username/password salah padahal benar | Buka halaman utama dulu (memicu auto-bootstrap), lalu login |
