# 🛡️ Escudo do Mestre

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
├── package.json            # Scripts de build (build:css, validar-dados)
├── scripts/
│   └── validar-dados.js    # Valida sintaxe JSON e marcadores de drill-down
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
└── docs/
    ├── specs/              # Especificações do produto e técnica
    └── assets/             # Referências (PDFs — ignorados pelo git)
```

## Como adicionar uma aventura

1. Crie `data/aventuras/nome-da-aventura.json` seguindo a estrutura dos arquivos existentes.
2. Adicione a entrada correspondente em `data/aventuras.json`.

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

O script (`scripts/validar-dados.js`, sem dependências externas) verifica se todo `data/*.json` tem sintaxe válida, se `data/aventuras.json` aponta para arquivos existentes e se todo marcador de drill-down corresponde a uma chave real na respectiva seção (`npcs`, `bestiario` ou `itens`). Sai com código 1 em caso de erro — pode ser plugado em CI.

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

- [Especificação do Produto](docs/specs/product_spec.md)
- [Especificação Técnica](docs/specs/tech_spec.md)
- [System Prompt / Prompt de Desenvolvimento](docs/specs/system_prompt.md)

## Aviso legal e conteúdo

Este é um **projeto pessoal**, mas qualquer pessoa é livre para usar, adaptar e reutilizar. 🙂

O conteúdo das aventuras aqui reunidas (bestiário, NPCs, locais, ganchos, missões e itens) é derivado do **Livro do Jogador** e dos módulos de aventura de **Dungeons & Dragons (edição 2024)** — *Dragão da Espiral de Gelo*, *A Mina Perdida de Phandelver* e *A Maldição de Strahd*. Esse conteúdo provavelmente pertence à **Wizards of the Coast** — eu apenas o reorganizei e adaptei para consulta rápida em mesa. Este projeto **não é oficial** e não é afiliado nem endossado pela Wizards of the Coast, e **não tem fins comerciais**.

*Dungeons & Dragons*, *D&D* e os nomes relacionados são marcas da Wizards of the Coast. Se você detém os direitos e deseja a remoção de algo, basta abrir uma *issue* neste repositório.

O **código** deste site (HTML/CSS/JS) é open-source sob a licença **MIT** (veja o arquivo [`LICENSE`](LICENSE)) — fique à vontade para copiar, adaptar e reutilizar. _A licença MIT cobre apenas o código, **não** o conteúdo das aventuras._
