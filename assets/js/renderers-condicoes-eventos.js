// Escudo do Mestre — Renderizadores: Condições e Eventos de Estrada
(function () {
  'use strict';

  const escHtml = window.escHtml;
  const { painelCard, dicParaArray, vazio } = window.Renderers._;

  function listaCondicoes(aventura) {
    const itens = dicParaArray(aventura.condicoes)
      .sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt'));
    if (!itens.length) {
      return vazio(aventura.erros && aventura.erros.condicoes
        ? 'Não foi possível carregar as condições. Verifique sua conexão e recarregue a página.'
        : 'Nenhuma condição cadastrada.');
    }
    const cards = itens.map(c => `
      <li>
        <button type="button" class="open-detail w-full text-left flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 active:bg-zinc-800 transition-colors"
                data-tipo="condicoes" data-id="${escHtml(c.id)}">
          <span class="text-2xl flex-shrink-0">${escHtml(c.icone || '\u{1F300}')}</span>
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
        <span class="text-3xl">${escHtml(c.icone || '\u{1F300}')}</span>
        <h3 class="text-lg font-bold text-amber-400">${escHtml(c.nome)}</h3>
      </div>
      ${c.resumo ? `<p class="text-sm italic text-zinc-400 mt-1">${escHtml(c.resumo)}</p>` : ''}
      <div class="stat-divider"></div>
      <h4 class="text-xs font-bold uppercase tracking-wider text-zinc-500">Efeitos</h4>
      ${efeitos || '<p class="text-sm text-zinc-500">Sem efeitos detalhados.</p>'}
    `;
    return `<div class="fade-in">${painelCard(corpo)}</div>`;
  }

  function listaEventos(aventura) {
    const itens = dicParaArray(aventura.eventos);
    if (!itens.length) {
      return vazio(aventura.erros && aventura.erros.eventos
        ? 'Não foi possível carregar os eventos. Verifique sua conexão e recarregue a página.'
        : 'Nenhum evento cadastrado.');
    }
    const cards = itens.map(e => `
      <li>
        <button type="button" class="open-detail w-full text-left flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 active:bg-zinc-800 transition-colors"
                data-tipo="eventos" data-id="${escHtml(e.id)}">
          <span class="text-2xl flex-shrink-0">${escHtml(e.icone || '\u{1F3B2}')}</span>
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-zinc-100 truncate">${escHtml(e.nome)}</p>
            <p class="text-xs text-zinc-500 line-clamp-2">${escHtml(e.narrativa || '')}</p>
          </div>
          <span class="text-zinc-600 text-lg flex-shrink-0">&rsaquo;</span>
        </button>
      </li>`).join('');
    return `
      <p class="text-xs text-zinc-500 mb-2">Role 1d20 ou escolha um evento durante a viagem.</p>
      <ul class="space-y-2 fade-in">${cards}</ul>`;
  }

  function detalheEvento(aventura, id) {
    const e = aventura.eventos && aventura.eventos[id];
    if (!e) return vazio('Evento não encontrado.');
    const corpo = `
      <div class="flex items-center gap-3">
        <span class="text-3xl">${escHtml(e.icone || '\u{1F3B2}')}</span>
        <h3 class="text-lg font-bold text-amber-400">${escHtml(e.nome)}</h3>
      </div>
      <div class="stat-divider"></div>
      ${e.narrativa ? `<p class="text-sm text-zinc-200 leading-snug">${escHtml(e.narrativa)}</p>` : ''}
      ${e.teste ? `<div class="mt-3 text-sm border rounded-lg p-3 bg-sky-500/5 border-sky-500/20">
          <span class="font-semibold text-sky-300">Teste sugerido:</span> <span class="text-zinc-300">${escHtml(e.teste)}</span>
        </div>` : ''}
      ${e.recompensa ? `<div class="mt-2 text-sm border rounded-lg p-3 bg-emerald-500/5 border-emerald-500/20">
          <span class="font-semibold text-emerald-300">Recompensa possível:</span> <span class="text-zinc-300">${escHtml(e.recompensa)}</span>
        </div>` : ''}
      ${e.risco ? `<div class="mt-2 text-sm border rounded-lg p-3 bg-rose-500/5 border-rose-500/20">
          <span class="font-semibold text-rose-300">Risco / dano menor:</span> <span class="text-zinc-300">${escHtml(e.risco)}</span>
        </div>` : ''}
      ${e.nota_dm ? `<div class="mt-2 text-sm text-zinc-400 bg-zinc-800/40 border border-zinc-700/50 rounded-lg p-3">
          <span class="font-semibold text-zinc-300">Nota do Mestre:</span> ${escHtml(e.nota_dm)}
        </div>` : ''}
    `;
    return `<div class="fade-in">${painelCard(corpo)}</div>`;
  }

  window.Renderers.listas.condicoes = listaCondicoes;
  window.Renderers.detalhes.condicoes = detalheCondicao;
  window.Renderers.listas.eventos = listaEventos;
  window.Renderers.detalhes.eventos = detalheEvento;
})();
