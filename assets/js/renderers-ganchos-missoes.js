// Escudo do Mestre — Renderizadores: Ganchos e Missões
(function () {
  'use strict';

  const escHtml = window.escHtml;
  const { parseLinks } = window.Renderers;
  const { painelCard, vazio, classeBadge, textoPlano, listasComId, resolverLista, lerSessao } = window.Renderers._;

  // Status efetivo: override da sessão (localStorage) tem precedência sobre o JSON.
  function statusEfetivo(aventura, id, m) {
    const overrides = lerSessao('missao', aventura.id || '');
    return overrides[id] || m.status;
  }

  function listaGanchos(aventura) {
    const ganchos = listasComId(aventura).ganchos;
    if (!ganchos.length) return vazio('Nenhum gancho cadastrado.');
    const cards = ganchos.map(({ id, obj: g }) => {
      const fonte = textoPlano(typeof g === 'object' ? g.fonte : null, aventura);
      const texto = textoPlano(typeof g === 'object' ? g.texto : g, aventura);
      const preview = (texto || '').slice(0, 120) + ((texto || '').length > 120 ? '…' : '');
      return `
        <li>
          <button type="button" class="open-detail w-full text-left bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 active:bg-zinc-800 transition-colors"
                  data-tipo="ganchos" data-id="${escHtml(id)}">
            <div class="flex items-start justify-between gap-2">
              <div class="flex-1 min-w-0">
                ${fonte ? `<p class="text-xs font-bold uppercase tracking-wider text-amber-500/80 mb-1">${escHtml(fonte)}</p>` : ''}
                <p class="text-sm text-zinc-300 leading-snug">${escHtml(preview)}</p>
              </div>
              <span class="text-zinc-600 text-lg flex-shrink-0 mt-0.5">&rsaquo;</span>
            </div>
          </button>
        </li>`;
    }).join('');
    return `<ul class="space-y-2 fade-in">${cards}</ul>`;
  }

  function detalheGancho(aventura, id) {
    const g = resolverLista(aventura, 'ganchos', id);
    if (g == null) return vazio('Gancho não encontrado.');
    const fonte = textoPlano(typeof g === 'object' ? g.fonte : null, aventura);
    const texto = typeof g === 'object' ? g.texto : g;
    const corpo = `
      ${fonte ? `<p class="text-xs font-bold uppercase tracking-wider text-amber-500/80 mb-3">${escHtml(fonte)}</p>` : ''}
      <p class="text-sm text-zinc-200 leading-relaxed">${parseLinks(texto || '', aventura)}</p>
    `;
    return `<div class="fade-in">${painelCard(corpo)}</div>`;
  }

  function listaMissoes(aventura) {
    const missoes = listasComId(aventura).missoes;
    if (!missoes.length) return vazio('Nenhuma missão cadastrada.');
    const cards = missoes.map(({ id, obj: m }) => {
      const status = statusEfetivo(aventura, id, m);
      return `
      <li>
        <button type="button" class="open-detail w-full text-left flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 active:bg-zinc-800 transition-colors"
                data-tipo="missoes" data-id="${escHtml(id)}">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <p class="font-semibold text-zinc-100 truncate">${escHtml(m.titulo)}</p>
              <span class="badge ${classeBadge(status)} flex-shrink-0">${escHtml(status || '—')}</span>
            </div>
            <div class="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5 text-xs text-zinc-500">
              ${m.nivel_sugerido != null ? `<span>Nível ${escHtml(m.nivel_sugerido)}</span>` : ''}
              ${m.localizacao ? `<span>${escHtml(textoPlano(m.localizacao, aventura))}</span>` : ''}
            </div>
          </div>
          <span class="text-zinc-600 text-lg flex-shrink-0">&rsaquo;</span>
        </button>
      </li>`;
    }).join('');
    return `<ul class="space-y-2 fade-in">${cards}</ul>`;
  }

  function detalheMissao(aventura, id) {
    const m = resolverLista(aventura, 'missoes', id);
    if (!m) return vazio('Missão não encontrada.');
    const status = statusEfetivo(aventura, id, m);
    const corpo = `
      <div class="flex items-start justify-between gap-2">
        <h3 class="text-base font-bold text-zinc-100">${escHtml(m.titulo)}</h3>
        <button type="button" class="badge badge-toggle ${classeBadge(status)} flex-shrink-0"
                data-id="${escHtml(id)}" title="Tocar para mudar o status">${escHtml(status || '—')}</button>
      </div>
      <div class="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-zinc-500">
        ${m.nivel_sugerido != null ? `<span>Nível ${escHtml(m.nivel_sugerido)}</span>` : ''}
        ${m.localizacao ? `<span>${escHtml(textoPlano(m.localizacao, aventura))}</span>` : ''}
      </div>
      ${m.objetivo ? `<p class="text-sm text-zinc-300 mt-3 leading-snug">${parseLinks(m.objetivo, aventura)}</p>` : ''}
      ${m.recompensa ? `<p class="text-sm text-amber-300/90 mt-2"><span class="text-zinc-500">Recompensa:</span> ${parseLinks(m.recompensa, aventura)}</p>` : ''}
      ${m.notas_dm ? `<div class="mt-3 text-sm text-zinc-400 bg-zinc-800/40 border border-zinc-700/50 rounded-lg p-3">
          <span class="font-semibold text-zinc-300">Notas do Mestre:</span> ${parseLinks(m.notas_dm, aventura)}
        </div>` : ''}
      <p class="text-[0.65rem] text-zinc-600 mt-3">Toque no status para alternar Disponível → Em Andamento → Concluída (salvo neste aparelho).</p>
    `;
    return `<div class="fade-in">${painelCard(corpo)}</div>`;
  }

  window.Renderers.listas.ganchos = listaGanchos;
  window.Renderers.detalhes.ganchos = detalheGancho;
  window.Renderers.listas.missoes = listaMissoes;
  window.Renderers.detalhes.missoes = detalheMissao;
})();
