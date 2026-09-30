/* =============================================================================
   sw.js — Service Worker ของ HRM Trouble Report
   -----------------------------------------------------------------------------
   จำเป็นสำหรับให้ Android ติดตั้งเป็นแอปจริง (WebAPK) ไม่ใช่แค่ทางลัดเปิดเบราว์เซอร์
   และทำให้เปิดใช้งานแบบออฟไลน์ได้

   สำคัญ: ทุกครั้งที่อัปไฟล์ใหม่ขึ้น GitHub ให้เปลี่ยนเลข CACHE ด้านล่าง
          ไม่งั้นเครื่องที่ติดตั้งไปแล้วจะยังเห็นของเก่า
============================================================================= */
const CACHE = 'hrm-v7';
const CORE = [
  './', './index.html', './manifest.json',
  './icon-192.png', './icon-512.png', './icon-maskable-512.png',
  './apple-touch-icon.png', './favicon-64.png',
  './sc-report.png', './sc-stop.png', './sc-qic.png', './sc-backup.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.allSettled(CORE.map(u => c.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', e => { if (e.data === 'skipWaiting') self.skipWaiting(); });

/* หน้าเว็บ: เอาของใหม่ก่อน เน็ตล่มค่อยใช้ของในแคช
   ไฟล์อื่น (ไอคอน ฟอนต์): ใช้แคชก่อนเพื่อความเร็ว */
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html').then(r => r || caches.match('./')))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok && (req.url.startsWith(self.location.origin) || req.url.includes('fonts.g'))) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
      }
      return res;
    }).catch(() => hit))
  );
});
