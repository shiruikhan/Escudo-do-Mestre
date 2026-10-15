# Design System — Escudo do Mestre

Diretrizes do sistema de design do **Escudo do Mestre** (painel do Mestre para D&D 5.5e): princípios, restrições inegociáveis, tokens e componentes. É a referência para qualquer alteração visual ou estrutural da interface.

- **Versão:** 2.0 (tema "Noite", tipografia Alegreya, navegação inferior)
- **Plataforma alvo:** navegador mobile (smartphone), hospedado em GitHub Pages
- **Stack:** HTML5 + JavaScript Vanilla (ES6+) + Tailwind CSS (build local commitado) + CSS próprio em `assets/css/styles.css`
- **Referência visual:** design system publicado em <https://claude.ai/artifact/J8HhVSwGJs5rgyt4duwwoC>

**Fonte da verdade é o código.** Se este documento e o código divergirem, valem, nesta ordem:

1. Tokens no `:root` de `assets/css/styles.css`;
2. Escalas de cor e famílias em `tailwind.config.js` (espelham os tokens);
3. Helpers de renderização em `assets/js/renderers-core.js` (`painelCard`, `cabecalhoDetalhe`, `campo`, `listaVerbetes`, `itemListaCard`…) e ícones em `assets/js/utils.js` (`window.icone`).

Ao mudar um deles, atualize este documento no mesmo commit.

---

## 1. Filosofia de design

O Escudo do Mestre substitui o escudo físico e os PDFs durante a sessão. O Mestre o usa **com uma mão, no celular, sob pressão de tempo, na frente dos jogadores**. Daí três valores que se sobrepõem a qualquer preferência estética:

1. **Velocidade de leitura.** A informação certa aparece em menos de dois toques. Hierarquia clara vence ornamentação.
2. **Confiabilidade offline-first.** Nada depende de servidor ou rede no meio da mesa. O service worker (`sw.js`) faz precache de HTML, CSS, JS, fontes e dados.
3. **Toque, não clique.** Tudo é dimensionado para o dedo. Nenhuma usabilidade depende de *hover*.

A estética é de **livro de regras à luz de vela**: texto de conteúdo em serifa humanista (Alegreya), interface em sem-serifa da mesma família, fundo grafite e um único ouro para ação.

> Regra de ouro: se um recurso melhora a aparência mas prejudica a velocidade de consulta no celular, ele é rejeitado.

---

## 2. Restrições de tecnologia (GitHub Pages)

O site é servido pelo **GitHub Pages**, que entrega **apenas arquivos estáticos**. Isso é a fundação do projeto.

### 2.1 Proibições (não negociáveis)

- **Sem backend.** Não há servidor de aplicação, banco ou API própria em runtime.
- **Sem etapa de build para servir o site.** O que está no repositório é o que é publicado. Não introduzir Webpack, Vite, Sass, TypeScript ou pipeline que precise rodar para o site funcionar.
- **Sem segredos.** Tudo é público; nunca colocar chaves de API no código. (O Client ID do Spotify é digitado pelo Mestre e fica no `localStorage` do aparelho.)
- **Sem autenticação ou cookies de sessão server-side.**

### 2.2 Permitido

- **HTML, CSS e JS estáticos**, servidos diretamente.
- **Tailwind via build local commitado.** `assets/css/tailwind.css` é gerado de `tailwind.config.js` + `assets/css/tailwind-src.css` com `npm run build:css` e versionado. O build só roda quando alguém adiciona classes novas, nunca para servir o site. Usar apenas utilitários do core; sem `@apply` nem plugins.
- **CSS próprio** em `assets/css/styles.css`: tokens e componentes que o Tailwind não cobre.
- **Fontes web locais (WOFF2)** em `assets/fonts/`, sob SIL OFL (`assets/fonts/OFL.txt`), declaradas com `@font-face` e `font-display: swap`. **Nunca de CDN** (Google Fonts etc.): fonte remota é ponto de falha de rede. Toda fonte nova entra no precache do `sw.js` (`node scripts/gerar-sw.js`).
- **Dados em JSON estático** em `data/`, via `fetch()` relativo.
- **Zero dependências de runtime.** Nenhuma biblioteca externa é carregada em runtime; a exceção é a Web API do Spotify, opcional, usada só pela trilha sonora.

### 2.3 Implicações

- Componentes são **classes CSS** (`styles.css`) e **funções JS que devolvem HTML** (`renderers-*.js`). Sem React/Vue.
- **Ícones de interface são SVG inline** gerados por `window.icone(nome)`. Emoji ficam só onde são *conteúdo* (ver §7).
- Caminhos de assets são sempre **relativos** (`data/...`, `assets/...`), pois o site roda em subdiretório (`usuario.github.io/Escudo-do-Mestre/`).

---

## 3. Mobile puro

O alvo é o **celular em retrato**. Desktop é tolerado, não otimizado.

### 3.1 Diretrizes obrigatórias

- **Mobile-first sempre.** O estilo sem breakpoint é o do celular. Painéis largos (folhas inferiores) se limitam a `min(100vw, 42rem)`.
- **Viewport:** `width=device-width, initial-scale=1.0`. O zoom do navegador fica permitido (acessibilidade); campos usam fonte ≥ 16px para o iOS não aplicar zoom automático no foco.
- **Largura de referência: 360–414px**, conferida em 375px. Nada rola na horizontal.
- **Alvo de toque ≥ 44×44px** (`--alvo-toque`). Botões de ícone, abas, verbetes, campos, células de atributo e controles da trilha respeitam esse mínimo. Única exceção tolerada: chips inline (`.chip-link`, 36px) e badges alternáveis (32px), que ficam dentro de texto e têm espaçamento em volta.
- **Coluna única.** Grades só para microconteúdo (seis atributos, números da ficha, climas da trilha, navegação entre salas).
- **Nada depende de hover.** Feedback por `:active`; `title` é complemento.
- **Texto legível sem zoom.** Corpo de livro 17px, interface 14–16px, legendas/rótulos no mínimo 12px (11px só nos micro-rótulos de `.verbete-dado`). Resumir conteúdo em vez de diminuir a fonte.
- **Ergonomia do polegar.** Navegação entre seções fica **embaixo** (`.nav-inferior`, 64px + área segura). O topo guarda Início/Voltar, título, Anotações e busca, em cabeçalho `sticky`.
- **Área segura.** Barras fixas inferiores somam `env(safe-area-inset-bottom)`.

### 3.2 Antipadrões

- Tabelas largas que forçam rolagem lateral.
- Menus que dependem de hover.
- Modais de tela cheia sem saída óbvia por toque (folhas inferiores fecham pelo véu e pelo botão Fechar).
- Tipografia condensada para caber mais.

---

## 4. Tokens

Os tokens vivem como variáveis CSS em `:root` (`assets/css/styles.css`). Toda cor, raio e espaçamento novo referencia um token antes de virar valor solto.

### 4.1 Cores — tema único "Noite"

Há **um único tema, escuro** (`color-scheme: dark`), pensado para mesas com pouca luz. Não existe alternador claro/escuro; `utils.js` apaga a preferência antiga (`escudo_tema`).

**Neutros grafite**

| Token | Valor | Uso |
|---|---|---|
| `--fundo` | `#111214` | Fundo da aplicação, campos, células de atributo |
| `--painel` | `#1a1b1e` | Painéis de detalhe, listas de verbetes |
| `--painel-alto` | `#232428` | Cabeçalho, folhas inferiores, barra da trilha, toast, estado `:active` |
| `--borda` | `#34363b` | Bordas e filetes |
| `--borda-forte` | `#71737b` | Borda de campos e botões secundários |
| `--tinta` | `#ecebe7` | Texto principal |
| `--tinta-suave` | `#b9b8b3` | Texto secundário, subtítulos |
| `--tinta-apagada` | `#8f8f8b` | Rótulos, legendas, placeholder |
| `--veu` | `rgba(6,7,8,.72)` | Véu atrás de folhas e diálogos |

**Ação**

| Token | Valor | Uso |
|---|---|---|
| `--ouro` | `#e3a93f` | **Única cor de ação:** links, chips, dados, foco, aba ativa, botão primário |
| `--on-ouro` | `#1a1206` | Texto sobre ouro sólido |
| `--ouro-fundo` | `#2f2716` | Fundo de chips, dados, aba ativa, `:active` de ícones |

**Semânticas** (cada uma com par `--x` / `--x-fundo`; comunicam categoria, nunca enfeitam nem indicam ação)

| Token | Valor | Significado |
|---|---|---|
| `--sangue` | `#ec8068` | Ficha de criatura, perigo, armadilha, PV baixo, dano |
| `--arcano` | `#93b6e2` | Disponível, conexões, interação |
| `--musgo` | `#a3c880` | Concluído, localização, cura |
| `--segredo` | `#dc9cc4` | Segredos do Mestre |

**Escalas Tailwind.** `tailwind.config.js` remapeia `zinc`, `amber`, `rose`, `sky` e `emerald` para essa paleta (ex.: `zinc-950` = `--fundo`, `zinc-900` = `--painel`, `zinc-100` = `--tinta`, `amber-400` = `--ouro`). Assim utilitários como `text-zinc-400` já saem na paleta nova. **Mantenha os hex em sincronia com o `:root`.** Em código novo, prefira as classes de componente; utilitários de cor servem para ajustes pontuais.

**Regra:** ouro é a **única** cor de ação/interação. As demais são exclusivamente semânticas.

### 4.2 Tipografia — família Alegreya

| Papel | Token CSS | Classe Tailwind | Família | Uso |
|---|---|---|---|---|
| Livro | `--font-livro` | `font-livro` | Alegreya (400–900, itálico) | Texto de conteúdo, descrições, notas, títulos de aventura |
| Rubrica | `--font-rubrica` | `font-rubrica` | Alegreya SC 700 | Nomes de entidade, títulos de seção, nomes de verbete |
| Escudo | `--font-escudo` | `font-sans` (padrão do `body`) | Alegreya Sans (400/500/700/800) | Interface: botões, campos, números, metadados |
| Rótulo | `--font-rotulo` | `font-rotulo` | Alegreya Sans SC 700 | Micro-rótulos de seção, abas, badges, etiquetas |

Pilhas de reserva: Georgia/Times para as serifadas, `system-ui` para as sem-serifa. Números de jogo usam `.num` / `font-variant-numeric: tabular-nums lining-nums`.

**Escala de uso** (em px, como no CSS):

| Classe | Tamanho/altura | Família |
|---|---|---|
| `.titulo-entidade` | 26/30 | Rubrica |
| `.titulo-secao` | 18/24, filete inferior | Rubrica |
| `.verbete-nome` | 18/22 | Rubrica |
| `.texto-livro` | 17/26 | Livro |
| `.subtitulo-entidade` | 16/22 itálico | Livro |
| `.meta`, `.verbete-sub` | 14/20 | Escudo |
| `.rotulo-secao` | 13/16, espaçado | Rótulo |

Caixa alta não é usada; o efeito de versalete vem das famílias SC.

### 4.3 Espaço, forma e camadas

| Token | Valor |
|---|---|
| `--space-1…6` | 4 · 8 · 12 · 16 · 24 · 32px |
| `--alvo-toque` | 44px |
| `--barra-nav` | 64px |
| `--raio-sm` / `--raio-md` / `--raio-lg` / `--raio-pilula` | 4 · 8 · 16 · 999px |
| `--sombra-folha` | `0 -8px 24px rgba(0,0,0,.5)` |

- **Raio:** `--raio-md` em painéis, listas, campos e botões; `--raio-sm` em chips, badges, dados e etiquetas; `--raio-lg` só no topo das folhas inferiores; `--raio-pilula` no realce da aba ativa e no puxador da folha.
- **Margem lateral da tela:** 16px (`px-4`) no conteúdo.
- **Camadas (z-index):** cabeçalho 20 · trilha 45 · navegação 46 · toast 50 · anotações 55 · folhas/diálogos 60.

### 4.4 Movimento

- Transições de cor/estado em `.15s`; entrada de tela `.fade-in` (`.18s`, 4px); folha inferior sobe em `.22s`.
- Sem animações decorativas. `prefers-reduced-motion: reduce` desliga as animações de entrada.

---

## 5. Catálogo de componentes

Reuso é obrigatório; componente novo só quando nenhum existente serve.

### 5.1 Cabeçalho (`.cabecalho`)
Faixa `sticky` em `--painel-alto`: botão Início, botão Voltar (ouro, só com histórico), título/subtítulo da aventura, botão Anotações e a busca. Botões de ícone usam `.icone-btn` (44×44, `:active` em `--ouro-fundo`).

### 5.2 Navegação inferior (`.nav-inferior`, `.tab-btn`)
Grade fixa de cinco abas com **ícone + rótulo**: Locais, Bestiário, NPCs, Combate e Mais. A aba ativa fica em ouro, com realce pílula atrás do ícone. "Mais" abre uma **folha inferior** (`.folha`) com as seções secundárias (Missões, Ganchos, Itens, Guia, Condições, Eventos de Estrada) em lista de verbetes, mais a ação "Exportar como Markdown".

### 5.3 Busca (`.busca`, `.busca-input`)
Campo de 44px com ícone de lupa, borda `--borda-forte`, foco em ouro. Busca global, sem acento e sem caixa. Resultados são verbetes com etiqueta de tipo (`.res-tag`).

### 5.4 Lista de verbetes (`listaVerbetes` → `.lista-verbetes`; `itemListaCard` → `.verbete`)
O átomo de navegação. Um painel único com linhas separadas por filete; cada linha é um `<button class="open-detail verbete">` de no mínimo 60px com:
- `.verbete-nome` (rubrica) e `.verbete-sub` (uma por sublinha, truncadas);
- `.verbete-dados` opcional à direita: pares número/rótulo (`[{ v: '1/4', r: 'ND' }]`);
- `.verbete-seta` (chevron desenhado em CSS).

Variantes: `.verbete-bloco` (texto em várias linhas, `.verbete-trecho`), `.verbete-ocupantes` (quem está na sala, em ouro).

### 5.5 Painel de detalhe (`painelCard` → `.painel`)
Contêiner `--painel` + borda + `--raio-md` + 16px. Por padrão leva `painel-neutro` (filete neutro); a ficha de criatura usa `ficha` (régua `--sangue`).

### 5.6 Cabeçalho de detalhe (`cabecalhoDetalhe`)
Sequência fixa: `.rotulo-secao.cabeca` (tipo da entidade) → `h3.titulo-entidade` (nome) → `.subtitulo-entidade` (linha em itálico). Seções internas usam `.titulo-secao`.

### 5.7 Campo rotulado (`campo(rotulo, html, tom)`)
Rótulo + `.texto-livro`. Tons:
- `ouro`, `arcano`, `musgo`: losango colorido antes do rótulo;
- `segredo`, `perigo`: caixa com fundo tingido (`--segredo-fundo` / `--sangue-fundo`);
- `mestre`: caixa tracejada neutra, para notas de condução.

`campoDestaque` mantém as chamadas antigas por cor (`amber`→`ouro`, `rose`→`segredo`, `sky`→`arcano`, `emerald`→`musgo`).

### 5.8 Ficha de criatura (`.ficha`, `.ficha-nums`, `.stat-grid`, `.stat-cell`, `.stat-divider`)
Rótulos e régua em `--sangue`; números-chave (CA, PV, deslocamento, ND) em grade de 4; atributos em grade de 6 células de 44px. Inclui o rastreador de PV (`.pv-tracker`, `.pv-btn`: dano em `--sangue`, cura em `--musgo`) e o botão "Adicionar ao combate" (`.cb-add-monstro`).

### 5.9 Links, dados e chips
- `.drill-link`: link inline em ouro, sublinhado fino. Gerado por `parseLinks` a partir de marcadores `bestiario:`, `npc:`, `itens:` etc.
- `.dice-link`: notação de dado (`2d6`, `1d8+3`) em etiqueta `--ouro-fundo`; o toque rola e mostra o resultado no toast.
- `.chip-link`: etiqueta clicável para criaturas/NPCs/locais (`chip`, `grupoChips`).

### 5.10 Badges de status (`.badge`)
Cor + forma + palavra: `disponivel` (arcano, círculo), `andamento` (ouro, losango), `concluida` (musgo, ✓). `.badge-toggle` alterna o status com um toque.

### 5.11 Botões (`.btn`)
44px de altura, `--raio-md`, 16px bold. `.btn-primario` (ouro sólido, texto `--on-ouro`) para a ação principal da tela; `.btn-secundario` (contorno `--borda-forte`) para as demais; `.btn-largo` ocupa a largura toda. O combate e a trilha têm variantes próprias com as mesmas regras (`.cb-btn`, `.cb-btn-destaque`, `.trilha-btn-*`).

### 5.12 Folhas inferiores e diálogos
`.folha` (menu Mais), `.painel-notas` (anotações) e `.trilha-config` (configuração da trilha): sobem da borda inferior em `--painel-alto`, raio `--raio-lg` só no topo, véu `--veu`, botão Fechar de 44px com ícone `fechar`.

### 5.13 Trilha sonora (`.trilha-bar`)
Barra fixa acima da navegação: emoji do clima, faixa e dispositivo, e botões de ícone (`.trilha-icone-btn`, 44px) **Próxima** (`proxima`), **Tocar/Pausar** (`tocar`/`pausar`, em ouro, troca conforme o estado) e **Configurar** (`ajustes`). Tocar na faixa expande o painel com a grade de climas (3 colunas), seletor de dispositivo (com botão `atualizar`) e volume. Sem conexão, a barra fica apagada mas no lugar.

### 5.14 Rastreador de combate (`.cb-*`)
Formulário de iniciativa, controle de rodada e linhas de combatente; o turno ativo ganha borda e insígnia de iniciativa em ouro.

### 5.15 Estados de apoio
`.vazio` (mensagem central apagada), `.spinner` (anel com topo em ouro), `.toast` (aviso flutuante acima das barras fixas; `.toast-acao` em ouro), `.ajuda` (texto de ajuda pequeno).

### 5.16 Tela inicial
`.marca` (logo + título em livro 34px) e `.aventura-card` (título, descrição limitada a 3 linhas e números da aventura).

---

## 6. Navegação e interação

- **Drill-down / drill-up.** Listas levam a detalhes; todo nome citado no texto é link para a entidade. Voltar (cabeçalho ou botão físico) desempilha o histórico.
- **SPA sem recarga.** A URL guarda o `?id=` da aventura e, no hash, a tela atual; por isso o voltar do aparelho e o recarregar caem na mesma tela.
- **Feedback de toque** por `:active` (`--painel-alto` em verbetes, `--ouro-fundo` em ícones, ouro sólido em chips/dados). Sem spinners longos: os dados são locais.
- **Foco visível:** anel sólido de 2px em ouro (`:focus-visible`) em botões, links, campos e `summary`.

---

## 7. Conteúdo, dados e ícones

- **Dados primeiro.** Cada seção é JSON; `renderers-*.js` transformam JSON em HTML e nunca embutem conteúdo de jogo.
- **Escape obrigatório.** Todo texto vindo de JSON ou do usuário passa por `escHtml` (ou `parseLinks`, que escapa) antes de ir ao DOM. Helpers como `campo()` recebem HTML **já escapado**. Nunca interpolar conteúdo cru.
- **Ícones de interface = SVG** de `window.icone(nome, classe?)` (`assets/js/utils.js`, objeto `ICONES`):
  - grade 24×24, traço 1.75px, pontas e junções arredondadas, sem preenchimento, cor `currentColor`;
  - classe `.icone` (22px; 18px dentro da busca e de botões compactos);
  - sempre `aria-hidden`; o rótulo acessível fica no botão;
  - ícone novo entra no `ICONES` no mesmo estilo. Nada de glifos Unicode (⚙, ▶, ⟳, ×…) ou fontes de ícones.
- **Emoji só como conteúdo:** clima da trilha, condições, eventos, ícone de verbete vindo do JSON.
- **Idioma:** português (Brasil), terminologia D&D 5.5e (2024).

---

## 8. Acessibilidade

- `aria-label` (e `title`) em todo controle só-ícone; botões que mudam de estado atualizam o rótulo (Tocar ↔ Pausar).
- Contraste: `--tinta` e `--tinta-suave` sobre `--fundo`/`--painel` para conteúdo; `--tinta-apagada` só para rótulos e legendas.
- Status nunca só por cor: badges combinam cor, forma e palavra.
- Semântica: `<button>` para ação, `<a>` para navegação real, `<ul>/<li>` para coleções, `role="dialog"` + `aria-modal` nas folhas.
- Respeitar `prefers-reduced-motion`.

---

## 9. Orçamento de performance

- **Carga enxuta:** HTML + `tailwind.css` + `styles.css` + scripts locais + 8 WOFF2 (Alegreya, subconjunto de pesos realmente usados). Sem imagens pesadas no caminho crítico.
- **Fontes com `font-display: swap`** e precache no service worker: a primeira visita mostra o texto na fonte de reserva; as seguintes já vêm do cache.
- **JSON sob demanda:** índice de aventuras, depois a aventura escolhida, mais condições e eventos globais.
- **Service worker:** lista de assets gerada por `node scripts/gerar-sw.js`; `npm run check-sw` falha se ela estiver desatualizada.

---

## 10. Checklist para adicionar/alterar um componente

- [ ] Funciona como **arquivo estático** no GitHub Pages; se adicionou classes Tailwind, rodou `npm run build:css` e commitou o CSS gerado.
- [ ] Utilizável em **360px**, coluna única, sem rolagem horizontal (conferir em 375px).
- [ ] Alvos de toque **≥ 44px**; nada depende de hover.
- [ ] Usa **tokens** do `:root` (cor, espaço, raio) e, se mexeu na paleta, sincronizou `tailwind.config.js`.
- [ ] Reutiliza um **componente/helper existente** (`painelCard`, `cabecalhoDetalhe`, `campo`, `listaVerbetes`, `itemListaCard`…).
- [ ] **Ouro é a única cor de ação**; demais cores são semânticas.
- [ ] Texto de dados passa por **escape** antes do DOM.
- [ ] Ícones de interface vêm de **`window.icone`**; controles só-ícone têm **`aria-label`**.
- [ ] Caminhos de asset **relativos**; asset novo (fonte, imagem, script) entrou no `sw.js` (`npm run check-sw` passa).
- [ ] Nenhuma dependência de runtime nova.

---

## 11. Regras inegociáveis

1. **Estático sempre** — nada que exija servidor ou build para rodar no GitHub Pages.
2. **Mobile puro** — celular em retrato é o alvo; desktop é tolerado.
3. **Toque, não hover** — alvos ≥ 44px, feedback por `:active`.
4. **Velocidade de consulta acima de estética** — resumir antes de comprimir tipografia.
5. **Tema único "Noite"; ouro é a única cor de ação.**
6. **Escape obrigatório** de todo conteúdo antes do DOM.
7. **Tokens e componentes existentes antes de novos.**
8. **Zero dependências de runtime; fontes e ícones são locais.**
