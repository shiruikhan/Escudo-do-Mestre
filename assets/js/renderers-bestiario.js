// Escudo do Mestre — Renderizadores: Bestiário
(function () {
  'use strict';

  const escHtml = window.escHtml;
  const { parseLinks } = window.Renderers;
  const { painelCard, linha, listaBlocos, dicParaArray, itemListaCard, vazio } = window.Renderers._;

  function listaBestiario(aventura) {
    const itens = dicParaArray(aventura.bestiario)
      .sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt'));
    if (!itens.length) return vazio('Nenhum monstro cadastrado.');
    const cards = itens.map(b => itemListaCard('bestiario', b.id, b.nome, [
      b.tipo_alinhamento,
      `ND ${b.nd ?? '?'} · CA ${b.ca ?? '?'} · PV ${b.pv ?? '?'}`,
    ])).join('');
    return `<ul class="space-y-2 fade-in">${cards}</ul>`;
  }

  function detalheBestiario(aventura, id) {
    const b = aventura.bestiario && aventura.bestiario[id];
    if (!b) return vazio('Monstro não encontrado.');

    const mods = b.modificadores || {};
    const ordem = ['FOR', 'DES', 'CON', 'INT', 'SAB', 'CAR'];
    const grid = ordem.map(ab => `
      <div class="stat-cell">
        <div class="abrev">${ab}</div>
        <div class="valor">${escHtml(mods[ab] ?? '—')}</div>
      </div>`).join('');

    const caLinha = b.ca != null
      ? `CA ${escHtml(b.ca)}${b.ca_descricao ? ` (${escHtml(b.ca_descricao)})` : ''}` : '';
    const pvLinha = b.pv != null
      ? `PV ${escHtml(b.pv)}${b.pv_formula ? ` (${escHtml(b.pv_formula)})` : ''}` : '';

    const listaTexto = (rotulo, arr) =>
      arr && arr.length
        ? `<p class="text-sm text-zinc-300 mt-1"><span class="text-zinc-500">${rotulo}:</span> ${escHtml(arr.join(', '))}</p>`
        : '';

    const corpo = `
      <h3 class="text-lg font-bold text-amber-400">${escHtml(b.nome)}</h3>
      <p class="text-xs italic text-zinc-400">${escHtml(b.tipo_alinhamento || '')}</p>
      <div class="stat-divider"></div>

      <div class="flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-200">
        ${caLinha ? `<span><strong>${caLinha}</strong></span>` : ''}
        ${pvLinha ? `<span><strong>${pvLinha}</strong></span>` : ''}
        ${b.deslocamento ? `<span>Deslocamento ${escHtml(b.deslocamento)}</span>` : ''}
      </div>
      <div class="flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-200 mt-1">
        ${b.iniciativa ? `<span>Iniciativa ${escHtml(b.iniciativa)}</span>` : ''}
        ${b.percepcao_passiva != null ? `<span>Perc. Passiva ${escHtml(b.percepcao_passiva)}</span>` : ''}
        ${b.nd != null ? `<span>ND ${escHtml(b.nd)}${b.xp != null ? ` (${escHtml(b.xp)} XP)` : ''}</span>` : ''}
      </div>

      <div class="stat-divider"></div>
      <div class="stat-grid">${grid}</div>
      <div class="stat-divider"></div>

      ${listaTexto('Salvaguardas', b.salvaguardas)}
      ${listaTexto('Perícias', b.pericias)}
      ${listaTexto('Vulnerabilidades a Dano', b.vulnerabilidades_dano)}
      ${listaTexto('Imunidades a Dano', b.imunidades_dano)}
      ${listaTexto('Resistências a Dano', b.resistencias_dano)}
      ${listaTexto('Imunidades a Condição', b.imunidades_condicao)}
      ${linha('Sentidos', b.sentidos)}
      ${linha('Idiomas', b.idiomas)}

      ${listaBlocos('Características', b.caracteristicas, aventura)}
      ${listaBlocos('Ações', b.acoes, aventura)}
      ${listaBlocos('Ações Bônus', b.acoes_bonus, aventura)}
      ${listaBlocos('Reações', b.reacoes, aventura)}
      ${listaBlocos('Ações Lendárias', b.acoes_lendarias, aventura)}

      ${b.localizacao ? `<div class="stat-divider"></div>${linha('Localização', b.localizacao)}` : ''}
      ${b.notas_dm ? `<div class="mt-2 text-sm text-amber-200/80 bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
          <span class="font-semibold text-amber-300">Nota do Mestre:</span> ${parseLinks(b.notas_dm, aventura)}
        </div>` : ''}
    `;
    return `<div class="fade-in">${painelCard(corpo)}</div>`;
  }

  window.Renderers.listas.bestiario = listaBestiario;
  window.Renderers.detalhes.bestiario = detalheBestiario;
})();
