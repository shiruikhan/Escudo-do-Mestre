// Escudo do Mestre — Trilha sonora (barra fixa de controle do Spotify)
//
// Um toque troca o clima da mesa; o áudio sai no device do Spotify Connect
// escolhido (tipicamente um Echo/Alexa). A barra é fixa no rodapé e existe nas
// duas páginas, porque o Mestre troca a música enquanto lê a ficha do monstro —
// se fosse uma aba, ele perderia o contexto a cada troca.
//
// Estado (localStorage):
//   escudo_trilha_device → NOME do device preferido (o device_id do Spotify não
//                          é estável entre sessões; guardar o id daria 404 na
//                          semana seguinte, então o id é re-resolvido pelo nome)
//   escudo_trilha_uris   → URIs de playlist por clima, configuradas no painel
//   escudo_trilha_vol    → último volume aplicado
// As credenciais ficam sob o prefixo sptfy_ (ver spotify.js) — fora do
// namespace que o "Exportar sessão" varre.

(function () {
  'use strict';

  const K_DEVICE = 'escudo_trilha_device';
  const K_URIS = 'escudo_trilha_uris';
  const K_VOL = 'escudo_trilha_vol';
  const INTERVALO_POLL = 20000;

  const api = window.SpotifyAPI;

  const state = {
    climas: [],          // catálogo vindo de data/trilha.json
    overrides: {},       // por aventura (data/aventuras/*.json → campo "trilha")
    config: {},          // por usuário (painel de configuração)
    devices: [],
    deviceId: '',
    deviceNome: '',
    tocando: false,
    faixa: '',
    climaAtivo: '',
    expandida: false,
  };

  const el = {};
  let timerPoll = null;

  // ---------- localStorage ----------
  function lerJson(chave) {
    try { return JSON.parse(localStorage.getItem(chave)) || {}; } catch (_) { return {}; }
  }
  function gravarJson(chave, valor) {
    try {
      if (valor && Object.keys(valor).length) localStorage.setItem(chave, JSON.stringify(valor));
      else localStorage.removeItem(chave);
    } catch (_) {}
  }
  function nomeDeviceSalvo() {
    try { return localStorage.getItem(K_DEVICE) || ''; } catch (_) { return ''; }
  }
  function salvarNomeDevice(nome) {
    try {
      if (nome) localStorage.setItem(K_DEVICE, nome);
      else localStorage.removeItem(K_DEVICE);
    } catch (_) {}
  }

  // ---------- URIs ----------
  // Aceita tanto "spotify:playlist:ID" quanto o link copiado do app
  // ("https://open.spotify.com/playlist/ID?si=..."). Devolve '' para vazio e
  // null para entrada inválida.
  function normalizarUri(valor) {
    const v = String(valor == null ? '' : valor).trim();
    if (!v) return '';
    if (/^spotify:(playlist|album|artist|show|episode):[A-Za-z0-9]+$/.test(v)) return v;
    const m = v.match(/open\.spotify\.com\/(?:intl-[a-z-]+\/)?(playlist|album|artist|show|episode)\/([A-Za-z0-9]+)/);
    if (m) return 'spotify:' + m[1] + ':' + m[2];
    return null;
  }

  // Precedência: override da aventura → configuração do usuário → padrão do JSON.
  // A aventura vence porque é o contexto mais específico (o "tensa" de Strahd
  // não é o "tensa" de Phandelver).
  function uriDoClima(clima) {
    return state.overrides[clima.id] || state.config[clima.id] || clima.uri || '';
  }

  function online() {
    return navigator.onLine !== false;
  }
  function pronto() {
    return !!(api && api.estaConectado() && online());
  }

  function aviso(texto) {
    if (window.mostrarToast) window.mostrarToast(window.escHtml(texto));
  }

  // ---------- Construção da barra ----------
  function montar() {
    if (document.getElementById('trilha-bar')) return;

    const barra = document.createElement('div');
    barra.id = 'trilha-bar';
    barra.className = 'trilha-bar';
    barra.innerHTML = `
      <div id="trilha-painel" class="trilha-painel" hidden>
        <div id="trilha-climas" class="trilha-climas"></div>
        <div class="trilha-linha">
          <label class="trilha-rotulo" for="trilha-device">Tocar em</label>
          <select id="trilha-device" class="trilha-select" aria-label="Dispositivo de reprodução"></select>
          <button type="button" id="trilha-refresh" class="trilha-icone-btn"
                  title="Atualizar dispositivos" aria-label="Atualizar dispositivos">⟳</button>
        </div>
        <div class="trilha-linha">
          <label class="trilha-rotulo" for="trilha-volume">Volume</label>
          <input type="range" id="trilha-volume" class="trilha-range" min="0" max="100" step="5"
                 aria-label="Volume" />
        </div>
      </div>
      <div class="trilha-topo">
        <button type="button" id="trilha-toggle" class="trilha-toggle" aria-expanded="false"
                aria-controls="trilha-painel" aria-label="Controles da trilha sonora">
          <span class="trilha-emoji" aria-hidden="true">🎵</span>
          <span class="trilha-info">
            <span id="trilha-faixa" class="trilha-faixa">Trilha sonora</span>
            <span id="trilha-sub" class="trilha-sub">Toque para configurar</span>
          </span>
        </button>
        <button type="button" id="trilha-next" class="trilha-icone-btn"
                title="Próxima faixa" aria-label="Próxima faixa">⏭</button>
        <button type="button" id="trilha-play" class="trilha-icone-btn"
                title="Tocar ou pausar" aria-label="Tocar ou pausar">▶</button>
        <button type="button" id="trilha-cfg" class="trilha-icone-btn"
                title="Configurar trilha" aria-label="Configurar trilha">⚙</button>
      </div>`;
    document.body.appendChild(barra);
    document.body.classList.add('com-trilha');

    el.barra = barra;
    el.painel = document.getElementById('trilha-painel');
    el.climas = document.getElementById('trilha-climas');
    el.device = document.getElementById('trilha-device');
    el.refresh = document.getElementById('trilha-refresh');
    el.volume = document.getElementById('trilha-volume');
    el.toggle = document.getElementById('trilha-toggle');
    el.faixa = document.getElementById('trilha-faixa');
    el.sub = document.getElementById('trilha-sub');
    el.play = document.getElementById('trilha-play');
    el.next = document.getElementById('trilha-next');
    el.cfg = document.getElementById('trilha-cfg');

    try {
      const v = parseInt(localStorage.getItem(K_VOL), 10);
      el.volume.value = isNaN(v) ? 60 : v;
    } catch (_) { el.volume.value = 60; }

    ligarEventos();
  }

  function montarClimas() {
    el.climas.innerHTML = '';
    state.climas.forEach((clima) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'trilha-clima';
      b.dataset.clima = clima.id;
      b.title = clima.rotulo;
      b.innerHTML = '<span class="trilha-clima-emoji" aria-hidden="true"></span>' +
                    '<span class="trilha-clima-rotulo"></span>';
      b.querySelector('.trilha-clima-emoji').textContent = clima.icone || '🎵';
      b.querySelector('.trilha-clima-rotulo').textContent = clima.rotulo;
      b.addEventListener('click', () => acionarClima(clima));
      el.climas.appendChild(b);
    });
  }

  // ---------- Habilitação (offline / desconectado) ----------
  // Decisão de produto: offline a barra NÃO some — os controles ficam
  // desabilitados com o motivo à vista, para o layout não pular durante a
  // sessão. Ver docs/specs/plano-trilha-spotify.md §10.
  function atualizarHabilitacao() {
    const ok = pronto();
    const semRede = !online();

    [el.play, el.next, el.refresh, el.volume, el.device].forEach((c) => { c.disabled = !ok; });
    el.barra.classList.toggle('trilha-off', !ok);

    el.climas.querySelectorAll('.trilha-clima').forEach((b) => {
      const clima = state.climas.find((c) => c.id === b.dataset.clima);
      const temUri = !!(clima && uriDoClima(clima));
      b.disabled = !ok || !temUri;
      b.classList.toggle('sem-uri', ok && !temUri);
      b.title = temUri ? clima.rotulo : clima.rotulo + ' — playlist não configurada (⚙)';
    });

    if (semRede) {
      el.faixa.textContent = 'Trilha sonora';
      el.sub.textContent = 'Sem conexão';
    } else if (!api.estaConectado()) {
      el.faixa.textContent = 'Trilha sonora';
      el.sub.textContent = api.clientId() ? 'Toque em ⚙ para conectar' : 'Toque em ⚙ para configurar';
    }
  }

  // ---------- Dispositivos ----------
  async function carregarDispositivos(silencioso) {
    if (!pronto()) return;
    try {
      state.devices = await api.dispositivos();
    } catch (e) {
      if (!silencioso) aviso(e.message);
      return;
    }

    el.device.innerHTML = '';
    if (!state.devices.length) {
      const o = document.createElement('option');
      o.value = '';
      o.textContent = 'Nenhum dispositivo ativo';
      el.device.appendChild(o);
      state.deviceId = '';
      if (!silencioso) {
        aviso('Nenhum dispositivo ativo. Diga "Alexa, tocar Spotify" para acordar a caixa e atualize (⟳).');
      }
      atualizarRodape();
      return;
    }

    const preferido = nomeDeviceSalvo();
    let escolhido = '';
    state.devices.forEach((d) => {
      const o = document.createElement('option');
      o.value = d.id;
      o.textContent = d.name + (d.is_active ? ' • ativo' : '');
      el.device.appendChild(o);
      // Re-resolve pelo NOME: o id muda entre sessões.
      if (d.name === preferido) escolhido = d.id;
      if (!escolhido && !preferido && d.is_active) escolhido = d.id;
    });
    state.deviceId = escolhido || state.devices[0].id;
    el.device.value = state.deviceId;
    atualizarRodape();
  }

  function nomeDoDevice(id) {
    const d = state.devices.find((x) => x.id === id);
    if (d) return d.name;
    return (id && id === state.deviceId) ? (state.deviceNome || '') : '';
  }

  // ---------- Estado do playback ----------
  async function sincronizar() {
    if (!pronto()) { atualizarHabilitacao(); return; }
    try {
      const e = await api.estadoAtual();
      if (!e) {
        state.tocando = false;
        state.faixa = '';
      } else {
        state.tocando = !!e.is_playing;
        const item = e.item || {};
        const artistas = (item.artists || []).map((a) => a.name).join(', ');
        state.faixa = item.name ? (item.name + (artistas ? ' — ' + artistas : '')) : '';
        if (e.device && e.device.id) {
          state.deviceId = e.device.id;
          // O /me/player informa o nome do device mesmo quando a lista ainda
          // não foi carregada — sem isso o rodapé mostraria "Sem dispositivo"
          // com a música tocando.
          state.deviceNome = e.device.name || '';
          if (el.device.querySelector('option[value="' + e.device.id + '"]')) {
            el.device.value = e.device.id;
          }
        }
      }
    } catch (_) {
      // Falha de sincronização é silenciosa: não vale interromper a mesa com um
      // toast a cada 20s se a rede oscilar.
    }
    atualizarRodape();
  }

  function atualizarRodape() {
    if (!pronto()) { atualizarHabilitacao(); return; }
    el.play.textContent = state.tocando ? '⏸' : '▶';
    el.faixa.textContent = state.faixa || 'Nada tocando';
    const nome = nomeDoDevice(state.deviceId);
    const clima = state.climas.find((c) => c.id === state.climaAtivo);
    el.sub.textContent = [clima ? clima.rotulo : '', nome || 'Sem dispositivo'].filter(Boolean).join(' · ');
    el.climas.querySelectorAll('.trilha-clima').forEach((b) => {
      b.classList.toggle('ativo', b.dataset.clima === state.climaAtivo);
    });
    atualizarHabilitacao();
  }

  // ---------- Ações ----------
  async function acionarClima(clima) {
    const uri = uriDoClima(clima);
    if (!uri) { aviso('Playlist de "' + clima.rotulo + '" não configurada (⚙).'); return; }
    if (!state.deviceId) {
      await carregarDispositivos();
      if (!state.deviceId) return;
    }
    try {
      await api.tocar(uri, state.deviceId, clima.shuffle !== false);
      state.climaAtivo = clima.id;
      state.tocando = true;
      atualizarRodape();
      // O Spotify leva um instante para refletir a faixa nova no /me/player.
      setTimeout(sincronizar, 1200);
    } catch (e) {
      aviso(e.message);
    }
  }

  async function alternarPlay() {
    try {
      if (state.tocando) { await api.pausar(state.deviceId); state.tocando = false; }
      else { await api.retomar(state.deviceId); state.tocando = true; }
      atualizarRodape();
      setTimeout(sincronizar, 1000);
    } catch (e) {
      aviso(e.message);
    }
  }

  function ligarEventos() {
    el.toggle.addEventListener('click', () => {
      state.expandida = !state.expandida;
      el.painel.hidden = !state.expandida;
      el.toggle.setAttribute('aria-expanded', String(state.expandida));
      if (state.expandida) carregarDispositivos(true);
    });

    el.play.addEventListener('click', alternarPlay);

    el.next.addEventListener('click', async () => {
      try { await api.proxima(state.deviceId); setTimeout(sincronizar, 1000); }
      catch (e) { aviso(e.message); }
    });

    el.refresh.addEventListener('click', () => carregarDispositivos());

    el.device.addEventListener('change', async () => {
      state.deviceId = el.device.value;
      state.deviceNome = nomeDoDevice(state.deviceId);
      salvarNomeDevice(state.deviceNome);
      try { await api.transferir(state.deviceId, state.tocando); }
      catch (e) { aviso(e.message); }
      atualizarRodape();
    });

    // 'change' e não 'input': o slider dispararia dezenas de requisições
    // durante o arrasto.
    el.volume.addEventListener('change', async () => {
      const v = parseInt(el.volume.value, 10);
      try { localStorage.setItem(K_VOL, String(v)); } catch (_) {}
      try { await api.volume(v, state.deviceId); }
      catch (e) { aviso(e.message); }
    });

    el.cfg.addEventListener('click', abrirConfig);

    // Ao voltar a rede é preciso repovoar a lista: os device_ids obtidos antes
    // da queda podem já não valer, e sem recarregar o seletor ficaria vazio.
    window.addEventListener('online', async () => {
      atualizarHabilitacao();
      await carregarDispositivos(true);
      sincronizar();
    });
    window.addEventListener('offline', atualizarHabilitacao);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) sincronizar();
    });
  }

  // ---------- Painel de configuração ----------
  function abrirConfig() {
    if (document.getElementById('trilha-config')) return;

    const fundo = document.createElement('div');
    fundo.id = 'trilha-config';
    fundo.className = 'trilha-config-fundo';
    fundo.innerHTML = `
      <div class="trilha-config" role="dialog" aria-modal="true" aria-label="Configurar trilha sonora">
        <div class="trilha-config-topo">
          <h2 class="text-sm font-bold text-amber-400">Trilha sonora</h2>
          <button type="button" class="painel-notas-fechar" aria-label="Fechar">×</button>
        </div>
        <div class="trilha-config-corpo">
          <label class="trilha-campo">
            <span>Client ID do Spotify</span>
            <input type="text" id="cfg-client" inputmode="latin" autocomplete="off" spellcheck="false"
                   placeholder="cole aqui o Client ID do seu app" />
          </label>
          <p class="trilha-ajuda">
            Crie um app em developer.spotify.com (marque apenas <strong>Web API</strong>) e cadastre
            este Redirect URI: <code id="cfg-redirect"></code>
          </p>
          <div id="cfg-playlists"></div>
          <p class="trilha-ajuda">
            Cole o link ou o URI de cada playlist. O botão fica apagado enquanto o clima não tiver playlist.
          </p>
        </div>
        <div class="trilha-config-acoes">
          <button type="button" id="cfg-conta" class="trilha-btn-secundario"></button>
          <button type="button" id="cfg-salvar" class="trilha-btn-primario">Salvar</button>
        </div>
      </div>`;
    document.body.appendChild(fundo);

    fundo.querySelector('#cfg-redirect').textContent = api.redirectUri();
    // O Spotify recusa "localhost" como redirect — exige HTTPS ou o IP de
    // loopback explícito. Sem este aviso, o dev copiaria uma URL que o
    // Dashboard não aceita e o login falharia sem explicação.
    if (location.hostname === 'localhost') {
      const alerta = document.createElement('p');
      alerta.className = 'trilha-ajuda';
      alerta.innerHTML = '⚠️ O Spotify recusa <code>localhost</code>: abra o app por ' +
                         '<code>' + window.escHtml(api.redirectUri().replace('localhost', '127.0.0.1')) + '</code>.';
      fundo.querySelector('#cfg-redirect').closest('p').after(alerta);
    }
    const campoClient = fundo.querySelector('#cfg-client');
    campoClient.value = api.clientId();

    const lista = fundo.querySelector('#cfg-playlists');
    state.climas.forEach((clima) => {
      const wrap = document.createElement('label');
      wrap.className = 'trilha-campo';
      wrap.innerHTML = '<span></span><input type="text" inputmode="url" autocomplete="off" spellcheck="false" />';
      wrap.querySelector('span').textContent = (clima.icone || '🎵') + ' ' + clima.rotulo;
      const input = wrap.querySelector('input');
      input.dataset.clima = clima.id;
      input.value = state.config[clima.id] || clima.uri || '';
      input.placeholder = state.overrides[clima.id]
        ? 'definido pela aventura atual'
        : 'https://open.spotify.com/playlist/…';
      input.disabled = !!state.overrides[clima.id];
      lista.appendChild(wrap);
    });

    const btnConta = fundo.querySelector('#cfg-conta');
    btnConta.textContent = api.estaConectado() ? 'Desconectar' : 'Conectar ao Spotify';

    function fechar() { fundo.remove(); }
    fundo.querySelector('.painel-notas-fechar').addEventListener('click', fechar);
    fundo.addEventListener('click', (ev) => { if (ev.target === fundo) fechar(); });

    function salvarCampos() {
      api.definirClientId(campoClient.value);
      const uris = {};
      let invalido = '';
      lista.querySelectorAll('input[data-clima]').forEach((i) => {
        if (i.disabled) return;
        const norm = normalizarUri(i.value);
        if (norm === null) { invalido = invalido || i.dataset.clima; return; }
        if (norm) uris[i.dataset.clima] = norm;
      });
      if (invalido) {
        aviso('Link inválido em "' + invalido + '". Use o link ou o URI da playlist.');
        return false;
      }
      state.config = uris;
      gravarJson(K_URIS, uris);
      atualizarHabilitacao();
      return true;
    }

    fundo.querySelector('#cfg-salvar').addEventListener('click', () => {
      if (salvarCampos()) { aviso('Trilha configurada.'); fechar(); }
    });

    btnConta.addEventListener('click', async () => {
      if (api.estaConectado()) {
        api.logout();
        state.devices = [];
        state.deviceId = '';
        state.tocando = false;
        state.faixa = '';
        fechar();
        atualizarRodape();
        return;
      }
      if (!salvarCampos()) return;
      if (!api.clientId()) { aviso('Informe o Client ID antes de conectar.'); return; }
      if (!online()) { aviso('Sem conexão — conecte-se à internet para autorizar.'); return; }
      try { await api.login(); } catch (e) { aviso(e.message); }
    });
  }

  // ---------- Ciclo de vida ----------
  // Chamado por app.js quando a aventura termina de carregar: o campo "trilha"
  // do JSON da aventura sobrescreve os climas para aquela campanha.
  function aplicarAventura(aventura) {
    const t = (aventura && aventura.trilha) || {};
    const overrides = {};
    Object.keys(t).forEach((id) => {
      const norm = normalizarUri(t[id]);
      if (norm) overrides[id] = norm;
    });
    state.overrides = overrides;
    if (el.climas) atualizarHabilitacao();
  }

  async function iniciar() {
    if (!api) return;
    state.config = lerJson(K_URIS);

    try {
      const r = await fetch('data/trilha.json', { cache: 'no-cache' });
      const dados = await r.json();
      state.climas = Array.isArray(dados.climas) ? dados.climas : [];
    } catch (_) {
      // Offline na primeira visita: sem catálogo não há barra para desenhar.
      return;
    }
    if (!state.climas.length) return;

    montar();
    montarClimas();
    atualizarHabilitacao();

    if (pronto()) {
      await carregarDispositivos(true);
      await sincronizar();
      timerPoll = setInterval(() => {
        if (!document.hidden && pronto()) sincronizar();
      }, INTERVALO_POLL);
    }
  }

  window.Trilha = { aplicarAventura: aplicarAventura };

  document.addEventListener('DOMContentLoaded', iniciar);
})();
