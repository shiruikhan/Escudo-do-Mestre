// Escudo do Mestre — Renderizadores: Locais
(function () {
  'use strict';

  const escHtml = window.escHtml;
  const { parseLinks } = window.Renderers;
  const { painelCard, dicParaArray, itemListaCard, vazio, grupoChips } = window.Renderers._;

  function listaLocais(aventura) {
    const itens = dicParaArray(aventura.locais);
    if (!itens.length) return vazio('Nenhuma localidade cadastrada.');
    const cards = itens.map(l => itemListaCard('locais', l.id, l.nome, [
      l.tipo,
      l.nivel_sugerido && l.nivel_sugerido !== '—' ? `Nível sugerido ${l.nivel_sugerido}` : null,
    ])).join('');
    return `<ul class="space-y-2 fade-in">${cards}</ul>`;
  }

  function detalheLocal(aventura, id) {
    const l = aventura.locais && aventura.locais[id];
    if (!l) return vazio('Localidade não encontrada.');
    const corpo = `
      <h3 class="text-lg font-bold text-amber-400">${escHtml(l.nome)}</h3>
      <div class="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-zinc-500">
        ${l.tipo ? `<span>${escHtml(l.tipo)}</span>` : ''}
        ${l.nivel_sugerido && l.nivel_sugerido !== '—' ? `<span>Nível sugerido ${escHtml(l.nivel_sugerido)}</span>` : ''}
      </div>
      <div class="stat-divider"></div>
      ${l.resumo ? `<p class="text-sm text-zinc-300 leading-snug">${parseLinks(l.resumo, aventura)}</p>` : ''}
      ${grupoChips('Criaturas', l.criaturas, aventura)}
      ${grupoChips('NPCs no local', l.npcs, aventura)}
      ${l.perigos ? `<div class="mt-3 text-sm border rounded-lg p-3 bg-rose-500/5 border-rose-500/20">
          <span class="font-semibold text-rose-300">Perigos:</span> <span class="text-zinc-300">${parseLinks(l.perigos, aventura)}</span>
        </div>` : ''}
      ${l.tesouro ? `<div class="mt-2 text-sm border rounded-lg p-3 bg-amber-500/5 border-amber-500/20">
          <span class="font-semibold text-amber-300">Tesouro:</span> <span class="text-zinc-300">${parseLinks(l.tesouro, aventura)}</span>
        </div>` : ''}
      ${l.conexoes ? `<div class="mt-2 text-sm border rounded-lg p-3 bg-sky-500/5 border-sky-500/20">
          <span class="font-semibold text-sky-300">Acesso e conexões:</span> <span class="text-zinc-300">${parseLinks(l.conexoes, aventura)}</span>
        </div>` : ''}
    `;
    return `<div class="fade-in">${painelCard(corpo)}</div>`;
  }

  window.Renderers.listas.locais = listaLocais;
  window.Renderers.detalhes.locais = detalheLocal;
})();
