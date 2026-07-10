// Escudo do Mestre — Núcleo de renderização
//
// Helpers e estruturas compartilhadas entre os módulos de domínio
// (renderers-*.js). Deve ser carregado antes deles e depois de utils.js.
// Expõe window.Renderers.listas/detalhes (preenchidos pelos módulos de
// domínio) e window.Renderers._ (helpers internos, não é API pública).

(function () {
  'use strict';

  const escHtml = window.escHtml;

  // Mapeia o prefixo usado nos textos (npc:, bestiario:, itens:, local:) para a
  // chave da seção correspondente no JSON da aventura.
  const PREFIXO_PARA_SECAO = {
    npc: 'npcs',
    bestiario: 'bestiario',
    itens: 'itens',
    item: 'itens',
    locais: 'locais',
    local: 'locais',
  };

  // Alternação com os prefixos mais longos primeiro (itens antes de item,
  // locais antes de local) para o regex consumir o prefixo inteiro.
  const PREFIXOS_RE = '(npc|bestiario|itens|item|locais|local)';

  // Converte texto com marcadores (ex.: "fale com npc:harbin-wester")
  // em HTML com botões de drill-down. Texto é escapado; nomes idem.
  function parseLinks(texto, aventura) {
    if (!texto) return '';
    const re = new RegExp(PREFIXOS_RE + ':([a-z0-9\\-]+)', 'g');
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

  // Versão texto-puro de parseLinks para prévias: troca cada marcador pelo
  // nome da entidade, sem gerar botões (evita botão dentro de botão).
  function textoPlano(texto, aventura) {
    if (!texto) return '';
    const re = new RegExp(PREFIXOS_RE + ':([a-z0-9\\-]+)', 'g');
    return texto.replace(re, (tudo, prefixo, id) => {
      const secao = PREFIXO_PARA_SECAO[prefixo];
      const obj = secao && aventura[secao] ? aventura[secao][id] : null;
      return obj ? (obj.nome || id) : tudo;
    });
  }

  function chip(marker, aventura) {
    const m = new RegExp('^' + PREFIXOS_RE + ':([a-z0-9\\-]+)$').exec(marker || '');
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

  function classeBadge(status) {
    const s = (status || '').toLowerCase();
    if (s.includes('conclu')) return 'badge-concluida';
    if (s.includes('andamento')) return 'badge-andamento';
    return 'badge-disponivel';
  }

  // Normaliza para busca: remove acentos (U+0300–U+036F) e caixa.
  function normalizar(s) {
    return String(s == null ? '' : s)
      .normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
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

  window.Renderers = {
    escHtml,
    parseLinks,
    listas: {},
    detalhes: {},
    _: {
      PREFIXO_PARA_SECAO,
      painelCard,
      linha,
      listaBlocos,
      dicParaArray,
      itemListaCard,
      vazio,
      campoDestaque,
      textoPlano,
      chip,
      grupoChips,
      classeBadge,
      normalizar,
      resultadoDetalhe,
      resultadoAba,
    },
  };
})();
