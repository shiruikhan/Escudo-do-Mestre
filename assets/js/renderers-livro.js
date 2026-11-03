// Escudo do Mestre — Renderizadores: Livro da aventura (Markdown)
//
// O campo opcional "livro" da aventura aponta para data/livros/<arquivo>.md:
// o documento completo da história, no papel que o PDF do módulo cumpre nas
// aventuras oficiais. O app.js busca o texto e guarda em aventura.livro_md.
//
// O Markdown é dividido em capítulos pelos títulos "## ". O "# " inicial é o
// título do livro, e o texto antes do primeiro "## " vira a apresentação
// mostrada acima do sumário. Cada capítulo é um detalhe próprio
// (#livro/<id>), com barra fixa da seção atual (abre a folha de seções,
// montada pelo app.js) e navegação Anterior/Próximo. Citações (>) são texto
// para os jogadores e saem no bloco "voz" (pergaminho).
//
// Subconjunto de Markdown suportado, sem dependências: títulos ### e ####,
// parágrafos, listas (- * + 1.), citações (>), tabelas com |, blocos ```,
// linha horizontal (---), **negrito**, *itálico* e `código`. Marcadores de
// drill-down (npc:id, local:id…) e notações de dado (2d6+3) funcionam como
// no resto do app.

(function () {
  'use strict';

  const escHtml = window.escHtml;
  const { parseLinks } = window.Renderers;
  const { slug, vazio, listaVerbetes, textoPlano } = window.Renderers._;

  // ---------- Parse em capítulos ----------
  function parseLivro(md) {
    const linhas = String(md || '').replace(/\r\n?/g, '\n').split('\n');
    const livro = { titulo: '', intro: '', capitulos: [] };
    const intro = [];
    const usados = Object.create(null);
    let atual = null;
    let emCodigo = false;
    for (const l of linhas) {
      if (/^```/.test(l)) emCodigo = !emCodigo;
      if (!emCodigo) {
        const h1 = /^#\s+(.+?)\s*#*\s*$/.exec(l);
        if (h1 && !livro.titulo && !atual) { livro.titulo = h1[1]; continue; }
        const h2 = /^##\s+(.+?)\s*#*\s*$/.exec(l);
        if (h2) {
          let id = slug(limparEnfase(h2[1])) || 'capitulo';
          if (usados[id]) { let n = 2; while (usados[id + '-' + n]) n++; id = id + '-' + n; }
          usados[id] = true;
          atual = { id, titulo: limparEnfase(h2[1]), linhas: [] };
          livro.capitulos.push(atual);
          continue;
        }
      }
      (atual ? atual.linhas : intro).push(l);
    }
    livro.intro = intro.join('\n').trim();
    livro.capitulos.forEach(c => { c.md = c.linhas.join('\n').trim(); delete c.linhas; });
    return livro;
  }

  // Memoizado na aventura (o texto não muda durante a sessão).
  function livroDe(aventura) {
    if (!aventura || !aventura.livro_md) return null;
    if (!aventura._livro) aventura._livro = parseLivro(aventura.livro_md);
    return aventura._livro;
  }

  function limparEnfase(s) {
    return String(s || '').replace(/\*\*|__|\*|`/g, '');
  }

  // "Andar 1 — Saguão do Limiar" → { pre: 'Andar 1', nome: 'Saguão do Limiar' }.
  // Só divide prefixos curtos (rótulos de sequência), nunca uma frase.
  function partirTitulo(t) {
    const m = /^(.{1,24}?)\s+[—–]\s+(.+)$/.exec(String(t || ''));
    return m ? { pre: m[1], nome: m[2] } : { pre: '', nome: String(t || '') };
  }

  // Texto puro de um trecho Markdown (prévias e busca).
  function mdParaTexto(md, aventura) {
    const t = String(md || '')
      .replace(/^```[\s\S]*?^```/gm, ' ')
      .replace(/^\s*(#{1,6}|>|[-*+]|\d+[.)])\s+/gm, '')
      .replace(/^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/gm, ' ')
      .replace(/\|/g, ' ')
      .replace(/\*\*|__|\*|`/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    return textoPlano(t, aventura);
  }

  // ---------- Inline ----------
  // Código inline não passa por marcadores nem ênfase. O resto passa por
  // parseLinks (que escapa o HTML) e só depois recebe a ênfase — os
  // atributos dos botões gerados nunca contêm "*".
  function inline(txt, aventura) {
    return String(txt).split(/(`[^`]+`)/).map(p => {
      if (/^`[^`]+`$/.test(p)) return `<code class="livro-codigo">${escHtml(p.slice(1, -1))}</code>`;
      return parseLinks(p, aventura)
        .replace(/\*\*(?=\S)([\s\S]*?\S)\*\*/g, '<strong>$1</strong>')
        .replace(/(^|[^*\w])\*(?=\S)([^*]*?\S)\*(?![*\w])/g, '$1<em>$2</em>');
    }).join('');
  }

  // ---------- Blocos ----------
  const RE_TITULO = /^(#{3,6})\s+(.+?)\s*#*\s*$/;
  const RE_HR = /^\s*(-{3,}|\*{3,}|_{3,})\s*$/;
  const RE_ITEM = /^\s*([-*+]|\d+[.)])\s+(.*)$/;
  const RE_TABELA = /^\s*\|.*\|\s*$/;
  const RE_SEP_TABELA = /^:?-{2,}:?$/;

  function ehEspecial(l) {
    return RE_TITULO.test(l) || RE_HR.test(l) || RE_ITEM.test(l) || RE_TABELA.test(l) ||
      /^\s*>/.test(l) || /^```/.test(l);
  }

  function celulas(linha) {
    return linha.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());
  }

  // ctx (opcional) coleta as seções "### " para os atalhos do capítulo.
  function mdParaHtml(md, aventura, ctx) {
    const L = String(md || '').replace(/\r\n?/g, '\n').split('\n');
    const out = [];
    let i = 0;
    while (i < L.length) {
      const l = L[i];
      if (!l.trim()) { i++; continue; }

      if (/^```/.test(l)) {
        const buf = [];
        i++;
        while (i < L.length && !/^```/.test(L[i])) buf.push(L[i++]);
        i++;
        out.push(`<pre class="livro-pre">${escHtml(buf.join('\n'))}</pre>`);
        continue;
      }

      const t = RE_TITULO.exec(l);
      if (t) {
        const nivel = t[1].length;
        if (nivel === 3) {
          let id = 'sec-' + (slug(limparEnfase(t[2])) || 'secao');
          if (ctx) {
            if (ctx.usados[id]) { let n = 2; while (ctx.usados[id + '-' + n]) n++; id = id + '-' + n; }
            ctx.usados[id] = true;
            ctx.secoes.push({ id, titulo: limparEnfase(t[2]) });
          }
          const p = partirTitulo(t[2]);
          const pre = p.pre ? `<span class="livro-h3-pre">${inline(p.pre, aventura)}</span>` : '';
          out.push(`<h4 class="livro-h3" id="${escHtml(id)}">${pre}<span class="livro-h3-nome">${inline(p.nome, aventura)}</span></h4>`);
        } else {
          out.push(`<h5 class="livro-h4">${inline(t[2], aventura)}</h5>`);
        }
        i++;
        continue;
      }

      if (RE_HR.test(l)) { out.push('<hr class="livro-hr" />'); i++; continue; }

      if (/^\s*>/.test(l)) {
        const buf = [];
        while (i < L.length && /^\s*>/.test(L[i])) buf.push(L[i++].replace(/^\s*>\s?/, ''));
        out.push(`<blockquote class="livro-voz">${mdParaHtml(buf.join('\n'), aventura, null)}</blockquote>`);
        continue;
      }

      if (RE_TABELA.test(l)) {
        const linhas = [];
        while (i < L.length && RE_TABELA.test(L[i])) linhas.push(celulas(L[i++]));
        let cab = null;
        let corpo = linhas;
        if (linhas.length > 1 && linhas[1].every(c => RE_SEP_TABELA.test(c))) {
          cab = linhas[0];
          corpo = linhas.slice(2);
        }
        const th = cab ? `<thead><tr>${cab.map(c => `<th>${inline(c, aventura)}</th>`).join('')}</tr></thead>` : '';
        const tb = corpo.map(r => `<tr>${r.map(c => `<td>${inline(c, aventura)}</td>`).join('')}</tr>`).join('');
        out.push(`<div class="livro-tabela"><table>${th}<tbody>${tb}</tbody></table></div>`);
        continue;
      }

      if (RE_ITEM.test(l)) {
        const ordenada = /^\s*\d/.test(l);
        const itens = [];
        while (i < L.length) {
          const m = RE_ITEM.exec(L[i]);
          if (m) { itens.push(m[2]); i++; continue; }
          // Linha recuada logo abaixo de um item continua o mesmo item.
          if (itens.length && L[i].trim() && /^\s{2,}/.test(L[i]) && !ehEspecial(L[i])) {
            itens[itens.length - 1] += ' ' + L[i].trim();
            i++;
            continue;
          }
          break;
        }
        const tag = ordenada ? 'ol' : 'ul';
        out.push(`<${tag} class="livro-lista">${itens.map(it => `<li>${inline(it, aventura)}</li>`).join('')}</${tag}>`);
        continue;
      }

      const buf = [];
      while (i < L.length && L[i].trim() && !ehEspecial(L[i])) buf.push(L[i++].trim());
      if (!buf.length) { buf.push(L[i].trim()); i++; }
      out.push(`<p class="texto-livro">${inline(buf.join(' '), aventura)}</p>`);
    }
    return out.join('');
  }

  // ---------- Telas ----------
  // Texto da barra antes da primeira seção (o título está logo acima).
  const REPOUSO = 'Seções do capítulo';

  function semLivro(aventura) {
    if (aventura && aventura.erros && aventura.erros.livro) {
      return vazio('Não foi possível carregar o livro da aventura. Abra uma vez com internet para guardá-lo offline.');
    }
    return vazio('Nenhum livro cadastrado para esta aventura.');
  }

  function resumoCapitulo(c, aventura) {
    const primeiro = (c.md.split(/\n\s*\n/).find(b => b.trim() && !/^\s*(#|\||```)/.test(b)) || '');
    const t = mdParaTexto(primeiro, aventura);
    return t.length > 110 ? t.slice(0, 110).replace(/\s+\S*$/, '') + '…' : t;
  }

  // Abertura de página: rótulo pequeno (prefixo do título) e nome grande.
  function abertura(rotulo, tituloHtml) {
    return `<header class="livro-abertura">
      <p class="rotulo-secao">${escHtml(rotulo)}</p>
      <h3 class="livro-titulo">${tituloHtml}</h3>
    </header>`;
  }

  function listaLivro(aventura) {
    const livro = livroDe(aventura);
    if (!livro) return semLivro(aventura);
    const titulo = livro.titulo || aventura.titulo || 'Livro da aventura';
    const intro = abertura('Livro da aventura', inline(titulo, aventura)) +
      (livro.intro ? `<div class="livro">${mdParaHtml(livro.intro, aventura, null)}</div>` : '');
    if (!livro.capitulos.length) return `<div class="livro-pagina fade-in">${intro}</div>`;
    // Capítulos numerados ganham o número numa coluna própria; os demais
    // (apêndices) mantêm o título inteiro.
    const itens = livro.capitulos.map(c => {
      const p = partirTitulo(c.titulo);
      const num = /^cap[ií]tulo\s+(\d+)$/i.exec(p.pre);
      return `
      <li>
        <button type="button" class="open-detail verbete verbete-bloco livro-sumario-item" data-tipo="livro" data-id="${escHtml(c.id)}">
          <span class="livro-num">${num ? escHtml(num[1]) : ''}</span>
          <span class="verbete-corpo">
            <span class="livro-sumario-nome">${escHtml(num ? p.nome : c.titulo)}</span>
            <span class="verbete-sub">${escHtml(resumoCapitulo(c, aventura))}</span>
          </span>
          <span class="verbete-seta" aria-hidden="true"></span>
        </button>
      </li>`;
    }).join('');
    return `<div class="livro-pagina fade-in">${intro}
      <h4 class="rotulo-secao mt-6 mb-2">Sumário</h4>
      ${listaVerbetes(itens)}</div>`;
  }

  function detalheLivro(aventura, id) {
    const livro = livroDe(aventura);
    if (!livro) return semLivro(aventura);
    const pos = livro.capitulos.findIndex(c => c.id === id);
    if (pos < 0) return vazio('Capítulo não encontrado.');
    const c = livro.capitulos[pos];
    const p = partirTitulo(c.titulo);
    const rotulo = p.pre || `Capítulo ${pos + 1}`;
    const ctx = { secoes: [], usados: Object.create(null) };
    const corpoHtml = mdParaHtml(c.md, aventura, ctx);
    // Barra fixa: mostra a seção em leitura (atualizada pelo app.js ao rolar)
    // e abre a folha com as seções do capítulo e o atalho para o sumário.
    const barra = `
      <button type="button" class="livro-barra" data-secoes aria-haspopup="dialog" data-repouso="${REPOUSO}">
        <span class="livro-barra-texto">
          <span class="livro-barra-pre">${escHtml(rotulo)}</span>
          <span class="livro-barra-atual">${REPOUSO}</span>
        </span>
        <span class="sr-only">(abrir a lista de seções)</span>
        ${window.icone('secoes')}
      </button>`;
    const ant = livro.capitulos[pos - 1];
    const prox = livro.capitulos[pos + 1];
    const nav = (cap, rotuloNav) => cap
      ? `<button type="button" class="open-detail sala-nav" data-tipo="livro" data-id="${escHtml(cap.id)}"><span class="rotulo-secao block">${rotuloNav}</span><span class="block text-[15px] font-bold text-amber-400 truncate">${escHtml(partirTitulo(cap.titulo).nome)}</span></button>`
      : '<span></span>';
    return `<article class="livro-pagina fade-in">
      ${abertura(rotulo, escHtml(p.nome))}
      ${barra}
      <div class="livro">${corpoHtml}</div>
      <div class="sala-navbar">${nav(ant, '‹ Anterior')}${nav(prox, 'Próximo ›')}</div>
    </article>`;
  }

  window.Renderers.listas.livro = listaLivro;
  window.Renderers.detalhes.livro = detalheLivro;
  Object.assign(window.Renderers._, { parseLivro, livroDe, mdParaHtml, mdParaTexto });
})();
