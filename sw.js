self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open('fox-store').then((cache) => cache.addAll([
            '/white-cane-app/sytle.css',
            '/white-cane-app/index.js',
            '/white-cane-app/animation_erase.js',
            '/white-cane-app/bluetooth.js',
            '/white-cane-app/chart.js',
            '/white-cane-app/csv_save.js',
            '/white-cane-app/keep_wake.js',
            '/white-cane-app/mouse_event.js',
            '/white-cane-app/voice.js',
            '/white-cane-app/utils.js',
        ])),
    );
});

self.addEventListener('fetch', (e) => {
    console.log(e.request.url);
    e.respondWith(
        caches.match(e.request).then((response) => response || fetch(e.request)),
    );
});