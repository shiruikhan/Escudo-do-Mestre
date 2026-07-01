#!/usr/bin/env node
// Escudo do Mestre — Validação dos arquivos de dados (data/)
//
// 1. Verifica se todo JSON em data/ tem sintaxe válida.
// 2. Verifica se cada entrada de data/aventuras.json aponta para um arquivo existente.
// 3. Verifica se todo marcador de drill-down (npc:, bestiario:, itens:, item:) usado
//    nos textos de cada aventura corresponde a uma chave real na respectiva seção.
//
// Uso: node scripts/validar-dados.js  (ou: npm run validar-dados)
// Sai com código 1 se encontrar algum erro — pode ser usado em CI.

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');

const PREFIXO_PARA_SECAO = { npc: 'npcs', bestiario: 'bestiario', itens: 'itens', item: 'itens' };

let erros = 0;

function erro(msg) {
  console.error('✗ ' + msg);
  erros++;
}

function ok(msg) {
  console.log('✓ ' + msg);
}

function listarJsons(dir) {
  const resultado = [];
  for (const entrada of fs.readdirSync(dir, { withFileTypes: true })) {
    const caminho = path.join(dir, entrada.name);
    if (entrada.isDirectory()) resultado.push(...listarJsons(caminho));
    else if (entrada.name.endsWith('.json')) resultado.push(caminho);
  }
  return resultado;
}

function carregarJson(caminho) {
  const relativo = path.relative(ROOT, caminho);
  try {
    return JSON.parse(fs.readFileSync(caminho, 'utf-8'));
  } catch (e) {
    erro(`${relativo}: JSON inválido — ${e.message}`);
    return null;
  }
}

function main() {
  if (!fs.existsSync(DATA_DIR)) {
    erro('Diretório data/ não encontrado.');
    process.exit(1);
  }

  // 1. Sintaxe de todos os JSONs em data/
  const arquivos = listarJsons(DATA_DIR);
  const dados = new Map();
  for (const caminho of arquivos) {
    const json = carregarJson(caminho);
    if (json !== null) dados.set(caminho, json);
  }
  ok(`${dados.size}/${arquivos.length} arquivo(s) JSON com sintaxe válida em data/`);

  // 2. Manifest data/aventuras.json -> arquivos referenciados existem
  const manifestPath = path.join(DATA_DIR, 'aventuras.json');
  const manifest = dados.get(manifestPath);
  if (manifest) {
    for (const item of manifest) {
      const alvo = item.arquivo ? path.join(DATA_DIR, 'aventuras', item.arquivo) : null;
      if (!alvo || !fs.existsSync(alvo)) {
        erro(`data/aventuras.json: entrada "${item.id}" aponta para arquivo inexistente: ${item.arquivo}`);
      }
    }
    ok(`data/aventuras.json referencia ${manifest.length} aventura(s)`);
  }

  // 3. Marcadores de drill-down (npc:/bestiario:/itens:/item:) apontam para chaves existentes
  const aventurasDir = path.join(DATA_DIR, 'aventuras');
  if (fs.existsSync(aventurasDir)) {
    for (const caminho of listarJsons(aventurasDir)) {
      const aventura = dados.get(caminho);
      if (!aventura) continue;
      const relativo = path.relative(ROOT, caminho);

      const idsValidos = {
        npcs: new Set(Object.keys(aventura.npcs || {})),
        bestiario: new Set(Object.keys(aventura.bestiario || {})),
        itens: new Set(Object.keys(aventura.itens || {})),
      };

      const texto = JSON.stringify(aventura);
      const re = /(npc|bestiario|itens|item):([a-z0-9-]+)/g;
      const jaReportados = new Set();
      let total = 0;
      let m;
      while ((m = re.exec(texto)) !== null) {
        total++;
        const secao = PREFIXO_PARA_SECAO[m[1]];
        const id = m[2];
        const chave = `${m[1]}:${id}`;
        if (!idsValidos[secao].has(id) && !jaReportados.has(chave)) {
          jaReportados.add(chave);
          erro(`${relativo}: marcador "${chave}" não corresponde a nenhuma chave em "${secao}"`);
        }
      }
      if (!jaReportados.size) ok(`${relativo}: ${total} marcador(es) de drill-down, todos válidos`);
    }
  }

  console.log('');
  if (erros) {
    console.error(`${erros} erro(s) encontrado(s).`);
    process.exit(1);
  }
  console.log('Nenhum erro encontrado.');
}

main();
