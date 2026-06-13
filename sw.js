// PaCs-Chat · Service Worker (macht die App installierbar + lädt das Gerüst schnell)
const CACHE = "pacs-chat-v2";
const SCHALE = [
  "./", "./index.html", "./stil.css",
  "./logo.png", "./muenze.png",
  "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png",
  "./manifest.webmanifest"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SCHALE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return; // Supabase/CDN immer aus dem Netz

  const istSeite = e.request.mode === "navigate" || url.pathname.endsWith("/") || url.pathname.endsWith(".html");
  if (istSeite) {
    // Seite: erst Netz (immer aktuell), sonst Cache (offline)
    e.respondWith(
      fetch(e.request).then(res => { const c = res.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); return res; })
        .catch(() => caches.match(e.request).then(h => h || caches.match("./index.html")))
    );
  } else {
    // Gerüst-Dateien: erst Cache (schnell), sonst Netz
    e.respondWith(
      caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
        const c = res.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); return res;
      }))
    );
  }
});
