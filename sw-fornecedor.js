// Service worker minimo do Portal do Fornecedor - CaçambaSP
// So existe pra satisfazer o requisito de instalabilidade do PWA.
// Nao faz cache agressivo pra sempre pegar dados atualizados do fornecedor.

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // passa direto pra rede - sem cache, o portal sempre precisa de dado fresco
  event.respondWith(fetch(event.request).catch(() => new Response('Offline', { status: 503 })));
});
