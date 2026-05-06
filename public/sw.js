// Lightweight service worker to satisfy PWA requirements without heavy caching.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // Allow the network to handle all fetches to stay bandwidth-friendly.
});
