// ═══════════════════════════════════════════════
// PROJETO AV1 - Programação para Dispositivos Móveis
// Equipe: Ricardo Henrique de Souza Santana; [Nome Completo 2] e [Nome Completo 3]
// Matrícula: 2510138; [Matrícula2] e [Matrícula3]
// App: Melhor App de Estudos do Mundo
// Data: 27/03/2026
// ═══════════════════════════════════════════════
// // sw.js — O SERVICE WORKER do mini-app PWA 
  
var CACHE_NAME = 'melhorapp-v5'; 
  
var ARQUIVOS_PARA_CACHEAR = [ 
  './', 
  './index.html', 
  './style.css', 
  './app.js', 
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './offline.html',
  './cache-status.html'
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
  
// ═══ EVENTO 3: fetch (Estratégia Híbrida) ═══
// Para arquivos estáticos (CSS, JS, HTML) → Cache First, Para dados de API → Stale While Revalidate
self.addEventListener('fetch', function (evento) {
var url = evento.request.url;
// Verifica se a requisição é para a API (olha se a URL contém 'jsonplaceholder')
if (url.indexOf('jsonplaceholder') !== -1) {
// ── STALE WHILE REVALIDATE para APIs ──
// 1) Serve do cache imediatamente (rápido!)
// 2) Em paralelo, busca versão nova na rede
// 3) Atualiza o cache com a versão nova
evento.respondWith(
caches.open(CACHE_NAME).then(function (cache) {
return cache.match(evento.request)
.then(function (respostaCache) {
// Tenta buscar da rede (em paralelo)
var buscaRede = fetch(evento.request)
.then(function (respostaRede) {
// Guarda cópia nova no cache
// .clone() é necessário porque a resposta
// só pode ser lida UMA vez - precisamos de
// uma cópia para o cache e outra para o app
cache.put(evento.request,
respostaRede.clone());
console.log('[SW] API atualizada no cache');
return respostaRede;
})
.catch(function () {
// Sem internet - usa o que tem no cache
console.log(
'[SW] API: sem rede, usando cache');
return respostaCache;
});
// Se tem no cache, serve imediatamente
// Se não tem, espera a rede responder
return respostaCache || buscaRede;
});
})
);
} else {
// ── CACHE FIRST para arquivos estáticos ──
// (mesmo comportamento da Aula 04)
evento.respondWith(
caches.match(evento.request)
.then(function (respostaDoCache) {
if (respostaDoCache) {
console.log('[SW] CACHE:', url);
return respostaDoCache;
}
console.log('[SW] REDE:', url);
return fetch(evento.request)
.catch(function () {
// Se é uma navegação e não tem cache,
// mostra a página offline.html
if (evento.request.mode === 'navigate') {
return caches.match('./offline.html');
}
});
})
);
}
});

