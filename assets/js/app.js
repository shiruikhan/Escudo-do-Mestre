// Escudo do Mestre — Gerenciador de Estado Global, Roteador SPA e Histórico de Navegação
//
// Carrega o JSON da aventura (id vindo da query string), monta a barra de
// abas e gerencia a navegação reativa drill-down / drill-up com pilha de
// histórico. Depende de window.Renderers (renderers.js).

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
  ];

  const state = {
    aventura: null,
    indice: [],
    aba: 'bestiario',
    foco: null,
    historico: [],
  };

  const el = {};

  function getParam(nome) {
    return new URLSearchParams(window.location.search).get(nome);
  }

  function debounce(fn, ms) {
    let t;
    return function (...args) { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), ms); };
  }

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
    // Condições são regras globais (compartilhadas entre aventuras).
    try {
      dados.condicoes = await fetch('data/condicoes.json').then(r => r.ok ? r.json() : {});
    } catch (_) {
      dados.condicoes = {};
    }
    return dados;
  }

  function montarAbas() {
    el.tabs.innerHTML = ABAS.map(a => `
      <button type="button" class="tab-btn" data-aba="${a.id}" aria-label="${a.rotulo}" title="${a.rotulo}">
        <span aria-hidden="true">${a.icone}</span>
      </button>`).join('');
  }

  function render() {
    Array.from(el.tabs.querySelectorAll('.tab-btn')).forEach(btn => {
      btn.classList.toggle('ativa', btn.dataset.aba === state.aba);
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

  function irParaAba(aba) {
    state.aba = aba;
    state.foco = null;
    state.historico = [];
    if (el.busca) el.busca.value = '';
    render();
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

  function drillDown(tipo, id) {
    state.historico.push({ aba: state.aba, foco: state.foco });
    state.foco = { tipo, id };
    if (ABAS.some(a => a.id === tipo)) state.aba = tipo;
    render();
  }

  function voltar() {
    const anterior = state.historico.pop();
    if (!anterior) return;
    state.aba = anterior.aba;
    state.foco = anterior.foco;
    if (anterior.foco && ABAS.some(a => a.id === anterior.foco.tipo)) {
      state.aba = anterior.foco.tipo;
    }
    render();
  }

  function ligarEventos() {
    el.tabs.addEventListener('click', e => {
      const btn = e.target.closest('.tab-btn');
      if (btn) irParaAba(btn.dataset.aba);
    });

    el.voltar.addEventListener('click', voltar);

    el.conteudo.addEventListener('click', e => {
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

    window.addEventListener('popstate', () => {
      if (state.historico.length) {
        voltar();
        history.pushState(null, '', '');
      }
    });
  }

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
    restaurarPosicao();
    history.pushState(null, '', '');
    render();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
