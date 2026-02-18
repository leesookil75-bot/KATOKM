const CACHE_NAME = 'katalk-attendance-v1.3.2';

self.addEventListener('install', (event) => {
    // console.log('Service Worker installed');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    // console.log('Service Worker activated');
    event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
    if (!event.data) return;

    const data = event.data.json();
    const options = {
        body: data.body,
        icon: '/icon.png',
        badge: '/icon.png',
        vibrate: data.vibrate || [100, 50, 100],
        data: data.data,
        actions: [
            { action: 'open', title: '앱 열기' }
        ],
        // Sound is browser dependent, usually browser uses default sound if not specified
        // Some browsers allow 'sound' property but it's not widely supported
        // We ensure vibration is there for tactile feedback
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow('/')
    );
});
