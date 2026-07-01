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
- Visualizador de mapas com zoom

A navegação é reativa: nomes de NPCs, monstros e itens aparecem como links clicáveis dentro dos textos de missões e ganchos (drill-down), com botão de retorno ao contexto anterior (drill-up).

## Acesso rápido

**[▶ Abrir no GitHub Pages](https://shiruikhan.github.io/Escudo-do-Mestre/)**

## Aventuras incluídas

| Aventura | Status |
|---|---|
| Dragão da Espiral de Gelo | Em desenvolvimento |
| A Mina Perdida de Phandelver | Em desenvolvimento |

## Estrutura do projeto

```
escudo-do-mestre/
├── index.html              # Shell da aplicação (SPA)
├── assets/
│   ├── css/styles.css      # Estilos customizados (complementa Tailwind)
│   └── js/
│       ├── app.js          # Lógica principal (roteamento, estado)
│       └── renderers.js    # Renderizadores de fichas e abas
├── data/
│   ├── aventuras.json      # Índice de aventuras disponíveis
│   └── aventuras/
│       ├── dragao-espiral-gelo.json   # Dados completos da aventura
│       └── mina-perdida-phandelver.json
└── docs/
    ├── specs/              # Especificações do produto e técnica
    └── assets/             # Referências (PDFs — ignorados pelo git)
```

## Como adicionar uma aventura

1. Crie `data/aventuras/nome-da-aventura.json` seguindo a estrutura dos arquivos existentes.
2. Adicione a entrada correspondente em `data/aventuras.json`.
3. Mapas devem ser salvos em `.webp` otimizado dentro da pasta da aventura.

## Configurar GitHub Pages

1. Faça push do repositório para o GitHub.
2. Vá em **Settings → Pages**.
3. Em **Source**, selecione `Deploy from a branch` → branch `main` → pasta `/ (root)`.
4. Aguarde o deploy e acesse a URL gerada.

## Tecnologias

- HTML5 + JavaScript vanilla (sem framework)
- [Tailwind CSS](https://tailwindcss.com/) via CDN
- Dados em JSON estático
- GitHub Pages para hospedagem

## Docs

- [Especificação do Produto](docs/specs/product_spec.md)
- [Especificação Técnica](docs/specs/tech_spec.md)
- [System Prompt / Prompt de Desenvolvimento](docs/specs/system_prompt.md)
