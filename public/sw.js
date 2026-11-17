const CACHE_NAME = "resonance-v2";

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
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({ type: "window" }))
      .then((clients) =>
        Promise.all(
          clients.map((client) => {
            // Force any page controlled by an older service worker to reload,
            // so users are never stuck on a stale shell referencing dead assets.
            if (typeof client.navigate === "function") {
              return client.navigate(client.url).catch(() => client.postMessage({ type: "SW_UPDATED" }));
            }
            return client.postMessage({ type: "SW_UPDATED" });
          })
        )
      )
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and cross-origin requests.
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // Never let the service worker intercept its own script (would block updates).
  if (url.pathname === "/sw.js") return;

  // Navigation requests: network-first, cache as we go.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(() => caches.match("/index.html").then((r) => r || fetch(request)))
    );
    return;
  }

  // Static assets: network-first, cache as we go. Never cache an HTML
  // response for a non-HTML request (that's the SPA fallback leaking in).
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.ok) {
          const contentType = (networkResponse.headers.get("content-type") || "").toLowerCase();
          const isAsset = /\.(js|css|png|jpg|jpeg|gif|svg|webp|woff2?|ttf|ico|json|webmanifest)$/i.test(url.pathname);
          const looksLikeHtml = contentType.includes("text/html");
          if (!(isAsset && looksLikeHtml)) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
        }
        return networkResponse;
      })
      .catch(() =>
        caches.match(request).then((cached) => cached || new Response("", { status: 404, statusText: "Not Found" }))
      )
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
