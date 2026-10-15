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
  // Painel de detalhe. `extra` acrescenta classes (ex.: "ficha" na criatura;
  // "painel-neutro" troca a régua vermelha por filete neutro).
  function painelCard(conteudo, extra) {
    return `<div class="painel ${extra || 'painel-neutro'}">${conteudo}</div>`;
  }

  // Cabeçalho de detalhe: rótulo de seção → nome → linha em itálico.
  function cabecalhoDetalhe(rotulo, nome, sub) {
    return `
      ${rotulo ? `<p class="rotulo-secao cabeca">${escHtml(rotulo)}</p>` : ''}
      <h3 class="titulo-entidade">${escHtml(nome)}</h3>
      ${sub ? `<p class="subtitulo-entidade">${escHtml(sub)}</p>` : ''}`;
  }

  function linha(rotulo, valor) {
    if (valor == null || valor === '') return '';
    return `<p class="text-[15px] text-zinc-400 mt-1"><span class="font-bold text-zinc-300">${escHtml(rotulo)}</span> ${escHtml(valor)}</p>`;
  }

  function listaBlocos(titulo, itens, aventura) {
    if (!itens || !itens.length) return '';
    const linhas = itens.map(it => `
      <p class="texto-livro"><span class="acao-nome">${escHtml(it.nome)}.</span> ${parseLinks(it.descricao, aventura)}</p>`).join('');
    return `
      <h4 class="titulo-secao">${escHtml(titulo)}</h4>
      ${linhas}`;
  }

  // Campo rotulado de detalhe. Tons: ouro | arcano | musgo (losango no
  // rótulo), segredo | perigo (fundo tingido), mestre (caixa tracejada).
  // `htmlValor` já deve vir escapado (parseLinks/escHtml).
  function campo(rotulo, htmlValor, tom) {
    if (!htmlValor) return '';
    return `<div class="campo campo-${tom || 'ouro'}">
      <p class="rotulo-secao">${escHtml(rotulo)}</p>
      <p class="texto-livro">${htmlValor}</p>
    </div>`;
  }

  function dicParaArray(dic) {
    if (!dic) return [];
    return Object.keys(dic).map(id => ({ id, ...dic[id] }));
  }

  // Lista de verbetes: um painel com linhas separadas por filete.
  function listaVerbetes(itensHtml, extra) {
    return `<ul class="lista-verbetes fade-in ${extra || ''}">${itensHtml}</ul>`;
  }

  // Verbete de lista. `dados` (opcional): [{ v: '1/4', r: 'ND' }, …] alinhados à direita.
  function itemListaCard(tipo, id, nome, sublinhas, dados) {
    const subs = (sublinhas || [])
      .filter(Boolean)
      .map(s => `<span class="verbete-sub">${escHtml(s)}</span>`)
      .join('');
    const dd = (dados || []).filter(d => d && d.v != null && d.v !== '')
      .map(d => `<span class="verbete-dado"><b>${escHtml(d.v)}</b><small>${escHtml(d.r)}</small></span>`).join('');
    return `
      <li>
        <button type="button" class="open-detail verbete"
                data-tipo="${escHtml(tipo)}" data-id="${escHtml(id)}">
          <span class="verbete-corpo">
            <span class="verbete-nome">${escHtml(nome)}</span>
            ${subs}
          </span>
          ${dd ? `<span class="verbete-dados">${dd}</span>` : ''}
          <span class="verbete-seta" aria-hidden="true"></span>
        </button>
      </li>`;
  }

  function vazio(msg) {
    return `<p class="vazio">${escHtml(msg)}</p>`;
  }

  // Compatível com as chamadas antigas (cor amber/rose/sky/emerald).
  const TOM_DA_COR = { amber: 'ouro', rose: 'segredo', sky: 'arcano', emerald: 'musgo' };
  function campoDestaque(rotulo, valor, aventura, cor) {
    if (!valor) return '';
    return campo(rotulo, parseLinks(valor, aventura), TOM_DA_COR[cor] || cor || 'ouro');
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
      <div class="mt-4">
        <h4 class="rotulo-secao">${escHtml(titulo)}</h4>
        <div class="flex flex-wrap gap-2">${chips}</div>
      </div>`;
  }

  // ---------- Encontros por local ----------
  // local.encontros: [{ area?, ref: "bestiario:id"|"npc:id", qtd?, nota? }].
  // Cada ref vira linha "Nome ×qtd". qtd: número (4 -> ×4) ou texto ("2d4",
  // "1 por jogador"). Entradas antigas em local.criaturas/npcs (sem
  // quantidade) continuam valendo e são mescladas nos helpers abaixo.
  const REF_RE = new RegExp('^' + PREFIXOS_RE + ':([a-z0-9\\-]+)$');

  function resolverRef(ref, aventura) {
    const m = REF_RE.exec(ref || '');
    if (!m) return null;
    const secao = PREFIXO_PARA_SECAO[m[1]];
    const id = m[2];
    const obj = secao && aventura[secao] ? aventura[secao][id] : null;
    return obj ? { secao, id, obj } : null;
  }

  function rotuloQtd(qtd) {
    if (qtd == null || qtd === '') return '';
    if (typeof qtd === 'number') return qtd === 1 ? '' : '×' + qtd;
    return marcarDados(escHtml(String(qtd)));
  }

  // ---------- Salas (areas[] do local) ----------
  // Cada área vira uma "sala" endereçável: id = <idLocal>:<slug>, único dentro do local.
  function rotuloArea(a) { return [a.codigo, a.nome].filter(Boolean).join(' \u2014 '); }

  function salasDoLocal(aventura, lid) {
    const l = aventura.locais && aventura.locais[lid];
    if (!l || !l.areas) return [];
    const usados = Object.create(null);
    return l.areas.map((a, i) => {
      let base = slug(a.codigo || a.nome || 'sala') || 'sala';
      let s = base, n = 2;
      while (usados[s]) s = base + '-' + (n++);
      usados[s] = true;
      return { id: lid + ':' + s, lid, indice: i, area: a, rotulo: rotuloArea(a) };
    });
  }

  function resolverSala(aventura, id) {
    const lid = String(id || '').split(':')[0];
    const lista = salasDoLocal(aventura, lid);
    const i = lista.findIndex(s => s.id === id);
    return i < 0 ? null : { sala: lista[i], anterior: lista[i - 1] || null, proxima: lista[i + 1] || null, total: lista.length, posicao: i + 1, lista };
  }

  // Ocupantes (encontros) cuja `area` é exatamente o rótulo da sala.
  function ocupantesDaSala(l, rotulo) {
    return (l.encontros || []).filter(e => e.area && e.area === rotulo);
  }

  // Lista normalizada de ocupantes de um local: encontros + legado
  // (criaturas/npcs que não aparecem em nenhum encontro).
  function ocupantesDoLocal(l) {
    const lista = (l.encontros || []).map(e => ({ area: e.area || '', ref: e.ref, qtd: e.qtd, nota: e.nota || '' }));
    const jaTem = new Set(lista.map(e => e.ref));
    [...(l.criaturas || []), ...(l.npcs || [])].forEach(ref => {
      if (!jaTem.has(ref)) { jaTem.add(ref); lista.push({ area: '', ref, qtd: null, nota: '', legado: true }); }
    });
    return lista;
  }

  // Reverso: em quais locais uma criatura/NPC aparece.
  function locaisDe(aventura, secao, id) {
    const salaPorRotulo = {};
    const res = [];
    for (const [lid, l] of Object.entries(aventura.locais || {})) {
      ocupantesDoLocal(l).forEach(o => {
        const r = resolverRef(o.ref, aventura);
        if (r && r.secao === secao && r.id === id) {
          const sala = o.area ? salasDoLocal(aventura, lid).find(s => s.rotulo === o.area) : null;
          res.push({ lid, nome: l.nome, area: o.area, qtd: o.qtd, nota: o.nota, salaId: sala ? sala.id : null });
        }
      });
    }
    return res;
  }

  function linhaOcupante(o, aventura) {
    const r = resolverRef(o.ref, aventura);
    if (!r) return '';
    const q = rotuloQtd(o.qtd);
    return `<li class="enc-linha">
      <button type="button" class="chip-link" data-tipo="${escHtml(r.secao)}" data-id="${escHtml(r.id)}">${escHtml(r.obj.nome)}</button>
      ${q ? `<span class="enc-qtd">${q}</span>` : ''}
      ${o.nota ? `<span class="enc-nota">${parseLinks(o.nota, aventura)}</span>` : ''}
    </li>`;
  }

  // Bloco "Quem está aqui" agrupado por área/sala (ordem de aparição).
  function blocoOcupantes(l, aventura, soSemSala) {
    let todos = ocupantesDoLocal(l);
    if (soSemSala) {
      const rotulos = new Set((l.areas || []).map(rotuloArea));
      todos = todos.filter(o => !(o.area && rotulos.has(o.area)));
    }
    if (!todos.length) return '';
    const grupos = new Map();
    todos.forEach(o => {
      const k = o.area || '';
      if (!grupos.has(k)) grupos.set(k, []);
      grupos.get(k).push(o);
    });
    const html = [...grupos.entries()].map(([area, os]) => {
      const linhas = os.map(o => linhaOcupante(o, aventura)).join('');
      if (!linhas) return '';
      return `<div class="enc-area">
        ${area ? `<p class="enc-area-nome">${escHtml(area)}</p>` : ''}
        <ul class="enc-lista">${linhas}</ul>
      </div>`;
    }).join('');
    if (!html) return '';
    return `<div class="mt-4">
      <h4 class="rotulo-secao">${soSemSala ? 'Fora das salas (geral / viagem)' : 'Quem está aqui'}</h4>
      ${html}
    </div>`;
  }

  // Seção "Aparece em" na ficha de monstro/NPC.
  function blocoApareceEm(aventura, secao, id) {
    const locs = locaisDe(aventura, secao, id);
    if (!locs.length) return '';
    const linhas = locs.map(x => {
      const q = rotuloQtd(x.qtd);
      return `<li class="enc-linha">
        <button type="button" class="chip-link" data-tipo="locais" data-id="${escHtml(x.lid)}">${escHtml(x.nome)}</button>
        ${q ? `<span class="enc-qtd">${q}</span>` : ''}
        ${x.area ? (x.salaId
          ? `<button type="button" class="chip-link" data-tipo="sala" data-id="${escHtml(x.salaId)}">${escHtml(x.area)}</button>`
          : `<span class="enc-nota">${escHtml(x.area)}</span>`) : ''}
        ${x.nota ? `<span class="enc-nota">${parseLinks(x.nota, aventura)}</span>` : ''}
      </li>`;
    }).join('');
    return `<div class="stat-divider"></div>
      <h4 class="rotulo-secao">Aparece em</h4>
      <ul class="enc-lista">${linhas}</ul>`;
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
        <button type="button" class="open-detail verbete"
                data-tipo="${escHtml(tipo)}" data-id="${escHtml(id)}">
          <span class="verbete-corpo">
            <span class="flex items-center gap-2 min-w-0">
              <span class="verbete-nome">${escHtml(nome)}</span>
              <span class="res-tag">${escHtml(label)}</span>
            </span>
            ${sub ? `<span class="verbete-sub">${escHtml(sub)}</span>` : ''}
          </span>
          <span class="verbete-seta" aria-hidden="true"></span>
        </button>
      </li>`;
  }

  function resultadoAba(aba, nome, label, sub) {
    return `
      <li>
        <button type="button" class="goto-aba verbete"
                data-aba="${escHtml(aba)}">
          <span class="verbete-corpo">
            <span class="flex items-center gap-2 min-w-0">
              <span class="verbete-nome">${escHtml(nome)}</span>
              <span class="res-tag">${escHtml(label)}</span>
            </span>
            ${sub ? `<span class="verbete-sub">${escHtml(sub)}</span>` : ''}
          </span>
          <span class="verbete-seta" aria-hidden="true"></span>
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
      cabecalhoDetalhe,
      campo,
      listaVerbetes,
      linha,
      listaBlocos,
      dicParaArray,
      itemListaCard,
      vazio,
      campoDestaque,
      textoPlano,
      chip,
      grupoChips,
      resolverRef,
      rotuloQtd,
      ocupantesDoLocal,
      locaisDe,
      blocoOcupantes,
      rotuloArea,
      salasDoLocal,
      resolverSala,
      ocupantesDaSala,
      linhaOcupante,
      blocoApareceEm,
      classeBadge,
      normalizar,
      resultadoDetalhe,
      resultadoAba,
    },
  };
})();
