/* Service worker — Sistem Informasi RT 002 (NO API cache, force update) */
const CACHE = "rt002-v4-force";
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => 
      c.addAll([OFFLINE_URL, "/", "/manifest.json", "/icon-192.png", "/icon-512.png"])
        .catch(() => c.add(OFFLINE_URL).catch(() => {}))
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => {
          console.log("Deleting old cache:", k);
          return caches.delete(k);
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  
  if (req.url.includes('/api/')) {
    e.respondWith(
      fetch(req).then((res) => {
        return res;
      }).catch(() => {
        return caches.match(req).then((r) => r || new Response('{"error":"Offline"}', { headers: { 'Content-Type': 'application/json' } }));
      })
    );
    return;
  }

  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req).then((r) => r || caches.match(OFFLINE_URL)))
    );
    return;
  }

  if (new URL(req.url).origin === self.location.origin) {
    e.respondWith(
      caches.match(req).then((cached) => 
        cached || fetch(req).then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        }).catch(() => cached)
      )
    );
  }
});

self.addEventListener("message", (e) => {
  if (e.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
