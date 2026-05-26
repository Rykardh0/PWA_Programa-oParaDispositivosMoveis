// ═══════════════════════════════════════════════
// PROJETO AV1 - Programação para Dispositivos Móveis
// AULA 07 - CRUD Completo + Web Share API
// Equipe: Ricardo Henrique de Souza Santana; Marina França e José Everton Almeida Santos Junior
// Matrícula: 2510138; 2020102 e 2310196
// App: Melhor App de Estudos do Mundo
// Data: 21/05/2026
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

// ═══ CRUD - GERENCIAMENTO DE ITENS DO USUÁRIO ═══
// Permite ao usuário criar/ler/atualizar/excluir itens próprios.
// Tudo persiste no localStorage entre sessões.

// Chave usada no localStorage. Troquem "meuapp" pelo nome do app!
var CHAVE_ITENS = 'melhorapp.itens';

// ── Gera um ID único para cada item ──
// Date.now() = milissegundos desde 1970 (sempre crescente)
// Math.random() = decimal entre 0 e 1
// Combinados, evitam duplicatas mesmo em cliques muito rápidos.
function gerarId() {
  return Date.now() + '-' + Math.floor(Math.random() * 10000);
}

// ── Função: carregar a lista de itens do localStorage ──
function carregarItens() {
  var texto = localStorage.getItem(CHAVE_ITENS);
  if (!texto) return [];
  try {
    return JSON.parse(texto);
  } catch (erro) {
    console.log('[CRUD] Dados corrompidos, resetando.');
    return [];
  }
}

// ── Função: salvar a lista de itens no localStorage ──
function salvarItens(lista) {
  localStorage.setItem(CHAVE_ITENS, JSON.stringify(lista));
  console.log('[CRUD] Lista salva. Total:', lista.length);
}

// CREATE ou UPDATE — agora também salva a foto (se houver)
function adicionarItem() {
  var inputTitulo = document.getElementById('input-titulo');
  var inputDescricao = document.getElementById('input-descricao');
  var inputCategoria = document.getElementById('input-categoria');

  var titulo = inputTitulo.value.trim();
  var descricao = inputDescricao.value.trim();
  var categoria = inputCategoria.value;

  if (titulo === '') {
    alert('O título não pode ficar vazio!');
    inputTitulo.focus();
    return;
  }

  var itens = carregarItens();

  if (idEmEdicao === null) {
    // CRIAR
    var novoItem = {
      id: gerarId(),
      titulo: titulo,
      descricao: descricao,
      categoria: categoria,
      localizacao: localizacaoPendente,
      foto: fotoPendente, // ★ NOVO (pode ser null)
      criadoEm: new Date().toLocaleString('pt-BR')
    };
    itens.push(novoItem);
    console.log('[CRUD] Criado:', novoItem.titulo);
  } else {
    // EDITAR
    var itemExistente = itens.find(function (i) {
      return i.id === idEmEdicao;
    });
    if (itemExistente) {
      itemExistente.titulo = titulo;
      itemExistente.descricao = descricao;
      itemExistente.categoria = categoria;
      if (localizacaoPendente) itemExistente.localizacao = localizacaoPendente;
      if (fotoPendente) itemExistente.foto = fotoPendente;
      itemExistente.atualizadoEm = new Date().toLocaleString('pt-BR');
      console.log('[CRUD] Atualizado:', idEmEdicao);
    }
    cancelarEdicao();
  }

  // ★ TRY/CATCH protege contra QuotaExceededError
  try {
    salvarItens(itens);
  } catch (erro) {
    alert('⚠️ Espaço esgotado no localStorage!\n\n'
      + 'Você atingiu o limite de ~5MB. '
      + 'Exclua alguns itens com foto antes de criar mais.');
    console.log('[CRUD] Erro ao salvar:', erro);
    return;
  }

  inputTitulo.value = '';
  inputDescricao.value = '';
  inputCategoria.value = 'Outro';
  limparLocalizacaoPendente();
  limparFotoPendente(); // ★ limpa a foto pendente
  inputTitulo.focus();

  renderizarItens();
}

// ── Conecta o botão "Adicionar" ──
var btnAdicionar = document.getElementById('btn-adicionar');
if (btnAdicionar) {
  btnAdicionar.addEventListener('click', adicionarItem);
}

// ── Bônus: criar ao apertar Enter no campo de título ──
// (Usamos nome diferente "campoTitulo" para não confundir com a
//  variável "inputTitulo" que existe DENTRO da função acima.)
var campoTitulo = document.getElementById('input-titulo');
if (campoTitulo) {
  campoTitulo.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      adicionarItem();
    }
  });
}

// READ: mostra itens filtrados com miniatura de foto (se houver)
function renderizarItens() {
  var container = document.getElementById('lista-itens');
  if (!container) return;

  var itens = carregarItens();

  var inputBusca = document.getElementById('input-busca');
  var filtroCat = document.getElementById('filtro-categoria');
  var termoBusca = inputBusca ? inputBusca.value.toLowerCase().trim() : '';
  var categoriaSelecionada = filtroCat ? filtroCat.value : 'todas';

  var itensFiltrados = itens.filter(function (item) {
    if (categoriaSelecionada !== 'todas') {
      var catItem = item.categoria || 'Outro';
      if (catItem !== categoriaSelecionada) return false;
    }
    if (termoBusca !== '') {
      var titulo = (item.titulo || '').toLowerCase();
      var desc = (item.descricao || '').toLowerCase();
      if (titulo.indexOf(termoBusca) === -1
          && desc.indexOf(termoBusca) === -1) {
        return false;
      }
    }
    return true;
  });

  console.log('[BUSCA] Resultados:', itensFiltrados.length, '/', itens.length);

  if (itens.length === 0) {
    container.innerHTML =
      '<p style="color:#64748b;font-size:0.9rem;'
      + 'text-align:center;padding:20px;">'
      + 'Nenhum item criado ainda. Use o formulário acima!</p>';
    return;
  }
  if (itensFiltrados.length === 0) {
    container.innerHTML =
      '<p style="color:#64748b;font-size:0.9rem;'
      + 'text-align:center;padding:20px;">'
      + '🔎 Nenhum item encontrado.</p>';
    return;
  }

  var html;
  if (itensFiltrados.length === itens.length) {
    html = '<p style="color:#475569;font-size:0.85rem;margin-bottom:12px;">'
      + '📊 Total: ' + itens.length + ' item(ns)</p>';
  } else {
    html = '<p style="color:#475569;font-size:0.85rem;margin-bottom:12px;">'
      + '🔎 Mostrando ' + itensFiltrados.length + ' de ' + itens.length + '</p>';
  }

  var coresCat = {
    'Trabalho': { bg: '#dbeafe', txt: '#1e40af', icon: '💼' },
    'Pessoal':  { bg: '#fce7f3', txt: '#9d174d', icon: '❤️' },
    'Estudos':  { bg: '#dcfce7', txt: '#166534', icon: '📚' },
    'Outro':    { bg: '#f1f5f9', txt: '#475569', icon: '📁' }
  };

  itensFiltrados.forEach(function (item) {
    var cat = item.categoria || 'Outro';
    var cor = coresCat[cat] || coresCat['Outro'];

    html += '<div style="background:#fff;border:1px solid #e2e8f0;'
      + 'border-radius:8px;padding:12px;margin-bottom:10px;'
      + 'box-shadow:0 1px 3px rgba(0,0,0,0.05);'
      + 'display:flex;gap:12px;">';

    // ★ Miniatura de foto (se tiver)
    if (item.foto) {
      html += '<img src="' + item.foto + '" '
        + 'onclick="abrirDetalhes(\'' + item.id + '\')" '
        + 'style="width:64px;height:64px;object-fit:cover;'
        + 'border-radius:6px;cursor:pointer;flex-shrink:0;">';
    }

    // Conteúdo do card
    html += '<div style="flex:1;min-width:0;">';

    html += '<span style="display:inline-block;background:' + cor.bg + ';'
      + 'color:' + cor.txt + ';padding:2px 8px;border-radius:999px;'
      + 'font-size:0.72rem;font-weight:600;margin-bottom:6px;">'
      + cor.icon + ' ' + cat + '</span>';

    // Indicadores de mídia (📍 se tem localização, 📸 se tem foto)
    if (item.localizacao) {
      html += '<span style="margin-left:6px;font-size:0.72rem;'
        + 'color:#0284c7;">📍</span>';
    }
    if (item.foto) {
      html += '<span style="margin-left:4px;font-size:0.72rem;'
        + 'color:#a855f7;">📸</span>';
    }

    html += '<h3 style="color:#0f172a;font-size:1.05rem;'
      + 'margin-bottom:6px;cursor:pointer;'
      + 'text-decoration:underline;text-decoration-color:#94a3b8;" '
      + 'onclick="abrirDetalhes(\'' + item.id + '\')">'
      + item.titulo + ' 🔍</h3>';

    if (item.descricao) {
      html += '<p style="color:#475569;font-size:0.9rem;margin-bottom:8px;">'
        + (item.descricao.length > 80
            ? item.descricao.substring(0, 80) + '...'
            : item.descricao)
        + '</p>';
    }

    html += '<p style="color:#94a3b8;font-size:0.75rem;margin-bottom:10px;">'
      + '⏰ ' + item.criadoEm + '</p>';

    html += '<div style="display:flex;gap:6px;flex-wrap:wrap;">'
      + '<button onclick="editarItem(\'' + item.id + '\')" '
      + 'style="padding:6px 12px;background:#fbbf24;color:#000;'
      + 'border:none;border-radius:6px;cursor:pointer;font-size:0.85rem;">'
      + '✏️ Editar</button>'
      + '<button onclick="excluirItem(\'' + item.id + '\')" '
      + 'style="padding:6px 12px;background:#ef4444;color:#fff;'
      + 'border:none;border-radius:6px;cursor:pointer;font-size:0.85rem;">'
      + '🗑️ Excluir</button>'
      + '<button onclick="compartilharItem(\'' + item.id + '\')" '
      + 'style="padding:6px 12px;background:#3b82f6;color:#fff;'
      + 'border:none;border-radius:6px;cursor:pointer;font-size:0.85rem;">'
      + '📤 Compartilhar</button>'
      + '</div>';

    html += '</div></div>'; // fecha conteúdo + card
  });

  container.innerHTML = html;
}

// ── DELETE: exclui um item pelo id ──
function excluirItem(id) {
  // Confirma antes (proteção contra clique acidental)
  if (!confirm('Tem certeza que deseja excluir este item?')) {
    return;
  }

  var itens = carregarItens();

  // .filter() cria nova lista SEM o item com aquele id
  // Mantém todos os itens cujo id é DIFERENTE do que queremos excluir
  var novaLista = itens.filter(function (item) {
    return item.id !== id;
  });

  salvarItens(novaLista);
  console.log('[CRUD] Excluído:', id);

  // Re-renderiza para atualizar a tela
  renderizarItens();
}

// ── Funções TEMPORÁRIAS para editar e compartilhar ──
// Serão implementadas nos LAB 3 e LAB 4
// Variável global: guarda qual item está sendo editado
// null = modo "criar novo"
// string com id = modo "editar item existente"
var idEmEdicao = null;

// UPDATE - Parte 1: preparar o formulário para edição (AGORA com categoria)
function editarItem(id) {
  var itens = carregarItens();
  var item = itens.find(function (i) {
    return i.id === id;
  });

  if (!item) {
    alert('Item não encontrado!');
    return;
  }

  document.getElementById('input-titulo').value = item.titulo;
  document.getElementById('input-descricao').value = item.descricao || '';
  // ★ Preenche a categoria (se item antigo não tem, usa 'Outro')
  document.getElementById('input-categoria').value = item.categoria || 'Outro';

  idEmEdicao = id;

  var btnAdd = document.getElementById('btn-adicionar');
  btnAdd.textContent = '💾 Salvar Edição';
  btnAdd.style.background =
    'linear-gradient(135deg,#f59e0b,#fbbf24)';

  document.getElementById('btn-cancelar').style.display = 'inline-block';

  document.getElementById('secao-crud')
    .scrollIntoView({ behavior: 'smooth' });

  document.getElementById('input-titulo').focus();

  console.log('[CRUD] Modo edição:', id);
}

// ── Cancela a edição, volta para "modo criar" ──
function cancelarEdicao() {
  idEmEdicao = null;
  document.getElementById('input-titulo').value = '';
  document.getElementById('input-descricao').value = '';

  var btnAdd = document.getElementById('btn-adicionar');
  btnAdd.textContent = '✚ Adicionar';
  btnAdd.style.background =
    'linear-gradient(135deg,#10b981,#34d399)';

  document.getElementById('btn-cancelar').style.display = 'none';
  console.log('[CRUD] Edição cancelada');
}

// ── Conecta o botão Cancelar ──
var btnCancelar = document.getElementById('btn-cancelar');
if (btnCancelar) {
  btnCancelar.addEventListener('click', cancelarEdicao);
}

// ── SHARE: compartilha um item usando a Web Share API ──
function compartilharItem(id) {
  var itens = carregarItens();
  var item = itens.find(function (i) {
    return i.id === id;
  });

  if (!item) return;

  // Monta o texto que será compartilhado
  var texto = '📌 ' + item.titulo + '\n\n'
    + (item.descricao || '')
    + '\n\n— Criado em ' + item.criadoEm;

  // Verifica se o navegador suporta Web Share
  // 'share' in navigator = navigator tem o método share?
  if (navigator.share) {
    // ─── MODO 1: Web Share API (navegador moderno) ───
    navigator.share({
      title: item.titulo,
      text: texto
    })
      .then(function () {
        console.log('[SHARE] Compartilhado!');
      })
      .catch(function (erro) {
        // O usuário pode ter cancelado — não é erro grave
        console.log('[SHARE] Cancelado ou erro:', erro.message);
      });
  } else {
    // ─── MODO 2: FALLBACK (navegador sem suporte) ───
    // Tenta copiar para a área de transferência
    if (navigator.clipboard) {
      navigator.clipboard.writeText(texto).then(function () {
        alert('Web Share não suportado neste navegador.\n\n'
          + '✅ Texto copiado para área de transferência!\n\n'
          + 'Cole no app que quiser (Ctrl+V).');
      });
    } else {
      // Último recurso: mostra o texto num alert
      alert('Texto para compartilhar:\n\n' + texto);
    }
    console.log('[SHARE] Fallback usado');
  }
}

// ── IMPORTANTE: renderiza ao carregar a página ──
// Sem isso, os itens só aparecem após criar/excluir um.
renderizarItens();

// ═══ AV2 - SISTEMA DE ROTAS (tela de lista vs tela de detalhes) ═══
// Usa window.location.hash para saber qual tela mostrar.
// Exemplos de hash:
//   ""          → tela de lista (padrão)
//   "#item/123" → tela de detalhes do item com id 123

// ── Função central: decide qual tela mostrar baseado no hash ──
function processarRota() {
  var hash = window.location.hash; // Ex: "#item/abc123"
  console.log('[ROUTE] Hash atual:', hash);

  // Pega as duas seções
  var telaLista = document.getElementById('secao-crud');
  var telaDetalhes = document.getElementById('tela-detalhes');

  // Verifica se o hash começa com "#item/"
  if (hash.indexOf('#item/') === 0) {
    // ─── MOSTRAR TELA DE DETALHES ───
    // Extrai o id depois do "#item/"
    var id = hash.substring('#item/'.length);
    console.log('[ROUTE] Mostrando detalhes do item:', id);

    // Esconde a lista, mostra os detalhes
    telaLista.style.display = 'none';
    telaDetalhes.style.display = 'block';

    // Preenche o conteúdo
    mostrarDetalhes(id);
  } else {
    // ─── MOSTRAR TELA DE LISTA ───
    console.log('[ROUTE] Mostrando lista');
    telaLista.style.display = 'block';
    telaDetalhes.style.display = 'none';

    // Re-renderiza a lista (caso tenha sido editada na tela de detalhes)
    renderizarItens();
  }

  // Rola para o topo da página
  window.scrollTo(0, 0);
}

// Detalhes do item (AGORA com foto grande)
function mostrarDetalhes(id) {
  var itens = carregarItens();
  var item = itens.find(function (i) { return i.id === id; });

  var container = document.getElementById('conteudo-detalhes');

  if (!item) {
    container.innerHTML =
      '<p style="color:#dc2626;padding:20px;text-align:center;">'
      + '⚠️ Item não encontrado.</p>';
    return;
  }

  var html = '<h1 style="font-size:1.8rem;color:#0f172a;'
    + 'margin-bottom:12px;">' + item.titulo + '</h1>';

  if (item.categoria) {
    html += '<p style="color:#64748b;font-size:0.9rem;'
      + 'margin-bottom:16px;">Categoria: '
      + '<strong>' + item.categoria + '</strong></p>';
  }

  // ★ FOTO em tamanho grande
  if (item.foto) {
    html += '<img src="' + item.foto + '" '
      + 'style="width:100%;max-width:500px;border-radius:8px;'
      + 'border:1px solid #cbd5e1;margin-bottom:16px;display:block;">';
  }

  if (item.descricao) {
    html += '<p style="color:#334155;font-size:1.05rem;'
      + 'line-height:1.7;margin-bottom:20px;'
      + 'white-space:pre-wrap;">' + item.descricao + '</p>';
  }

  if (item.localizacao) {
    var lat = item.localizacao.lat;
    var lng = item.localizacao.lng;
    var url = 'https://www.google.com/maps?q=' + lat + ',' + lng;
    html += '<div style="background:#dbeafe;padding:12px;'
      + 'border-radius:8px;margin-bottom:16px;">'
      + '<p style="color:#1e40af;font-weight:600;">📍 Localização</p>'
      + '<p style="color:#1e3a8a;font-size:0.9rem;font-family:monospace;">'
      + lat.toFixed(6) + ', ' + lng.toFixed(6) + '</p>'
      + '<a href="' + url + '" target="_blank" '
      + 'style="display:inline-block;margin-top:8px;'
      + 'background:#1e40af;color:#fff;padding:6px 14px;'
      + 'border-radius:6px;text-decoration:none;font-size:0.85rem;">'
      + '🗺️ Abrir no Google Maps</a></div>';
  }

  html += '<div style="background:#fef3c7;padding:12px;'
    + 'border-radius:8px;font-size:0.85rem;color:#78350f;'
    + 'margin-bottom:20px;">'
    + '<p>⏰ Criado em: ' + item.criadoEm + '</p>';
  if (item.atualizadoEm) {
    html += '<p>✏️ Editado em: ' + item.atualizadoEm + '</p>';
  }
  html += '<p style="color:#92400e;font-family:monospace;'
    + 'font-size:0.75rem;margin-top:6px;">ID: ' + item.id + '</p></div>';

  html += '<div style="display:flex;gap:8px;flex-wrap:wrap;">'
    + '<button onclick="editarItem(\'' + item.id + '\');voltarParaLista();" '
    + 'style="padding:10px 20px;background:#fbbf24;color:#000;'
    + 'border:none;border-radius:8px;cursor:pointer;font-size:0.95rem;'
    + 'font-weight:600;">✏️ Editar</button>'
    + '<button onclick="if(confirm(\'Excluir?\')){excluirItem(\'' + item.id + '\');voltarParaLista();}" '
    + 'style="padding:10px 20px;background:#ef4444;color:#fff;'
    + 'border:none;border-radius:8px;cursor:pointer;font-size:0.95rem;'
    + 'font-weight:600;">🗑️ Excluir</button>'
    + '<button onclick="compartilharItem(\'' + item.id + '\')" '
    + 'style="padding:10px 20px;background:#3b82f6;color:#fff;'
    + 'border:none;border-radius:8px;cursor:pointer;font-size:0.95rem;'
    + 'font-weight:600;">📤 Compartilhar</button></div>';

  container.innerHTML = html;
}

// ── Função: navega para a lista (limpa o hash) ──
function voltarParaLista() {
  window.location.hash = '';
}

// ── Função: abre a tela de detalhes de um item ──
function abrirDetalhes(id) {
  window.location.hash = '#item/' + id;
}

// ── Conecta o botão Voltar ──
var btnVoltar = document.getElementById('btn-voltar');
if (btnVoltar) {
  btnVoltar.addEventListener('click', voltarParaLista);
}

// ── Escuta mudanças no hash (back/forward do navegador, edição direta da URL) ──
window.addEventListener('hashchange', processarRota);

// ── Processa a rota ao carregar a página (importante para F5 funcionar) ──
processarRota();

// ── AV2 - busca em tempo real + filtro de categoria ──
var campoBusca = document.getElementById('input-busca');
if (campoBusca) {
  // 'input' dispara a cada caractere digitado
  campoBusca.addEventListener('input', renderizarItens);
}

var filtroCat = document.getElementById('filtro-categoria');
if (filtroCat) {
  filtroCat.addEventListener('change', renderizarItens);
}

// ═══ AV2 - GEOLOCALIZAÇÃO ═══
// Captura a localização atual usando a Geolocation API.
// A localização capturada fica em variável temporária e é
// anexada ao próximo item criado.

// Variável que guarda a localização "pendente" (a ser anexada)
var localizacaoPendente = null;

// ── Função: captura a localização atual ──
function capturarLocalizacao() {
  var status = document.getElementById('status-localizacao');

  // Verifica suporte
  if (!navigator.geolocation) {
    alert('Seu navegador não suporta Geolocation API.');
    return;
  }

  // Feedback visual de "carregando"
  status.textContent = '⏳ Capturando...';
  status.style.color = '#f59e0b';

  // Chamada principal: pede a posição ao navegador
  // getCurrentPosition(sucesso, erro, opcoes)
  navigator.geolocation.getCurrentPosition(
    // CALLBACK DE SUCESSO
    function (position) {
      var lat = position.coords.latitude;
      var lng = position.coords.longitude;
      var precisao = Math.round(position.coords.accuracy);

      // Guarda na variável global
      localizacaoPendente = {
        lat: lat,
        lng: lng,
        precisao: precisao,
        capturadaEm: new Date().toLocaleString('pt-BR')
      };

      // Mostra na tela com 5 casas decimais (precisão de ~1m)
      status.innerHTML = '✅ ' + lat.toFixed(5) + ', ' + lng.toFixed(5)
        + ' (±' + precisao + 'm)';
      status.style.color = '#10b981';

      console.log('[GEO] Localização capturada:', localizacaoPendente);
    },
    // CALLBACK DE ERRO
    function (erro) {
      var msg = 'Erro ao capturar localização: ';
      switch (erro.code) {
        case erro.PERMISSION_DENIED:
          msg += 'permissão negada. Clique no cadeado da URL → Permissões → Localização → Permitir';
          break;
        case erro.POSITION_UNAVAILABLE:
          msg += 'localização indisponível. Verifique sua conexão.';
          break;
        case erro.TIMEOUT:
          msg += 'demorou muito (timeout). Tente novamente.';
          break;
        default:
          msg += erro.message;
      }
      status.textContent = '❌ ' + msg.substring(0, 60);
      status.style.color = '#dc2626';
      console.log('[GEO] Erro:', erro);
      alert(msg);
    },
    // OPÇÕES
    {
      enableHighAccuracy: true, // tenta GPS (mais preciso)
      timeout: 10000,           // desiste em 10 segundos
      maximumAge: 0             // não usar cache, sempre nova
    }
  );
}

// ── Função: limpa a localização pendente (após salvar item) ──
function limparLocalizacaoPendente() {
  localizacaoPendente = null;
  var status = document.getElementById('status-localizacao');
  if (status) {
    status.textContent = 'Nenhuma localização anexada';
    status.style.color = '#64748b';
  }
}

// ── Conecta o botão ──
var btnLoc = document.getElementById('btn-localizacao');
if (btnLoc) {
  btnLoc.addEventListener('click', capturarLocalizacao);
}

// ═══ AV2 - FOTO COM COMPRESSÃO ═══
// Pipeline: arquivo → FileReader → Image → Canvas redimensiona → JPEG 70%
// Resultado: foto de 3MB vira ~80KB. Cabe muito mais no localStorage.

// Variável que guarda a foto "pendente" (base64 comprimido)
var fotoPendente = null;

// Configurações de compressão
var FOTO_MAX_DIMENSAO = 800;   // px (lado maior)
var FOTO_QUALIDADE = 0.7;      // 0..1 (0.7 é equilíbrio bom)

// ── Função: comprime uma imagem usando Canvas ──
// Recebe o arquivo (File) e chama callback com a string base64
function comprimirImagem(arquivo, callback) {
  // 1) FileReader lê o arquivo do disco
  var reader = new FileReader();

  reader.onload = function (e) {
    // 2) Cria um objeto Image com os dados do arquivo
    var img = new Image();
    img.onload = function () {
      // 3) Calcula novas dimensões mantendo proporção
      var largura = img.width;
      var altura = img.height;
      if (largura > altura) {
        if (largura > FOTO_MAX_DIMENSAO) {
          altura = altura * (FOTO_MAX_DIMENSAO / largura);
          largura = FOTO_MAX_DIMENSAO;
        }
      } else {
        if (altura > FOTO_MAX_DIMENSAO) {
          largura = largura * (FOTO_MAX_DIMENSAO / altura);
          altura = FOTO_MAX_DIMENSAO;
        }
      }

      // 4) Cria um canvas off-screen e desenha a imagem nele já redimensionada
      var canvas = document.createElement('canvas');
      canvas.width = largura;
      canvas.height = altura;
      var ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, largura, altura);

      // 5) Converte para JPEG comprimido em base64
      var base64 = canvas.toDataURL('image/jpeg', FOTO_QUALIDADE);

      // 6) Devolve via callback
      callback(base64);
    };
    img.onerror = function () {
      callback(null);
      alert('Erro ao carregar a imagem.');
    };
    img.src = e.target.result;
  };

  reader.onerror = function () {
    callback(null);
    alert('Erro ao ler o arquivo.');
  };

  reader.readAsDataURL(arquivo);
}

// ── Função: trata seleção do arquivo ──
function tratarFoto(evento) {
  var arquivo = evento.target.files[0];
  if (!arquivo) return;

  // Validação básica: deve ser imagem
  if (!arquivo.type.startsWith('image/')) {
    alert('Arquivo selecionado não é uma imagem.');
    return;
  }

  var status = document.getElementById('status-foto');
  var preview = document.getElementById('preview-foto');

  status.textContent = '⏳ Comprimindo...';
  status.style.color = '#f59e0b';

  // Mostra o tamanho original
  var kbOriginal = Math.round(arquivo.size / 1024);
  console.log('[FOTO] Arquivo original:', kbOriginal + 'KB');

  // Comprime
  comprimirImagem(arquivo, function (base64) {
    if (!base64) {
      status.textContent = '❌ Erro';
      status.style.color = '#dc2626';
      return;
    }

    fotoPendente = base64;

    // Calcula tamanho final (base64 string length aproximada)
    var kbFinal = Math.round(base64.length / 1024);
    console.log('[FOTO] Foto comprimida:', kbFinal + 'KB',
      '(' + Math.round((kbFinal / kbOriginal) * 100) + '% do original)');

    status.textContent = '✅ ' + kbFinal + 'KB';
    status.style.color = '#10b981';

    // Mostra preview
    preview.innerHTML = '<img src="' + base64 + '" '
      + 'style="max-width:200px;max-height:200px;'
      + 'border-radius:8px;border:1px solid #cbd5e1;">';
  });
}

// ── Função: limpa a foto pendente ──
function limparFotoPendente() {
  fotoPendente = null;
  var status = document.getElementById('status-foto');
  var preview = document.getElementById('preview-foto');
  var input = document.getElementById('input-foto');
  if (status) {
    status.textContent = 'Nenhuma foto';
    status.style.color = '#64748b';
  }
  if (preview) preview.innerHTML = '';
  if (input) input.value = ''; // limpa o input (importante!)
}

// ── Conecta o input ──
var inputFoto = document.getElementById('input-foto');
if (inputFoto) {
  inputFoto.addEventListener('change', tratarFoto);
}