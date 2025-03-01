self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open('epic-notes-v1').then((cache) => {
            return cache.addAll([
                '/epic-notes/',
                '/epic-notes/index.html',
                '/epic-notes/styles.css',
                '/epic-notes/app.js'
            ]);
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
