// ═══════════════════════════════════════════════
// PROJETO AV1 - Programação para Dispositivos Móveis
// Equipe: Ricardo Henrique de Souza Santana; Marina França e José Everton Almeida Santos Junior
// Matrícula: 2510138; 2020102 e 2310196
// App: Melhor App de Estudos do Mundo
// Data: 30/04/2026
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

// Função que monta o HTML dos dados na tela (AGORA COM FAVORITOS)
function mostrarDados(dados, fonte) {
  var container = document.getElementById('conteudo-api');

  // Pega a lista atual de favoritos para saber quais estão marcados
  var favoritos = carregarFavoritos();

  // Mostra de onde vieram os dados (ONLINE ou CACHE)
  var html = '<p style="color:#64748b;font-size:0.85rem;">'
    + '📡 Fonte: ' + fonte.toUpperCase() + '</p>';

  // Para cada item dos dados, cria um card COM botão de favoritar
  dados.forEach(function (item) {
    // Verifica se ESTE item está favoritado
    var ehFavorito = favoritos.indexOf(item.id) !== -1;

    // Escolhe o ícone: dourado se favorito, cinza se não
    var icone = ehFavorito ? '🌟' : '⭐';

    // Usa onclick inline para chamar nossa função toggleFavorito
    // Passamos o item.id (id do post) como parâmetro
    html += '<div style="background:#f1f5f9;'
      + 'padding:12px;margin:8px 0;border-radius:8px;'
      + 'display:flex;justify-content:space-between;'
      + 'align-items:flex-start;gap:12px;">'
      + '<div style="flex:1;">'
      + '<strong>' + item.title + '</strong>'
      + '<p style="color:#475569;font-size:0.9rem;">'
      + item.body.substring(0, 80) + '...</p>'
      + '</div>'
      + '<button onclick="toggleFavorito(' + item.id + ')" '
      + 'style="background:none;border:none;'
      + 'font-size:1.8rem;cursor:pointer;padding:0;" '
      + 'title="Favoritar">' + icone + '</button>'
      + '</div>';
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

// ═══ FAVORITOS COM LOCALSTORAGE ═══
// Guarda uma lista de IDs de posts favoritos no "caderninho"
// do navegador (localStorage). Persiste entre sessões.

// Chave usada no localStorage. Usem uma chave única do seu app!
var CHAVE_FAVORITOS = 'meuapp.favoritos';

// ── Função 1: carregar a lista de favoritos do localStorage ──
function carregarFavoritos() {
  // Tenta ler a chave. Pode retornar null se nunca foi salvo.
  var textoSalvo = localStorage.getItem(CHAVE_FAVORITOS);

  // Se não tem nada salvo, retorna array vazio
  if (!textoSalvo) {
    return [];
  }

  // Transforma o texto JSON de volta em array
  // try/catch protege contra dados corrompidos
  try {
    return JSON.parse(textoSalvo);
  } catch (erro) {
    console.log('[FAV] Dados corrompidos, resetando.');
    return [];
  }
}

// ── Função 2: salvar a lista de favoritos no localStorage ──
function salvarFavoritos(lista) {
  // Transforma o array em texto JSON antes de salvar
  localStorage.setItem(CHAVE_FAVORITOS, JSON.stringify(lista));
  console.log('[FAV] Salvos:', lista);
}

// ── Função 3: alternar (adicionar ou remover) um favorito ──
// Chamada quando o usuário clica na estrelinha ⭐
function toggleFavorito(id) {
  // Pega a lista atual
  var favoritos = carregarFavoritos();

  // Verifica se o ID já está na lista
  var posicao = favoritos.indexOf(id);

  if (posicao === -1) {
    // Não está → adiciona
    favoritos.push(id);
    console.log('[FAV] Adicionado:', id);
    notificar('⭐ Favoritado!', 'Post #' + id + ' salvo nos seus favoritos.');
  } else {
    // Já está → remove (splice corta 1 item na posição)
    favoritos.splice(posicao, 1);
    console.log('[FAV] Removido:', id);
  }

  // Salva a lista atualizada
  salvarFavoritos(favoritos);

  // Atualiza a tela: redesenha os cards (estrelas) e a seção de favoritos
  buscarDados();
  atualizarSecaoFavoritos();
}

// ── Função 4: atualizar a seção "Meus Favoritos" na tela ──
function atualizarSecaoFavoritos() {
  var container = document.getElementById('lista-favoritos');
  if (!container) return;

  var favoritos = carregarFavoritos();

  // Se a lista está vazia, mostra mensagem amigável
  if (favoritos.length === 0) {
    container.innerHTML =
      '<p style="color:#64748b;font-size:0.9rem;">'
      + 'Nenhum favorito ainda. '
      + 'Clique na ⭐ dos posts abaixo!</p>';
    return;
  }

  // Monta o HTML listando os IDs favoritados
  var html = '<p style="color:#64748b;font-size:0.85rem;">'
    + 'Você tem ' + favoritos.length + ' post(s) favorito(s):'
    + '</p>';

  favoritos.forEach(function (id) {
    html += '<div style="background:#fef3c7;'
      + 'padding:8px 12px;margin:6px 0;border-radius:6px;'
      + 'color:#78350f;font-size:0.9rem;">'
      + '⭐ Post #' + id + '</div>';
  });

  container.innerHTML = html;
}

// ── Conecta o botão "Limpar Favoritos" ──
var btnLimpar = document.getElementById('btn-limpar-favoritos');
if (btnLimpar) {
  btnLimpar.addEventListener('click', function () {
    // confirm() abre um popup de sim/não
    if (confirm('Apagar TODOS os favoritos?')) {
      // Apaga só a nossa chave (não mexe em outros dados)
      localStorage.removeItem(CHAVE_FAVORITOS);
      console.log('[FAV] Todos os favoritos apagados.');
      buscarDados();
      atualizarSecaoFavoritos();
    }
  });
}

// ── Ao abrir a página, já mostra a seção de favoritos ──
atualizarSecaoFavoritos();

// ═══ NOTIFICAÇÕES LOCAIS (Notification API) ═══
// Dispara notificações do sistema operacional.
// A preferência "notificações ligadas/desligadas" é guardada
// no localStorage — conectando com o que aprendemos no LAB 1.

// Chave para guardar a preferência do usuário
var CHAVE_NOTIF = 'meuapp.notificacoes';

// ── Função 1: verifica se o navegador suporta notificações ──
function suportaNotificacao() {
  // 'Notification' in window = existe a API Notification?
  return 'Notification' in window;
}

// ── Função 2: atualiza o texto de status na tela ──
function atualizarStatusNotif() {
  var elem = document.getElementById('status-notif');
  if (!elem) return;

  if (!suportaNotificacao()) {
    elem.textContent =
      '❌ Seu navegador não suporta notificações.';
    return;
  }

  // Notification.permission retorna:
  //   'default'  → ainda não pedimos permissão
  //   'granted'  → usuário permitiu
  //   'denied'   → usuário bloqueou (só desbloqueia manualmente)
  var perm = Notification.permission;

  // Lê a preferência salva no localStorage (se o usuário ligou/desligou)
  var ligada = localStorage.getItem(CHAVE_NOTIF) === 'sim';

  if (perm === 'denied') {
    elem.textContent =
      '🚫 Bloqueadas pelo navegador. '
      + 'Para reativar: cadeado ao lado da URL → Permissões.';
  } else if (perm === 'granted' && ligada) {
    elem.textContent = '✅ Notificações ATIVADAS.';
  } else if (perm === 'granted' && !ligada) {
    elem.textContent =
      '⏸️ Permissão concedida, mas você desligou no app.';
  } else {
    elem.textContent = '⏳ Ainda não ativadas. Clique no botão.';
  }
}

// ── Função 3: pede permissão ao usuário ──
function pedirPermissaoNotif() {
  if (!suportaNotificacao()) {
    alert('Seu navegador não suporta notificações.');
    return;
  }

  // requestPermission() retorna uma Promise com 'granted', 'denied' ou 'default'
  Notification.requestPermission().then(function (resultado) {
    console.log('[NOTIF] Permissão:', resultado);

    if (resultado === 'granted') {
      // Salva no localStorage que o usuário ligou as notificações
      localStorage.setItem(CHAVE_NOTIF, 'sim');
      // Manda uma notificação de boas-vindas para testar
      notificar('✅ Tudo certo!',
        'Notificações ativadas. Agora você será avisado.');
    } else {
      localStorage.setItem(CHAVE_NOTIF, 'nao');
    }
    atualizarStatusNotif();
  });
}

// ── Função 4: dispara uma notificação ──
// Esta é a função que outras partes do código vão chamar
function notificar(titulo, corpo) {
  // Verifica suporte
  if (!suportaNotificacao()) return;

  // Verifica permissão
  if (Notification.permission !== 'granted') return;

  // Verifica a preferência do usuário (ele pode ter desligado)
  if (localStorage.getItem(CHAVE_NOTIF) !== 'sim') return;

  // Cria a notificação. Aparece na barra do sistema operacional!
  // Opções comuns: body (texto), icon (imagem), tag (agrupa notifs)
  var notif = new Notification(titulo, {
    body: corpo,
    icon: './icons/icon-192.png', // Se não tiverem, remova esta linha
    tag: 'meuapp-notif' // Notifs com mesma tag substituem a anterior
  });

  // Quando o usuário clica na notificação: traz a janela pra frente
  notif.onclick = function () {
    window.focus();
    notif.close();
  };

  console.log('[NOTIF] Enviada:', titulo);
}

// ── Conecta os botões ──
var btnAtivar = document.getElementById('btn-ativar-notif');
if (btnAtivar) {
  btnAtivar.addEventListener('click', pedirPermissaoNotif);
}

var btnTestar = document.getElementById('btn-testar-notif');
if (btnTestar) {
  btnTestar.addEventListener('click', function () {
    notificar('🧪 Notificação de teste',
      'Se você está vendo isso, tá funcionando!');
  });
}

// Atualiza o status assim que a página carrega
atualizarStatusNotif();