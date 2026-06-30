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
    { id: 'mapas',     rotulo: 'Mapas',     icone: '\u{1F5FA}' },
  ];

  // Estado global da aplicação.
  const state = {
    aventura: null,          // objeto JSON da aventura
    aba: 'bestiario',        // aba atual
    foco: null,              // { tipo, id } quando em tela de detalhe, ou null
    historico: [],           // pilha de { aba, foco } para o botão Voltar
  };

  // Referências de DOM (preenchidas no init).
  const el = {};

  // ---------- Carregamento ----------

  function getParam(nome) {
    return new URLSearchParams(window.location.search).get(nome);
  }

  async function carregarAventura(id) {
    const idx = await fetch('data/aventuras.json').then(r => r.json());
    const meta = idx.find(a => a.id === id);
    if (!meta) throw new Error('Aventura não encontrada no índice: ' + id);
    const dados = await fetch('data/aventuras/' + meta.arquivo).then(r => {
      if (!r.ok) throw new Error('Arquivo da aventura não encontrado: ' + meta.arquivo);
      return r.json();
    });
    return dados;
  }

  // ---------- Renderização ----------

  function montarAbas() {
    el.tabs.innerHTML = ABAS.map(a => `
      <button type="button" class="tab-btn" data-aba="${a.id}">
        <span aria-hidden="true">${a.icone}</span> ${a.rotulo}
      </button>`).join('');
  }

  function render() {
    // Estado das abas
    Array.from(el.tabs.querySelectorAll('.tab-btn')).forEach(btn => {
      btn.classList.toggle('ativa', btn.dataset.aba === state.aba);
    });

    // Botão Voltar (drill-up): visível quando há histórico.
    el.voltar.classList.toggle('hidden', state.historico.length === 0);

    const R = window.Renderers;
    let html;

    if (state.foco) {
      // Tela de detalhe de uma entidade.
      const fn = R.detalhes[state.foco.tipo];
      html = fn ? fn(state.aventura, state.foco.id) : '<p class="text-zinc-500">Tipo desconhecido.</p>';
    } else {
      // Tela de lista da aba atual.
      const fn = R.listas[state.aba];
      html = fn ? fn(state.aventura) : '<p class="text-zinc-500">Aba desconhecida.</p>';
    }

    el.conteudo.innerHTML = html;
    el.conteudo.scrollTop = 0;
    window.scrollTo(0, 0);
  }

  // ---------- Navegação ----------

  // Troca de aba: zera o foco e o histórico (volta à raiz daquela aba).
  function irParaAba(aba) {
    state.aba = aba;
    state.foco = null;
    state.historico = [];
    render();
  }

  // Drill-down: empurra o estado atual na pilha e entra no detalhe.
  function drillDown(tipo, id) {
    state.historico.push({ aba: state.aba, foco: state.foco });
    state.foco = { tipo, id };
    // Mantém a aba coerente com o tipo focado (quando há aba correspondente).
    if (ABAS.some(a => a.id === tipo)) state.aba = tipo;
    render();
  }

  // Drill-up: desempilha o estado anterior.
  function voltar() {
    const anterior = state.historico.pop();
    if (!anterior) return;
    state.aba = anterior.aba;
    state.foco = anterior.foco;
    // Reposiciona a aba ativa caso o estado anterior fosse um detalhe.
    if (anterior.foco && ABAS.some(a => a.id === anterior.foco.tipo)) {
      state.aba = anterior.foco.tipo;
    }
    render();
  }

  // ---------- Eventos ----------

  function ligarEventos() {
    el.tabs.addEventListener('click', e => {
      const btn = e.target.closest('.tab-btn');
      if (btn) irParaAba(btn.dataset.aba);
    });

    el.voltar.addEventListener('click', voltar);

    // Delegação para abrir detalhe (lista) e drill-down (links inline).
    el.conteudo.addEventListener('click', e => {
      const abrir = e.target.closest('.open-detail');
      if (abrir) { drillDown(abrir.dataset.tipo, abrir.dataset.id); return; }

      const link = e.target.closest('.drill-link');
      if (link) { drillDown(link.dataset.tipo, link.dataset.id); return; }

      const mapa = e.target.closest('.open-map');
      if (mapa) { abrirMapa(parseInt(mapa.dataset.idx, 10)); return; }
    });

    // Botão físico "voltar" do navegador/celular faz drill-up se houver pilha.
    window.addEventListener('popstate', () => {
      if (state.historico.length) {
        voltar();
        history.pushState(null, '', '');
      }
    });
  }

  // ---------- Overlay de mapa com zoom ----------

  function abrirMapa(idx) {
    const mp = (state.aventura.mapas || [])[idx];
    if (!mp) return;
    let escala = 1;
    const overlay = document.createElement('div');
    overlay.className = 'mapa-overlay';
    overlay.innerHTML = `
      <div class="fechar" role="button" aria-label="Fechar">&times;</div>
      <img src="${window.Renderers.escHtml(mp.url)}" alt="${window.Renderers.escHtml(mp.nome)}">
      <div class="zoom-controls">
        <button type="button" data-z="out">−</button>
        <button type="button" data-z="reset">1:1</button>
        <button type="button" data-z="in">+</button>
      </div>`;
    const img = overlay.querySelector('img');
    const aplicar = () => { img.style.transform = `scale(${escala})`; };
    overlay.addEventListener('click', e => {
      if (e.target.dataset.z === 'in') { escala = Math.min(escala + 0.5, 5); aplicar(); }
      else if (e.target.dataset.z === 'out') { escala = Math.max(escala - 0.5, 0.5); aplicar(); }
      else if (e.target.dataset.z === 'reset') { escala = 1; aplicar(); }
      else if (e.target.classList.contains('fechar') || e.target === overlay) {
        document.body.removeChild(overlay);
      }
    });
    document.body.appendChild(overlay);
  }

  // ---------- Init ----------

  async function init() {
    el.tabs = document.getElementById('tabs');
    el.conteudo = document.getElementById('conteudo');
    el.voltar = document.getElementById('btn-voltar');
    el.titulo = document.getElementById('titulo-aventura');
    el.sub = document.getElementById('sub-aventura');

    const id = getParam('id');
    if (!id) {
      el.conteudo.innerHTML = '<p class="text-center text-zinc-500 mt-16">Nenhuma aventura selecionada.</p>';
      return;
    }

    try {
      state.aventura = await carregarAventura(id);
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

    montarAbas();
    ligarEventos();
    history.pushState(null, '', ''); // base para capturar o "voltar" do SO
    render();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
