const CACHE_NAME = "inteliq-v10";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // Don't intercept: API calls, cross-origin, non-GET, chrome-extension
  if (url.pathname.startsWith("/api/")) return;
  if (url.origin !== self.location.origin) return;
  if (e.request.method !== "GET") return;
  if (url.protocol === "chrome-extension:") return;

  e.respondWith(
    fetch(e.request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        }
        return response;
      })
      .catch(() => {
        return caches.match(e.request).then(cached => {
          // Return cached response or a simple offline fallback
          return cached || new Response("Offline", { status: 503, statusText: "Service Unavailable" });
        });
      })
  );
});
