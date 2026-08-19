// Escudo do Mestre — Cliente da Spotify Web API (Authorization Code + PKCE)
//
// Controle remoto de playback: o áudio sai de um device do Spotify Connect que
// o Mestre já usa (Echo/Alexa, celular, PC). Nada toca dentro do navegador —
// o Web Playback SDK foi descartado por não funcionar em navegador mobile.
// Ver docs/specs/plano-trilha-spotify.md.
//
// Sem backend: o PKCE existe justamente para clientes públicos. O client_secret
// NÃO é usado em lugar nenhum — num site estático não há onde escondê-lo. O
// Client ID é público por design; quem protege a conta é o allowlist de
// Redirect URIs cadastrado no Spotify Dashboard.

(function () {
  'use strict';

  const AUTORIZAR = 'https://accounts.spotify.com/authorize';
  const TOKEN = 'https://accounts.spotify.com/api/token';
  const API = 'https://api.spotify.com/v1';
  const ESCOPOS = 'user-read-playback-state user-modify-playback-state';

  // Prefixo sptfy_ e NÃO escudo_: o "Exportar sessão" (index.html, initBackup)
  // varre todas as chaves escudo_* e as grava no JSON baixado — um refresh
  // token aqui vazaria em todo backup exportado.
  const K_AUTH = 'sptfy_auth';
  const K_CLIENT = 'sptfy_client_id';
  const K_PKCE = 'sptfy_pkce';

  // ---------- localStorage ----------
  function lerJson(chave) {
    try { return JSON.parse(localStorage.getItem(chave)); } catch (_) { return null; }
  }
  function gravarJson(chave, valor) {
    try {
      if (valor == null) localStorage.removeItem(chave);
      else localStorage.setItem(chave, JSON.stringify(valor));
    } catch (_) {}
  }
  function clientId() {
    try { return localStorage.getItem(K_CLIENT) || ''; } catch (_) { return ''; }
  }
  function definirClientId(id) {
    try {
      const v = String(id || '').trim();
      if (v) localStorage.setItem(K_CLIENT, v);
      else localStorage.removeItem(K_CLIENT);
    } catch (_) {}
  }

  // O redirect precisa bater EXATAMENTE com o cadastrado no Dashboard. Caminho
  // relativo porque o site roda em subdiretório (usuario.github.io/Escudo-do-Mestre/).
  function redirectUri() {
    return location.origin + location.pathname.replace(/[^/]*$/, '') + 'callback.html';
  }

  // ---------- PKCE ----------
  function aleatorio(tamanho) {
    const alfabeto = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    const bytes = new Uint8Array(tamanho);
    crypto.getRandomValues(bytes);
    let s = '';
    for (let i = 0; i < bytes.length; i++) s += alfabeto[bytes[i] % alfabeto.length];
    return s;
  }

  async function desafioS256(verificador) {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verificador));
    let bin = '';
    new Uint8Array(digest).forEach((b) => { bin += String.fromCharCode(b); });
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  async function login() {
    const cid = clientId();
    if (!cid) throw new Error('Client ID do Spotify não configurado.');
    const verificador = aleatorio(64);
    const estado = aleatorio(16);
    gravarJson(K_PKCE, { verificador: verificador, estado: estado, retorno: location.href });
    const params = new URLSearchParams({
      client_id: cid,
      response_type: 'code',
      redirect_uri: redirectUri(),
      code_challenge_method: 'S256',
      code_challenge: await desafioS256(verificador),
      state: estado,
      scope: ESCOPOS,
    });
    location.href = AUTORIZAR + '?' + params.toString();
  }

  function guardarTokens(dados) {
    const atual = lerJson(K_AUTH) || {};
    gravarJson(K_AUTH, {
      access_token: dados.access_token,
      // O Spotify ROTACIONA o refresh token no PKCE: se vier um novo, ele
      // substitui o anterior; se não vier, o antigo continua válido.
      refresh_token: dados.refresh_token || atual.refresh_token || '',
      expira_em: Date.now() + ((dados.expires_in || 3600) * 1000),
    });
  }

  async function postToken(corpo) {
    const r = await fetch(TOKEN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(corpo).toString(),
    });
    const dados = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(dados.error_description || dados.error || 'Falha ao obter token.');
    return dados;
  }

  // Chamado por callback.html com os parâmetros devolvidos pelo Spotify.
  async function concluirLogin(code, estado) {
    const pkce = lerJson(K_PKCE);
    gravarJson(K_PKCE, null);
    if (!pkce) throw new Error('Sessão de login expirada. Tente conectar novamente.');
    if (pkce.estado !== estado) throw new Error('Parâmetro state não confere — login abortado.');
    const dados = await postToken({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri(),
      client_id: clientId(),
      code_verifier: pkce.verificador,
    });
    guardarTokens(dados);
    return pkce.retorno || (location.origin + location.pathname.replace(/[^/]*$/, '') + 'index.html');
  }

  let renovando = null;
  async function renovar() {
    const auth = lerJson(K_AUTH);
    if (!auth || !auth.refresh_token) return '';
    if (renovando) return renovando;
    renovando = postToken({
      grant_type: 'refresh_token',
      refresh_token: auth.refresh_token,
      client_id: clientId(),
    })
      .then((dados) => { guardarTokens(dados); return dados.access_token; })
      .catch(() => { logout(); return ''; })
      .finally(() => { renovando = null; });
    return renovando;
  }

  async function token() {
    const auth = lerJson(K_AUTH);
    if (!auth || !auth.access_token) return '';
    // Margem de 60s para não usar um token que expira no meio da requisição.
    if (Date.now() > (auth.expira_em - 60000)) return renovar();
    return auth.access_token;
  }

  function estaConectado() {
    const auth = lerJson(K_AUTH);
    return !!(auth && auth.refresh_token);
  }

  function logout() {
    gravarJson(K_AUTH, null);
    gravarJson(K_PKCE, null);
  }

  // ---------- Requisições ----------
  function mensagemDeErro(status, corpo) {
    const motivo = (corpo && corpo.error && corpo.error.reason) || '';
    if (motivo === 'NO_ACTIVE_DEVICE') return 'Nenhum dispositivo ativo. Acorde a caixa de som e atualize a lista.';
    if (motivo === 'PREMIUM_REQUIRED' || status === 403) return 'O controle de playback exige Spotify Premium.';
    if (status === 404) return 'Dispositivo não encontrado — atualize a lista de dispositivos.';
    if (status === 429) return 'Muitas requisições ao Spotify. Aguarde alguns segundos.';
    if (status === 401) return 'Sessão do Spotify expirada. Conecte novamente.';
    return (corpo && corpo.error && corpo.error.message) || 'Falha na comunicação com o Spotify.';
  }

  async function req(metodo, caminho, opcoes) {
    const o = opcoes || {};
    let tk = await token();
    if (!tk) throw new Error('Não conectado ao Spotify.');

    const url = API + caminho + (o.query ? '?' + new URLSearchParams(o.query).toString() : '');
    const enviar = (bearer) => fetch(url, {
      method: metodo,
      headers: o.corpo
        ? { Authorization: 'Bearer ' + bearer, 'Content-Type': 'application/json' }
        : { Authorization: 'Bearer ' + bearer },
      body: o.corpo ? JSON.stringify(o.corpo) : undefined,
    });

    let r = await enviar(tk);
    if (r.status === 401) {
      tk = await renovar();
      if (tk) r = await enviar(tk);
    }
    if (r.status === 204 || r.status === 202) return null;
    const corpo = await r.json().catch(() => null);
    if (!r.ok) throw new Error(mensagemDeErro(r.status, corpo));
    return corpo;
  }

  // ---------- Playback ----------
  async function dispositivos() {
    const d = await req('GET', '/me/player/devices');
    return (d && d.devices) || [];
  }

  function estadoAtual() {
    return req('GET', '/me/player');
  }

  async function transferir(deviceId, manterTocando) {
    return req('PUT', '/me/player', { corpo: { device_ids: [deviceId], play: !!manterTocando } });
  }

  // O shuffle é ajustado ANTES do play: aplicado depois, a playlist já teria
  // começado pela primeira faixa e daria um salto audível.
  async function tocar(contextUri, deviceId, embaralhar) {
    const query = deviceId ? { device_id: deviceId } : null;
    try {
      await req('PUT', '/me/player/shuffle', { query: Object.assign({ state: !!embaralhar }, query || {}) });
    } catch (_) {
      // Nem todo device do Connect aceita shuffle via API — não é motivo para
      // abortar a troca de clima.
    }
    return req('PUT', '/me/player/play', { query: query, corpo: { context_uri: contextUri } });
  }

  function pausar(deviceId) {
    return req('PUT', '/me/player/pause', { query: deviceId ? { device_id: deviceId } : null });
  }

  function retomar(deviceId) {
    return req('PUT', '/me/player/play', { query: deviceId ? { device_id: deviceId } : null });
  }

  function proxima(deviceId) {
    return req('POST', '/me/player/next', { query: deviceId ? { device_id: deviceId } : null });
  }

  function volume(percentual, deviceId) {
    const v = Math.max(0, Math.min(100, Math.round(percentual)));
    const query = { volume_percent: v };
    if (deviceId) query.device_id = deviceId;
    return req('PUT', '/me/player/volume', { query: query });
  }

  window.SpotifyAPI = {
    clientId: clientId,
    definirClientId: definirClientId,
    redirectUri: redirectUri,
    login: login,
    concluirLogin: concluirLogin,
    logout: logout,
    estaConectado: estaConectado,
    dispositivos: dispositivos,
    estadoAtual: estadoAtual,
    transferir: transferir,
    tocar: tocar,
    pausar: pausar,
    retomar: retomar,
    proxima: proxima,
    volume: volume,
  };
})();
