const CACHE_NAME = "foodbox-shell-v1";
const PRECACHE_URLS = ["/icons/icon-192.png", "/icons/icon-512.png", "/logo.svg"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

// Faqat statik fayllar (JS/CSS bundle, ikonkalar) keshlanadi. Mahsulot va
// narxlar sahifasi (HTML/navigatsiya so'rovlari) doim serverdan yangi
// holatda olinadi — admin panelda qilingan o'zgarish darhol ko'rinishi kerak.
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const isStaticAsset = url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/");
  if (!isStaticAsset) return;

  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
    )
  );
});
