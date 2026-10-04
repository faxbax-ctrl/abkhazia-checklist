/* «Соберись!» — service worker (офлайн) */
const CACHE = 'abkhazia-v18';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png'
];
/* Firebase SDK (версия зафиксирована в index.html — файлы по этому адресу не меняются).
   Без них приложение не откроется офлайн: на них держится вход. */
const SDK_PREFIX = 'https://www.gstatic.com/firebasejs/';
const SDK = ['firebase-app.js', 'firebase-auth.js', 'firebase-firestore.js']
  .map(f => SDK_PREFIX + '10.12.0/' + f);

self.addEventListener('install', e => {
  /* cache:'reload' — мимо обычного кэша браузера: GitHub Pages отдаёт файлы с max-age=600,
     и без этого в новый кэш мог попасть старый index.html */
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS.map(u => new Request(u, {cache: 'reload'}))).then(() =>
    /* SDK — по возможности: если не скачался, установка всё равно проходит */
    Promise.all(SDK.map(u => fetch(u).then(r => r.ok && c.put(u, r)).catch(() => {})))
  )).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const own = url.origin === location.origin;
  /* Кэшируем только свои файлы и Firebase SDK: запросы к API Firebase не трогаем,
     иначе кэш растёт бесконечно, а офлайн-ошибка API подменилась бы страницей */
  if (!own && !req.url.startsWith(SDK_PREFIX)) return;
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      /* в кэш — только удачные ответы и без ?v=… (иначе кэш пухнет от каждой «пробивки») */
      if (res.ok && !(own && url.search)) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      }
      return res;
    }).catch(() => req.mode === 'navigate' ? caches.match('./index.html') : Response.error()))
  );
});
