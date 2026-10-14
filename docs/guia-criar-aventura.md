# Guia — Criar uma Aventura Nova

Este guia existe para duas audiências ao mesmo tempo: uma pessoa preenchendo o JSON à mão, e uma IA (Claude, ChatGPT etc.) gerando o JSON a partir de um módulo de D&D em texto/PDF. Os arquivos de referência ficam em [`templates/`](../templates/):

- [`templates/aventura.schema.json`](../templates/aventura.schema.json) — JSON Schema completo, com uma `description` em cada campo. Extraído lendo o código real (`assets/js/renderers-*.js`), não escrito de memória — cada campo documentado é lido em algum lugar do app.
- [`templates/aventura.exemplo.json`](../templates/aventura.exemplo.json) — uma aventura mínima, mas completa e válida (1 monstro, 2 NPCs, 1 item, 1 local, 1 gancho, 1 missão), com os marcadores de drill-down já demonstrados entre si.

## Passo a passo

1. Copie `templates/aventura.exemplo.json` para `data/aventuras/<id-da-aventura>.json` e vá substituindo o conteúdo.
2. Adicione a entrada correspondente em `data/aventuras.json` (mesmo `id`, `titulo`, `nivel_recomendado`, `num_jogadores`, `descricao`, e `arquivo` apontando para o novo JSON).
3. Rode `npm run validar-dados` — o script confere sintaxe JSON, se o manifesto aponta para arquivos existentes, se todo marcador de drill-down resolve para uma chave real, e se `sw.js` está listando os arquivos necessários para uso offline.
4. Abra `index.html` localmente (ou via GitHub Pages) e confira a aventura na lista.

## Estrutura de um arquivo de aventura

Um arquivo em `data/aventuras/` é um único objeto com estas seções (todas exceto `id`/`titulo` são opcionais — uma seção ausente ou vazia só faz a aba correspondente mostrar "nenhum X cadastrado"):

| Seção | Tipo | Indexado por |
|---|---|---|
| `bestiario` | objeto | id kebab-case (`goblin-batedor`) |
| `npcs` | objeto | id kebab-case |
| `itens` | objeto | id kebab-case |
| `locais` | objeto | id kebab-case |
| `ganchos` | array | posição no array (não o campo `id` do item — ver aviso abaixo) |
| `missoes` | array | posição no array (mesma ressalva) |

`condicoes.json` e `eventos-estrada.json` (em `data/`, fora de `aventuras/`) são **globais** — compartilhados por todas as aventuras e carregados à parte pelo app. Não crie um desses por aventura, e não use marcadores de drill-down neles (eles não têm seções próprias de `npcs`/`bestiario`/`itens` para resolver contra — o validador rejeita isso).

## Marcadores de drill-down

Dentro dos campos de texto livre, você pode linkar para um NPC, monstro, item ou local usando `prefixo:id`:

| Prefixo | Aponta para | Exemplo |
|---|---|---|
| `npc:` | `npcs` | `npc:elara-vidente` |
| `bestiario:` | `bestiario` | `bestiario:goblin-batedor` |
| `itens:` ou `item:` | `itens` (aliases — vão para a mesma seção) | `itens:amuleto-da-mare` |
| `local:` ou `locais:` | `locais` (aliases — vão para a mesma seção) | `local:torre-da-mare` |

**Não existe** marcador para `missoes:` ou `ganchos:` — esses dois só podem ser mencionados como texto simples, nunca como link clicável. `id` deve ser minúsculo, apenas `a-z0-9-` (sem acento, espaço ou maiúscula) — é o mesmo texto usado como chave do objeto na seção correspondente.

Nem todo campo de texto passa pelo parser de marcadores — a tabela abaixo (extraída lendo cada renderer) diz onde funciona:

| Seção.campo | Suporta marcador? |
|---|---|
| `bestiario.notas_dm`, `bestiario.localizacao`, e a `descricao` dentro de `caracteristicas`/`acoes`/`acoes_bonus`/`reacoes`/`acoes_lendarias` | Sim |
| `bestiario.sentidos`, `.idiomas`, `.deslocamento`, `.iniciativa`, `.ca_descricao`, `.pv_formula`, salvaguardas/perícias/imunidades/resistências | Não (texto simples) |
| `npcs.descricao`, `.motivacao`, `.segredos`, `.interacao` | Sim |
| `npcs.local`, `.papel` | Não |
| `itens.efeito`, `.localizacao` | Sim |
| `itens.tipo`, `.propriedades` | Não |
| `locais.resumo`, `.perigos`, `.tesouro`, `.conexoes` | Sim |
| `locais.encontros[]` | Estrutura própria (`area`, `ref`, `qtd`, `nota`) — ver seção "Encontros por local" abaixo; `ref` é marcador exato `npc:id`/`bestiario:id` |
| `locais.npcs[]`, `.criaturas[]` | Marcador **exato** (o item inteiro do array é `"npc:id"` ou `"bestiario:id"`, não embutido em frase) — vira chip clicável, não link inline |
| `locais.tipo`, `.nivel_sugerido` | Não |
| `ganchos[].texto` | Sim — a prévia na lista resolve o marcador para o nome da entidade (texto simples); a tela de detalhe resolve em botão |
| `missoes.objetivo`, `.recompensa`, `.notas_dm` | Sim |
| `missoes.localizacao` | Não |

O validador (`npm run validar-dados`) confere se todo marcador usado aponta para uma chave que existe — mas **não** sabe em qual campo o marcador foi colocado, então colocar um marcador válido num campo que não é renderizado com parser (ex. `npcs.local`) passa na validação e ainda assim aparece como texto cru na tela. Siga a tabela acima.

## Encontros por local

`locais.<id>.encontros` diz **quem está no local e quantos**. Cada entrada tem `ref` (obrigatório, `bestiario:id` ou `npc:id`), e opcionalmente `area` (sala/área; entradas com a mesma área são agrupadas), `qtd` (inteiro como `4`, ou texto como `"2d4"` ou `"1 por jogador"`) e `nota` (`"dormindo"`, `"emboscada"`).

```json
"encontros": [
  { "area": "A27 — Aposentos da Banshee", "ref": "bestiario:banshee", "qtd": 1 },
  { "area": "Pátio", "ref": "bestiario:orc", "qtd": 6, "nota": "patrulhando" }
]
```

Na tela do local aparece como "Quem está aqui"; na ficha do monstro/NPC aparece "Aparece em" com o reverso (local, quantidade, área). `criaturas`/`npcs` antigos continuam funcionando, mas só `encontros` carrega quantidade. O validador confere `ref` e `qtd`.

## Áreas por local e aba Guia

`locais.<id>.areas` é uma lista de salas/áreas (`codigo`, `nome`, `texto`, `armadilha`, `tesouro`) exibida como itens recolhíveis na tela do local. `guia` (nível raiz da aventura) é uma lista de `{id, titulo, resumo, texto}` para regras gerais; a aba 📖 Guia só aparece quando o campo existe.

## Convenções de status de missão

`missoes[].status` aceita qualquer texto, mas só estes três geram a cor de badge correta (o app faz busca por substring, sem diferenciar maiúsculas): `Disponível`, `Em Andamento`, `Concluída`.

## Campos exibidos pela UI

`npcs.notas_dm`, `npcs.ver_bestiario` (id do monstro com a ficha de combate, com ou sem o prefixo `bestiario:`), `itens.historico` e `bestiario.vulnerabilidades_dano` são exibidos. Também são exibidos `locais.encontros`, `locais.areas` e a aba Guia.

## Prompt pronto para gerar uma aventura com IA

Cole isto num assistente de IA junto com o texto do módulo (PDF convertido, resumo, ou capítulo) e o conteúdo de `templates/aventura.schema.json`:

```
Você vai converter o módulo de D&D 5.5e (2024) anexo em um único arquivo JSON
para o app "Escudo do Mestre". Siga ESTRITAMENTE o JSON Schema abaixo — cada
campo tem uma descrição de onde/como é exibido no app. Regras não-negociáveis:

1. Toda chave de bestiario/npcs/itens/locais é kebab-case: só a-z, 0-9 e hífen.
2. Marcadores de drill-down só existem para "npc:", "bestiario:", "itens:"
   (ou "item:") e "local:" (ou "locais:") — NUNCA invente "missao:" ou
   "gancho:". Um marcador só é válido se o id apontar para uma chave que
   você mesmo criou em bestiario/npcs/itens/locais neste mesmo arquivo.
3. Retorne APENAS o JSON, sem comentários, sem markdown ao redor.
4. Preencha o máximo de campos que o material de origem permitir — campos
   sem informação no módulo podem ficar de fora (nenhum é obrigatório
   exceto "nome"/"titulo" de cada entrada e "id"/"titulo" no topo).

[cole aqui o conteúdo de templates/aventura.schema.json]

Módulo a converter:
[cole aqui o texto do módulo]
```

Depois de gerar, sempre rode `npm run validar-dados` — ele pega qualquer marcador inventado ou referência quebrada antes de você commitar.
