// Escudo do Mestre — Utilitários compartilhados entre páginas
(function () {
  'use strict';

  function escHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  window.escHtml = escHtml;

  // ---------- Toast flutuante (rolagem de dados, avisos) ----------
  // mostrarToast aceita HTML (chamadores escapam conteúdo dinâmico).
  let toastTimer = null;
  function mostrarToast(html, ms) {
    let t = document.getElementById('escudo-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'escudo-toast';
      t.className = 'toast';
      t.setAttribute('role', 'status');
      t.setAttribute('aria-live', 'polite');
      document.body.appendChild(t);
    }
    t.innerHTML = html;
    t.classList.add('visivel');
    clearTimeout(toastTimer);
    if (ms !== 0) toastTimer = setTimeout(() => t.classList.remove('visivel'), ms || 3000);
    return t;
  }
  window.mostrarToast = mostrarToast;

  // ---------- Service Worker: registro + aviso de nova versão ----------
  // Com cache-first, uma atualização publicada só apareceria na segunda
  // visita. O SW novo fica em "waiting" até o usuário aceitar; o toast
  // envia SKIP_WAITING e o controllerchange recarrega a página.
  if ('serviceWorker' in navigator) {
    let recarregando = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (recarregando) return;
      recarregando = true;
      window.location.reload();
    });

    function avisarAtualizacao(reg) {
      const t = mostrarToast(
        'Nova versão disponível. ' +
        '<button type="button" class="toast-acao" id="btn-atualizar-app">Atualizar</button>', 0);
      const btn = t.querySelector('#btn-atualizar-app');
      if (btn) btn.addEventListener('click', () => {
        if (reg.waiting) reg.waiting.postMessage('SKIP_WAITING');
        t.classList.remove('visivel');
      });
    }

    function observarInstalacao(reg, worker) {
      if (!worker) return;
      worker.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) {
          avisarAtualizacao(reg);
        }
      });
    }

    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').then(reg => {
        if (reg.waiting && navigator.serviceWorker.controller) avisarAtualizacao(reg);
        observarInstalacao(reg, reg.installing);
        reg.addEventListener('updatefound', () => observarInstalacao(reg, reg.installing));
      }).catch(() => {});
    });
  }

  // ---------- Ícones de interface ----------
  // Traço 24×24, 1.75px, herdam a cor do texto (currentColor). Emoji ficam
  // só onde são conteúdo (clima da trilha, condições, eventos).
  const ICONES = {
    inicio: '<path d="M4 11l8-7 8 7"/><path d="M6 10v10h12V10"/>',
    voltar: '<path d="M15 5l-7 7 7 7"/>',
    notas: '<path d="M5 4h10l4 4v12H5z"/><path d="M9 12h6M9 16h4"/>',
    busca: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/>',
    locais: '<path d="M5 21V9l2-1V5h2v2h2V5h2v2h2V5h2v3l2 1v12z"/><path d="M10 21v-4a2 2 0 0 1 4 0v4"/>',
    bestiario: '<path d="M7 4c2.5 5 2.5 11 0 16M12 3c2.5 6 2.5 12 0 18M17 4c2.5 5 2.5 11 0 16"/>',
    npcs: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4.5 4.5-7 8-7s7 2.5 8 7"/>',
    combate: '<path d="M5 3l11 11M19 3L8 14M7 13l4 4M17 13l-4 4M4 20l3-3M20 20l-3-3"/>',
    mais: '<path d="M5 4h12a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2z"/><path d="M5 18a2 2 0 0 1 2-2h12M9 8h6"/>',
    exportar: '<path d="M12 4v11M7 10l5 5 5-5"/><path d="M5 20h14"/>',
    fechar: '<path d="M6 6l12 12M18 6L6 18"/>',
    // Trilha sonora
    tocar: '<path d="M8 5v14l11-7z"/>',
    pausar: '<rect x="6.5" y="5" width="4" height="14" rx="1"/><rect x="13.5" y="5" width="4" height="14" rx="1"/>',
    proxima: '<path d="M6 5v14l9-7z"/><path d="M18 5v14"/>',
    ajustes: '<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="7"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9L7 7M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
    atualizar: '<path d="M20 12a8 8 0 1 1-2.34-5.66"/><path d="M20 4v5h-5"/>',
  };
  function icone(nome, classe) {
    const d = ICONES[nome];
    if (!d) return '';
    return `<svg class="icone${classe ? ' ' + classe : ''}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${d}</svg>`;
  }
  window.icone = icone;

  // Tema único escuro: limpa a preferência do antigo alternador claro/escuro.
  try { localStorage.removeItem('escudo_tema'); } catch (_) {}
})();
