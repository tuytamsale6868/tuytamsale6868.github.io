// Tùy Tâm Sales – lưu sẵn phần mềm trên máy để dùng khi không có mạng.
// Khi cập nhật phần mềm: đổi số phiên bản dưới đây.
const CACHE = 'tuytam-v2';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];
const OWN = new Set(FILES.map(f => new URL(f, self.location).pathname));

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('tuytam-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Chỉ phục vụ các tệp của app bán hàng; các app khác cùng trang (như /lop/) tự lo phần của mình.
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin || !OWN.has(url.pathname)) return;
  const key = req.mode === 'navigate' ? './index.html' : req;
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(key, {ignoreSearch: true});
    const net = fetch(req).then(r => { if (r && r.ok) c.put(key, r.clone()); return r; }).catch(() => null);
    return hit || (await net) || new Response('Không có mạng', {status: 503});
  }));
});
