// Escudo do Mestre — Funções de conversão de dados JSON para componentes DOM
//
// Expõe window.Renderers com funções puras que recebem (aventura, ...) e
// retornam uma string HTML. A lógica de eventos/navegação vive em app.js.

(function () {
  'use strict';

  // Mapeia o prefixo usado nos textos (npc:, bestiario:, itens:) para a
  // chave da seção correspondente no JSON da aventura.
  const PREFIXO_PARA_SECAO = {
    npc: 'npcs',
    bestiario: 'bestiario',
    itens: 'itens',
    item: 'itens',
  };

  // ---------- Utilitários ----------

  const escHtml = window.escHtml;

  // Converte texto com marcadores (ex.: "fale com npc:harbin-wester")
  // em HTML com botões de drill-down. Texto é escapado; nomes idem.
  function parseLinks(texto, aventura) {
    if (!texto) return '';
    const re = /(npc|bestiario|itens|item):([a-z0-9\-]+)/g;
    let out = '';
    let ultimo = 0;
    let m;
    while ((m = re.exec(texto)) !== null) {
      out += escHtml(texto.slice(ultimo, m.index));
      const prefixo = m[1];
      const id = m[2];
      const secao = PREFIXO_PARA_SECAO[prefixo];
      const obj = secao && aventura[secao] ? aventura[secao][id] : null;
      if (obj) {
        const rotulo = escHtml(obj.nome || id);
        out += `<button type="button" class="drill-link" data-tipo="${escHtml(secao)}" data-id="${escHtml(id)}">${rotulo}</button>`;
      } else {
        out += escHtml(m[0]);
      }
      ultimo = re.lastIndex;
    }
    out += escHtml(texto.slice(ultimo));
    return out;
  }

  function painelCard(conteudo, extra) {
    return `<div class="bg-zinc-900 border border-zinc-800 rounded-xl p-4 ${extra || ''}">${conteudo}</div>`;
  }

  function linha(rotulo, valor) {
    if (valor == null || valor === '') return '';
    return `<p class="text-sm text-zinc-300 mt-1"><span class="text-zinc-500">${escHtml(rotulo)}:</span> ${escHtml(valor)}</p>`;
  }

  function listaBlocos(titulo, itens, aventura) {
    if (!itens || !itens.length) return '';
    const linhas = itens.map(it => `
      <div class="mt-2">
        <p class="text-sm font-semibold text-amber-300">${escHtml(it.nome)}</p>
        <p class="text-sm text-zinc-300 leading-snug">${parseLinks(it.descricao, aventura)}</p>
      </div>`).join('');
    return `
      <div class="mt-3">
        <h4 class="text-xs font-bold uppercase tracking-wider text-zinc-500">${escHtml(titulo)}</h4>
        ${linhas}
      </div>`;
  }

  function dicParaArray(dic) {
    if (!dic) return [];
    return Object.keys(dic).map(id => ({ id, ...dic[id] }));
  }

  // ---------- LISTAS ----------

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

  function itemListaCard(tipo, id, nome, sublinhas) {
    const subs = (sublinhas || [])
      .filter(Boolean)
      .map(s => `<p class="text-xs text-zinc-500 truncate">${escHtml(s)}</p>`)
      .join('');
    return `
      <li>
        <button type="button" class="open-detail w-full text-left flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 active:bg-zinc-800 transition-colors"
                data-tipo="${escHtml(tipo)}" data-id="${escHtml(id)}">
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-zinc-100 truncate">${escHtml(nome)}</p>
            ${subs}
          </div>
          <span class="text-zinc-600 text-lg flex-shrink-0">&rsaquo;</span>
        </button>
      </li>`;
  }

  function vazio(msg) {
    return `<div class="text-center text-zinc-600 mt-16">
      <div class="text-4xl mb-3">\u{1F4DC}</div>
      <p class="text-sm">${escHtml(msg)}</p>
    </div>`;
  }

  // ---------- DETALHES ----------

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

  function campoDestaque(rotulo, valor, aventura, cor) {
    if (!valor) return '';
    const cores = {
      amber:   'bg-amber-500/5 border-amber-500/20 text-amber-300',
      rose:    'bg-rose-500/5 border-rose-500/20 text-rose-300',
      sky:     'bg-sky-500/5 border-sky-500/20 text-sky-300',
      emerald: 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300',
    };
    const c = cores[cor] || cores.amber;
    return `<div class="mt-2 text-sm border rounded-lg p-3 ${c.split(' ').slice(0,2).join(' ')}">
      <span class="font-semibold ${c.split(' ')[2]}">${escHtml(rotulo)}:</span>
      <span class="text-zinc-300">${parseLinks(valor, aventura)}</span>
    </div>`;
  }

  // ---------- GANCHOS ----------

  function listaGanchos(aventura) {
    const ganchos = aventura.ganchos || [];
    if (!ganchos.length) return vazio('Nenhum gancho cadastrado.');
    const cards = ganchos.map((g, i) => {
      const fonte = typeof g === 'object' ? g.fonte : null;
      const texto = typeof g === 'object' ? g.texto : g;
      const preview = (texto || '').slice(0, 120) + ((texto || '').length > 120 ? '…' : '');
      return `
        <li>
          <button type="button" class="open-detail w-full text-left bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 active:bg-zinc-800 transition-colors"
                  data-tipo="ganchos" data-id="${i}">
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
    const g = (aventura.ganchos || [])[parseInt(id)];
    if (g == null) return vazio('Gancho não encontrado.');
    const fonte = typeof g === 'object' ? g.fonte : null;
    const texto = typeof g === 'object' ? g.texto : g;
    const corpo = `
      ${fonte ? `<p class="text-xs font-bold uppercase tracking-wider text-amber-500/80 mb-3">${escHtml(fonte)}</p>` : ''}
      <p class="text-sm text-zinc-200 leading-relaxed">${parseLinks(texto || '', aventura)}</p>
    `;
    return `<div class="fade-in">${painelCard(corpo)}</div>`;
  }

  // ---------- MISSÕES ----------

  function classeBadge(status) {
    const s = (status || '').toLowerCase();
    if (s.includes('conclu')) return 'badge-concluida';
    if (s.includes('andamento')) return 'badge-andamento';
    return 'badge-disponivel';
  }

  function listaMissoes(aventura) {
    const missoes = aventura.missoes || [];
    if (!missoes.length) return vazio('Nenhuma missão cadastrada.');
    const cards = missoes.map((m, i) => `
      <li>
        <button type="button" class="open-detail w-full text-left flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 active:bg-zinc-800 transition-colors"
                data-tipo="missoes" data-id="${i}">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <p class="font-semibold text-zinc-100 truncate">${escHtml(m.titulo)}</p>
              <span class="badge ${classeBadge(m.status)} flex-shrink-0">${escHtml(m.status || '—')}</span>
            </div>
            <div class="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5 text-xs text-zinc-500">
              ${m.nivel_sugerido != null ? `<span>Nível ${escHtml(m.nivel_sugerido)}</span>` : ''}
              ${m.localizacao ? `<span>${escHtml(m.localizacao)}</span>` : ''}
            </div>
          </div>
          <span class="text-zinc-600 text-lg flex-shrink-0">&rsaquo;</span>
        </button>
      </li>`).join('');
    return `<ul class="space-y-2 fade-in">${cards}</ul>`;
  }

  function detalheMissao(aventura, id) {
    const m = (aventura.missoes || [])[parseInt(id)];
    if (!m) return vazio('Missão não encontrada.');
    const corpo = `
      <div class="flex items-start justify-between gap-2">
        <h3 class="text-base font-bold text-zinc-100">${escHtml(m.titulo)}</h3>
        <span class="badge ${classeBadge(m.status)} flex-shrink-0">${escHtml(m.status || '—')}</span>
      </div>
      <div class="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-zinc-500">
        ${m.nivel_sugerido != null ? `<span>Nível ${escHtml(m.nivel_sugerido)}</span>` : ''}
        ${m.localizacao ? `<span>${escHtml(m.localizacao)}</span>` : ''}
      </div>
      ${m.objetivo ? `<p class="text-sm text-zinc-300 mt-3 leading-snug">${parseLinks(m.objetivo, aventura)}</p>` : ''}
      ${m.recompensa ? `<p class="text-sm text-amber-300/90 mt-2"><span class="text-zinc-500">Recompensa:</span> ${parseLinks(m.recompensa, aventura)}</p>` : ''}
      ${m.notas_dm ? `<div class="mt-3 text-sm text-zinc-400 bg-zinc-800/40 border border-zinc-700/50 rounded-lg p-3">
          <span class="font-semibold text-zinc-300">Notas do Mestre:</span> ${parseLinks(m.notas_dm, aventura)}
        </div>` : ''}
    `;
    return `<div class="fade-in">${painelCard(corpo)}</div>`;
  }

  // ---------- LOCAIS ----------

  function chip(marker, aventura) {
    const m = /^(npc|bestiario|itens|item):([a-z0-9\-]+)$/.exec(marker || '');
    if (!m) return '';
    const secao = PREFIXO_PARA_SECAO[m[1]];
    const id = m[2];
    const obj = secao && aventura[secao] ? aventura[secao][id] : null;
    if (!obj) return '';
    return `<button type="button" class="chip-link" data-tipo="${escHtml(secao)}" data-id="${escHtml(id)}">${escHtml(obj.nome)}</button>`;
  }

  function grupoChips(titulo, markers, aventura) {
    if (!markers || !markers.length) return '';
    const chips = markers.map(mk => chip(mk, aventura)).filter(Boolean).join('');
    if (!chips) return '';
    return `
      <div class="mt-3">
        <h4 class="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">${escHtml(titulo)}</h4>
        <div class="flex flex-wrap gap-2">${chips}</div>
      </div>`;
  }

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

  // ---------- CONDIÇÕES ----------

  function listaCondicoes(aventura) {
    const itens = dicParaArray(aventura.condicoes)
      .sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt'));
    if (!itens.length) return vazio('Nenhuma condição cadastrada.');
    const cards = itens.map(c => `
      <li>
        <button type="button" class="open-detail w-full text-left flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 active:bg-zinc-800 transition-colors"
                data-tipo="condicoes" data-id="${escHtml(c.id)}">
          <span class="text-2xl flex-shrink-0">${c.icone || '\u{1F300}'}</span>
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-zinc-100 truncate">${escHtml(c.nome)}</p>
            <p class="text-xs text-zinc-500 line-clamp-2">${escHtml(c.resumo || '')}</p>
          </div>
          <span class="text-zinc-600 text-lg flex-shrink-0">&rsaquo;</span>
        </button>
      </li>`).join('');
    return `<ul class="space-y-2 fade-in">${cards}</ul>`;
  }

  function detalheCondicao(aventura, id) {
    const c = aventura.condicoes && aventura.condicoes[id];
    if (!c) return vazio('Condição não encontrada.');
    const efeitos = (c.efeitos || []).map(ef => `
      <div class="mt-2">
        <p class="text-sm font-semibold text-amber-300">${escHtml(ef.nome)}</p>
        <p class="text-sm text-zinc-300 leading-snug">${escHtml(ef.descricao)}</p>
      </div>`).join('');
    const corpo = `
      <div class="flex items-center gap-3">
        <span class="text-3xl">${c.icone || '\u{1F300}'}</span>
        <h3 class="text-lg font-bold text-amber-400">${escHtml(c.nome)}</h3>
      </div>
      ${c.resumo ? `<p class="text-sm italic text-zinc-400 mt-1">${escHtml(c.resumo)}</p>` : ''}
      <div class="stat-divider"></div>
      <h4 class="text-xs font-bold uppercase tracking-wider text-zinc-500">Efeitos</h4>
      ${efeitos || '<p class="text-sm text-zinc-500">Sem efeitos detalhados.</p>'}
    `;
    return `<div class="fade-in">${painelCard(corpo)}</div>`;
  }

  // ---------- BUSCA GERAL ----------

  // Normaliza para busca: remove acentos (U+0300–U+036F) e caixa.
  function normalizar(s) {
    return String(s == null ? '' : s)
      .normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  }

  function construirIndice(aventura) {
    const idx = [];
    for (const [id, b] of Object.entries(aventura.bestiario || {}))
      idx.push({ tipo: 'bestiario', id, label: 'Monstro', nome: b.nome, sub: b.tipo_alinhamento,
        campos: [normalizar(b.nome), normalizar(b.tipo_alinhamento)] });
    for (const [id, n] of Object.entries(aventura.npcs || {}))
      idx.push({ tipo: 'npcs', id, label: 'NPC', nome: n.nome, sub: n.papel || n.local,
        campos: [normalizar(n.nome), normalizar(n.papel), normalizar(n.local)] });
    for (const [id, i] of Object.entries(aventura.itens || {}))
      idx.push({ tipo: 'itens', id, label: 'Item', nome: i.nome, sub: i.tipo,
        campos: [normalizar(i.nome), normalizar(i.tipo), normalizar(i.efeito)] });
    for (const [id, l] of Object.entries(aventura.locais || {}))
      idx.push({ tipo: 'locais', id, label: 'Local', nome: l.nome, sub: l.tipo,
        campos: [normalizar(l.nome), normalizar(l.tipo), normalizar(l.resumo)] });
    (aventura.missoes || []).forEach((m, i) =>
      idx.push({ tipo: 'missoes', id: String(i), label: 'Missão', nome: m.titulo, sub: m.localizacao,
        campos: [normalizar(m.titulo), normalizar(m.objetivo), normalizar(m.localizacao)] }));
    (aventura.ganchos || []).forEach((g, i) => {
      const texto = typeof g === 'object' ? g.texto : g;
      const fonte = typeof g === 'object' ? g.fonte : '';
      idx.push({ tipo: 'ganchos', id: String(i), label: 'Gancho', nome: fonte || 'Gancho',
        sub: (texto || '').slice(0, 70), campos: [normalizar(texto), normalizar(fonte)] });
    });
    for (const [id, c] of Object.entries(aventura.condicoes || {}))
      idx.push({ tipo: 'condicoes', id, label: 'Condição', nome: c.nome, sub: c.resumo,
        campos: [normalizar(c.nome), normalizar(c.resumo)] });
    return idx;
  }

  function sugestoesFoco(aventura) {
    const grupos = [
      { chave: 'bestiario', tipo: 'bestiario', label: 'Monstro', getSub: b => b.tipo_alinhamento },
      { chave: 'npcs',      tipo: 'npcs',      label: 'NPC',     getSub: n => n.papel || n.local },
      { chave: 'locais',    tipo: 'locais',    label: 'Local',   getSub: l => l.tipo },
    ];
    const res = [];
    for (const g of grupos)
      for (const [id, obj] of Object.entries(aventura[g.chave] || {}).slice(0, 3))
        res.push(resultadoDetalhe(g.tipo, id, obj.nome, g.label, g.getSub(obj)));
    if (!res.length) return '';
    return `<p class="text-xs text-zinc-500 mb-2">Acesso rápido</p>
      <ul class="space-y-2 fade-in">${res.join('')}</ul>`;
  }

  function resultadoDetalhe(tipo, id, nome, label, sub) {
    return `
      <li>
        <button type="button" class="open-detail w-full text-left flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 active:bg-zinc-800 transition-colors"
                data-tipo="${escHtml(tipo)}" data-id="${escHtml(id)}">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <p class="font-semibold text-zinc-100 truncate">${escHtml(nome)}</p>
              <span class="res-tag">${escHtml(label)}</span>
            </div>
            ${sub ? `<p class="text-xs text-zinc-500 truncate">${escHtml(sub)}</p>` : ''}
          </div>
          <span class="text-zinc-600 text-lg flex-shrink-0">&rsaquo;</span>
        </button>
      </li>`;
  }

  function resultadoAba(aba, nome, label, sub) {
    return `
      <li>
        <button type="button" class="goto-aba w-full text-left flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 active:bg-zinc-800 transition-colors"
                data-aba="${escHtml(aba)}">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <p class="font-semibold text-zinc-100 truncate">${escHtml(nome)}</p>
              <span class="res-tag">${escHtml(label)}</span>
            </div>
            ${sub ? `<p class="text-xs text-zinc-500 truncate">${escHtml(sub)}</p>` : ''}
          </div>
          <span class="text-zinc-600 text-lg flex-shrink-0">&rsaquo;</span>
        </button>
      </li>`;
  }

  function resultadosBusca(aventura, indice, query) {
    const q = normalizar(query);
    if (!q) return '';
    const res = [];
    for (const e of indice)
      if (e.campos.some(c => c.includes(q)))
        res.push(resultadoDetalhe(e.tipo, e.id, e.nome, e.label, e.sub));
    if (!res.length) {
      return `<div class="text-center text-zinc-600 mt-16">
        <div class="text-4xl mb-3">\u{1F50D}</div>
        <p class="text-sm">Nada encontrado para "${escHtml(query)}".</p>
      </div>`;
    }
    return `<p class="text-xs text-zinc-500 mb-2">${res.length} resultado(s)</p>
      <ul class="space-y-2 fade-in">${res.join('')}</ul>`;
  }

  function exportarMarkdown(aventura) {
    const md = [];
    const sep = () => md.push('');

    md.push(`# ${aventura.titulo || 'Aventura'}`);
    if (aventura.nivel_recomendado) md.push(`**Níveis:** ${aventura.nivel_recomendado}`);
    if (aventura.cenario) md.push(`**Cenário:** ${aventura.cenario}`);
    sep();

    const ganchos = aventura.ganchos || [];
    if (ganchos.length) {
      md.push('## Ganchos');
      ganchos.forEach(g => {
        const fonte = typeof g === 'object' ? g.fonte : null;
        const texto = typeof g === 'object' ? g.texto : g;
        if (fonte) md.push(`**${fonte}**`);
        md.push(texto || ''); sep();
      });
    }

    if ((aventura.missoes || []).length) {
      md.push('## Missões');
      aventura.missoes.forEach(m => {
        md.push(`### ${m.titulo} [${m.status || '—'}]`);
        if (m.localizacao) md.push(`*${m.localizacao}*`);
        if (m.objetivo) { sep(); md.push(m.objetivo); }
        if (m.recompensa) md.push(`**Recompensa:** ${m.recompensa}`);
        if (m.notas_dm) md.push(`> 🗒 ${m.notas_dm}`);
        sep();
      });
    }

    const locais = Object.values(aventura.locais || {});
    if (locais.length) {
      md.push('## Locais');
      locais.forEach(l => {
        md.push(`### ${l.nome}`);
        if (l.tipo) md.push(`*${l.tipo}*`);
        if (l.resumo) { sep(); md.push(l.resumo); }
        if (l.perigos) md.push(`**Perigos:** ${l.perigos}`);
        if (l.tesouro) md.push(`**Tesouro:** ${l.tesouro}`);
        if (l.conexoes) md.push(`**Conexões:** ${l.conexoes}`);
        sep();
      });
    }

    const npcs = Object.values(aventura.npcs || {});
    if (npcs.length) {
      md.push('## NPCs');
      npcs.forEach(n => {
        md.push(`### ${n.nome}`);
        if (n.papel) md.push(`*${n.papel}*`);
        if (n.local) md.push(`**Local:** ${n.local}`);
        if (n.descricao) { sep(); md.push(n.descricao); }
        if (n.motivacao) md.push(`**Motivação:** ${n.motivacao}`);
        if (n.segredos) md.push(`**Segredos:** ${n.segredos}`);
        if (n.interacao) md.push(`**Interação:** ${n.interacao}`);
        sep();
      });
    }

    const bestiario = Object.values(aventura.bestiario || {});
    if (bestiario.length) {
      md.push('## Bestiário');
      bestiario.forEach(b => {
        md.push(`### ${b.nome}`);
        md.push(`*${b.tipo_alinhamento || ''}*`);
        const stats = [];
        if (b.ca != null) stats.push(`CA ${b.ca}`);
        if (b.pv != null) stats.push(`PV ${b.pv}`);
        if (b.nd != null) stats.push(`ND ${b.nd}`);
        if (stats.length) md.push(stats.join(' · '));
        sep();
      });
    }

    const itens = Object.values(aventura.itens || {});
    if (itens.length) {
      md.push('## Itens');
      itens.forEach(i => {
        md.push(`### ${i.nome}`);
        if (i.tipo) md.push(`*${i.tipo}*`);
        if (i.efeito) { sep(); md.push(i.efeito); }
        sep();
      });
    }

    return md.join('\n');
  }

  // ---------- Expor ----------

  window.Renderers = {
    escHtml,
    parseLinks,
    construirIndice,
    resultadosBusca,
    sugestoesFoco,
    exportarMarkdown,
    listas: {
      bestiario: listaBestiario,
      npcs: listaNpcs,
      itens: listaItens,
      ganchos: listaGanchos,
      missoes: listaMissoes,
      locais: listaLocais,
      condicoes: listaCondicoes,
    },
    detalhes: {
      bestiario: detalheBestiario,
      npcs: detalheNpc,
      itens: detalheItem,
      ganchos: detalheGancho,
      missoes: detalheMissao,
      locais: detalheLocal,
      condicoes: detalheCondicao,
    },
  };
})();
