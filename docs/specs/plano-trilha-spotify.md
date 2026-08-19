# Plano — Trilha Sonora (integração Spotify)

> Status: **implementado.** Este documento registra as decisões técnicas por trás da
> integração — leia antes de mexer em `assets/js/spotify.js` ou `assets/js/trilha.js`.
> Instruções de uso e configuração estão no [README](../../README.md#trilha-sonora-spotify).

## 1. Objetivo e escopo

Um **controle remoto rápido** de trilha sonora dentro do Escudo do Mestre. O Mestre toca a
música na caixa de som que já usa (tipicamente um **Echo/Alexa** pareado à conta Spotify) e
troca o clima com **um toque**, sem sair do app e sem abrir o Spotify.

**Está no escopo:**

- 5 botões de clima: **Ambiente**, **Combate**, **Tensa**, **Chefe (épica)**, **Taberna**.
- Escolha do **dispositivo de saída** (Alexa, celular, PC) entre os devices do Spotify Connect.
- Controles mínimos: play/pause, próxima faixa, volume.
- Indicação do que está tocando agora.

**Não está no escopo (explicitamente):**

- Tocar áudio dentro do navegador (ver §2).
- Busca de músicas, criação/edição de playlists, fila manual.
- Efeitos sonoros pontuais (porta, trovão, grito) — não é caso de uso do Spotify.
- Sincronizar música com evento de jogo automaticamente (ex.: iniciar combate na aba ⚔️ ligar a
  trilha de combate). Pode virar evolução; fora da primeira versão.

## 2. Decisão de arquitetura: Web API, não Web Playback SDK

O cadastro do app no Spotify Developer Dashboard marca **apenas `Web API`**.

| Opção | Veredito |
|---|---|
| **Web API** (`/me/player/*`) | **Escolhida.** Controla remotamente um device já existente (Alexa, celular, PC). É exatamente o caso de uso. |
| Web Playback SDK | Descartada. Transformaria a aba do navegador num device de reprodução — o oposto do objetivo (o som sai da Alexa) — e **não é suportado em navegador mobile**, único alvo real do projeto (design system §3). Ainda exigiria script externo de `sdk.scdn.co`, contrariando "zero dependência de runtime". |
| Ads API / iOS / Android | Irrelevantes para um site estático. |

## 3. Compatibilidade com as restrições do projeto

O design system §2.1 proíbe backend, build obrigatório e segredos no repositório. A integração
respeita as três:

- **Sem backend.** O fluxo **Authorization Code + PKCE** foi desenhado para clientes públicos:
  troca o `code` por token direto do navegador, sem `client_secret`. Nada roda no servidor.
- **Sem build.** JS vanilla, dois arquivos novos, carregados por `<script>` como os demais.
- **Sem segredos.** O **Client ID do Spotify é público por design** — identifica o app, não
  autentica. O **Client Secret nunca entra no repositório** e não é usado em momento algum
  (PKCE dispensa). A regra não é afrouxada: nenhum valor sensível é versionado.
- **Sem cookies.** Tokens ficam em `localStorage`, nunca em cookie.

Único ponto novo: o app passa a depender de **rede e de um serviço de terceiros**. Por isso a
degradação offline é requisito, não detalhe (§9).

## 4. Cadastro do app no Spotify Developer Dashboard

- **APIs/SDKs:** somente `Web API`.
- **Redirect URIs:**
  - Produção: `https://shiruikhan.github.io/Escudo-do-Mestre/callback.html`
  - Desenvolvimento: `http://127.0.0.1:3000/callback.html`
    (o Spotify exige **HTTPS** ou **IP de loopback explícito**; `http://localhost:3000` é
    rejeitado — o `.claude/launch.json` serve na porta 3000, basta acessar por `127.0.0.1`.)
- **Cota:** um app em *development mode* aceita no máximo **25 usuários**, cadastrados
  manualmente por e-mail no Dashboard. É por isso que o Client ID é digitado pelo usuário
  (§10.1): cada um cadastra o próprio app e o teto deixa de importar.

### 4.1 Credenciais: o que fazer com Client ID e Client Secret

**O Client Secret não é usado — em lugar nenhum.** PKCE existe justamente para clientes
públicos que não conseguem guardar segredo. Num site estático **não há onde escondê-lo**:
qualquer valor que o navegador precise ler está disponível no DevTools, no fonte e no cache.

`.gitignore` **não** é solução aqui, e por um motivo específico do GitHub Pages: ele serve
**o que está commitado**. Um arquivo de configuração ignorado pelo git não é publicado, e o
site quebraria em produção. O padrão "config.local.js fora do versionamento" é inaplicável.

**Ação:** rotacionar o Client Secret no Dashboard e não copiá-lo para nenhum arquivo do
projeto. Obrigatório se ele já tiver passado por algum arquivo, mesmo não commitado.

**O Client ID não é segredo** em sentido técnico: ele trafega na URL de `authorize` aberta pelo
próprio navegador, é público por design. A proteção real é o **allowlist de Redirect URIs** —
mesmo de posse do Client ID, um terceiro não recebe token, porque o Spotify só redireciona para
as URLs cadastradas em §4. Manter as Redirect URIs enxutas é o controle que importa.

**Mesmo assim, nenhum Client ID é versionado** (decisão em §10.1): o campo do painel nasce
vazio e cada usuário digita o seu. Não é proteção contra vazamento — é para não amarrar o
repositório público à conta de desenvolvedor de uma pessoa específica.

## 5. Autenticação (PKCE)

Escopos solicitados — mínimo necessário:

| Escopo | Para quê |
|---|---|
| `user-read-playback-state` | Listar devices e ler o estado atual |
| `user-modify-playback-state` | Play/pause, próxima, volume, transferir device |

Fluxo:

1. Gera `code_verifier` aleatório + `code_challenge` (S256) via `crypto.subtle`.
2. Redireciona para `accounts.spotify.com/authorize`.
3. `callback.html` recebe `?code=`, troca por token em `POST accounts.spotify.com/api/token`
   (com `client_id` + `code_verifier`, sem secret) e volta para a página de origem.
4. `access_token` vale ~1h; renova via `refresh_token` (o Spotify **rotaciona** o refresh token
   no PKCE — sempre gravar o novo valor retornado).
5. Erro `401` em qualquer chamada dispara uma tentativa de refresh e um único retry.

### 5.1 Armazenamento e vazamento no backup

O botão **Exportar sessão** (`index.html`, `initBackup`) varre **todas** as chaves com prefixo
`escudo_` e as grava no JSON baixado. Guardar o token como `escudo_spotify_*` faria o
**refresh token vazar em todo backup exportado**.

Regra: as chaves de autenticação usam prefixo **`sptfy_`**, fora do namespace de backup:

| Chave | Conteúdo | Entra no backup? |
|---|---|---|
| `sptfy_auth` | access/refresh token, expiração | **Não** |
| `sptfy_client_id` | Client ID configurado pelo usuário | **Não** |
| `escudo_trilha_device` | **nome** do device preferido | Sim (é preferência, não credencial) |

Há também um **denylist explícito** no `initBackup` (ignora chaves `sptfy_`), como defesa em
profundidade caso algo seja renomeado no futuro.

## 6. Modelo de dados

`data/trilha.json` — padrões globais, editáveis sem tocar em código:

```json
{
  "climas": [
    { "id": "ambiente", "rotulo": "Ambiente", "icone": "🌫️", "uri": "spotify:playlist:...", "shuffle": true },
    { "id": "combate",  "rotulo": "Combate",  "icone": "⚔️",  "uri": "spotify:playlist:...", "shuffle": true },
    { "id": "tensa",    "rotulo": "Tensa",    "icone": "👁️", "uri": "spotify:playlist:...", "shuffle": true },
    { "id": "chefe",    "rotulo": "Chefe",    "icone": "🐉", "uri": "spotify:playlist:...", "shuffle": false },
    { "id": "taberna",  "rotulo": "Taberna",  "icone": "🍺", "uri": "spotify:playlist:...", "shuffle": true }
  ]
}
```

Override opcional por aventura, em `data/aventuras/*.json` — Strahd pede um "tensa" diferente
de Phandelver:

```json
"trilha": { "tensa": "spotify:playlist:...", "chefe": "spotify:album:..." }
```

As URIs também podem ser preenchidas no próprio app (painel ⚙), gravadas em
`escudo_trilha_uris` — evita editar JSON pelo celular no meio da mesa.

Resolução, do mais específico ao mais genérico: **override da aventura → configuração do
usuário → padrão de `trilha.json`**. Sem nenhum dos três, o clima fica desabilitado (botão
apagado, não some — a grade não pode dançar entre aventuras). Quando a aventura define um
clima, o campo correspondente no painel ⚙ aparece bloqueado, deixando claro quem manda.

## 7. Interface

**Barra fixa no rodapé**, presente em `index.html` e `aventura.html` — **não** uma aba. O Mestre
troca a música enquanto lê a ficha do monstro; se fosse aba, perderia o contexto a cada troca.

- **Recolhida (padrão):** device atual + faixa tocando + play/pause. Uma linha, ~56px.
- **Expandida (toque na barra):** grade com os 5 climas + volume + seletor de device.
- Conformidade com o design system: coluna única, alvos ≥44px, âmbar como única cor de
  interação, ícones em emoji Unicode, nada dependente de hover, `aria-label` em todo controle
  só-ícone.
- A barra reserva espaço no `<main>` (padding inferior) para não cobrir conteúdo.

## 8. Arquivos afetados

| Arquivo | Mudança |
|---|---|
| `assets/js/spotify.js` | **Novo.** PKCE, tokens, refresh, wrapper de chamadas. |
| `assets/js/trilha.js` | **Novo.** Estado da trilha, resolução de climas, barra fixa. |
| `callback.html` | **Novo.** Recebe `?code=`, troca por token, redireciona de volta. |
| `data/trilha.json` | **Novo.** Playlists padrão por clima. |
| `index.html` | Barra fixa + `<script>` + denylist `sptfy_` no `initBackup`. |
| `aventura.html` | Barra fixa + `<script>`. |
| `sw.js` | Regenerar via `npm run gerar-sw` (novos assets + versão do cache). |
| `scripts/validar-dados.js` | Validar `trilha.json` e os overrides `trilha` das aventuras (ids de clima conhecidos, formato `spotify:tipo:id`). |
| `templates/aventura.schema.json` | Documentar o campo opcional `trilha`. |
| `docs/specs/product_spec.md` | Registrar o módulo no escopo funcional. |
| `README.md` | Seção de configuração do Spotify. |

## 9. Limitações conhecidas

Documentadas porque **vão** aparecer no uso real:

1. **Premium é obrigatório.** A API de controle de playback não responde em conta gratuita.
   Fallback: abrir a playlist por deep link `spotify:` e deixar o usuário tocar manualmente.
2. **O Echo some da lista quando ocioso.** `GET /me/player/devices` só retorna devices ativos no
   Spotify Connect. Se a Alexa não tocou nada recentemente, pode não aparecer. Mitigação: botão
   "atualizar dispositivos" + mensagem explicando o "Alexa, tocar Spotify" que a acorda — melhor
   que uma lista vazia sem explicação.
3. **`device_id` não é estável entre sessões.** Guardar o **nome** do device e re-resolver o ID a
   cada abertura; guardar o ID daria 404 na semana seguinte.
4. **Volume é irregular por device.** Alguns Connect devices recusam `PUT /me/player/volume`.
   Falha de volume não pode derrubar o resto do painel.
5. **Não existe crossfade via API.** A troca de clima é corte seco. Rampa manual de volume é
   possível, mas depende do item 4 funcionar no device.
6. **Offline.** O recurso morre sem rede — e o app se propõe a funcionar em mesa com wifi ruim.
   A barra **some** quando não há sessão Spotify ou não há rede; o resto do Escudo segue intacto.
   O `sw.js` já ignora requisições de outra origem, então não há conflito de cache.
7. **Termos do Spotify.** Uso permitido: controle de playback e playlists. Não fazer download,
   cache de áudio nem mixagem com outras fontes.

## 10. Decisões tomadas

1. **Client ID inteiramente digitado pelo usuário.** Guardado em `sptfy_client_id`
   (`localStorage`), preenchido no painel de configuração dentro do app. **Nenhum Client ID vai
   para o repositório** — nem como padrão, nem como sugestão, nem como placeholder preenchido.
   O campo nasce vazio. Evita de uma vez o teto de 25 contas do *development mode* e a
   burocracia de *extended quota*: quem quiser usar cadastra o próprio app no Dashboard. O mesmo
   painel recebe as **URIs das 5 playlists**, para não exigir edição de JSON pelo celular.
2. **Offline: a barra permanece visível e desabilitada.** Controles em estado `disabled` com
   rótulo explicando o motivo ("Sem conexão"), reativando sozinhos no evento `online`. A barra
   não pula nem muda de altura ao perder rede — o layout fica estável durante a sessão.

## 11. Critérios de aceite

- [ ] Login Spotify completo pelo celular, sem backend, em `https://shiruikhan.github.io/Escudo-do-Mestre/`.
- [ ] A Alexa aparece na lista de devices e recebe o playback.
- [ ] Os 5 climas trocam a música no device escolhido com um toque.
- [ ] O device escolhido persiste entre sessões (por nome, re-resolvido).
- [ ] `Exportar sessão` **não** contém nenhum token do Spotify.
- [ ] Sem rede, o app abre normalmente e a barra de trilha não aparece nem gera erro no console.
- [ ] `npm run validar-dados`, `npm test` e `npm run check-sw` passam.
- [ ] Utilizável em 360px, alvos ≥44px, sem rolagem horizontal.
