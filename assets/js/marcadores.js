// Escudo do Mestre — Mapa de marcadores de drill-down (fonte única de verdade)
//
// Compartilhado entre o navegador (window.MARCADORES, usado por renderers-core.js)
// e o Node (module.exports, usado por scripts/validar-dados.js e scripts/testes.js).
// Antes o validador extraía este mapa do fonte de renderers-core.js com regex —
// funcionava, mas quebrava silenciosamente se o formato do código mudasse.
(function (raiz, def) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = def;
  else raiz.MARCADORES = def;
})(typeof self !== 'undefined' ? self : this, {
  // Prefixo usado nos textos (npc:, bestiario:, itens:, local:) → seção do JSON.
  PREFIXO_PARA_SECAO: {
    npc: 'npcs',
    bestiario: 'bestiario',
    itens: 'itens',
    item: 'itens',
    locais: 'locais',
    local: 'locais',
  },
  // Alternação com os prefixos mais longos primeiro (itens antes de item,
  // locais antes de local) para o regex consumir o prefixo inteiro.
  PREFIXOS_RE: '(npc|bestiario|itens|item|locais|local)',
});
