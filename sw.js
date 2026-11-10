// Offline support: the app keeps working without internet.
const CACHE = "daily-exercises-v5";
const ASSETS = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "apple-touch-icon.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    if (req.mode === "navigate") {
      // newest app when online, saved app when offline
      e.respondWith(fetch(new Request(req.url, { cache: "no-cache", credentials: "same-origin" }))
        .then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put("index.html", copy)); return res; })
        .catch(() => caches.match("index.html")));
      return;
    }
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req)));
  } else if (url.hostname.endsWith("googleapis.com") || url.hostname.endsWith("gstatic.com")) {
    e.respondWith(caches.open(CACHE).then((c) => c.match(req).then((hit) => hit ||
      fetch(req).then((res) => { c.put(req, res.clone()); return res; }))));
  }
});
