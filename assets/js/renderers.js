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

  function escHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

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
        // Referência quebrada: mostra o texto cru sem virar link.
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

  // ---------- LISTAS ----------

  function dicParaArray(dic) {
    if (!dic) return [];
    return Object.keys(dic).map(id => ({ id, ...dic[id] }));
  }

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
    const cards = ganchos.map(g => {
      const fonte = typeof g === 'object' ? g.fonte : null;
      const texto = typeof g === 'object' ? g.texto : g;
      return painelCard(`
        ${fonte ? `<p class="text-xs font-bold uppercase tracking-wider text-amber-500/80 mb-1">${escHtml(fonte)}</p>` : ''}
        <p class="text-sm text-zinc-200 leading-snug">${parseLinks(texto, aventura)}</p>
      `, 'mb-2');
    }).join('');
    return `<div class="fade-in">${cards}</div>`;
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
    const cards = missoes.map(m => painelCard(`
      <div class="flex items-start justify-between gap-2">
        <h3 class="text-base font-bold text-zinc-100">${escHtml(m.titulo)}</h3>
        <span class="badge ${classeBadge(m.status)} flex-shrink-0">${escHtml(m.status || '—')}</span>
      </div>
      <div class="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-zinc-500">
        ${m.nivel_sugerido != null ? `<span>Nível ${escHtml(m.nivel_sugerido)}</span>` : ''}
        ${m.localizacao ? `<span>${escHtml(m.localizacao)}</span>` : ''}
      </div>
      ${m.objetivo ? `<p class="text-sm text-zinc-300 mt-2 leading-snug">${parseLinks(m.objetivo, aventura)}</p>` : ''}
      ${m.recompensa ? `<p class="text-sm text-amber-300/90 mt-2"><span class="text-zinc-500">Recompensa:</span> ${parseLinks(m.recompensa, aventura)}</p>` : ''}
      ${m.notas_dm ? `<div class="mt-2 text-sm text-zinc-400 bg-zinc-800/40 border border-zinc-700/50 rounded-lg p-3">
          <span class="font-semibold text-zinc-300">Notas do Mestre:</span> ${parseLinks(m.notas_dm, aventura)}
        </div>` : ''}
    `, 'mb-2')).join('');
    return `<div class="fade-in">${cards}</div>`;
  }

  // ---------- MAPAS ----------

  function listaMapas(aventura) {
    const mapas = aventura.mapas || [];
    if (!mapas.length) return vazio('Nenhum mapa cadastrado.');
    const cards = mapas.map((mp, idx) => `
      <div class="mb-3">
        <p class="text-sm font-semibold text-zinc-200 mb-2">${escHtml(mp.nome)}</p>
        <button type="button" class="open-map block w-full rounded-xl overflow-hidden border border-zinc-800" data-idx="${idx}">
          <img src="${escHtml(mp.url)}" alt="${escHtml(mp.nome)}"
               class="w-full h-auto block"
               onerror="this.parentElement.innerHTML='&lt;div class=\\'mapa-placeholder\\'&gt;\u{1F5FA}️ Mapa não disponível&lt;br&gt;${escHtml(mp.url)}&lt;/div&gt;'">
        </button>
      </div>`).join('');
    return `<div class="fade-in">${cards}</div>`;
  }

  // ---------- Expor ----------

  window.Renderers = {
    escHtml,
    parseLinks,
    listas: {
      bestiario: listaBestiario,
      npcs: listaNpcs,
      itens: listaItens,
      ganchos: listaGanchos,
      missoes: listaMissoes,
      mapas: listaMapas,
    },
    detalhes: {
      bestiario: detalheBestiario,
      npcs: detalheNpc,
      itens: detalheItem,
    },
  };
})();
