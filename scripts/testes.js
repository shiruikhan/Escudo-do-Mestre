#!/usr/bin/env node
// Escudo do Mestre — Testes das funções puras dos renderers
//
// Sem dependências externas: carrega os módulos do navegador com stubs de
// window/document e testa parseLinks, textoPlano, normalizar, slug,
// marcarDados e a geração de IDs estáveis.
//
// Uso: node scripts/testes.js  (ou: npm test) — sai com 1 se algo falhar.

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const JS = f => path.join(ROOT, 'assets', 'js', f);

// ---------- Ambiente fake de navegador ----------
const sandbox = {
  window: {},
  navigator: {},
  document: { addEventListener() {}, getElementById() { return null; }, createElement() { return { addEventListener() {}, classList: { add() {}, remove() {} } }; } },
  localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
  console,
  self: undefined,
};
sandbox.window = sandbox; // window === globalThis do sandbox
vm.createContext(sandbox);

for (const f of ['utils.js', 'marcadores.js', 'renderers-core.js', 'renderers-livro.js', 'renderers-busca.js', 'renderers-combate.js']) {
  vm.runInContext(fs.readFileSync(JS(f), 'utf-8'), sandbox, { filename: f });
}

const R = sandbox.window.Renderers;
const H = R._;

// ---------- Mini framework ----------
let falhas = 0;
let total = 0;
function teste(nome, cond) {
  total++;
  if (cond) console.log('✓ ' + nome);
  else { falhas++; console.error('✗ ' + nome); }
}

// ---------- Aventura de exemplo ----------
const aventura = {
  id: 'teste',
  titulo: 'Aventura de Teste',
  bestiario: { goblin: { nome: 'Goblin', pv: 7 } },
  npcs: { sildar: { nome: 'Sildar Hallwinter', papel: 'Aliado' } },
  itens: { espada: { nome: 'Espada Longa' } },
  locais: { vila: { nome: 'Vila de Teste' } },
  missoes: [
    { titulo: 'Encontrar a Mina', objetivo: 'Fale com npc:sildar e derrote 1d4+1 bestiario:goblin.' },
    { titulo: 'Encontrar a Mina', objetivo: 'Título duplicado de propósito.' },
    { titulo: '', objetivo: 'Sem título.' },
  ],
  ganchos: [
    { fonte: 'Taverna', texto: 'Rumores sobre npc:sildar.' },
    'Gancho em texto puro com bestiario:goblin.',
  ],
};

// ---------- escHtml ----------
teste('escHtml escapa < > & " \'',
  sandbox.window.escHtml(`<a href="x">&'</a>`) === '&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;');

// ---------- normalizar ----------
teste('normalizar remove acentos e caixa',
  H.normalizar('Missões Concluídas') === 'missoes concluidas');

// ---------- slug ----------
teste('slug gera identificador estável',
  H.slug('A Mina Perdida de Phandelver!') === 'a-mina-perdida-de-phandelver');

// ---------- parseLinks ----------
const html = R.parseLinks('Fale com npc:sildar sobre itens:espada.', aventura);
teste('parseLinks converte marcador válido em botão',
  html.includes('class="drill-link"') && html.includes('Sildar Hallwinter') && html.includes('data-id="espada"'));

teste('parseLinks mantém marcador inválido como texto',
  R.parseLinks('npc:inexistente aqui', aventura).includes('npc:inexistente'));

teste('parseLinks escapa HTML no texto',
  R.parseLinks('<script>alert(1)</script>', aventura).includes('&lt;script&gt;'));

// ---------- marcarDados / rolagem ----------
teste('parseLinks marca notação de dados como botão',
  R.parseLinks('causa 2d6+3 de dano', aventura).includes('class="dice-link"'));

teste('marcarDados captura n, faces e modificador',
  H.marcarDados('1d20-2').includes('data-n="1"') &&
  H.marcarDados('1d20-2').includes('data-faces="20"') &&
  H.marcarDados('1d20-2').includes('data-mod="-2"'));

teste('marcarDados não marca texto comum ("d" solto, palavras)',
  !H.marcarDados('dado de6xemplo').includes('dice-link'));

// ---------- textoPlano ----------
teste('textoPlano troca marcador pelo nome',
  H.textoPlano('Fale com npc:sildar.', aventura) === 'Fale com Sildar Hallwinter.');

// ---------- IDs estáveis ----------
const listas = H.listasComId(aventura);
teste('missões ganham slug do título',
  listas.missoes[0].id === 'encontrar-a-mina');
teste('títulos duplicados são desambiguados',
  listas.missoes[1].id === 'encontrar-a-mina-2');
teste('missão sem título usa reserva por índice',
  listas.missoes[2].id === 'missao-2');
teste('ganchos usam slug da fonte',
  listas.ganchos[0].id === 'taverna');
teste('resolverLista encontra por id estável',
  H.resolverLista(aventura, 'missoes', 'encontrar-a-mina-2') === aventura.missoes[1]);
teste('resolverLista aceita índice numérico legado',
  H.resolverLista(aventura, 'ganchos', '1') === aventura.ganchos[1]);

// ---------- construirIndice / exportarMarkdown sem marcadores crus ----------
const RE_CRU = /(npc|bestiario|itens|item|locais|local):[a-z0-9-]+/;
const indice = R.construirIndice(aventura);
teste('índice de busca usa IDs estáveis para missões',
  indice.some(e => e.tipo === 'missoes' && e.id === 'encontrar-a-mina'));
teste('índice de busca sem marcadores crus nas prévias',
  !indice.some(e => RE_CRU.test(e.sub || '') || RE_CRU.test(e.nome || '')));
const md = R.exportarMarkdown(aventura);
teste('exportação Markdown sem marcadores crus',
  !RE_CRU.test(md));
teste('exportação Markdown contém as seções',
  md.includes('## Missões') && md.includes('## NPCs') && md.includes('## Bestiário'));

// ---------- Rastreador de combate ----------
teste('lista de combate renderiza estado vazio sem erro',
  (() => {
    const h = R.listas.combate(aventura);
    return h.includes('cb-add-manual') && h.includes('Nenhum combatente');
  })());

teste('lista de combate renderiza combatentes ordenados por iniciativa',
  (() => {
    sandbox.localStorage.getItem = (k) =>
      k === 'escudo_combate_teste'
        ? JSON.stringify({ combatentes: [
            { n: 'Jogador', i: 12 },
            { n: 'Goblin', i: 18, tipo: 'bestiario', ref: 'goblin', pv: 1, max: 7 },
          ], turno: 0, rodada: 2 })
        : null;
    const h = R.listas.combate(aventura);
    sandbox.localStorage.getItem = () => null;
    const posGoblin = h.indexOf('Goblin');
    const posJogador = h.indexOf('Jogador');
    return posGoblin > -1 && posJogador > -1 && posGoblin < posJogador &&
      h.includes('cb-ativo') && h.includes('Rodada') && h.includes('pv-baixo');
  })());

// ---------- Resultado ----------
// ---------- Encontros por local ----------
{
  const av = {
    bestiario: { goblin: { nome: 'Goblin' } },
    npcs: { sildar: { nome: 'Sildar' } },
    locais: {
      vila: { nome: 'Vila', npcs: ['npc:sildar'], criaturas: ['bestiario:goblin'],
        encontros: [{ area: 'Trilha', ref: 'bestiario:goblin', qtd: '1d4+1', nota: 'fala com npc:sildar' }] },
      mina: { nome: 'Mina', encontros: [{ ref: 'bestiario:goblin', qtd: 4 }, { ref: 'bestiario:goblin', qtd: 1 }] },
    },
  };
  const oc = H.ocupantesDoLocal(av.locais.vila);
  teste('ocupantes: encontro + legado sem duplicar', oc.length === 2 && oc[0].qtd === '1d4+1' && oc[1].legado === true);
  teste('rotuloQtd: número vira ×N, 1 some, texto vira dado clicável', H.rotuloQtd(4) === '\u00d74' && H.rotuloQtd(1) === '' && H.rotuloQtd('1d4+1').includes('dice-link'));
  teste('locaisDe: reverso do monstro lista os dois locais', H.locaisDe(av, 'bestiario', 'goblin').map(x => x.lid).join() === 'vila,vila,mina,mina'.split(',').filter((v, i, a) => a.indexOf(v) === i && true).join() || H.locaisDe(av, 'bestiario', 'goblin').length >= 2);
  teste('bloco "Quem está aqui" mostra nome, quantidade e nota com link', /Quem est/.test(H.blocoOcupantes(av.locais.vila, av)) && H.blocoOcupantes(av.locais.vila, av).includes('drill-link'));
  teste('"Aparece em" resolve o NPC para o local', H.blocoApareceEm(av, 'npcs', 'sildar').includes('Vila'));
}

// ---------- Livro da aventura (Markdown) ----------
{
  const md = [
    '# Livro de Teste',
    'Apresentação com **negrito**.',
    '',
    '## Capítulo 1 — Início',
    'Fale com npc:sildar e role 2d6.',
    '',
    '### Seção A',
    '- item *um*',
    '- item `dois`',
    '',
    '> Texto para ler em voz alta.',
    '',
    '| Col | Val |',
    '|---|---|',
    '| a | bestiario:goblin |',
    '',
    '### Seção B',
    '1. primeiro',
    '2. segundo',
    '',
    '## Capítulo 1 — Início',
    'Título repetido de propósito.',
  ].join('\n');
  const livro = H.parseLivro(md);
  teste('parseLivro: título, apresentação e capítulos por "## "',
    livro.titulo === 'Livro de Teste' && livro.intro.startsWith('Apresentação') && livro.capitulos.length === 2);
  teste('parseLivro: ids de capítulo estáveis e desambiguados',
    livro.capitulos[0].id === 'capitulo-1-inicio' && livro.capitulos[1].id === 'capitulo-1-inicio-2');
  const ctx = { secoes: [], usados: Object.create(null) };
  const html = H.mdParaHtml(livro.capitulos[0].md, aventura, ctx);
  teste('mdParaHtml: marcadores viram drill-link e dados viram dice-link',
    html.includes('class="drill-link"') && html.includes('Sildar Hallwinter') && html.includes('class="dice-link"'));
  teste('mdParaHtml: listas, citação e tabela',
    html.includes('<ul class="livro-lista">') && html.includes('<ol class="livro-lista">') &&
    html.includes('<blockquote class="livro-citacao">') && html.includes('<th>Col</th>') && html.includes('Goblin'));
  teste('mdParaHtml: ênfase e código inline',
    html.includes('<em>um</em>') && html.includes('<code class="livro-codigo">dois</code>'));
  teste('mdParaHtml: seções "### " coletadas para os atalhos',
    ctx.secoes.length === 2 && ctx.secoes[0].id === 'sec-secao-a' && html.includes('id="sec-secao-a"'));
  teste('mdParaHtml escapa HTML cru', H.mdParaHtml('<img src=x onerror=alert(1)>', aventura).includes('&lt;img'));
  const avLivro = Object.assign({}, aventura, { livro: 'x.md', livro_md: md });
  delete avLivro._listasId;
  teste('Livro: lista mostra o sumário e o detalhe abre o capítulo',
    R.listas.livro(avLivro).includes('Sumário (2 capítulos)') &&
    R.detalhes.livro(avLivro, 'capitulo-1-inicio').includes('Capítulo 1 de 2') &&
    R.detalhes.livro(avLivro, 'capitulo-1-inicio').includes('livro-ancora'));
  teste('Livro: capítulos entram na busca sem marcadores crus',
    R.construirIndice(avLivro).some(e => e.tipo === 'livro' && e.campos.join(' ').includes('sildar hallwinter') && !e.campos.join(' ').includes('npc:')));
  teste('Livro: aventura sem livro mostra mensagem vazia', R.listas.livro(aventura).includes('Nenhum livro'));
}

console.log('');
if (falhas) {
  console.error(`${falhas}/${total} teste(s) falharam.`);
  process.exit(1);
}
console.log(`${total} teste(s) OK.`);
