# Design System — Escudo do Mestre

Diretrizes e direcionamentos para a construção e evolução do sistema de design do **Escudo do Mestre** (painel do Mestre para D&D 5.5e). Este documento define os princípios, restrições inegociáveis, tokens e padrões de componentes. Serve como referência única para qualquer alteração visual ou estrutural da interface.

- **Versão:** 1.0
- **Plataforma alvo:** Navegador mobile (smartphone), hospedado em GitHub Pages
- **Stack:** HTML5 + JavaScript Vanilla (ES6+) + Tailwind CSS (build local commitado) + CSS custom em `assets/css/styles.css`

---

## 1. Filosofia de design

O Escudo do Mestre substitui o escudo físico e os PDFs durante a sessão de jogo. O Mestre o usa **com uma mão, no celular, sob pressão de tempo, na frente dos jogadores**. Disso decorrem três valores que se sobrepõem a qualquer preferência estética:

1. **Velocidade de leitura.** A informação certa precisa aparecer em menos de dois toques. Hierarquia visual clara vence ornamentação.
2. **Confiabilidade offline-first.** Nada pode depender de servidor, build ou rede no meio da mesa. O que não carrega instantaneamente não existe.
3. **Toque, não clique.** Tudo é dimensionado para o dedo, não para o cursor. Não há estados de *hover* dos quais a usabilidade dependa.

> Regra de ouro: se um recurso melhora a aparência mas prejudica a velocidade de consulta no celular, ele é rejeitado.

---

## 2. Restrições de tecnologia (GitHub Pages)

O site é hospedado em **GitHub Pages**, que serve **apenas arquivos estáticos**. Isso não é uma limitação temporária — é a fundação do projeto e define o que é permitido.

### 2.1 Proibições (não negociáveis)

- **Sem backend / sem servidor de aplicação.** Não há Node, PHP, banco de dados ou API própria em runtime. Nenhuma funcionalidade pode exigir processamento no servidor.
- **Sem etapa de build obrigatória.** O que está no repositório é o que é servido. Não se deve introduzir Webpack, Vite, Sass compilado, TypeScript transpilado ou qualquer pipeline que exija `npm run build` para o site funcionar. O código-fonte e o código publicado são o mesmo.
- **Sem variáveis de ambiente / segredos.** Tudo é público. Nunca colocar chaves de API ou dados sensíveis no código.
- **Sem cookies de sessão ou autenticação server-side.**

### 2.2 Permitido e recomendado

- **HTML, CSS e JavaScript estáticos**, servidos diretamente.
- **Tailwind CSS via build local commitado** (`assets/css/tailwind.css`, gerado a partir de `tailwind.config.js` + `assets/css/tailwind-src.css` com `npm run build:css`). O CSS gerado é versionado no repositório e servido diretamente — não há CDN nem compilação em runtime, então continua valendo "sem etapa de build obrigatória" (o build só roda quando alguém adiciona/altera classes, nunca para servir o site). Usar apenas classes utilitárias do core; `@apply` e plugins customizados são evitados para manter o processo de build trivial.
- **CSS custom** em `assets/css/styles.css` para tokens (variáveis CSS) e componentes próprios que o Tailwind não cobre.
- **Dados em JSON estático** dentro de `data/`, carregados via `fetch()` relativo. Toda "base de dados" do app é arquivo `.json` versionado.
- **Bibliotecas externas via CDN**, se imprescindíveis — mas cada dependência adicionada é peso e ponto de falha de rede. O default é **zero dependências de runtime além do Tailwind**.

### 2.3 Implicações para o design system

- Componentes são definidos como **classes CSS** (em `styles.css`) e/ou **combinações de utilitários Tailwind** geradas por funções JS de renderização (`assets/js/renderers.js`). Não há componentização via framework (React/Vue).
- Ícones são **emoji Unicode** ou **glifos/entidades HTML** (ex.: `&rsaquo;`, `&#8962;`). Não se deve depender de bibliotecas de ícones que exijam build ou fontes externas pesadas.
- Caminhos de assets são sempre **relativos** (`data/...`, `assets/...`), pois o site pode ser servido em subdiretório (`usuario.github.io/Escudo-do-Mestre/`).

---

## 3. Exigência de mobile puro

O alvo **não é "responsivo desktop-first que também funciona no celular"**. É **mobile puro**: o celular em modo retrato é o único contexto de uso real. O desktop é tolerado, não otimizado.

### 3.1 Diretrizes obrigatórias

- **Mobile-first sempre.** O estilo base (sem breakpoint) é o estilo do celular. Qualquer adaptação para telas maiores é exceção opcional, nunca o ponto de partida.
- **Viewport travado:** `width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no`. Evita zoom acidental durante a sessão.
- **Largura de referência: ~360–414px.** Todo componente deve caber e ser legível nessa faixa sem rolagem horizontal indesejada.
- **Alvos de toque ≥ 44×44px.** Botões, abas e itens de lista respeitam esse mínimo (ex.: abas têm `2.75rem ≈ 44px`). Nada clicável menor que isso.
- **Layout em coluna única.** Cards empilhados verticalmente. Grades só para microconteúdo (ex.: os seis atributos do bloco de estatísticas).
- **Nada depende de hover.** Estados de interação usam `:active` (toque), não `:hover`. Tooltips/`title` são complementos, nunca o único caminho para uma informação.
- **Rolagem vertical é natural; horizontal é proibida** — salvo faixas explicitamente roláveis e contidas (ex.: a barra de abas usa `overflow-x: auto` como reserva, sem barra de rolagem visível).
- **Texto sem zoom necessário.** Corpo mínimo `0.875rem` (text-sm); legendas mínimas `0.75rem` (text-xs). Não usar fontes menores para "caber mais".
- **Área segura e ergonomia do polegar.** Ações primárias (voltar, busca, abas) ficam no topo, ao alcance, em header fixo (`sticky`).

### 3.2 Antipadrões a evitar

- Tabelas largas, multi-coluna, que forçam rolagem lateral.
- Menus suspensos que dependem de hover.
- Modais que cobrem a tela inteira sem saída óbvia por toque.
- Tipografia condensada para compensar excesso de informação — em vez disso, **resumir o conteúdo**.

---

## 4. Tokens de design

Os tokens vivem como **variáveis CSS** em `:root` (`assets/css/styles.css`). Toda cor, raio e espaçamento novo deve referenciar um token existente antes de criar um valor solto.

### 4.1 Cores

Tema **escuro permanente** (`<html class="dark">`), pensado para ambientes de mesa com pouca luz e para não ofuscar.

| Token | Valor | Uso |
|---|---|---|
| `--cor-fundo` | `#09090b` (zinc-950) | Fundo geral da aplicação |
| `--cor-painel` | `#18181b` (zinc-900) | Cards, botões inativos |
| `--cor-borda` | `#27272a` (zinc-800) | Bordas de cards e divisórias |
| `--cor-ambar` | `#fbbf24` (amber-400) | **Cor de marca / destaque / interação** |
| `--cor-ambar-escuro` | `#b45309` (amber-700) | Gradientes e detalhes |

Escala de texto (via Tailwind zinc): `zinc-100` (texto principal), `zinc-300` (corpo secundário), `zinc-400/500` (legendas), `zinc-600/700` (texto desativado).

**Cores semânticas** (usadas em destaques e badges, sempre em tom suave com 5–20% de opacidade no fundo):

| Significado | Cor base | Aplicação |
|---|---|---|
| Âmbar | amber | Marca, motivação, tesouro, destaque neutro |
| Azul | blue/sky | Status "Disponível", informações de acesso |
| Verde | emerald/green | Status "Concluída", localização positiva |
| Rosa | rose | Segredos, **perigos** |
| Verde-água | sky | Interação, conexões |

**Regra:** âmbar é a única cor de ação/interação. Links, chips, foco de input e aba ativa são âmbar. As demais cores são exclusivamente **semânticas** (comunicam categoria), nunca decorativas.

### 4.2 Tipografia

- **Família:** stack do sistema (default do Tailwind). Não importar fontes web — é peso de rede e ponto de falha.
- **Escala:** `text-xs` (0.75rem) · `text-sm` (0.875rem) · `text-base` (1rem) · `text-lg` (1.125rem). Títulos de detalhe usam `text-lg` âmbar/negrito.
- **Pesos:** 400 (corpo), 600 (semibold, rótulos), 700 (bold, títulos e badges).
- **Caixa alta** apenas em microrrótulos de seção (`text-xs uppercase tracking-wider`).

### 4.3 Forma e espaçamento

- **Raio padrão:** `rounded-xl` (0.75rem) em cards; `9999px` (pílula) em abas, chips, badges e input de busca.
- **Espaçamento entre cards:** `space-y-2` / `mb-2`. Respiro interno de card: `p-4`.
- **Padding lateral da tela:** `px-4` (16px), constante em header e conteúdo.

### 4.4 Movimento

- Transições curtas e funcionais: `0.15s` em mudanças de cor/estado; entrada de telas com `fade-in` (`0.18s`, leve deslocamento vertical).
- **Sem animações longas ou decorativas.** Movimento serve para orientar (de onde a tela veio), não para enfeitar.

---

## 5. Catálogo de componentes

Componentes existentes definidos em `styles.css` e/ou em `renderers.js`. Reuso é obrigatório; novos componentes só quando nenhum existente serve.

### 5.1 Header fixo
Faixa `sticky` no topo com: botão Início (glifo), botão **Voltar** (visível só quando há histórico), título da aventura, **barra de busca** e **barra de abas**. É a única área de navegação persistente.

### 5.2 Barra de abas (`.tab-btn`)
Pílulas circulares **somente com ícone** (emoji), `2.75rem`, com `aria-label`/`title` para acessibilidade. Aba ativa em âmbar. A barra rola horizontalmente como reserva, sem barra de rolagem visível. **O texto foi removido propositalmente** para não estourar a largura no celular.

### 5.3 Barra de busca (`.busca-input`)
Input pílula, largura total, busca global em todas as seções (ignora acento e caixa). Foco em âmbar. Resultados reaproveitam o componente de card de lista com uma **etiqueta de tipo** (`.res-tag`).

### 5.4 Card de lista (`.open-detail`)
Botão de largura total: ícone/título à esquerda, chevron `›` à direita, subtítulos truncados. É o átomo de navegação para entrar em qualquer detalhe (drill-down).

### 5.5 Card de painel (`painelCard`)
Contêiner `bg-zinc-900` + borda + `rounded-xl p-4`. Base de toda tela de detalhe e de blocos de conteúdo (ganchos, missões, locais).

### 5.6 Bloco de estatísticas (`.stat-divider`, `.stat-grid`, `.stat-cell`)
Ficha de monstro: divisórias em gradiente âmbar e grade de 6 colunas para os atributos (FOR/DES/CON/INT/SAB/CAR). Padrão visual de "ficha de RPG".

### 5.7 Links e chips de navegação
- `.drill-link` — link inline dentro de texto (sublinhado pontilhado âmbar, prefixo `›`). Gerado pelo parser que converte marcadores `bestiario:`, `npc:`, `itens:` em botões.
- `.chip-link` — pílula clicável para listar criaturas/NPCs em locais.
Ambos disparam drill-down para o detalhe correspondente.

### 5.8 Badges de status (`.badge`)
Pílulas semânticas para status de missão: `disponivel` (azul), `andamento` (âmbar), `concluida` (verde).

### 5.9 Campos de destaque
Blocos coloridos com tinta suave para categorizar informação: motivação (âmbar), segredos/perigos (rosa), interação/conexões (verde-água), localização/tesouro (verde/âmbar).

---

## 6. Navegação e interação

- **Modelo drill-down / drill-up.** Listas levam a detalhes; qualquer nome citado em um texto é um link para o detalhe daquela entidade. O botão **Voltar** desempilha o histórico; o botão "voltar" físico do aparelho faz o mesmo.
- **Toda navegação é reativa e sem recarga de página** (SPA em JS vanilla). Estado vive em memória (`state`), não na URL além do `?id=` da aventura.
- **Feedback de toque** via `:active`. Sem spinners longos — o conteúdo é JSON local e carrega instantaneamente.

---

## 7. Conteúdo, dados e ícones

- **Dados primeiro, apresentação depois.** Cada seção é um arquivo/objeto JSON. A camada de renderização (`renderers.js`) transforma JSON em DOM; ela nunca contém conteúdo do jogo embutido.
- **Escape obrigatório.** Todo texto vindo de JSON passa por `escHtml`/`parseLinks` antes de ir ao DOM. Nunca interpolar conteúdo cru — é regra de segurança do design system.
- **Ícones = emoji Unicode.** Escolher emojis distinguíveis entre si em tamanho pequeno. Cada aba/condição tem um ícone único.
- **Idioma:** Português (Brasil), terminologia D&D 5.5e (2024).

---

## 8. Acessibilidade

- `aria-label` e `title` em todo controle só-ícone (abas, botões de navegação).
- Contraste mínimo respeitado: texto principal `zinc-100` sobre `zinc-950`; evitar texto `zinc-600` para conteúdo essencial.
- Foco de teclado visível em inputs (borda âmbar).
- Semântica: usar `<button>` para ação, `<a>` para navegação real, listas (`<ul>/<li>`) para coleções.

---

## 9. Orçamento de performance

- **Carga inicial enxuta.** HTML + CSS custom + 2 arquivos JS + Tailwind CDN. Sem fontes web, sem imagens pesadas no caminho crítico.
- **JSON sob demanda.** Carregar apenas o necessário (índice de aventuras, depois a aventura selecionada, mais condições globais).
- **Sem dependências supérfluas.** Cada `<script>`/CDN novo precisa justificar seu peso e seu risco de rede.

---

## 10. Checklist para adicionar/alterar um componente

Antes de fazer merge de qualquer mudança visual, confirmar:

- [ ] Funciona como **arquivo estático** (sem build, sem backend) no GitHub Pages.
- [ ] Renderiza e é **utilizável em 360px** de largura, em coluna única, sem rolagem horizontal.
- [ ] Alvos de toque **≥ 44px**; nada depende de hover.
- [ ] Usa **tokens existentes** (cores/raios/espaçamentos) antes de inventar valores.
- [ ] Reutiliza um **componente existente** se possível; novo componente só se justificado.
- [ ] Âmbar é a **única** cor de interação; demais cores são semânticas.
- [ ] Todo texto de dados passa por **escape** antes do DOM.
- [ ] Controles só-ícone têm **`aria-label`/`title`**.
- [ ] Caminhos de asset são **relativos**.
- [ ] Não adiciona dependência de runtime sem justificativa de peso/risco.

---

## 11. Resumo das regras inegociáveis

1. **Estático sempre** — nada que exija servidor ou build para rodar no GitHub Pages.
2. **Mobile puro** — o celular em retrato é o único alvo; desktop é tolerado.
3. **Toque, não hover** — alvos ≥ 44px, feedback por `:active`.
4. **Velocidade de consulta acima de estética** — resumir conteúdo antes de comprimir tipografia.
5. **Âmbar é a cor de ação; tema escuro é permanente.**
6. **Tokens e componentes existentes antes de novos.**
7. **Zero dependências de runtime além do Tailwind CDN.**
