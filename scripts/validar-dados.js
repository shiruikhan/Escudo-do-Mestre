#!/usr/bin/env node
// Escudo do Mestre — Validação dos arquivos de dados (data/)
//
// 1. Verifica se todo JSON em data/ tem sintaxe válida.
// 2. Verifica se cada entrada de data/aventuras.json aponta para um arquivo existente.
// 3. Verifica se todo marcador de drill-down (npc:, bestiario:, itens:/item:,
//    locais:/local:) usado nos textos de cada aventura corresponde a uma chave
//    real na respectiva seção.
//
// Uso: node scripts/validar-dados.js  (ou: npm run validar-dados)
// Sai com código 1 se encontrar algum erro — pode ser usado em CI.

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const JS_DIR = path.join(ROOT, 'assets', 'js');

let erros = 0;

function erro(msg) {
  console.error('✗ ' + msg);
  erros++;
}

function ok(msg) {
  console.log('✓ ' + msg);
}

// Única fonte de verdade é assets/js/marcadores.js (módulo UMD compartilhado
// entre navegador e Node) — o mesmo mapa que o app usa em runtime.
function carregarPrefixoParaSecao() {
  return require(path.join(JS_DIR, 'marcadores.js')).PREFIXO_PARA_SECAO;
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
  const PREFIXO_PARA_SECAO = carregarPrefixoParaSecao();
  const MARCADOR_RE = /(npc|bestiario|itens|item|locais|local):([a-z0-9-]+)/g;

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
        locais: new Set(Object.keys(aventura.locais || {})),
      };

      const texto = JSON.stringify(aventura);
      const jaReportados = new Set();
      let total = 0;
      let m;
      while ((m = MARCADOR_RE.exec(texto)) !== null) {
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

  // 4. Arquivos globais (condicoes.json, eventos-estrada.json) são compartilhados entre
  // todas as aventuras e não têm seções próprias de npcs/bestiario/itens — um marcador de
  // drill-down ali só resolveria por coincidência, então é sempre tratado como erro.
  for (const nome of ['condicoes.json', 'eventos-estrada.json']) {
    const caminho = path.join(DATA_DIR, nome);
    const conteudo = dados.get(caminho);
    if (!conteudo) continue;
    const relativo = path.relative(ROOT, caminho);
    const texto = JSON.stringify(conteudo);
    const encontrados = new Set();
    let m;
    while ((m = MARCADOR_RE.exec(texto)) !== null) encontrados.add(`${m[1]}:${m[2]}`);
    if (encontrados.size) {
      erro(`${relativo}: marcador(es) de drill-down não suportado(s) em arquivo global: ${[...encontrados].join(', ')}`);
    } else {
      ok(`${relativo}: nenhum marcador de drill-down (esperado — arquivo global)`);
    }
  }

  // 4.1 Trilha sonora: catálogo de climas e URIs de playlist.
  // Um URI errado só apareceria como erro do Spotify no meio da sessão, então
  // o formato é checado aqui. Nenhum Client ID deve existir em data/ — ele é
  // digitado pelo usuário e vive em localStorage (plano §10.1).
  const URI_RE = /^spotify:(playlist|album|artist|show|episode):[A-Za-z0-9]+$/;
  const trilhaPath = path.join(DATA_DIR, 'trilha.json');
  const trilha = dados.get(trilhaPath);
  const climasConhecidos = new Set();
  const errosAntes = erros;
  if (trilha) {
    if (!Array.isArray(trilha.climas) || !trilha.climas.length) {
      erro('data/trilha.json: campo "climas" ausente ou vazio.');
    } else {
      for (const clima of trilha.climas) {
        if (!clima.id || !clima.rotulo) {
          erro(`data/trilha.json: clima sem "id" ou "rotulo": ${JSON.stringify(clima)}`);
          continue;
        }
        if (climasConhecidos.has(clima.id)) {
          erro(`data/trilha.json: clima "${clima.id}" duplicado.`);
        }
        climasConhecidos.add(clima.id);
        if (clima.uri && !URI_RE.test(clima.uri)) {
          erro(`data/trilha.json: clima "${clima.id}" tem URI inválido: ${clima.uri}`);
        }
      }
      if (Object.prototype.hasOwnProperty.call(trilha, 'client_id_padrao')) {
        erro('data/trilha.json: Client ID não deve ser versionado — o campo é digitado pelo usuário no app.');
      }
      if (erros === errosAntes) ok(`data/trilha.json: ${climasConhecidos.size} clima(s) válido(s)`);
    }
  }

  // 4.2 Override de trilha por aventura: ids de clima precisam existir no
  // catálogo, senão o botão nunca receberia a playlist e falharia em silêncio.
  if (climasConhecidos.size && fs.existsSync(aventurasDir)) {
    let comTrilha = 0;
    for (const caminho of listarJsons(aventurasDir)) {
      const aventura = dados.get(caminho);
      if (!aventura || !aventura.trilha) continue;
      comTrilha++;
      const relativo = path.relative(ROOT, caminho);
      for (const [id, uri] of Object.entries(aventura.trilha)) {
        if (!climasConhecidos.has(id)) {
          erro(`${relativo}: trilha refere-se ao clima "${id}", ausente de data/trilha.json`);
        }
        if (!URI_RE.test(uri)) {
          erro(`${relativo}: trilha["${id}"] tem URI inválido: ${uri}`);
        }
      }
    }
    ok(`${comTrilha} aventura(s) com trilha própria`);
  }

  // 5. sw.js precisa listar todo asset servido, ou o app quebra offline após a
  // primeira visita (silenciosamente, já que o cache-first não avisa sobre 404).
  const swPath = path.join(ROOT, 'sw.js');
  if (fs.existsSync(swPath)) {
    const swSrc = fs.readFileSync(swPath, 'utf-8');
    const swMatch = /CORE_ASSETS = \[([\s\S]*?)\];/.exec(swSrc);
    const listados = new Set(
      swMatch ? [...swMatch[1].matchAll(/['"]([^'"]+)['"]/g)].map(m => m[1]) : []
    );

    const esperados = [];
    for (const arq of fs.readdirSync(JS_DIR)) {
      if (arq.endsWith('.js')) esperados.push('assets/js/' + arq);
    }
    esperados.push('data/aventuras.json', 'data/condicoes.json', 'data/eventos-estrada.json', 'data/trilha.json');
    if (manifest) {
      for (const item of manifest) {
        if (item.arquivo) esperados.push('data/aventuras/' + item.arquivo);
      }
    }

    const faltando = esperados.filter(e => !listados.has(e));
    if (faltando.length) {
      erro(`sw.js: CORE_ASSETS não lista os seguintes arquivos (ficarão indisponíveis offline): ${faltando.join(', ')}`);
    } else {
      ok(`sw.js: CORE_ASSETS cobre todos os ${esperados.length} arquivo(s) de JS/dados esperados`);
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
