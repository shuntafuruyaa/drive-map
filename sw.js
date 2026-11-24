/* ドライブマップ Service Worker
   - アプリ本体：オフラインでも起動できるよう保存
   - 地図タイル：一度見た場所は自動で保存（上限あり）。「この範囲を保存」した分は消さずに保持
   - 天気はページ側が取得時刻つきで保存するので、ここでは扱わない */
const VERSION = '1.3.1';
const SHELL = 'dm-shell-' + VERSION;
const TILES = 'dm-tiles-v1';      // 自動保存（古いものから削除）
const AREA = 'dm-area-v1';        // 「この範囲を保存」した地図（削除しない）
const RUNTIME = 'dm-runtime-v1';  // フォント・天気
const MAX_AUTO_TILES = 4000;
const SHELL_FILES = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];
const TILE_HOSTS = ['cyberjapandata.gsi.go.jp', 'tile.openstreetmap.org'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(SHELL_FILES.map((u) => new Request(u, { cache: 'reload' })))));
  // 初回は即有効化。更新時はページ側の「更新する」で切り替える
  if (!self.registration.active) self.skipWaiting();
});
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('dm-shell-') && k !== SHELL) await caches.delete(k);
    await self.clients.claim();
  })());
});
self.addEventListener('message', (e) => {
  if (e.data === 'skip-waiting') self.skipWaiting();
  if (e.data === 'version' && e.source) e.source.postMessage({ type: 'version', version: VERSION });
});

let putCount = 0;
async function trimTiles() {
  const c = await caches.open(TILES); const keys = await c.keys();
  const over = keys.length - MAX_AUTO_TILES;
  for (let i = 0; i < over; i++) await c.delete(keys[i]);
}
async function tileFirst(req) {
  const hit = await caches.match(req.url);
  if (hit) return hit;
  try {
    const res = await fetch(req);
    if (res.ok && res.type !== 'opaque') {
      const c = await caches.open(TILES); await c.put(req.url, res.clone());
      if (++putCount % 60 === 0) trimTiles();
    }
    return res;
  } catch (err) {
    return new Response('', { status: 504, statusText: 'offline' });
  }
}
async function staleWhileRevalidate(req) {
  const c = await caches.open(RUNTIME);
  const hit = await c.match(req);
  const net = fetch(req).then((res) => { if (res && (res.ok || res.type === 'opaque')) c.put(req, res.clone()); return res; }).catch(() => null);
  return hit || (await net) || new Response('', { status: 504 });
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    if (req.mode === 'navigate') {
      e.respondWith((async () => {
        try {
          const res = await Promise.race([fetch(req), new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 5000))]);
          if (res.ok) (await caches.open(SHELL)).put('./index.html', res.clone());
          return res;
        } catch (err) {
          return (await caches.match('./index.html')) || (await caches.match('./')) || new Response('オフラインです', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
        }
      })());
      return;
    }
    e.respondWith(caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req)));
    return;
  }
  if (TILE_HOSTS.includes(url.hostname)) { e.respondWith(tileFirst(req)); return; }
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') { e.respondWith(staleWhileRevalidate(req)); return; }
  // それ以外（地名検索・ルート計算・Firebase など）は通常どおりネットへ
});
