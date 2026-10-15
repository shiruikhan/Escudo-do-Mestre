// Escudo do Mestre — Renderizadores: Bestiário
(function () {
  'use strict';

  const escHtml = window.escHtml;
  const { parseLinks } = window.Renderers;
  const { painelCard, listaBlocos, dicParaArray, itemListaCard, listaVerbetes, vazio, marcarDados, lerSessao, blocoApareceEm, campo } = window.Renderers._;

  function listaBestiario(aventura) {
    const itens = dicParaArray(aventura.bestiario)
      .sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt'));
    if (!itens.length) return vazio('Nenhum monstro cadastrado.');
    const cards = itens.map(b => itemListaCard('bestiario', b.id, b.nome,
      [b.tipo_alinhamento],
      [{ v: b.nd, r: 'ND' }, { v: b.ca, r: 'CA' }])).join('');
    return listaVerbetes(cards);
  }

  // Rastreador de PV da sessão: mostra o PV atual (override do localStorage,
  // gravado pelo app.js) com botões de ajuste. Só aparece quando pv é numérico.
  function trackerPv(aventura, id, b) {
    const max = parseInt(b.pv, 10);
    if (!Number.isFinite(max)) return '';
    const pvs = lerSessao('pv', aventura.id || '');
    const atual = pvs[id] != null ? pvs[id] : max;
    const baixo = atual <= max / 4 ? ' pv-baixo' : '';
    return `
      <div class="pv-tracker" data-id="${escHtml(id)}" data-max="${max}">
        <button type="button" class="pv-btn" data-delta="-5" aria-label="Menos 5 PV">−5</button>
        <button type="button" class="pv-btn" data-delta="-1" aria-label="Menos 1 PV">−1</button>
        <div class="pv-valor"><span class="pv-atual${baixo}">${atual}</span><span class="pv-max">/${max}</span></div>
        <button type="button" class="pv-btn" data-delta="1" aria-label="Mais 1 PV">+1</button>
        <button type="button" class="pv-btn" data-delta="5" aria-label="Mais 5 PV">+5</button>
        <button type="button" class="pv-btn pv-reset" aria-label="Restaurar PV" title="Restaurar PV">&#8634;</button>
      </div>`;
  }

  // Botão de entrada no rastreador de combate (aba ⚔️): o app.js rola a
  // iniciativa (1d20+mod) e adiciona o monstro com PV cheio.
  function botaoCombate(id) {
    return `
      <button type="button" class="cb-add-monstro" data-id="${escHtml(id)}">${window.icone('combate')} Adicionar ao combate</button>`;
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

    // Números de combate em grade: CA, PV, Deslocamento, Iniciativa.
    const num = (rot, valor, nota) => valor == null || valor === '' ? '' : `
      <div><dt>${rot}</dt><dd>${escHtml(valor)}</dd>${nota ? `<small>${nota}</small>` : ''}</div>`;
    const ini = b.iniciativa != null ? String(b.iniciativa) : '';
    const iniValor = ini.replace(/\s*\(.*\)\s*$/, '');
    const iniNota = (/\(([^)]*)\)/.exec(ini) || [])[1];
    const nums = [
      num('CA', b.ca, b.ca_descricao ? escHtml(b.ca_descricao) : ''),
      num('PV', b.pv, b.pv_formula ? marcarDados(escHtml(b.pv_formula)) : ''),
      num('Desl.', b.deslocamento),
      num('Inic.', iniValor, iniNota ? escHtml(iniNota) : ''),
    ].join('');

    const listaTexto = (rotulo, arr) =>
      arr && arr.length ? `<p><b>${rotulo}</b> ${escHtml(arr.join(', '))}</p>` : '';
    const linhaTexto = (rotulo, v) => v == null || v === '' ? '' : `<p><b>${rotulo}</b> ${escHtml(v)}</p>`;
    const cabecaRotulo = ['Bestiário', b.nd != null ? `ND ${b.nd}` : '', b.xp != null ? `${b.xp} XP` : ''].filter(Boolean).join(' · ');

    const corpo = `
      <p class="rotulo-secao cabeca">${escHtml(cabecaRotulo)}</p>
      <h3 class="titulo-entidade">${escHtml(b.nome)}</h3>
      ${b.tipo_alinhamento ? `<p class="subtitulo-entidade">${escHtml(b.tipo_alinhamento)}</p>` : ''}
      <div class="stat-divider"></div>
      <dl class="ficha-nums">${nums}</dl>

      ${trackerPv(aventura, id, b)}
      ${botaoCombate(id)}

      <div class="stat-divider"></div>
      <div class="stat-grid">${grid}</div>
      <div class="stat-divider"></div>

      <div class="ficha-linhas">
        ${listaTexto('Salvaguardas', b.salvaguardas)}
        ${listaTexto('Perícias', b.pericias)}
        ${listaTexto('Vulnerabilidades a Dano', b.vulnerabilidades_dano)}
        ${listaTexto('Imunidades a Dano', b.imunidades_dano)}
        ${listaTexto('Resistências a Dano', b.resistencias_dano)}
        ${listaTexto('Imunidades a Condição', b.imunidades_condicao)}
        ${linhaTexto('Sentidos', [b.sentidos, b.percepcao_passiva != null ? `Percepção passiva ${b.percepcao_passiva}` : ''].filter(Boolean).join('; '))}
        ${linhaTexto('Idiomas', b.idiomas)}
      </div>

      ${listaBlocos('Características', b.caracteristicas, aventura)}
      ${listaBlocos('Ações', b.acoes, aventura)}
      ${listaBlocos('Ações Bônus', b.acoes_bonus, aventura)}
      ${listaBlocos('Reações', b.reacoes, aventura)}
      ${listaBlocos('Ações Lendárias', b.acoes_lendarias, aventura)}

      ${blocoApareceEm(aventura, 'bestiario', id)}
      ${b.localizacao ? campo('Localização', parseLinks(b.localizacao, aventura), 'musgo') : ''}
      ${b.notas_dm ? campo('Nota do Mestre', parseLinks(b.notas_dm, aventura), 'mestre') : ''}
    `;
    return `<div class="fade-in">${painelCard(corpo, 'ficha')}</div>`;
  }

  window.Renderers.listas.bestiario = listaBestiario;
  window.Renderers.detalhes.bestiario = detalheBestiario;
})();
