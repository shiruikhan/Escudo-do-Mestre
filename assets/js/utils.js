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

  // Registra o Service Worker para uso offline (cache-first do app shell e dados).
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    });
  }

  // Tema claro/escuro — aplicado o quanto antes (antes do body renderizar) para
  // evitar flash do tema errado. Persistido em localStorage; alterna via #btn-tema.
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
