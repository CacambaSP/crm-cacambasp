// Service worker do Portal do Fornecedor - CaçambaSP (v3)
// A v1 registrou com escopo "/" (o site inteiro) por engano, afetando o CRM principal.
// Este arquivo verifica o proprio escopo: se for o site inteiro, se autodesinstala.
// Se for so o portal do fornecedor (escopo correto), funciona normalmente.

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const escopoSiteInteiro = self.location.origin + '/';
    if (self.registration.scope === escopoSiteInteiro) {
      // registro antigo e largo demais - remove e forca as paginas a recarregar
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach((client) => client.navigate(client.url));
    } else {
      await self.clients.claim();
    }
  })());
});

self.addEventListener('fetch', (event) => {
  const escopoSiteInteiro = self.location.origin + '/';
  if (self.registration.scope === escopoSiteInteiro) return; // nao intercepta nada nesse caso
  event.respondWith(fetch(event.request).catch(() => new Response('Offline', { status: 503 })));
});
