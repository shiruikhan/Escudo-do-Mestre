// Escudo do Mestre — Renderizador: Rastreador de Combate (iniciativa)
//
// Tela por aventura com a ordem de iniciativa da sessão. O renderizador só
// LÊ o estado (localStorage escudo_combate_{id}); todas as mutações (turno,
// PV, iniciativa, adicionar/remover) ficam no app.js, que re-renderiza.
(function () {
  'use strict';

  const escHtml = window.escHtml;
  const { vazio } = window.Renderers._;

  function lerCombate(aventura) {
    try {
      const c = JSON.parse(localStorage.getItem('escudo_combate_' + (aventura.id || '')));
      if (c && Array.isArray(c.combatentes)) return c;
    } catch (_) {}
    return { combatentes: [], turno: 0, rodada: 1 };
  }

  // Ordem de exibição: iniciativa decrescente; empate mantém ordem de entrada.
  // Carrega o índice original junto para os botões mutarem o item certo.
  function ordenado(c) {
    return c.combatentes
      .map((cb, idx) => ({ cb, idx }))
      .sort((a, b) => (b.cb.i - a.cb.i) || (a.idx - b.idx));
  }

  function listaCombate(aventura) {
    const c = lerCombate(aventura);

    const form = `
      <div class="cb-form">
        <input id="cb-nome" class="cb-input" type="text" autocomplete="off"
               placeholder="Nome (jogador, aliado…)" aria-label="Nome do combatente" />
        <input id="cb-init" class="cb-input cb-input-num" type="number" inputmode="numeric"
               placeholder="Init" aria-label="Iniciativa" />
        <button type="button" class="cb-btn cb-add-manual">Adicionar</button>
      </div>
      <p class="text-[0.65rem] text-zinc-600 mt-1 mb-3">Monstros entram direto pela ficha (botão ⚔️), com iniciativa rolada automaticamente. Tudo é salvo neste aparelho.</p>`;

    if (!c.combatentes.length) {
      return `<div class="fade-in">${form}${vazio('Nenhum combatente. Adicione os jogadores acima e os monstros pela ficha.')}</div>`;
    }

    const lista = ordenado(c);
    const n = lista.length;
    const turnoAtual = ((c.turno % n) + n) % n;

    const linhas = lista.map(({ cb, idx }, pos) => {
      const ativo = pos === turnoAtual;
      const nome = cb.tipo && cb.ref
        ? `<button type="button" class="open-detail cb-nome-link" data-tipo="${escHtml(cb.tipo)}" data-id="${escHtml(cb.ref)}">${escHtml(cb.n)}</button>`
        : `<span class="cb-nome">${escHtml(cb.n)}</span>`;
      const pv = cb.max != null ? `
          <div class="cb-pv-linha">
            <button type="button" class="pv-btn cb-pv" data-idx="${idx}" data-delta="-5">−5</button>
            <button type="button" class="pv-btn cb-pv" data-idx="${idx}" data-delta="-1">−1</button>
            <span class="pv-valor"><span class="pv-atual${cb.pv <= cb.max / 4 ? ' pv-baixo' : ''}">${cb.pv}</span><span class="pv-max">/${cb.max}</span></span>
            <button type="button" class="pv-btn cb-pv" data-idx="${idx}" data-delta="1">+1</button>
            <button type="button" class="pv-btn cb-pv" data-idx="${idx}" data-delta="5">+5</button>
          </div>` : '';
      return `
        <li class="cb-linha${ativo ? ' cb-ativo' : ''}">
          <div class="cb-topo">
            <span class="cb-init-badge">
              <button type="button" class="cb-init" data-idx="${idx}" data-delta="-1" aria-label="Diminuir iniciativa">−</button>
              <strong>${Number(cb.i) || 0}</strong>
              <button type="button" class="cb-init" data-idx="${idx}" data-delta="1" aria-label="Aumentar iniciativa">+</button>
            </span>
            ${nome}
            <button type="button" class="cb-del" data-idx="${idx}" aria-label="Remover ${escHtml(cb.n)}">×</button>
          </div>
          ${pv}
        </li>`;
    }).join('');

    return `
      <div class="fade-in">
        ${form}
        <div class="cb-controles">
          <span class="text-sm text-zinc-400">Rodada <strong class="text-amber-400">${c.rodada}</strong></span>
          <div class="cb-controles-botoes">
            <button type="button" class="cb-btn cb-prev" title="Turno anterior" aria-label="Turno anterior">&#9198;</button>
            <button type="button" class="cb-btn cb-btn-destaque cb-next">Próximo &#9654;</button>
            <button type="button" class="cb-btn cb-limpar">Encerrar</button>
          </div>
        </div>
        <ul class="space-y-2 mt-3">${linhas}</ul>
      </div>`;
  }

  window.Renderers.listas.combate = listaCombate;
})();
