// service-worker.js — caches the app shell so it opens offline.
const CACHE = "noor-eggs-v4";
const SHELL = [
  "./", "./index.html",
  "./css/base.css", "./css/components.css", "./css/views.css",
  "./js/app.js", "./js/state.js", "./js/utils.js", "./js/calc.js",
  "./js/backend.js", "./js/ui.js", "./js/router.js",
  "./js/views/today.js", "./js/views/sheet.js", "./js/views/dues.js",
  "./js/views/records.js", "./js/views/more.js", "./js/views/customers.js",
  "./assets/logo.png", "./assets/icon-192.png", "./assets/icon-512.png",
  "./manifest.webmanifest"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const url = e.request.url;
  // cache-first for our own assets, network fallback
  if (e.request.method === "GET" && url.startsWith(self.location.origin)) {
    e.respondWith(
      caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy)).catch(()=>{});
        return res;
      }).catch(() => caches.match("./index.html")))
    );
  }
});
