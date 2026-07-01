// Escudo do Mestre — Índice de busca, resultados, sugestões e exportação Markdown
(function () {
  'use strict';

  const { normalizar, resultadoDetalhe } = window.Renderers._;

  function construirIndice(aventura) {
    const idx = [];
    for (const [id, b] of Object.entries(aventura.bestiario || {}))
      idx.push({ tipo: 'bestiario', id, label: 'Monstro', nome: b.nome, sub: b.tipo_alinhamento,
        campos: [normalizar(b.nome), normalizar(b.tipo_alinhamento)] });
    for (const [id, n] of Object.entries(aventura.npcs || {}))
      idx.push({ tipo: 'npcs', id, label: 'NPC', nome: n.nome, sub: n.papel || n.local,
        campos: [normalizar(n.nome), normalizar(n.papel), normalizar(n.local)] });
    for (const [id, i] of Object.entries(aventura.itens || {}))
      idx.push({ tipo: 'itens', id, label: 'Item', nome: i.nome, sub: i.tipo,
        campos: [normalizar(i.nome), normalizar(i.tipo), normalizar(i.efeito)] });
    for (const [id, l] of Object.entries(aventura.locais || {}))
      idx.push({ tipo: 'locais', id, label: 'Local', nome: l.nome, sub: l.tipo,
        campos: [normalizar(l.nome), normalizar(l.tipo), normalizar(l.resumo)] });
    (aventura.missoes || []).forEach((m, i) =>
      idx.push({ tipo: 'missoes', id: String(i), label: 'Missão', nome: m.titulo, sub: m.localizacao,
        campos: [normalizar(m.titulo), normalizar(m.objetivo), normalizar(m.localizacao)] }));
    (aventura.ganchos || []).forEach((g, i) => {
      const texto = typeof g === 'object' ? g.texto : g;
      const fonte = typeof g === 'object' ? g.fonte : '';
      idx.push({ tipo: 'ganchos', id: String(i), label: 'Gancho', nome: fonte || 'Gancho',
        sub: (texto || '').slice(0, 70), campos: [normalizar(texto), normalizar(fonte)] });
    });
    for (const [id, c] of Object.entries(aventura.condicoes || {}))
      idx.push({ tipo: 'condicoes', id, label: 'Condição', nome: c.nome, sub: c.resumo,
        campos: [normalizar(c.nome), normalizar(c.resumo)] });
    for (const [id, e] of Object.entries(aventura.eventos || {}))
      idx.push({ tipo: 'eventos', id, label: 'Evento', nome: e.nome, sub: e.narrativa,
        campos: [normalizar(e.nome), normalizar(e.narrativa)] });
    return idx;
  }

  function sugestoesFoco(aventura) {
    const grupos = [
      { chave: 'bestiario', tipo: 'bestiario', label: 'Monstro', getSub: b => b.tipo_alinhamento },
      { chave: 'npcs',      tipo: 'npcs',      label: 'NPC',     getSub: n => n.papel || n.local },
      { chave: 'locais',    tipo: 'locais',    label: 'Local',   getSub: l => l.tipo },
    ];
    const res = [];
    for (const g of grupos)
      for (const [id, obj] of Object.entries(aventura[g.chave] || {}).slice(0, 3))
        res.push(resultadoDetalhe(g.tipo, id, obj.nome, g.label, g.getSub(obj)));
    if (!res.length) return '';
    return `<p class="text-xs text-zinc-500 mb-2">Acesso rápido</p>
      <ul class="space-y-2 fade-in">${res.join('')}</ul>`;
  }

  function resultadosBusca(aventura, indice, query) {
    const q = normalizar(query);
    if (!q) return '';
    const res = [];
    for (const e of indice)
      if (e.campos.some(c => c.includes(q)))
        res.push(resultadoDetalhe(e.tipo, e.id, e.nome, e.label, e.sub));
    if (!res.length) {
      return `<div class="text-center text-zinc-600 mt-16">
        <div class="text-4xl mb-3">\u{1F50D}</div>
        <p class="text-sm">Nada encontrado para "${window.escHtml(query)}".</p>
      </div>`;
    }
    return `<p class="text-xs text-zinc-500 mb-2">${res.length} resultado(s)</p>
      <ul class="space-y-2 fade-in">${res.join('')}</ul>`;
  }

  function exportarMarkdown(aventura) {
    const md = [];
    const sep = () => md.push('');

    md.push(`# ${aventura.titulo || 'Aventura'}`);
    if (aventura.nivel_recomendado) md.push(`**Níveis:** ${aventura.nivel_recomendado}`);
    if (aventura.cenario) md.push(`**Cenário:** ${aventura.cenario}`);
    sep();

    const ganchos = aventura.ganchos || [];
    if (ganchos.length) {
      md.push('## Ganchos');
      ganchos.forEach(g => {
        const fonte = typeof g === 'object' ? g.fonte : null;
        const texto = typeof g === 'object' ? g.texto : g;
        if (fonte) md.push(`**${fonte}**`);
        md.push(texto || ''); sep();
      });
    }

    if ((aventura.missoes || []).length) {
      md.push('## Missões');
      aventura.missoes.forEach(m => {
        md.push(`### ${m.titulo} [${m.status || '—'}]`);
        if (m.localizacao) md.push(`*${m.localizacao}*`);
        if (m.objetivo) { sep(); md.push(m.objetivo); }
        if (m.recompensa) md.push(`**Recompensa:** ${m.recompensa}`);
        if (m.notas_dm) md.push(`> 🗒 ${m.notas_dm}`);
        sep();
      });
    }

    const locais = Object.values(aventura.locais || {});
    if (locais.length) {
      md.push('## Locais');
      locais.forEach(l => {
        md.push(`### ${l.nome}`);
        if (l.tipo) md.push(`*${l.tipo}*`);
        if (l.resumo) { sep(); md.push(l.resumo); }
        if (l.perigos) md.push(`**Perigos:** ${l.perigos}`);
        if (l.tesouro) md.push(`**Tesouro:** ${l.tesouro}`);
        if (l.conexoes) md.push(`**Conexões:** ${l.conexoes}`);
        sep();
      });
    }

    const npcs = Object.values(aventura.npcs || {});
    if (npcs.length) {
      md.push('## NPCs');
      npcs.forEach(n => {
        md.push(`### ${n.nome}`);
        if (n.papel) md.push(`*${n.papel}*`);
        if (n.local) md.push(`**Local:** ${n.local}`);
        if (n.descricao) { sep(); md.push(n.descricao); }
        if (n.motivacao) md.push(`**Motivação:** ${n.motivacao}`);
        if (n.segredos) md.push(`**Segredos:** ${n.segredos}`);
        if (n.interacao) md.push(`**Interação:** ${n.interacao}`);
        sep();
      });
    }

    const bestiario = Object.values(aventura.bestiario || {});
    if (bestiario.length) {
      md.push('## Bestiário');
      bestiario.forEach(b => {
        md.push(`### ${b.nome}`);
        md.push(`*${b.tipo_alinhamento || ''}*`);
        const stats = [];
        if (b.ca != null) stats.push(`CA ${b.ca}`);
        if (b.pv != null) stats.push(`PV ${b.pv}`);
        if (b.nd != null) stats.push(`ND ${b.nd}`);
        if (stats.length) md.push(stats.join(' · '));
        sep();
      });
    }

    const itens = Object.values(aventura.itens || {});
    if (itens.length) {
      md.push('## Itens');
      itens.forEach(i => {
        md.push(`### ${i.nome}`);
        if (i.tipo) md.push(`*${i.tipo}*`);
        if (i.efeito) { sep(); md.push(i.efeito); }
        sep();
      });
    }

    const eventos = Object.values(aventura.eventos || {});
    if (eventos.length) {
      md.push('## Eventos de Estrada');
      eventos.forEach(e => {
        md.push(`### ${e.nome}`);
        if (e.narrativa) { sep(); md.push(e.narrativa); }
        if (e.teste) md.push(`**Teste:** ${e.teste}`);
        if (e.recompensa) md.push(`**Recompensa:** ${e.recompensa}`);
        if (e.risco) md.push(`**Risco:** ${e.risco}`);
        if (e.nota_dm) md.push(`> 🗒 ${e.nota_dm}`);
        sep();
      });
    }

    return md.join('\n');
  }

  window.Renderers.construirIndice = construirIndice;
  window.Renderers.resultadosBusca = resultadosBusca;
  window.Renderers.sugestoesFoco = sugestoesFoco;
  window.Renderers.exportarMarkdown = exportarMarkdown;
})();
