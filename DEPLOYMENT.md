# Deployment Cloudflare Pages — KAS RT

Versi source: `2026.09-static-dist-v5`

## Pengaturan Cloudflare

- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: `/`
- Node.js: `22`

Aplikasi ini static export dan tidak membutuhkan `DATABASE_URL`.

## Tanda repository sudah benar

Log build harus menampilkan:

`rm -rf dist .next && STATIC_EXPORT=1 next build && next build`

Cloudflare harus menemukan `wrangler.json` dengan `pages_build_output_dir: dist`.
Daftar route hanya berisi `/`, `/dashboard`, `/login`, `/api/health`, dan `/api/version`.

Jika log masih hanya menampilkan `> next build`, 27 route, middleware, `/api/warga`, atau `/api/users`, repository masih berisi source lama. Hapus seluruh file lama lalu upload isi paket terbaru sekaligus.
