// Escudo do Mestre — Renderizadores: Ganchos e Missões
(function () {
  'use strict';

  const escHtml = window.escHtml;
  const { parseLinks } = window.Renderers;
  const { paginaDetalhe, cabecalhoDetalhe, campo, listaVerbetes, vazio, classeBadge, textoPlano, listasComId, resolverLista, lerSessao } = window.Renderers._;

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
          <button type="button" class="open-detail verbete verbete-bloco"
                  data-tipo="ganchos" data-id="${escHtml(id)}">
            <span class="verbete-corpo">
              ${fonte ? `<span class="rotulo-secao block text-amber-400">${escHtml(fonte)}</span>` : ''}
              <span class="verbete-trecho">${escHtml(preview)}</span>
            </span>
            <span class="verbete-seta" aria-hidden="true"></span>
          </button>
        </li>`;
    }).join('');
    return listaVerbetes(cards);
  }

  function detalheGancho(aventura, id) {
    const g = resolverLista(aventura, 'ganchos', id);
    if (g == null) return vazio('Gancho não encontrado.');
    const fonte = textoPlano(typeof g === 'object' ? g.fonte : null, aventura);
    const texto = typeof g === 'object' ? g.texto : g;
    return paginaDetalhe(cabecalhoDetalhe('Gancho', fonte || 'Rumor'),
      `<p class="texto-livro">${parseLinks(texto || '', aventura)}</p>`);
  }

  function listaMissoes(aventura) {
    const missoes = listasComId(aventura).missoes;
    if (!missoes.length) return vazio('Nenhuma missão cadastrada.');
    const cards = missoes.map(({ id, obj: m }) => {
      const status = statusEfetivo(aventura, id, m);
      return `
      <li>
        <button type="button" class="open-detail verbete verbete-bloco"
                data-tipo="missoes" data-id="${escHtml(id)}">
          <span class="verbete-corpo">
            <span class="verbete-nome whitespace-normal">${escHtml(m.titulo)}</span>
            <span class="verbete-sub">${[m.nivel_sugerido != null ? 'Nível ' + escHtml(m.nivel_sugerido) : '', m.localizacao ? escHtml(textoPlano(m.localizacao, aventura)) : ''].filter(Boolean).join(' · ')}</span>
            <span class="badge ${classeBadge(status)} mt-2">${escHtml(status || '—')}</span>
          </span>
          <span class="verbete-seta" aria-hidden="true"></span>
        </button>
      </li>`;
    }).join('');
    return listaVerbetes(cards);
  }

  function detalheMissao(aventura, id) {
    const m = resolverLista(aventura, 'missoes', id);
    if (!m) return vazio('Missão não encontrada.');
    const status = statusEfetivo(aventura, id, m);
    const cabeca = cabecalhoDetalhe('Missão' + (m.nivel_sugerido != null ? ' · Nível ' + m.nivel_sugerido : ''),
      m.titulo, m.localizacao ? textoPlano(m.localizacao, aventura) : '');
    const corpo = `
      <div class="flex items-center gap-2">
        <button type="button" class="badge badge-toggle ${classeBadge(status)}"
                data-id="${escHtml(id)}" title="Tocar para mudar o status">${escHtml(status || '—')}</button>
        <span class="ajuda">Toque para alternar o status (salvo neste aparelho).</span>
      </div>
      ${m.objetivo ? campo('Objetivo', parseLinks(m.objetivo, aventura), 'arcano') : ''}
      ${m.recompensa ? campo('Recompensa', parseLinks(m.recompensa, aventura), 'ouro') : ''}
      ${m.notas_dm ? campo('Notas do Mestre', parseLinks(m.notas_dm, aventura), 'mestre') : ''}
    `;
    return paginaDetalhe(cabeca, corpo);
  }

  window.Renderers.listas.ganchos = listaGanchos;
  window.Renderers.detalhes.ganchos = detalheGancho;
  window.Renderers.listas.missoes = listaMissoes;
  window.Renderers.detalhes.missoes = detalheMissao;
})();
