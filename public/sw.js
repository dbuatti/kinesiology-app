const CACHE_NAME = "resonance-v1";

const PRECACHE = ["/", "/index.html", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and cross-origin requests.
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // Navigation requests: serve the cached SPA shell.
  if (request.mode === "navigate") {
    event.respondWith(caches.match("/index.html").then((r) => r || fetch(request)));
    return;
  }

  // Static assets: cache as we go, then serve from cache.
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
