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

  // ---------- Tema claro/escuro ----------
  // Aplicado o quanto antes (antes do body renderizar) para evitar flash do
  // tema errado. Persistido em localStorage; alterna via #btn-tema.
  try {
    if (localStorage.getItem('escudo_tema') === 'light') {
      document.documentElement.classList.add('light');
    }
  } catch (_) {}

  function initTemaToggle() {
    const btn = document.getElementById('btn-tema');
    if (!btn) return;

    function atualizarIcone() {
      const claro = document.documentElement.classList.contains('light');
      btn.textContent = claro ? '☀️' : '\u{1F319}';
      btn.setAttribute('aria-label', claro ? 'Mudar para tema escuro' : 'Mudar para tema claro');
      btn.setAttribute('title', claro ? 'Mudar para tema escuro' : 'Mudar para tema claro');
    }

    atualizarIcone();
    btn.addEventListener('click', () => {
      const claro = document.documentElement.classList.toggle('light');
      try { localStorage.setItem('escudo_tema', claro ? 'light' : 'dark'); } catch (_) {}
      atualizarIcone();
    });
  }

  document.addEventListener('DOMContentLoaded', initTemaToggle);
})();
