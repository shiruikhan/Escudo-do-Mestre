// Escudo do Mestre — Renderizadores: Locais
(function () {
  'use strict';

  const escHtml = window.escHtml;
  const { parseLinks } = window.Renderers;
  const { painelCard, dicParaArray, itemListaCard, vazio, blocoOcupantes, textoPlano, salasDoLocal, resolverSala, ocupantesDaSala, linhaOcupante, resolverRef } = window.Renderers._;

  function listaLocais(aventura) {
    const itens = dicParaArray(aventura.locais);
    if (!itens.length) return vazio('Nenhuma localidade cadastrada.');
    const cards = itens.map(l => itemListaCard('locais', l.id, l.nome, [
      l.tipo,
      l.nivel_sugerido && l.nivel_sugerido !== '—' ? `Nível sugerido ${l.nivel_sugerido}` : null,
    ])).join('');
    return `<ul class="space-y-2 fade-in">${cards}</ul>`;
  }

  // Lista de salas do local: cada linha abre a sala (tipo "sala").
  function blocoSalas(l, lid, aventura) {
    const salas = salasDoLocal(aventura, lid);
    if (!salas.length) return '';
    const linhas = salas.map(({ id, area, rotulo }) => {
      const ocup = ocupantesDaSala(l, rotulo).map(e => {
        const r = resolverRef(e.ref, aventura);
        if (!r) return '';
        const q = e.qtd == null || e.qtd === '' || e.qtd === 1 ? '' : (typeof e.qtd === 'number' ? ' \u00d7' + e.qtd : ' (' + e.qtd + ')');
        return r.obj.nome + q;
      }).filter(Boolean).join(' \u00b7 ');
      const resumo = textoPlano(area.texto || '', aventura);
      const curto = resumo.length > 110 ? resumo.slice(0, 110).replace(/\s+\S*$/, '') + '\u2026' : resumo;
      return `<li>
        <button type="button" class="open-detail w-full text-left flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 active:bg-zinc-800 transition-colors"
                data-tipo="sala" data-id="${escHtml(id)}">
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-zinc-100 text-sm">${escHtml(rotulo || 'Área')}${area.armadilha ? ' <span title="Armadilha" class="text-rose-400">\u26A0</span>' : ''}${area.tesouro ? ' <span title="Tesouro" class="text-amber-400">\u25C6</span>' : ''}</p>
            ${ocup ? `<p class="text-xs text-amber-300/90 truncate">${escHtml(ocup)}</p>` : ''}
            ${curto ? `<p class="text-xs text-zinc-500 sala-resumo">${escHtml(curto)}</p>` : ''}
          </div>
          <span class="text-zinc-600 text-lg flex-shrink-0">&rsaquo;</span>
        </button>
      </li>`;
    }).join('');
    return `<div class="mt-3">
      <h4 class="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">Salas e áreas (${salas.length})</h4>
      <ul class="space-y-1.5">${linhas}</ul>
    </div>`;
  }

  // Tela de uma sala: ocupantes, texto, armadilha, tesouro e navegação entre salas.
  function detalheSala(aventura, id) {
    const r = resolverSala(aventura, id);
    if (!r) return vazio('Sala não encontrada.');
    const { sala, anterior, proxima, total, posicao } = r;
    const l = aventura.locais[sala.lid];
    const a = sala.area;
    const ocup = ocupantesDaSala(l, sala.rotulo).map(e => linhaOcupante(e, aventura)).join('');
    const bloco = (rot, cor, v) => v ? `<div class="mt-3 text-sm border rounded-lg p-3 ${cor.bg}">
        <span class="font-semibold ${cor.txt}">${rot}:</span> <span class="text-zinc-300">${parseLinks(v, aventura)}</span></div>` : '';
    const nav = (s, rotulo) => s
      ? `<button type="button" class="open-detail sala-nav" data-tipo="sala" data-id="${escHtml(s.id)}"><span class="text-xs text-zinc-500">${rotulo}</span><span class="block text-sm font-semibold text-amber-300 truncate">${escHtml(s.rotulo || 'Área')}</span></button>`
      : '<span></span>';
    const corpo = `
      <button type="button" class="chip-link" data-tipo="locais" data-id="${escHtml(sala.lid)}">${escHtml(l.nome)}</button>
      <h3 class="text-lg font-bold text-amber-400 mt-2">${escHtml(sala.rotulo || 'Área')}</h3>
      <p class="text-xs text-zinc-500">Sala ${posicao} de ${total}</p>
      <div class="stat-divider"></div>
      ${ocup ? `<div class="mb-3"><h4 class="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">Quem está aqui</h4><ul class="enc-lista">${ocup}</ul></div>` : ''}
      ${a.texto ? `<p class="text-sm text-zinc-300 leading-snug">${parseLinks(a.texto, aventura)}</p>` : ''}
      ${bloco('Armadilha', { bg: 'bg-rose-500/5 border-rose-500/20', txt: 'text-rose-300' }, a.armadilha)}
      ${bloco('Tesouro', { bg: 'bg-amber-500/5 border-amber-500/20', txt: 'text-amber-300' }, a.tesouro)}
      <div class="sala-navbar">${nav(anterior, '\u2039 Anterior')}${nav(proxima, 'Próxima \u203A')}</div>`;
    return `<div class="fade-in">${painelCard(corpo)}</div>`;
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
      ${blocoOcupantes(l, aventura, !!(l.areas && l.areas.length))}
      ${blocoSalas(l, id, aventura)}
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

  // ---------- Guia: regras e referências gerais da aventura ----------
  function listaGuia(aventura) {
    const itens = aventura.guia || [];
    if (!itens.length) return vazio('Nenhum guia cadastrado.');
    const cards = itens.map(g => itemListaCard('guia', g.id, g.titulo, [textoPlano(g.resumo || '', aventura)])).join('');
    return `<ul class="space-y-2 fade-in">${cards}</ul>`;
  }

  function detalheGuia(aventura, id) {
    const g = (aventura.guia || []).find(x => x.id === id);
    if (!g) return vazio('Entrada do guia não encontrada.');
    const paragrafos = (Array.isArray(g.texto) ? g.texto : String(g.texto || '').split(/\n+/))
      .filter(Boolean)
      .map(p => `<p class="text-sm text-zinc-300 leading-snug mt-2">${parseLinks(p, aventura)}</p>`).join('');
    const corpo = `<h3 class="text-lg font-bold text-amber-400">${escHtml(g.titulo)}</h3>${paragrafos}`;
    return `<div class="fade-in">${painelCard(corpo)}</div>`;
  }

  window.Renderers.detalhes.sala = detalheSala;
  window.Renderers.listas.guia = listaGuia;
  window.Renderers.detalhes.guia = detalheGuia;
  window.Renderers.listas.locais = listaLocais;
  window.Renderers.detalhes.locais = detalheLocal;
})();
