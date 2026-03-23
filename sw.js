// CaçambaSP Service Worker v2.0 — OneSignal
importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');

const CACHE = 'cacambasp-v2';

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(clients.claim());
});

// Recebe push do servidor
self.addEventListener('push', e => {
  let data = { title: 'CaçambaSP', body: 'Nova atualização', icon: '/icon-192.png', badge: '/icon-192.png' };
  try { data = { ...data, ...e.data.json() }; } catch(err) {}
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/icon-192.png',
      badge: data.badge || '/icon-192.png',
      tag: data.tag || 'cacambasp',
      renotify: true,
      data: data.url || '/',
      actions: data.actions || []
    })
  );
});

// Click na notificação abre o app
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = e.notification.data || '/';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if (c.url.includes(self.location.origin) && 'focus' in c) return c.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

// Mensagem interna — notificação local (sem servidor push)
self.addEventListener('message', e => {
  if (e.data?.type === 'NOTIFY') {
    const { title, body, tag, url } = e.data;
    self.registration.showNotification(title || 'CaçambaSP', {
      body: body || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: tag || 'cacambasp-local',
      renotify: true,
      data: url || '/'
    });
  }
});
