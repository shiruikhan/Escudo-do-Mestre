// Escudo do Mestre — Renderizadores: Condições e Eventos de Estrada
(function () {
  'use strict';

  const escHtml = window.escHtml;
  const { paginaDetalhe, cabecalhoDetalhe, tituloSecao, campo, listaVerbetes, dicParaArray, vazio } = window.Renderers._;

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
        <button type="button" class="open-detail verbete"
                data-tipo="condicoes" data-id="${escHtml(c.id)}">
          <span class="verbete-icone" aria-hidden="true">${escHtml(c.icone || '\u{1F300}')}</span>
          <span class="verbete-corpo">
            <span class="verbete-nome">${escHtml(c.nome)}</span>
            <span class="verbete-sub sala-resumo">${escHtml(c.resumo || '')}</span>
          </span>
          <span class="verbete-seta" aria-hidden="true"></span>
        </button>
      </li>`).join('');
    return listaVerbetes(cards);
  }

  function detalheCondicao(aventura, id) {
    const c = aventura.condicoes && aventura.condicoes[id];
    if (!c) return vazio('Condição não encontrada.');
    const efeitos = (c.efeitos || []).map(ef => `
      <p class="texto-livro"><span class="acao-nome">${escHtml(ef.nome)}.</span> ${escHtml(ef.descricao)}</p>`).join('');
    const nome = `<span class="titulo-icone" aria-hidden="true">${escHtml(c.icone || '\u{1F300}')}</span>${escHtml(c.nome)}`;
    const corpo = `
      ${tituloSecao('Efeitos', 'sec-efeitos')}
      ${efeitos || '<p class="ajuda">Sem efeitos detalhados.</p>'}
    `;
    return paginaDetalhe(cabecalhoDetalhe('Condição', c.nome, c.resumo, nome), corpo);
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
        <button type="button" class="open-detail verbete"
                data-tipo="eventos" data-id="${escHtml(e.id)}">
          <span class="verbete-icone" aria-hidden="true">${escHtml(e.icone || '\u{1F3B2}')}</span>
          <span class="verbete-corpo">
            <span class="verbete-nome">${escHtml(e.nome)}</span>
            <span class="verbete-sub sala-resumo">${escHtml(e.narrativa || '')}</span>
          </span>
          <span class="verbete-seta" aria-hidden="true"></span>
        </button>
      </li>`).join('');
    return `
      <p class="rotulo-secao mb-2">Role 1d20 ou escolha um evento durante a viagem</p>
      ${listaVerbetes(cards)}`;
  }

  function detalheEvento(aventura, id) {
    const e = aventura.eventos && aventura.eventos[id];
    if (!e) return vazio('Evento não encontrado.');
    const nome = `<span class="titulo-icone" aria-hidden="true">${escHtml(e.icone || '\u{1F3B2}')}</span>${escHtml(e.nome)}`;
    // A narrativa é lida para a mesa: sai no bloco de pergaminho (voz).
    const corpo = `
      ${e.narrativa ? `<blockquote class="voz"><p class="texto-livro">${escHtml(e.narrativa)}</p></blockquote>` : ''}
      ${e.teste ? campo('Teste sugerido', escHtml(e.teste), 'arcano') : ''}
      ${e.recompensa ? campo('Recompensa possível', escHtml(e.recompensa), 'musgo') : ''}
      ${e.risco ? campo('Risco / dano menor', escHtml(e.risco), 'perigo') : ''}
      ${e.nota_dm ? campo('Nota do Mestre', escHtml(e.nota_dm), 'mestre') : ''}
    `;
    return paginaDetalhe(cabecalhoDetalhe('Evento de estrada', e.nome, '', nome), corpo);
  }

  window.Renderers.listas.condicoes = listaCondicoes;
  window.Renderers.detalhes.condicoes = detalheCondicao;
  window.Renderers.listas.eventos = listaEventos;
  window.Renderers.detalhes.eventos = detalheEvento;
})();
