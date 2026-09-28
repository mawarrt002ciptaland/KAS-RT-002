/* Service worker — Sistem Informasi RT 002 (offline fallback, no API cache) */
const CACHE = "rt002-v3"; // Versi 3: paksa update di semua HP
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll([OFFLINE_URL, "/", "/manifest.json", "/icon-192.png", "/icon-512.png"]).catch(() => c.add(OFFLINE_URL).catch(() => {}))));
  self.skipWaiting(); // Paksa SW baru langsung aktif
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim(); // Paksa SW baru kontrol semua tab
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  
  // FIX: JANGAN pernah cache request ke /api/*, selalu ambil dari server
  if (req.url.includes('/api/')) {
    e.respondWith(fetch(req).catch(() => caches.match(req)));
    return;
  }

  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res; }).catch(() => caches.match(req).then((r) => r || caches.match(OFFLINE_URL))));
    return;
  }

  // Untuk aset statis (CSS, JS, gambar), pakai cache dulu supaya cepat
  if (new URL(req.url).origin === self.location.origin) {
    e.respondWith(caches.match(req).then((cached) => cached || fetch(req).then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res; }).catch(() => cached)));
  }
});
