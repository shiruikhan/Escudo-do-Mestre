// Escudo do Mestre — Núcleo de renderização
//
// Helpers e estruturas compartilhadas entre os módulos de domínio
// (renderers-*.js). Deve ser carregado depois de utils.js e marcadores.js e
// antes dos módulos de domínio. Expõe window.Renderers.listas/detalhes
// (preenchidos pelos módulos de domínio) e window.Renderers._ (helpers
// internos, não é API pública).

(function () {
  'use strict';

  const escHtml = window.escHtml;
  const { PREFIXO_PARA_SECAO, PREFIXOS_RE } = window.MARCADORES;

  // ---------- Rolagem de dados ----------
  // Marca notações de dado (2d6, 1d8+3, 4d6-1) no texto JÁ ESCAPADO como
  // botões cliáveis; o app.js rola e mostra o resultado num toast.
  const DADOS_RE = /\b(\d{1,2})d(\d{1,3})([+-]\d{1,3})?\b/g;
  function marcarDados(txtEscapado) {
    return txtEscapado.replace(DADOS_RE, (tudo, n, faces, mod) =>
      `<button type="button" class="dice-link" data-n="${n}" data-faces="${faces}" data-mod="${mod || ''}" title="Rolar ${tudo}">${tudo}</button>`);
  }

  // Converte texto com marcadores (ex.: "fale com npc:harbin-wester")
  // em HTML com botões de drill-down. Texto é escapado; nomes idem.
  // Notações de dado nos trechos de texto viram botões de rolagem.
  function parseLinks(texto, aventura) {
    if (!texto) return '';
    const re = new RegExp(PREFIXOS_RE + ':([a-z0-9\\-]+)', 'g');
    let out = '';
    let ultimo = 0;
    let m;
    while ((m = re.exec(texto)) !== null) {
      out += marcarDados(escHtml(texto.slice(ultimo, m.index)));
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
    out += marcarDados(escHtml(texto.slice(ultimo)));
    return out;
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

  // Normaliza para busca: remove acentos (U+0300–U+036F) e caixa.
  function normalizar(s) {
    return String(s == null ? '' : s)
      .normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  }

  // ---------- IDs estáveis para missões e ganchos ----------
  // Missões e ganchos são arrays no JSON; identificá-los pelo índice quebra
  // posições salvas e links quando a ordem muda. Derivamos um slug do
  // título/fonte (com desambiguação -2, -3...) e memoizamos na aventura.
  function slug(s) {
    return normalizar(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50);
  }

  function listasComId(aventura) {
    if (aventura._listasId) return aventura._listasId;
    const res = { missoes: [], ganchos: [], mapas: { missoes: {}, ganchos: {} } };
    const usados = Object.create(null);
    function idUnico(base, reserva) {
      let id = base || reserva;
      if (usados[id]) { let n = 2; while (usados[id + '-' + n]) n++; id = id + '-' + n; }
      usados[id] = true;
      return id;
    }
    (aventura.missoes || []).forEach((m, i) => {
      const id = idUnico(slug(m.titulo || ''), 'missao-' + i);
      res.missoes.push({ id, obj: m });
      res.mapas.missoes[id] = m;
    });
    (aventura.ganchos || []).forEach((g, i) => {
      const fonte = typeof g === 'object' ? g.fonte : '';
      const texto = typeof g === 'object' ? g.texto : g;
      const base = slug(fonte || '') || slug(String(texto || '').split(/\s+/).slice(0, 6).join(' '));
      const id = idUnico(base, 'gancho-' + i);
      res.ganchos.push({ id, obj: g });
      res.mapas.ganchos[id] = g;
    });
    aventura._listasId = res;
    return res;
  }

  // Resolve missão/gancho por id estável, aceitando índice numérico como
  // legado (posições salvas em localStorage antes desta mudança).
  function resolverLista(aventura, tipo, id) {
    const listas = listasComId(aventura);
    const obj = listas.mapas[tipo][id];
    if (obj) return obj;
    if (/^\d+$/.test(id)) return (aventura[tipo] || [])[parseInt(id, 10)] || null;
    return null;
  }

  // ---------- Estado de sessão (localStorage) ----------
  // Overrides do Mestre durante a sessão: status de missão e PV atual de
  // monstros. Gravados pelo app.js com as mesmas chaves.
  function lerSessao(tipo, aventuraId) {
    try {
      return JSON.parse(localStorage.getItem('escudo_' + tipo + '_' + aventuraId)) || {};
    } catch (_) { return {}; }
  }

  // ---------- Blocos visuais ----------
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
      marcarDados,
      slug,
      listasComId,
      resolverLista,
      lerSessao,
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
