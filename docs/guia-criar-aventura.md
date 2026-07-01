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

Dentro dos campos de texto livre, você pode linkar para um NPC, monstro ou item usando `prefixo:id`:

| Prefixo | Aponta para | Exemplo |
|---|---|---|
| `npc:` | `npcs` | `npc:elara-vidente` |
| `bestiario:` | `bestiario` | `bestiario:goblin-batedor` |
| `itens:` ou `item:` | `itens` (aliases — vão para a mesma seção) | `itens:amuleto-da-mare` |

**Não existe** marcador para `locais:`, `missoes:` ou `ganchos:` — esses três só podem ser mencionados como texto simples, nunca como link clicável. `id` deve ser minúsculo, apenas `a-z0-9-` (sem acento, espaço ou maiúscula) — é o mesmo texto usado como chave do objeto na seção correspondente.

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
| `locais.npcs[]`, `.criaturas[]` | Marcador **exato** (o item inteiro do array é `"npc:id"` ou `"bestiario:id"`, não embutido em frase) — vira chip clicável, não link inline |
| `locais.tipo`, `.nivel_sugerido` | Não |
| `ganchos[].texto` | Sim — mas a prévia na lista mostra o marcador cru (`...fale com npc:foo...`), só a tela de detalhe resolve em botão |
| `missoes.objetivo`, `.recompensa`, `.notas_dm` | Sim |
| `missoes.localizacao` | Não |

O validador (`npm run validar-dados`) confere se todo marcador usado aponta para uma chave que existe — mas **não** sabe em qual campo o marcador foi colocado, então colocar um marcador válido num campo que não é renderizado com parser (ex. `npcs.local`) passa na validação e ainda assim aparece como texto cru na tela. Siga a tabela acima.

## Convenções de status de missão

`missoes[].status` aceita qualquer texto, mas só estes três geram a cor de badge correta (o app faz busca por substring, sem diferenciar maiúsculas): `Disponível`, `Em Andamento`, `Concluída`.

## Campos existentes mas ainda não exibidos pela UI

Durante a auditoria dos renderers encontramos 4 campos usados nas aventuras já publicadas que **não aparecem em lugar nenhum da tela** (o renderer correspondente nunca lê essas chaves): `bestiario.vulnerabilidades_dano`, `npcs.notas_dm`, `npcs.ver_bestiario`, `itens.historico`. Provavelmente foram adicionados nos dados esperando um suporte no renderer que nunca chegou a ser escrito. Preencha-os mesmo assim se tiver a informação (não custa nada e cobre o dia em que alguém adicionar o suporte), mas não conte com eles aparecendo para o Mestre hoje.

## Prompt pronto para gerar uma aventura com IA

Cole isto num assistente de IA junto com o texto do módulo (PDF convertido, resumo, ou capítulo) e o conteúdo de `templates/aventura.schema.json`:

```
Você vai converter o módulo de D&D 5.5e (2024) anexo em um único arquivo JSON
para o app "Escudo do Mestre". Siga ESTRITAMENTE o JSON Schema abaixo — cada
campo tem uma descrição de onde/como é exibido no app. Regras não-negociáveis:

1. Toda chave de bestiario/npcs/itens/locais é kebab-case: só a-z, 0-9 e hífen.
2. Marcadores de drill-down só existem para "npc:", "bestiario:", "itens:"
   (ou "item:") — NUNCA invente "local:", "missao:" ou "gancho:". Um marcador
   só é válido se o id apontar para uma chave que você mesmo criou em
   bestiario/npcs/itens neste mesmo arquivo.
3. Retorne APENAS o JSON, sem comentários, sem markdown ao redor.
4. Preencha o máximo de campos que o material de origem permitir — campos
   sem informação no módulo podem ficar de fora (nenhum é obrigatório
   exceto "nome"/"titulo" de cada entrada e "id"/"titulo" no topo).

[cole aqui o conteúdo de templates/aventura.schema.json]

Módulo a converter:
[cole aqui o texto do módulo]
```

Depois de gerar, sempre rode `npm run validar-dados` — ele pega qualquer marcador inventado ou referência quebrada antes de você commitar.
