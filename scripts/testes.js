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

for (const f of ['utils.js', 'marcadores.js', 'renderers-core.js', 'renderers-busca.js']) {
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

// ---------- Resultado ----------
console.log('');
if (falhas) {
  console.error(`${falhas}/${total} teste(s) falharam.`);
  process.exit(1);
}
console.log(`${total} teste(s) OK.`);
