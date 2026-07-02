// Escudo do Mestre — Service Worker
//
// Cache-first para o app shell e os dados das aventuras, com atualização em
// segundo plano (stale-while-revalidate). Alinhado ao princípio "offline-first"
// do design system: depois da primeira visita, o app deve abrir instantaneamente
// mesmo sem rede (uso típico: mesa de RPG com wifi ruim ou inexistente).

'use strict';

const CACHE_VERSION = 'v4';
const CACHE_NAME = 'escudo-do-mestre-' + CACHE_VERSION;

const CORE_ASSETS = [
  './',
  'index.html',
  'aventura.html',
  'manifest.json',
  'assets/css/tailwind.css',
  'assets/css/styles.css',
  'assets/js/utils.js',
  'assets/js/renderers-core.js',
  'assets/js/renderers-bestiario.js',
  'assets/js/renderers-npcs-itens.js',
  'assets/js/renderers-ganchos-missoes.js',
  'assets/js/renderers-locais.js',
  'assets/js/renderers-condicoes-eventos.js',
  'assets/js/renderers-busca.js',
  'assets/js/app.js',
  'assets/favicon.svg',
  'assets/favicon-32.png',
  'assets/apple-touch-icon.png',
  'data/aventuras.json',
  'data/condicoes.json',
  'data/eventos-estrada.json',
  'data/aventuras/dragao-espiral-gelo.json',
  'data/aventuras/mina-perdida-phandelver.json',
  'data/aventuras/maldicao-de-strahd.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Navegações chegam com query string (ex.: aventura.html?id=...), mas o
  // cache guarda a URL sem query — sem ignoreSearch o match falha e o app
  // quebra offline justamente na página da aventura.
  event.respondWith(
    caches.match(req, { ignoreSearch: req.mode === 'navigate' }).then((cached) => {
      const atualizando = fetch(req)
        .then((resp) => {
          if (resp && resp.ok) {
            caches.open(CACHE_NAME)
              .then((cache) => cache.put(req, resp.clone()))
              .catch(() => {});
          }
          return resp;
        })
        .catch(() => cached);
      // Cache-first: resposta instantânea se já em cache; a rede só atualiza
      // o cache em segundo plano para a próxima visita.
      return cached || atualizando;
    })
  );
});
