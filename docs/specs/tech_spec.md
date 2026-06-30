# Technical Specification: Escudo do Mestre

## 1. Tech Stack & Infraestrutura
Como o projeto será hospedado no **GitHub Pages**, utilizaremos uma arquitetura puramente client-side (Frontend estático como Single Page Application)[cite: 2]:
* **Linguagem:** HTML5, CSS3 moderno (Variáveis CSS, Flexbox/CSS Grid), JavaScript Vanilla (ES6+) focado em manipulação reativa do DOM baseado em estado[cite: 2].
* **Framework:** HTML/JS Puro para manter a performance instantânea e livre de dependências de compilação pesadas[cite: 2].
* **Estilização:** Tailwind CSS (via CDN otimizada) para responsividade rigorosa focada em Mobile[cite: 2].
* **Armazenamento de Dados:** Arquivos de dados em formato `JSON` dentro do diretório do projeto[cite: 2].

## 2. Estrutura de Pastas Sugerida
```text
escudo-do-mestre/
├── index.html                # Ponto de entrada único (Single Page Application)
├── docs/                     # Documentação e especificações (.md)
│   └── specs/
├── assets/
│   ├── css/                  # Estilos globais/Tailwind output
│   └── js/                   # Scripts de controle, roteamento interno e renderização
│       ├── app.js            # Gerenciador de Estado Global, Roteador SPA e Histórico de Navegação
│       └── renderers.js      # Funções de conversão de dados JSON para componentes DOM
└── data/                     # Banco de dados em arquivos JSON
    ├── aventuras.json        # Lista global de aventuras cadastradas
    └── aventuras/            # Subpasta com os detalhes de cada aventura
        └── a-mina-perdida.json
```[cite: 2]

## 3. Lógica de Navegação Interativa (Drill-Down / Drill-Up)
Para permitir que o Mestre clique no nome de um monstro ou NPC em qualquer texto e vá para a tela dele, o `app.js` deve implementar:
1. **Estado Global:** Guardar a aventura ativa, a aba atual, o ID do objeto focado em detalhe (se houver) e uma pilha (`array`) de histórico de navegação.
2. **Parser de Links Dinâmicos:** Uma função utilitária que varre os textos das missões e ganchos procurando correspondências exatas com as chaves dos IDs de `npcs`, `bestiario` e `itens`. Encontrando, substitui o texto por um elemento `<button data-drill-type="npcs" data-drill-id="sildar">Sildar</button>`.
3. **Pilha de Histórico (Drill-Up):** Quando um botão de drill-down for clicado, o estado anterior (aba e foco) é empurrado para o array de histórico. O botão "Voltar" remove o último item da pilha e renderiza a tela anterior.

## 4. Estrutura de Dados (Exemplo de JSON de Aventura conforme D&D 2024)
Cada arquivo de aventura em `data/aventuras/[nome-da-aventura].json` utilizará chaves de dicionário nos objetos (em vez de arrays simples) para otimizar o tempo de busca ($O(1)$) durante o processamento do drill-down:

```json
{
  "id": "mina-perdida",
  "titulo": "A Mina Perdida de Phandelver",
  "mapas": [
    { "nome": "Região de Phandalin", "url": "assets/images/mina-perdida/mapa_regiao.webp" }
  ],
  "bestiario": {
    "goblin": {
      "nome": "Goblin",
      "tipo_alinhamento": "Humanoide Pequeno, Fey, Neutro e Mau",
      "ca": 15,
      "pv": 7,
      "deslocamento": "9m (30 ft)",
      "iniciativa": "+2 (12)",
      "percepcao_passiva": 9,
      "modificadores": {
        "FOR": "-1", "DES": "+2", "CON": "+0",
        "INT": "-1", "SAB": "-1", "CAR": "-1"
      },
      "salvaguardas": ["DES +4"],
      "pericias": ["Furtividade +6"],
      "sentidos": "Visão no Escuro 18m",
      "nd": "1/4",
      "caracteristicas": [
        { "nome": "Fuga Ágil", "descricao": "O goblin pode realizar a ação de Desengajar ou Esconder como uma Ação Bônus em cada um de seus turnos." }
      ],
      "acoes": [
        { "nome": "Cimitarra", "descricao": "Ataque de Arma Corpo-a-Corpo: +4 para acertar, alcance 1.5m. Dano: 5 (1d6 + 2) de dano cortante." }
      ],
      "acoes_bonus": [],
      "reacoes": []
    }
  },
  "npcs": {
    "sildar": {
      "nome": "Sildar Hallwinter",
      "local": "Phandalin",
      "descricao": "Guerreiro humano aposentado, membro da Aliança dos Lordes. Ele está atualmente procurando por Iarno Albrek."
    }
  },
  "itens": {
    "manopla-ogro": {
      "nome": "Manopla do Poder Ogro",
      "propriedades": "Requer Sintonização, Item Mágico",
      "efeito": "Define a Força do usuário para 19 enquanto usada."
    }
  },
  "ganchos": [
    "Rumor na taverna diz que o npc:sildar foi capturado por um grupo de bestiario:goblin na Trilha de Triboar."
  ],
  "missoes": [
    {
      "titulo": "Resgatar Gundren",
      "status": "Em Andamento",
      "objetivo": "Encontrar o Castelo Boca de Crânio e resgatar o anão. Nota: interrogar o npc:sildar para obter pistas."
    }
  ]
}