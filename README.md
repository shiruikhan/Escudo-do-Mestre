# 🛡️ Escudo do Mestre

**[GitHub](https://github.com/shiruikhan/Escudo-do-Mestre)** · [Abrir no GitHub Pages](https://shiruikhan.github.io/Escudo-do-Mestre/)

Painel do Narrador para D&D 5.5e (2024) — ferramenta web estática, mobile-first, hospedada via **GitHub Pages**.

> Feita para rodar no celular durante a sessão. Zero backend, zero instalação.

## O que é

O **Escudo do Mestre** substitui o escudo físico e os PDFs pesados durante a mesa. O Mestre abre o site no smartphone, escolhe a campanha e tem acesso imediato a:

- Fichas de monstros (bloco de estatísticas D&D 2024)
- Fichas rápidas de NPCs (localização, motivação, segredos)
- Itens mágicos e itens de missão
- Ganchos de aventura e rumores
- Rastreador de missões (Disponível / Em Andamento / Concluída)

A navegação é reativa: nomes de NPCs, monstros e itens aparecem como links clicáveis dentro dos textos de missões e ganchos (drill-down), com botão de retorno ao contexto anterior (drill-up).

## Acesso rápido

**[▶ Abrir no GitHub Pages](https://shiruikhan.github.io/Escudo-do-Mestre/)**

## Aventuras incluídas

| Aventura | Status |
|---|---|
| Dragão da Espiral de Gelo | Em desenvolvimento |
| A Mina Perdida de Phandelver | Em desenvolvimento |
| A Maldição de Strahd | Em desenvolvimento |

## Estrutura do projeto

```
escudo-do-mestre/
├── index.html              # Shell da aplicação (SPA)
├── manifest.json           # Manifest PWA (instalação na tela inicial)
├── sw.js                   # Service Worker (cache offline-first)
├── tailwind.config.js      # Configuração do build local do Tailwind
├── package.json            # Scripts de build (build:css, validar-dados, gerar-sw)
├── scripts/
│   ├── validar-dados.js    # Valida sintaxe JSON e marcadores de drill-down
│   └── gerar-sw.js         # Regenera CORE_ASSETS do sw.js e sobe a versão do cache
├── assets/
│   ├── css/
│   │   ├── tailwind-src.css  # Entrada do build (@tailwind base/components/utilities)
│   │   ├── tailwind.css      # CSS gerado e commitado — servido em runtime
│   │   └── styles.css        # Estilos customizados (complementam o Tailwind)
│   └── js/
│       ├── app.js                        # Lógica principal (roteamento, estado)
│       ├── renderers-core.js             # Helpers de renderização compartilhados
│       ├── renderers-bestiario.js        # Bestiário
│       ├── renderers-npcs-itens.js       # NPCs e Itens
│       ├── renderers-ganchos-missoes.js  # Ganchos e Missões
│       ├── renderers-locais.js           # Locais
│       ├── renderers-condicoes-eventos.js # Condições e Eventos de Estrada
│       └── renderers-busca.js            # Índice de busca e exportação Markdown
├── data/
│   ├── aventuras.json      # Índice de aventuras disponíveis
│   └── aventuras/
│       ├── dragao-espiral-gelo.json   # Dados completos da aventura
│       ├── mina-perdida-phandelver.json
│       └── maldicao-de-strahd.json
├── templates/
│   ├── aventura.schema.json  # JSON Schema comentado (uma description por campo)
│   └── aventura.exemplo.json # Aventura mínima e válida para copiar
└── docs/
    ├── specs/              # Especificações do produto e técnica
    ├── assets/             # Referências (PDFs — ignorados pelo git)
    └── guia-criar-aventura.md # Passo a passo + regras de marcadores + prompt de IA
```

## Como adicionar uma aventura

1. Copie `templates/aventura.exemplo.json` para `data/aventuras/nome-da-aventura.json` e preencha seguindo `templates/aventura.schema.json`.
2. Adicione a entrada correspondente em `data/aventuras.json`.
3. Rode `npm run gerar-sw` — reescreve o `CORE_ASSETS` do `sw.js` e incrementa a versão do cache (sem isso a aventura nova não fica disponível offline).
4. Rode `npm run validar-dados` (veja abaixo).

Guia completo, com a tabela de quais campos aceitam marcador de drill-down e um prompt pronto para gerar o JSON com IA a partir de um módulo: **[docs/guia-criar-aventura.md](docs/guia-criar-aventura.md)**.

## Desenvolvimento (build do CSS)

O Tailwind é gerado **uma vez, localmente, e o CSS resultante é commitado** — não há CDN nem etapa de build em runtime; o site continua sendo servido como HTML/CSS/JS puros. Isso só é necessário se você adicionar/alterar classes Tailwind no HTML ou nos `.js`:

```bash
npm install
npm run build:css   # gera assets/css/tailwind.css a partir das classes usadas
```

## Validar os dados

Antes de commitar uma aventura nova ou editada, valide a sintaxe dos JSONs e os marcadores de drill-down (`npc:`, `bestiario:`, `itens:`, `item:`) usados nos textos:

```bash
npm run validar-dados
```

O script (`scripts/validar-dados.js`, sem dependências externas) verifica se todo `data/*.json` tem sintaxe válida, se `data/aventuras.json` aponta para arquivos existentes, se todo marcador de drill-down corresponde a uma chave real na respectiva seção (`npcs`, `bestiario` ou `itens`), se os arquivos globais (`condicoes.json`, `eventos-estrada.json`) não usam marcadores (eles não têm seções próprias para resolvê-los) e se `sw.js` lista todo `.js`/dado necessário para o app funcionar offline. Sai com código 1 em caso de erro — pode ser plugado em CI.

## CI

O workflow em `.github/workflows/ci.yml` roda em todo push/PR na `main`:

```bash
npm run validar-dados   # sintaxe, marcadores e cobertura do sw.js
npm run check-sw        # falha se o CORE_ASSETS do sw.js estiver desatualizado
```

Se o `check-sw` falhar, rode `npm run gerar-sw` localmente e commite o `sw.js` atualizado.

## Configurar GitHub Pages

1. Faça push do repositório para o GitHub.
2. Vá em **Settings → Pages**.
3. Em **Source**, selecione `Deploy from a branch` → branch `main` → pasta `/ (root)`.
4. Aguarde o deploy e acesse a URL gerada.

## Tecnologias

- HTML5 + JavaScript vanilla (sem framework)
- [Tailwind CSS](https://tailwindcss.com/) — build local commitado (sem CDN em runtime, veja "Desenvolvimento" abaixo)
- Dados em JSON estático
- GitHub Pages para hospedagem

## Docs

- [Guia — Criar uma Aventura Nova](docs/guia-criar-aventura.md) (com templates prontos para IA)
- [Especificação do Produto](docs/specs/product_spec.md)
- [Especificação Técnica](docs/specs/tech_spec.md)
- [System Prompt / Prompt de Desenvolvimento](docs/specs/system_prompt.md)

## Aviso legal e conteúdo

Este é um **projeto pessoal**, mas qualquer pessoa é livre para usar, adaptar e reutilizar. 🙂

O conteúdo das aventuras aqui reunidas (bestiário, NPCs, locais, ganchos, missões e itens) é derivado do **Livro do Jogador** e dos módulos de aventura de **Dungeons & Dragons (edição 2024)** — *Dragão da Espiral de Gelo*, *A Mina Perdida de Phandelver* e *A Maldição de Strahd*. Esse conteúdo provavelmente pertence à **Wizards of the Coast** — eu apenas o reorganizei e adaptei para consulta rápida em mesa. Este projeto **não é oficial** e não é afiliado nem endossado pela Wizards of the Coast, e **não tem fins comerciais**.

*Dungeons & Dragons*, *D&D* e os nomes relacionados são marcas da Wizards of the Coast. Se você detém os direitos e deseja a remoção de algo, basta abrir uma *issue* neste repositório.

As regras genéricas (condições, blocos de estatística de monstros comuns etc.) baseiam-se no **System Reference Document 5.2** ("SRD 5.2"), da Wizards of the Coast LLC, disponível em <https://www.dndbeyond.com/srd> e licenciado sob **Creative Commons Attribution 4.0 International** (<https://creativecommons.org/licenses/by/4.0/legalcode>). Este projeto inclui material do SRD 5.2 nos termos dessa licença. O restante do conteúdo dos módulos de aventura **não** está coberto pelo SRD nem por esta atribuição.

O **código** deste site (HTML/CSS/JS) é open-source sob a licença **MIT** (veja o arquivo [`LICENSE`](LICENSE)) — fique à vontade para copiar, adaptar e reutilizar. _A licença MIT cobre apenas o código, **não** o conteúdo das aventuras._
