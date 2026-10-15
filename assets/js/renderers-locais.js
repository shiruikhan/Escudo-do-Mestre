// Escudo do Mestre — Renderizadores: Locais
(function () {
  'use strict';

  const escHtml = window.escHtml;
  const { parseLinks } = window.Renderers;
  const { painelCard, cabecalhoDetalhe, campo, listaVerbetes, dicParaArray, itemListaCard, vazio, blocoOcupantes, textoPlano, salasDoLocal, resolverSala, ocupantesDaSala, linhaOcupante, resolverRef } = window.Renderers._;

  function listaLocais(aventura) {
    const itens = dicParaArray(aventura.locais);
    if (!itens.length) return vazio('Nenhuma localidade cadastrada.');
    const cards = itens.map(l => itemListaCard('locais', l.id, l.nome, [
      l.tipo,
      l.nivel_sugerido && l.nivel_sugerido !== '—' ? `Nível sugerido ${l.nivel_sugerido}` : null,
    ])).join('');
    return listaVerbetes(cards);
  }

  // Lista de salas do local: cada linha abre a sala (tipo "sala").
  function blocoSalas(l, lid, aventura) {
    const salas = salasDoLocal(aventura, lid);
    if (!salas.length) return '';
    const linhas = salas.map(({ id, area, rotulo }) => {
      const ocup = ocupantesDaSala(l, rotulo).map(e => {
        const r = resolverRef(e.ref, aventura);
        if (!r) return '';
        const q = e.qtd == null || e.qtd === '' || e.qtd === 1 ? '' : (typeof e.qtd === 'number' ? ' \u00d7' + e.qtd : ' (' + e.qtd + ')');
        return r.obj.nome + q;
      }).filter(Boolean).join(' \u00b7 ');
      const resumo = textoPlano(area.texto || '', aventura);
      const curto = resumo.length > 110 ? resumo.slice(0, 110).replace(/\s+\S*$/, '') + '\u2026' : resumo;
      return `<li>
        <button type="button" class="open-detail verbete verbete-bloco"
                data-tipo="sala" data-id="${escHtml(id)}">
          <span class="verbete-corpo">
            <span class="verbete-nome whitespace-normal">${escHtml(rotulo || 'Área')}${area.armadilha ? '<span class="marca-armadilha">Armadilha</span>' : ''}${area.tesouro ? '<span class="marca-tesouro">Tesouro</span>' : ''}</span>
            ${ocup ? `<span class="verbete-ocupantes">${escHtml(ocup)}</span>` : ''}
            ${curto ? `<span class="verbete-sub sala-resumo">${escHtml(curto)}</span>` : ''}
          </span>
          <span class="verbete-seta" aria-hidden="true"></span>
        </button>
      </li>`;
    }).join('');
    return `<div class="mt-4">
      <h4 class="rotulo-secao">Salas e áreas (${salas.length})</h4>
      <ul class="lista-verbetes">${linhas}</ul>
    </div>`;
  }

  // Tela de uma sala: ocupantes, texto, armadilha, tesouro e navegação entre salas.
  function detalheSala(aventura, id) {
    const r = resolverSala(aventura, id);
    if (!r) return vazio('Sala não encontrada.');
    const { sala, anterior, proxima, total, posicao } = r;
    const l = aventura.locais[sala.lid];
    const a = sala.area;
    const ocup = ocupantesDaSala(l, sala.rotulo).map(e => linhaOcupante(e, aventura)).join('');
    const nav = (s, rotulo) => s
      ? `<button type="button" class="open-detail sala-nav" data-tipo="sala" data-id="${escHtml(s.id)}"><span class="rotulo-secao block">${rotulo}</span><span class="block text-[15px] font-bold text-amber-400 truncate">${escHtml(s.rotulo || 'Área')}</span></button>`
      : '<span></span>';
    const corpo = `
      <button type="button" class="chip-link" data-tipo="locais" data-id="${escHtml(sala.lid)}">${escHtml(l.nome)}</button>
      <p class="rotulo-secao mt-3">Sala ${posicao} de ${total}</p>
      <h3 class="titulo-entidade">${escHtml(sala.rotulo || 'Área')}</h3>
      ${ocup ? `<div class="mt-3"><h4 class="rotulo-secao">Quem está aqui</h4><ul class="enc-lista">${ocup}</ul></div>` : ''}
      ${a.texto ? `<p class="texto-livro mt-3">${parseLinks(a.texto, aventura)}</p>` : ''}
      ${a.armadilha ? campo('Armadilha', parseLinks(a.armadilha, aventura), 'perigo') : ''}
      ${a.tesouro ? campo('Tesouro', parseLinks(a.tesouro, aventura), 'ouro') : ''}
      <div class="sala-navbar">${nav(anterior, '\u2039 Anterior')}${nav(proxima, 'Próxima \u203A')}</div>`;
    return `<div class="fade-in">${painelCard(corpo)}</div>`;
  }

  function detalheLocal(aventura, id) {
    const l = aventura.locais && aventura.locais[id];
    if (!l) return vazio('Localidade não encontrada.');
    const corpo = `
      ${cabecalhoDetalhe(['Local', l.nivel_sugerido && l.nivel_sugerido !== '—' ? 'Nível ' + l.nivel_sugerido : ''].filter(Boolean).join(' · '), l.nome, l.tipo)}
      ${l.resumo ? `<p class="texto-livro mt-3">${parseLinks(l.resumo, aventura)}</p>` : ''}
      ${blocoOcupantes(l, aventura, !!(l.areas && l.areas.length))}
      ${blocoSalas(l, id, aventura)}
      ${l.perigos ? campo('Perigos', parseLinks(l.perigos, aventura), 'perigo') : ''}
      ${l.tesouro ? campo('Tesouro', parseLinks(l.tesouro, aventura), 'ouro') : ''}
      ${l.conexoes ? campo('Acesso e conexões', parseLinks(l.conexoes, aventura), 'arcano') : ''}
    `;
    return `<div class="fade-in">${painelCard(corpo)}</div>`;
  }

  // ---------- Guia: regras e referências gerais da aventura ----------
  function listaGuia(aventura) {
    const itens = aventura.guia || [];
    if (!itens.length) return vazio('Nenhum guia cadastrado.');
    const cards = itens.map(g => itemListaCard('guia', g.id, g.titulo, [textoPlano(g.resumo || '', aventura)])).join('');
    return listaVerbetes(cards);
  }

  function detalheGuia(aventura, id) {
    const g = (aventura.guia || []).find(x => x.id === id);
    if (!g) return vazio('Entrada do guia não encontrada.');
    const paragrafos = (Array.isArray(g.texto) ? g.texto : String(g.texto || '').split(/\n+/))
      .filter(Boolean)
      .map(p => `<p class="texto-livro mt-3">${parseLinks(p, aventura)}</p>`).join('');
    const corpo = `<p class="rotulo-secao">Guia</p><h3 class="titulo-entidade">${escHtml(g.titulo)}</h3>${paragrafos}`;
    return `<div class="fade-in">${painelCard(corpo)}</div>`;
  }

  window.Renderers.detalhes.sala = detalheSala;
  window.Renderers.listas.guia = listaGuia;
  window.Renderers.detalhes.guia = detalheGuia;
  window.Renderers.listas.locais = listaLocais;
  window.Renderers.detalhes.locais = detalheLocal;
})();
