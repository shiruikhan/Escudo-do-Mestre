// Escudo do Mestre — Renderizadores: NPCs e Itens
(function () {
  'use strict';

  const escHtml = window.escHtml;
  const { parseLinks } = window.Renderers;
  const { painelCard, cabecalhoDetalhe, campo, linha, dicParaArray, itemListaCard, listaVerbetes, vazio, campoDestaque, blocoApareceEm } = window.Renderers._;

  function listaNpcs(aventura) {
    const itens = dicParaArray(aventura.npcs)
      .sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt'));
    if (!itens.length) return vazio('Nenhum NPC cadastrado.');
    const cards = itens.map(n => itemListaCard('npcs', n.id, n.nome, [
      n.papel,
      n.local,
    ])).join('');
    return listaVerbetes(cards);
  }

  function detalheNpc(aventura, id) {
    const n = aventura.npcs && aventura.npcs[id];
    if (!n) return vazio('NPC não encontrado.');
    const corpo = `
      ${cabecalhoDetalhe('NPC', n.nome, n.papel)}
      ${linha('Local', n.local)}
      ${n.descricao ? `<p class="texto-livro mt-3">${parseLinks(n.descricao, aventura)}</p>` : ''}
      ${campoDestaque('Motivação', n.motivacao, aventura, 'ouro')}
      ${campoDestaque('Segredos', n.segredos, aventura, 'segredo')}
      ${campoDestaque('Interação', n.interacao, aventura, 'arcano')}
      ${n.ver_bestiario ? campo('Ficha de combate', parseLinks(/^[a-z]+:/.test(n.ver_bestiario) ? n.ver_bestiario : 'bestiario:' + n.ver_bestiario, aventura), 'ouro') : ''}
      ${campoDestaque('Notas do Mestre', n.notas_dm, aventura, 'mestre')}
      ${blocoApareceEm(aventura, 'npcs', id)}
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
    return listaVerbetes(cards);
  }

  function detalheItem(aventura, id) {
    const i = aventura.itens && aventura.itens[id];
    if (!i) return vazio('Item não encontrado.');
    const corpo = `
      ${cabecalhoDetalhe('Item', i.nome, i.tipo)}
      ${linha('Propriedades', i.propriedades)}
      ${i.efeito ? `<p class="texto-livro mt-3">${parseLinks(i.efeito, aventura)}</p>` : ''}
      ${campoDestaque('Localização', i.localizacao, aventura, 'musgo')}
      ${campoDestaque('Histórico', i.historico, aventura, 'arcano')}
    `;
    return `<div class="fade-in">${painelCard(corpo)}</div>`;
  }

  window.Renderers.listas.npcs = listaNpcs;
  window.Renderers.detalhes.npcs = detalheNpc;
  window.Renderers.listas.itens = listaItens;
  window.Renderers.detalhes.itens = detalheItem;
})();
