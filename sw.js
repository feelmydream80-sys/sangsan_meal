const CACHE_NAME = 'sangsan-meal-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;700;900&family=Space+Mono:wght@400;700&display=swap',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js'
];

/* ── 설치: 정적 파일 캐시 ── */
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

/* ── 활성화: 이전 캐시 삭제 ── */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

/* ── 요청 처리 전략 ── */
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  /* NEIS API / allorigins 프록시 → 네트워크 우선, 실패시 캐시 */
  if (url.hostname.includes('neis.go.kr') || url.hostname.includes('allorigins.win') || url.hostname.includes('anthropic.com')) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          /* NEIS 응답은 짧게 캐시 (30분) */
          if (url.hostname.includes('allorigins.win')) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
          }
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  /* 구글 폰트 / CDN → 캐시 우선 */
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('jsdelivr.net') || url.hostname.includes('fonts.gstatic.com')) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          return res;
        });
      })
    );
    return;
  }

  /* 앱 셸 (HTML/JS/CSS) → 캐시 우선, 네트워크 폴백 */
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
