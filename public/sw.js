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

    // Broadcast for real-time in-app popup
    try {
        const channel = new BroadcastChannel('push-notification');
        channel.postMessage(data);
    } catch (e) {
        console.error('Broadcast failed', e);
    }

    const options = {
        body: data.body,
        icon: '/icon.png',
        badge: '/icon.png',
        vibrate: data.vibrate || [100, 50, 100],
        data: data.data,
        actions: [
            { action: 'open', title: '앱 열기' }
        ],
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
