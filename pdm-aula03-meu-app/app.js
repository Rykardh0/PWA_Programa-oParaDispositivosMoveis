// ═══════════════════════════════════════════════
// PROJETO AV1 - Programação para Dispositivos Móveis
// Equipe: Ricardo Henrique de Souza Santana; [Nome Completo 2] e [Nome Completo 3]
// Matrícula: 2510138; [Matrícula2] e [Matrícula3]
// App: Melhor App de Estudos do Mundo
// Data: 27/03/2026
// ═══════════════════════════════════════════════
// app.js — Registra o Service Worker no navegador

if ('serviceWorker' in navigator) { 

window.addEventListener('load', function () { 

navigator.serviceWorker.register('./sw.js') 

.then(function (registration) { 
console.log('✅ Service Worker registrado com sucesso!'); 
console.log(' Escopo:', registration.scope); 
}) 

.catch(function (erro) { 
console.log('❌ Falha ao registrar o SW:', erro); 
}); 

  }); 

} else { 
console.log('⚠️ Este navegador não suporta SW.'); 
}

// ═══ BANNER DE STATUS ONLINE / OFFLINE ═══ 
function atualizarStatusConexao() { 
  var banner = document.getElementById('status-conexao'); 
  if (!banner) { 
    banner = document.createElement('div'); 
    banner.id = 'status-conexao'; 
    banner.style.cssText = 
      'text-align:center;padding:8px 16px;font-size:14px;' + 
      'font-weight:600;font-family:system-ui,sans-serif;' + 
      'transition:all 0.3s;position:sticky;top:0;z-index:9999;'; 
    document.body.insertBefore(banner, document.body.firstChild); 
  } 
  if (navigator.onLine) { 
    banner.textContent = '🟢 Você está online'; 
    banner.style.background = '#065f46'; 
    banner.style.color = '#bbf7d0'; 
  } else { 
    banner.textContent = '🔴 Você está offline — usando cache'; 
    banner.style.background = '#7c2d12'; 
    banner.style.color = '#fed7aa'; 
  } 
} 
atualizarStatusConexao(); 
window.addEventListener('online', atualizarStatusConexao); 
window.addEventListener('offline', atualizarStatusConexao);

// ═══ BUSCA DE DADOS DA API COM CACHE ═══
// Este código busca dados de uma API na internet
// Se estiver offline, tenta mostrar os dados salvos no cache
// Endereço da API que vamos usar (pública e gratuita)
var API_URL = 'https://jsonplaceholder.typicode.com/posts?_limit=5';
// Função principal: busca os dados da API
function buscarDados() {
// Pega o elemento da página onde vamos mostrar os dados
var container = document.getElementById('conteudo-api');
if (!container) return; // Se não encontrou, para aqui
// Mostra mensagem de 'carregando' enquanto busca
container.innerHTML = '<p>⏳ Buscando dados...</p>';
// fetch() = função que busca dados na internet
// É como digitar a URL no navegador, mas via código
fetch(API_URL)
.then(function (resposta) {
// Converte a resposta para formato JSON (objeto JS)
return resposta.json();
})
.then(function (dados) {
// Deu certo! Mostra os dados com fonte 'online'
mostrarDados(dados, 'online');
})
.catch(function () {
// Deu erro (provavelmente offline)
// Tenta buscar do cache do Service Worker
caches.match(API_URL).then(function (respCache) {
if (respCache) {
// Tem dados no cache! Mostra com fonte 'cache'
respCache.json().then(function (dados) {
mostrarDados(dados, 'cache');
});
} else {
// Não tem nada no cache
container.innerHTML =
'<p>❌ Sem dados disponíveis offline.</p>';
}
});
});
}
// Função que monta o HTML dos dados na tela
function mostrarDados(dados, fonte) {
var container = document.getElementById('conteudo-api');
// Mostra de onde vieram os dados (ONLINE ou CACHE)
var html = '<p style="color:#64748b;font-size:0.85rem;">'
+ '📡 Fonte: ' + fonte.toUpperCase() + '</p>';
// Para cada item dos dados, cria um 'card'
dados.forEach(function (item) {
html += '<div style="background:#f1f5f9;'
+ 'padding:12px;margin:8px 0;border-radius:8px;">'
+ '<strong>' + item.title + '</strong>'
+ '<p style="color:#475569;font-size:0.9rem;">'
+ item.body.substring(0, 80) + '...</p></div>';
});
// Salva a data/hora da última atualização online
if (fonte === 'online') {
localStorage.setItem('ultimaAtualizacao',
new Date().toLocaleString('pt-BR'));
}
// Mostra a data/hora da última atualização
var ultima = localStorage.getItem('ultimaAtualizacao');
if (ultima) {
html += '<p style="color:#94a3b8;font-size:0.8rem;'
+ 'margin-top:8px;">⏰ Última atualização: '
+ ultima + '</p>';
}
// Coloca tudo na tela
container.innerHTML = html;
}
// Busca dados ao abrir a página
buscarDados();
// Busca dados ao clicar no botão 'Atualizar'
var btnAtualizar = document.getElementById('btn-atualizar');
if (btnAtualizar) {
btnAtualizar.addEventListener('click', buscarDados);
}