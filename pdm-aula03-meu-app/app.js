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