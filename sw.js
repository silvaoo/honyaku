// ===== ほんやくくん Service Worker =====
// 中身を更新したら、この番号を上げる（v1 → v2 …）
const CACHE = 'honyaku-v7';

// 保存しておくファイル
const FILES = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

// インストール時：ファイルを保存
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
});

// 有効化時：古い保存データを削除
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 読み込み時
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // 翻訳サーバーなど外部への通信は、そのまま通す（保存しない）
  if (url.origin !== location.origin) return;

  // ページ本体：ネット優先（更新がすぐ反映される）、圏外なら保存版
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // それ以外（アイコン等）：保存版優先
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
