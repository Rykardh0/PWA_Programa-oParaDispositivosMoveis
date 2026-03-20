// sw.js — O SERVICE WORKER do mini-app PWA 
  
var CACHE_NAME = 'meu-app-v3'; 
  
var ARQUIVOS_PARA_CACHEAR = [ 
  './', 
  './index.html', 
  './style.css', 
  './app.js', 
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './offline.html',
]; 
  
// ═══ EVENTO 1: install ═══ 
self.addEventListener('install', function (evento) { 
  console.log('[SW] install — enchendo a geladeira...'); 
  evento.waitUntil( 
    caches.open(CACHE_NAME) 
      .then(function (cache) { 
        console.log('[SW] Adicionando arquivos...'); 
        return cache.addAll(ARQUIVOS_PARA_CACHEAR); 
      }) 
      .then(function () { 
        console.log('[SW] ✅ Todos cacheados!'); 
      }) 
  ); 
}); 
  
// ═══ EVENTO 2: activate ═══ 
self.addEventListener('activate', function (evento) { 
  console.log('[SW] activate — limpando antigos...'); 
  evento.waitUntil( 
    caches.keys().then(function (nomes) { 
      return Promise.all( 
        nomes.map(function (nome) { 
          if (nome !== CACHE_NAME) {
             console.log('[SW] Deletando:', nome); 
            return caches.delete(nome); 
          } 
        }) 
      ); 
    }) 
  ); 
}); 
  
// ═══ EVENTO 3: fetch (Cache First) ═══ 
// Cache First + fallback offline.html 
self.addEventListener('fetch', function (evento) { 
evento.respondWith( 
caches.match(evento.request) 
.then(function (respostaDoCache) { 
if (respostaDoCache) { return respostaDoCache; } 
return fetch(evento.request) 
.catch(function () { 
if (evento.request.mode === 'navigate') { 
return caches.match('./offline.html'); 
} 
}); 
}) 
  ); 
}); 