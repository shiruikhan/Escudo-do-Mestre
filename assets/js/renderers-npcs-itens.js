// Escudo do Mestre — Renderizadores: NPCs e Itens
(function () {
  'use strict';

  const escHtml = window.escHtml;
  const { parseLinks } = window.Renderers;
  const { painelCard, linha, dicParaArray, itemListaCard, vazio, campoDestaque } = window.Renderers._;

  function listaNpcs(aventura) {
    const itens = dicParaArray(aventura.npcs)
      .sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt'));
    if (!itens.length) return vazio('Nenhum NPC cadastrado.');
    const cards = itens.map(n => itemListaCard('npcs', n.id, n.nome, [
      n.papel,
      n.local,
    ])).join('');
    return `<ul class="space-y-2 fade-in">${cards}</ul>`;
  }

  function detalheNpc(aventura, id) {
    const n = aventura.npcs && aventura.npcs[id];
    if (!n) return vazio('NPC não encontrado.');
    const corpo = `
      <h3 class="text-lg font-bold text-amber-400">${escHtml(n.nome)}</h3>
      ${n.papel ? `<p class="text-xs italic text-zinc-400">${escHtml(n.papel)}</p>` : ''}
      <div class="stat-divider"></div>
      ${linha('Local', n.local)}
      ${n.descricao ? `<p class="text-sm text-zinc-300 mt-2 leading-snug">${parseLinks(n.descricao, aventura)}</p>` : ''}
      ${campoDestaque('Motivação', n.motivacao, aventura, 'amber')}
      ${campoDestaque('Segredos', n.segredos, aventura, 'rose')}
      ${campoDestaque('Interação', n.interacao, aventura, 'sky')}
    `;
    return `<div class="fade-in">${painelCard(corpo)}</div>`;
  }

  function listaItens(aventura) {
    const itens = dicParaArray(aventura.itens)
      .sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt'));
    if (!itens.length) return vazio('Nenhum item cadastrado.');
    const cards = itens.map(i => itemListaCard('itens', i.id, i.nome, [
      i.tipo,
      i.propriedades,
    ])).join('');
    return `<ul class="space-y-2 fade-in">${cards}</ul>`;
  }

  function detalheItem(aventura, id) {
    const i = aventura.itens && aventura.itens[id];
    if (!i) return vazio('Item não encontrado.');
    const corpo = `
      <h3 class="text-lg font-bold text-amber-400">${escHtml(i.nome)}</h3>
      ${i.tipo ? `<p class="text-xs italic text-zinc-400">${escHtml(i.tipo)}</p>` : ''}
      <div class="stat-divider"></div>
      ${linha('Propriedades', i.propriedades)}
      ${i.efeito ? `<p class="text-sm text-zinc-300 mt-2 leading-snug">${parseLinks(i.efeito, aventura)}</p>` : ''}
      ${i.localizacao ? campoDestaque('Localização', i.localizacao, aventura, 'emerald') : ''}
    `;
    return `<div class="fade-in">${painelCard(corpo)}</div>`;
  }

  window.Renderers.listas.npcs = listaNpcs;
  window.Renderers.detalhes.npcs = detalheNpc;
  window.Renderers.listas.itens = listaItens;
  window.Renderers.detalhes.itens = detalheItem;
})();
