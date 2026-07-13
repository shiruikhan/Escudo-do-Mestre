#!/usr/bin/env node
// Escudo do Mestre — Geração automática do CORE_ASSETS em sw.js
//
// Varre o projeto (JS, CSS, ícones, dados e as aventuras listadas em
// data/aventuras.json) e reescreve o bloco CORE_ASSETS do sw.js. Se a lista
// mudou, incrementa CACHE_VERSION automaticamente — sem isso o SW antigo
// continuaria servindo o cache velho e a aventura nova nunca apareceria
// offline.
//
// Uso:
//   node scripts/gerar-sw.js           # reescreve sw.js se necessário
//   node scripts/gerar-sw.js --check   # não escreve; sai com 1 se sw.js está
//                                      # desatualizado (para CI)

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SW_PATH = path.join(ROOT, 'sw.js');

const CHECK = process.argv.includes('--check');

function listar(dir, filtro) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) return [];
  return fs.readdirSync(abs)
    .filter(filtro)
    .sort()
    .map(f => dir + '/' + f);
}

function montarLista() {
  const assets = [];

  // App shell (ordem fixa)
  assets.push('./', 'index.html', 'aventura.html', 'manifest.json');

  // CSS servido em runtime (tailwind-src.css é só entrada de build)
  assets.push(...listar('assets/css', f => f.endsWith('.css') && f !== 'tailwind-src.css'));

  // Todo JS do app
  assets.push(...listar('assets/js', f => f.endsWith('.js')));

  // Ícones na raiz de assets/
  assets.push(...listar('assets', f => /\.(svg|png|ico)$/.test(f)));

  // Dados globais + manifest
  assets.push('data/aventuras.json', 'data/condicoes.json', 'data/eventos-estrada.json');

  // Aventuras referenciadas no manifest (fonte de verdade: data/aventuras.json)
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'aventuras.json'), 'utf-8'));
  for (const item of manifest) {
    if (!item.arquivo) continue;
    const alvo = path.join(ROOT, 'data', 'aventuras', item.arquivo);
    if (!fs.existsSync(alvo)) {
      console.error(`✗ data/aventuras.json aponta para arquivo inexistente: ${item.arquivo}`);
      process.exit(1);
    }
    assets.push('data/aventuras/' + item.arquivo);
  }

  return assets;
}

function main() {
  const src = fs.readFileSync(SW_PATH, 'utf-8');

  const mLista = /const CORE_ASSETS = \[([\s\S]*?)\];/.exec(src);
  const mVersao = /const CACHE_VERSION = '(v(\d+))';/.exec(src);
  if (!mLista || !mVersao) {
    console.error('✗ Não foi possível localizar CORE_ASSETS ou CACHE_VERSION em sw.js');
    process.exit(1);
  }

  const atuais = [...mLista[1].matchAll(/['"]([^'"]+)['"]/g)].map(m => m[1]);
  const esperados = montarLista();

  const igual = atuais.length === esperados.length &&
    atuais.every((a, i) => a === esperados[i]);

  if (igual) {
    console.log(`✓ sw.js atualizado — ${esperados.length} asset(s), cache ${mVersao[1]}`);
    return;
  }

  if (CHECK) {
    const setAtual = new Set(atuais);
    const setEsperado = new Set(esperados);
    const faltando = esperados.filter(e => !setAtual.has(e));
    const sobrando = atuais.filter(a => !setEsperado.has(a));
    if (faltando.length) console.error('✗ Faltando em CORE_ASSETS: ' + faltando.join(', '));
    if (sobrando.length) console.error('✗ Sobrando em CORE_ASSETS: ' + sobrando.join(', '));
    if (!faltando.length && !sobrando.length) console.error('✗ CORE_ASSETS fora de ordem — rode: npm run gerar-sw');
    console.error('✗ sw.js desatualizado — rode: npm run gerar-sw');
    process.exit(1);
  }

  const novaVersao = 'v' + (parseInt(mVersao[2], 10) + 1);
  const bloco = 'const CORE_ASSETS = [\n' +
    esperados.map(a => `  '${a}',`).join('\n') +
    '\n];';

  let novo = src.replace(mLista[0], bloco);
  novo = novo.replace(mVersao[0], `const CACHE_VERSION = '${novaVersao}';`);
  fs.writeFileSync(SW_PATH, novo);

  console.log(`✓ sw.js reescrito — ${esperados.length} asset(s), cache ${mVersao[1]} → ${novaVersao}`);
}

main();
