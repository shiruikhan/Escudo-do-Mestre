// Escudo do Mestre — Gerenciador de Estado Global, Roteador SPA e Histórico de Navegação
//
// Carrega o JSON da aventura (id vindo da query string), monta a barra de
// abas e gerencia a navegação reativa drill-down / drill-up.
//
// Roteamento por hash: o fragmento da URL é a fonte de verdade da navegação.
//   #bestiario            → aba
//   #npcs/sildar          → detalhe (tipo/id)
// Cada navegação vira uma entrada real no histórico do navegador, então o
// botão físico "voltar" do celular funciona, e uma ficha específica pode ser
// favoritada ou compartilhada (aventura.html?id=x#npcs/sildar).

(function () {
  'use strict';

  const ABAS = [
    { id: 'bestiario', rotulo: 'Bestiário', icone: '\u{1F409}' },
    { id: 'npcs',      rotulo: 'NPCs',      icone: '\u{1F9D9}' },
    { id: 'itens',     rotulo: 'Itens',     icone: '✨' },
    { id: 'ganchos',   rotulo: 'Ganchos',   icone: '\u{1FA9D}' },
    { id: 'missoes',   rotulo: 'Missões',   icone: '\u{1F4DC}' },
    { id: 'locais',    rotulo: 'Locais',    icone: '\u{1F5FA}' },
    { id: 'condicoes', rotulo: 'Condições', icone: '\u{1F300}' },
    { id: 'eventos',   rotulo: 'Eventos de Estrada', icone: '\u{1F3B2}' },
  ];

  const state = {
    aventura: null,
    indice: [],
    aba: 'bestiario',
    foco: null,
    historico: [],   // pilha de hashes anteriores — alimenta o botão "Voltar"
  };

  const el = {};
  let hashAnterior = '';
  let resetPilha = false;

  function getParam(nome) {
    return new URLSearchParams(window.location.search).get(nome);
  }

  function debounce(fn, ms) {
    let t;
    return function (...args) { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), ms); };
  }

  // ---------- Hash ----------
  function hashAtual() {
    return decodeURIComponent((window.location.hash || '').replace(/^#/, ''));
  }

  function parseHash(h) {
    if (!h) return null;
    const barra = h.indexOf('/');
    if (barra > 0) {
      const tipo = h.slice(0, barra);
      const id = h.slice(barra + 1);
      if (id && window.Renderers.detalhes[tipo]) return { foco: { tipo, id } };
      return null;
    }
    if (ABAS.some(a => a.id === h)) return { aba: h };
    return null;
  }

  function hashDoEstado() {
    return state.foco ? state.foco.tipo + '/' + state.foco.id : state.aba;
  }

  function navegar(novoHash) {
    if (hashAtual() === novoHash) {
      if (resetPilha) { state.historico = []; resetPilha = false; }
      render();
      return;
    }
    window.location.hash = novoHash; // dispara hashchange, que aplica e renderiza
  }

  function aplicarHash() {
    const h = hashAtual();
    const alvo = parseHash(h);

    // Pilha do botão "Voltar": se o novo hash é o topo da pilha, foi um
    // retorno (pop); senão, é navegação para frente (push do anterior).
    // Trocar de aba zera a pilha (contexto novo).
    if (resetPilha) {
      state.historico = [];
      resetPilha = false;
    } else if (state.historico.length && state.historico[state.historico.length - 1] === h) {
      state.historico.pop();
    } else if (hashAnterior && hashAnterior !== h) {
      state.historico.push(hashAnterior);
    }
    hashAnterior = h;

    if (alvo && alvo.foco) {
      state.foco = alvo.foco;
      if (ABAS.some(a => a.id === alvo.foco.tipo)) state.aba = alvo.foco.tipo;
    } else if (alvo && alvo.aba) {
      state.aba = alvo.aba;
      state.foco = null;
    } else {
      state.foco = null; // hash vazio/inválido → lista da aba atual
    }
    render();
  }

  // ---------- Posição salva ----------
  function salvarPosicao() {
    const id = getParam('id');
    if (!id) return;
    try { localStorage.setItem('escudo_pos_' + id, JSON.stringify({ aba: state.aba, foco: state.foco })); } catch (_) {}
  }

  function restaurarPosicao() {
    const id = getParam('id');
    if (!id) return;
    try {
      const saved = JSON.parse(localStorage.getItem('escudo_pos_' + id));
      if (saved && saved.aba) { state.aba = saved.aba; state.foco = saved.foco || null; }
    } catch (_) {}
  }

  // ---------- Carga de dados ----------
  async function carregarAventura(id) {
    const idx = await fetch('data/aventuras.json').then(r => {
      if (!r.ok) throw new Error('Manifest não encontrado (HTTP ' + r.status + ')');
      return r.json();
    });
    const meta = idx.find(a => a.id === id);
    if (!meta) throw new Error('Aventura não encontrada no índice: ' + id);
    const dados = await fetch('data/aventuras/' + meta.arquivo).then(r => {
      if (!r.ok) throw new Error('Arquivo da aventura não encontrado: ' + meta.arquivo);
      return r.json();
    });
    // Regras globais compartilhadas entre aventuras (condições e eventos de estrada),
    // buscadas em paralelo. Falha de rede é sinalizada em dados.erros para
    // diferenciar "sem itens" de "não carregou".
    dados.erros = {};
    async function carregarGlobal(url, chave) {
      try {
        const r = await fetch(url);
        dados[chave] = r.ok ? await r.json() : {};
        if (!r.ok) dados.erros[chave] = true;
      } catch (_) {
        dados[chave] = {};
        dados.erros[chave] = true;
      }
    }
    await Promise.all([
      carregarGlobal('data/condicoes.json', 'condicoes'),
      carregarGlobal('data/eventos-estrada.json', 'eventos'),
    ]);
    return dados;
  }

  // ---------- Render ----------
  function montarAbas() {
    el.tabs.innerHTML = ABAS.map(a => `
      <button type="button" class="tab-btn" data-aba="${a.id}" aria-label="${a.rotulo}" title="${a.rotulo}">
        <span aria-hidden="true">${a.icone}</span>
      </button>`).join('');
  }

  function render() {
    Array.from(el.tabs.querySelectorAll('.tab-btn')).forEach(btn => {
      const ativa = btn.dataset.aba === state.aba;
      btn.classList.toggle('ativa', ativa);
      if (ativa) btn.setAttribute('aria-current', 'true');
      else btn.removeAttribute('aria-current');
    });

    el.voltar.classList.toggle('hidden', state.historico.length === 0);

    const R = window.Renderers;
    let html;

    if (state.foco) {
      const fn = R.detalhes[state.foco.tipo];
      html = fn ? fn(state.aventura, state.foco.id) : '<p class="text-zinc-500">Tipo desconhecido.</p>';
    } else {
      const fn = R.listas[state.aba];
      html = fn ? fn(state.aventura) : '<p class="text-zinc-500">Aba desconhecida.</p>';
    }

    el.conteudo.innerHTML = html;
    el.conteudo.scrollTop = 0;
    window.scrollTo(0, 0);
    salvarPosicao();
  }

  // ---------- Navegação ----------
  function irParaAba(aba) {
    if (el.busca) el.busca.value = '';
    resetPilha = true;
    state.aba = aba;
    navegar(aba);
  }

  function drillDown(tipo, id) {
    navegar(tipo + '/' + id);
  }

  function voltar() {
    if (state.historico.length) window.history.back();
  }

  // Renderiza os resultados da busca (ou sugestões de acesso rápido se vazia).
  function buscar() {
    const q = el.busca.value.trim();
    if (!q) {
      el.conteudo.innerHTML = window.Renderers.sugestoesFoco(state.aventura);
      el.conteudo.scrollTop = 0;
      window.scrollTo(0, 0);
      return;
    }
    el.conteudo.innerHTML = window.Renderers.resultadosBusca(state.aventura, state.indice, q);
    el.conteudo.scrollTop = 0;
    window.scrollTo(0, 0);
  }

  // ---------- Rolagem de dados ----------
  function rolarDado(btn) {
    const n = Math.min(parseInt(btn.dataset.n, 10) || 1, 40);
    const faces = parseInt(btn.dataset.faces, 10) || 6;
    const mod = parseInt(btn.dataset.mod || '0', 10) || 0;
    const rolagens = [];
    for (let i = 0; i < n; i++) rolagens.push(1 + Math.floor(Math.random() * faces));
    const soma = rolagens.reduce((a, b) => a + b, 0) + mod;
    const detalhe = n > 1 ? ` [${rolagens.join(' + ')}]` : '';
    const modTxt = mod ? (mod > 0 ? ` + ${mod}` : ` − ${Math.abs(mod)}`) : '';
    const notacao = `${n}d${faces}${mod ? (mod > 0 ? '+' + mod : mod) : ''}`;
    if (window.mostrarToast) {
      window.mostrarToast(`\u{1F3B2} ${notacao}${detalhe}${modTxt} = <strong>${soma}</strong>`, 3500);
    }
  }

  // ---------- Estado de sessão (missões e PV) ----------
  const CICLO_STATUS = ['Disponível', 'Em Andamento', 'Concluída'];

  function lerMapa(chave) {
    try { return JSON.parse(localStorage.getItem(chave)) || {}; } catch (_) { return {}; }
  }

  function gravarMapa(chave, mapa) {
    try {
      if (Object.keys(mapa).length) localStorage.setItem(chave, JSON.stringify(mapa));
      else localStorage.removeItem(chave);
    } catch (_) {}
  }

  function ciclarStatus(btn) {
    const idMissao = btn.dataset.id;
    const chave = 'escudo_missao_' + (state.aventura.id || '');
    const mapa = lerMapa(chave);
    const m = window.Renderers._.resolverLista(state.aventura, 'missoes', idMissao) || {};
    const atual = mapa[idMissao] || m.status || CICLO_STATUS[0];
    const idxAtual = CICLO_STATUS.findIndex(s =>
      atual.toLowerCase().includes(s.toLowerCase().slice(0, 6)));
    const proximo = CICLO_STATUS[(idxAtual + 1) % CICLO_STATUS.length];
    if (proximo === m.status) delete mapa[idMissao];
    else mapa[idMissao] = proximo;
    gravarMapa(chave, mapa);
    render();
  }

  function ajustarPv(btn) {
    const wrap = btn.closest('.pv-tracker');
    if (!wrap) return;
    const idMonstro = wrap.dataset.id;
    const max = parseInt(wrap.dataset.max, 10);
    const chave = 'escudo_pv_' + (state.aventura.id || '');
    const mapa = lerMapa(chave);
    let atual = mapa[idMonstro] != null ? mapa[idMonstro] : max;
    if (btn.classList.contains('pv-reset')) atual = max;
    else atual = Math.max(0, Math.min(max, atual + (parseInt(btn.dataset.delta, 10) || 0)));
    if (atual === max) delete mapa[idMonstro];
    else mapa[idMonstro] = atual;
    gravarMapa(chave, mapa);
    const val = wrap.querySelector('.pv-atual');
    if (val) {
      val.textContent = atual;
      val.classList.toggle('pv-baixo', atual <= max / 4);
    }
  }

  // ---------- Eventos ----------
  function ligarEventos() {
    el.tabs.addEventListener('click', e => {
      const btn = e.target.closest('.tab-btn');
      if (btn) irParaAba(btn.dataset.aba);
    });

    el.voltar.addEventListener('click', voltar);

    el.conteudo.addEventListener('click', e => {
      const dado = e.target.closest('.dice-link');
      if (dado) { rolarDado(dado); return; }

      const pvBtn = e.target.closest('.pv-btn');
      if (pvBtn) { ajustarPv(pvBtn); return; }

      const badge = e.target.closest('.badge-toggle');
      if (badge) { ciclarStatus(badge); return; }

      const irAba = e.target.closest('.goto-aba');
      if (irAba) { irParaAba(irAba.dataset.aba); return; }

      const abrir = e.target.closest('.open-detail');
      if (abrir) { if (el.busca) el.busca.value = ''; drillDown(abrir.dataset.tipo, abrir.dataset.id); return; }

      const link = e.target.closest('.drill-link');
      if (link) { drillDown(link.dataset.tipo, link.dataset.id); return; }

      const chip = e.target.closest('.chip-link');
      if (chip) { drillDown(chip.dataset.tipo, chip.dataset.id); return; }
    });

    if (el.busca) {
      el.busca.addEventListener('input', debounce(buscar, 150));
      el.busca.addEventListener('focus', () => {
        if (!el.busca.value.trim()) {
          el.conteudo.innerHTML = window.Renderers.sugestoesFoco(state.aventura);
          el.conteudo.scrollTop = 0;
        }
      });
      el.busca.addEventListener('blur', () => {
        // Pequeno delay para permitir clique nos resultados antes de restaurar
        setTimeout(() => {
          if (!el.busca.value.trim() && !state.foco) render();
        }, 200);
      });
    }

    if (el.exportar) {
      el.exportar.addEventListener('click', () => {
        const md = window.Renderers.exportarMarkdown(state.aventura);
        const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = (state.aventura.titulo || 'aventura').toLowerCase().replace(/\s+/g, '-') + '.md';
        a.click();
        URL.revokeObjectURL(url);
      });
    }

    window.addEventListener('hashchange', aplicarHash);
  }

  // ---------- Init ----------
  async function init() {
    el.tabs = document.getElementById('tabs');
    el.conteudo = document.getElementById('conteudo');
    el.voltar = document.getElementById('btn-voltar');
    el.titulo = document.getElementById('titulo-aventura');
    el.sub = document.getElementById('sub-aventura');
    el.busca = document.getElementById('busca');
    el.exportar = document.getElementById('btn-exportar');

    const id = getParam('id');
    if (!id) {
      el.conteudo.innerHTML = '<p class="text-center text-zinc-500 mt-16">Nenhuma aventura selecionada.</p>';
      return;
    }

    el.conteudo.innerHTML = `
      <div class="text-center text-zinc-600 mt-16">
        <div class="spinner mb-3"></div>
        <p class="text-sm">Carregando aventura…</p>
      </div>`;

    try {
      state.aventura = await carregarAventura(id);
      state.indice = window.Renderers.construirIndice(state.aventura);
    } catch (err) {
      el.conteudo.innerHTML =
        `<div class="text-center text-zinc-500 mt-16">
           <div class="text-4xl mb-3">⚠️</div>
           <p class="text-sm">${window.Renderers.escHtml(err.message)}</p>
         </div>`;
      return;
    }

    el.titulo.textContent = state.aventura.titulo || 'Aventura';
    const partes = [];
    if (state.aventura.nivel_recomendado) partes.push('Níveis ' + state.aventura.nivel_recomendado);
    if (state.aventura.cenario) partes.push(state.aventura.cenario);
    el.sub.textContent = partes.join(' · ');
    document.title = (state.aventura.titulo || 'Aventura') + ' — Escudo do Mestre';

    if (el.exportar) el.exportar.classList.remove('hidden');
    montarAbas();
    ligarEventos();

    // Deep link tem prioridade; sem hash, restaura a última posição salva.
    const alvoInicial = parseHash(hashAtual());
    if (alvoInicial) {
      if (alvoInicial.foco) {
        state.foco = alvoInicial.foco;
        if (ABAS.some(a => a.id === alvoInicial.foco.tipo)) state.aba = alvoInicial.foco.tipo;
      } else {
        state.aba = alvoInicial.aba;
      }
    } else {
      restaurarPosicao();
    }
    window.history.replaceState(null, '', '#' + hashDoEstado());
    hashAnterior = hashAtual();
    render();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
