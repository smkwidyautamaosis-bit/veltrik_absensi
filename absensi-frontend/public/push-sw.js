// Listener untuk menerima push notification
self.addEventListener('push', function (event) {
  if (event.data) {
    try {
      const data = event.data.json();
      const options = {
        body: data.body,
        icon: data.icon || '/logo.png',
        badge: '/logo.png',
        data: data.data, // Berisi URL dll
      };

      event.waitUntil(self.registration.showNotification(data.title, options));
    } catch (e) {
      console.error('Error parsing push data', e);
    }
  }
});

// Listener ketika notifikasi diklik
self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(clients.openWindow(event.notification.data.url));
  } else {
    event.waitUntil(clients.openWindow('/'));
  }
});
