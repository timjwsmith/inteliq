const CACHE_NAME = "inteliq-v3";

// Install: skip waiting to activate immediately
self.addEventListener("install", () => {
  self.skipWaiting();
});

// Activate: clean ALL old caches, claim clients immediately
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: always network-first, cache as offline fallback only
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // Never intercept API calls
  if (url.pathname.startsWith("/api/") || url.pathname === "/health") {
    return;
  }

  // Network first, cache as fallback
  e.respondWith(
    fetch(e.request)
      .then((response) => {
        if (response.ok && e.request.method === "GET") {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(e.request))
  );
});
