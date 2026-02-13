// =============================================================================
// MAFIA GAME - Rendering Functions
// =============================================================================

// -----------------------------------------------------------------------------
// HELPERS
// -----------------------------------------------------------------------------

function isSoloMode() {
  return state.players.length === 1 && state.bots.length > 0;
}

function clampExposure(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}

function getExposurePct(exposure) {
  return Math.round(clampExposure(exposure) * 100);
}

function getExposureColor(exposure) {
  const pct = clampExposure(exposure);
  const hue = Math.round((1 - pct) * 120);
  return `hsl(${hue} 85% 52%)`;
}

function getAliveDiscussionHumans() {
  return getAlivePlayers().filter(player => !player.isBot);
}

function isMultiDeviceChatEnabled() {
  return state.multiplayerMode === 'realtime' && (state.network.devices || []).length > 1;
}

function renderThinkingDots() {
  return `<span class="thinking-dots"><span>.</span><span>.</span><span>.</span></span>`;
}

function renderMultiDeviceChatPanel({ prominent = false, corner = false } = {}) {
  const aliveHumans = getAliveDiscussionHumans();
  const dayMessages = state.chatMessages.filter(message => message.day === state.dayNumber);
  const chatOpen = state.gamePhase === 'discussion';
  const panelClasses = ['chat-panel'];
  if (prominent) panelClasses.push('chat-panel-prominent');
  if (corner) panelClasses.push('chat-panel-corner');

  return `
    <div class="${panelClasses.join(' ')}">
      <div class="chat-header">🗨️ Multi-device Chat</div>
      ${aliveHumans.length > 1 ? `
        <div class="chat-senders">
          ${aliveHumans.map(player => `
            <button class="chat-sender-btn ${state.chatSenderId === player.id ? 'active' : ''}" onclick="setChatSender('${player.id}')">
              ${player.name}
            </button>
          `).join('')}
        </div>
      ` : ''}
      <div class="chat-messages">
        ${dayMessages.length === 0 ? '<div style="color:var(--text-secondary);font-size:0.9rem">No messages yet this round.</div>' : dayMessages.map(message => `
          <div class="chat-message ${message.senderId?.startsWith('bot') ? 'chat-message-bot' : ''}">
            <span class="chat-author">${message.senderName}:</span> ${message.text}
          </div>
        `).join('')}
      </div>
      <div class="chat-compose">
        <input class="input" type="text" value="${state.chatDraft.replace(/"/g, '&quot;')}"
               oninput="setChatDraft(this.value)"
               onkeydown="if(event.key==='Enter'){event.preventDefault();sendDiscussionMessage();}"
               placeholder="${chatOpen ? 'Type message and press Enter' : 'Chat opens during discussion'}"
               ${chatOpen ? '' : 'disabled'}/>
        <button class="btn btn-secondary btn-small" onclick="sendDiscussionMessage()" ${chatOpen ? '' : 'disabled'}>Send</button>
      </div>
      ${chatOpen ? '' : '<div style="color:var(--text-secondary);font-size:0.8rem;margin-top:8px">Chat is read-only outside discussion.</div>'}
    </div>
  `;
}

function renderNarratorQuickControls() {
  const modeHint = state.settings.narratorMode === 'human'
    ? (isMultiDeviceChatEnabled()
      ? 'Human narrator active: narrator turn goes first each phase and the cue is posted in shared chat.'
      : 'Human narrator active: narrator turn goes first each phase and the cue is spoken aloud.')
    : 'Auto narrator active.';

  return `
    <div class="narrator-quick-controls">
      <div class="narrator-quick-label">Narrator</div>
      <div class="narrator-quick-actions">
        <button class="btn btn-small ${state.settings.narratorMode === 'auto' ? 'btn-primary' : 'btn-secondary'}" onclick="setNarratorMode('auto')">Auto</button>
        <button class="btn btn-small ${state.settings.narratorMode === 'human' ? 'btn-primary' : 'btn-secondary'}" onclick="setNarratorMode('human')">Human</button>
      </div>
      <div class="narrator-quick-hint">${modeHint}</div>
    </div>
  `;
}

// -----------------------------------------------------------------------------
// MAIN RENDER
// -----------------------------------------------------------------------------

function render() {
  const app = document.getElementById('app');
  if (state.screen === 'setup') app.innerHTML = renderSetup();
  else if (state.screen === 'solo_lobby') app.innerHTML = renderSoloLobby();
  else if (state.screen === 'multi_lobby') app.innerHTML = renderMultiLobby();
  else if (state.screen === 'game') app.innerHTML = renderGame();
  attachEventListeners();
  if (typeof window.afterRender === 'function') window.afterRender();
}

// -----------------------------------------------------------------------------
// SETUP SCREEN
// -----------------------------------------------------------------------------

function renderSetup() {
  return `
    <div class="container">
      <h1>MAFIA</h1>
      <p class="subtitle">A game of deception and survival</p>
      <button class="btn btn-secondary btn-full" style="margin-bottom:24px" onclick="showInstructions()">
        How to Play
      </button>
      <div class="card">
        <button class="mode-btn" onclick="goToSoloLobby()">
          <div class="mode-btn-title">🎮 Solo (vs Bots)</div>
          <div class="mode-btn-desc">Practice against AI opponents</div>
        </button>
        <button class="mode-btn" onclick="goToMultiLobby()">
          <div class="mode-btn-title">👥 Multiplayer</div>
          <div class="mode-btn-desc">Play with friends</div>
        </button>
      </div>
      ${state.joinCode ? `
        <div class="card" style="border-color:rgba(59,130,246,0.5)">
          <div class="section-label" style="color:#93c5fd">🔗 Room Code Detected</div>
          <p style="color:var(--text-secondary);margin-bottom:10px">Code: <strong>${state.joinCode}</strong></p>
          <button class="btn btn-primary btn-full" onclick="goToMultiLobby()">Open Multi-device Lobby</button>
        </div>
      ` : ''}
    </div>
    ${state.showInstructions ? renderInstructionsModal() : ''}
  `;
}

// -----------------------------------------------------------------------------
// SOLO LOBBY
// -----------------------------------------------------------------------------

function renderSoloLobby() {
  const allPlayers = getAllPlayers();
  const total = getTotalRoles();
  const warnings = getStartWarnings();
  const blockReason = getStartBlockReason();

  return `
    <div class="container">
      <div class="header-bar">
        <button class="btn btn-secondary btn-small" onclick="goToSetup()">← Back</button>
        <div class="header-actions">
          <button class="btn-icon btn-primary" onclick="showInstructions()">?</button>
          <button class="btn-icon btn-secondary" onclick="showSettings()">⚙️</button>
        </div>
      </div>
      <h2 style="color:var(--red-accent)">Solo Game</h2>
      ${renderNarratorQuickControls()}

      <div class="card">
        <div class="section-label">Your Name</div>
        <input type="text" class="input" id="soloNameInput" value="${state.soloPlayerName}" placeholder="Enter your name..."/>
      </div>

      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <span class="section-label" style="margin-bottom:0">🤖 Bots (${state.bots.length})</span>
          <button class="btn btn-secondary btn-small" onclick="addBot()" ${allPlayers.length >= 16 ? 'disabled' : ''}>+ Add Bot</button>
        </div>
        <div class="bot-list">
          ${state.bots.map(b => `
            <div class="player-item">
              <span class="player-name">🤖</span>
              <div class="player-item-actions" style="margin-left:auto">
                <input type="text" class="input inline-edit" value="${b.name.replace(/"/g, '&quot;')}"
                       onblur="renameBot('${b.id}', this.value)"
                       onkeydown="if(event.key==='Enter'){event.preventDefault();this.blur();}"/>
                <button class="remove-btn" onclick="removeBot('${b.id}')">×</button>
              </div>
            </div>
          `).join('')}
          ${state.bots.length === 0 ? '<div style="color:var(--text-secondary);text-align:center;padding:12px">No bots yet</div>' : ''}
        </div>
      </div>

      <div class="card">
        <div class="section-label">📖 Setting</div>
        <div class="grid-2">
          ${STORY_PRESETS.map(s => `
            <div class="story-card ${state.selectedStory.id === s.id ? 'selected' : ''}" onclick="selectStory('${s.id}')">
              <div class="story-name">${s.name}</div>
              <div class="story-intro">${s.intro}</div>
              <div class="story-setting">${s.setting}</div>
            </div>
          `).join('')}
        </div>
      </div>

      ${renderRoleConfig(allPlayers, total, warnings)}

      <button class="btn btn-danger btn-full btn-lg" onclick="startGame()" ${blockReason ? 'disabled' : ''}>
        ${blockReason || 'Start Game'}
      </button>
    </div>
    ${state.showInstructions ? renderInstructionsModal() : ''}
    ${state.showSettings ? renderSettingsModal() : ''}
  `;
}

// -----------------------------------------------------------------------------
// MULTIPLAYER LOBBY
// -----------------------------------------------------------------------------

function renderMultiLobby() {
  const allPlayers = getAllPlayers();
  const total = getTotalRoles();
  const warnings = getStartWarnings();
  const blockReason = getStartBlockReason();
  const isRealtime = state.multiplayerMode === 'realtime';
  const orderedDeviceList = getDeviceGroupedPlayers();
  const showDeviceList = isRealtime && orderedDeviceList.length > 1;
  const waitingForHost = isRealtime && !state.network.isHost;
  const isJoinPanel = state.realtimePanelMode === 'join';
  const realtimeStatusColor = state.network.status === 'connected'
    ? '#4ade80'
    : state.network.status === 'error'
      ? '#f87171'
      : '#fbbf24';
  const realtimeStatusLabel = state.network.status === 'connected'
    ? 'Connected'
    : state.network.status === 'connecting'
      ? 'Connecting...'
      : 'Offline';
  const joinPortal = isRealtime ? getJoinPortalUrl() : '';
  const shareJoinUrl = isRealtime ? getShareJoinUrl(state.gameCode) : '';
  const connectionGuide = isRealtime ? getConnectionGuideText() : '';
  const addBotBlocked = isRealtime && !state.network.isHost;
  const groupedPlayers = isRealtime ? orderedDeviceList : [];

  return `
    <div class="container wide">
      <div class="header-bar">
        <button class="btn btn-secondary btn-small" onclick="goToSetup()">← Back</button>
        <div class="header-actions">
          <button class="btn-icon btn-primary" onclick="showInstructions()">?</button>
          <button class="btn-icon btn-secondary" onclick="showSettings()">⚙️</button>
        </div>
      </div>
      <h2 style="color:var(--red-accent)">Multiplayer Lobby</h2>
      ${renderNarratorQuickControls()}

      <div class="card">
        <div class="section-label">🛰️ Multiplayer Mode</div>
        <div class="mode-switch-row">
          <button class="btn btn-small ${!isRealtime ? 'btn-primary' : 'btn-secondary'}" onclick="setMultiplayerMode('passplay')">Single-device</button>
          <button class="btn btn-small ${isRealtime ? 'btn-primary' : 'btn-secondary'}" onclick="setMultiplayerMode('realtime')">Multi-device</button>
        </div>
        ${isRealtime ? `
          <div class="realtime-meta">
            <div class="realtime-row">
              <label>Device name</label>
              <input type="text" class="input" value="${state.network.deviceName.replace(/"/g, '&quot;')}" oninput="setRealtimeDeviceName(this.value)" maxlength="32"/>
            </div>
            <div class="realtime-row">
              <div>Connection: <span style="color:${realtimeStatusColor}">${realtimeStatusLabel}</span></div>
              <div style="color:var(--text-secondary);font-size:0.85rem">${state.network.isHost ? 'Host device' : 'Client device'}</div>
            </div>
            <div class="mode-switch-row" style="margin-top:2px">
              <button class="btn btn-small ${!isJoinPanel ? 'btn-primary' : 'btn-secondary'}" onclick="setRealtimePanelMode('host')">Host</button>
              <button class="btn btn-small ${isJoinPanel ? 'btn-primary' : 'btn-secondary'}" onclick="setRealtimePanelMode('join')">Join</button>
            </div>
            ${isJoinPanel ? `
              <div class="realtime-row">
                <label>Enter room code</label>
                <input type="text" class="input" value="${state.gameCode}" oninput="setJoinCodeInput(this.value)" maxlength="8" spellcheck="false"/>
              </div>
              <div class="mode-switch-row">
                <button class="btn btn-small btn-primary" onclick="connectAsJoiner()" ${state.network.connected ? 'disabled' : ''}>Join Room</button>
                <button class="btn btn-small btn-secondary" onclick="disconnectRealtime()" ${!state.network.connected ? 'disabled' : ''}>Disconnect</button>
              </div>
            ` : `
              <div class="realtime-row">
                <label>Room code</label>
                <div class="input-row">
                  <input type="text" class="input" readonly value="${state.gameCode}"/>
                  <button class="btn btn-secondary btn-small" onclick="regenerateRoomCode()">Regenerate</button>
                </div>
              </div>
              <div class="mode-switch-row">
                <button class="btn btn-small btn-primary" onclick="connectAsHost()" ${state.network.connected ? 'disabled' : ''}>Host Room</button>
                <button class="btn btn-small btn-secondary" onclick="disconnectRealtime()" ${!state.network.connected ? 'disabled' : ''}>Disconnect</button>
              </div>
            `}
          </div>
        ` : `
          <div style="color:var(--text-secondary);font-size:0.9rem">
            Single-device uses pass-and-play on one screen. No room codes or join links are needed.
          </div>
        `}
      </div>

      ${isRealtime ? `
        <div class="card">
          <div class="section-label">🔗 Join Links</div>
          <div class="realtime-row" style="margin-bottom:10px">
            <label>Join portal URL</label>
            <div class="input-row">
              <input type="text" class="input" readonly value="${joinPortal || 'Unavailable'}"/>
              <button class="copy-btn" onclick="navigator.clipboard?.writeText('${(joinPortal || '').replace(/'/g, '\\\'')}')">📋 Copy</button>
            </div>
          </div>
          <div class="realtime-row">
            <label>Direct hotlink (joins this room)</label>
            <div class="input-row">
              <input type="text" class="input" readonly value="${shareJoinUrl || 'Unavailable'}"/>
              <button class="copy-btn" id="copyBtn" onclick="copyLink()">📋 Copy</button>
            </div>
          </div>
          <div style="font-size:0.85rem;color:var(--text-secondary);margin-top:10px;line-height:1.4">
            <strong>How to join:</strong> ${connectionGuide}
          </div>
        </div>
      ` : ''}

      ${showDeviceList ? `
        <div class="card">
          <div class="section-label">📱 Device Order (${orderedDeviceList.length})</div>
          <div class="device-list">
            ${orderedDeviceList.map((device) => `
              <div class="player-item draggable-row" draggable="${state.network.isHost ? 'true' : 'false'}"
                   ondragstart="event.dataTransfer.setData('text/device-id','${device.deviceId}');this.classList.add('dragging-row')"
                   ondragend="this.classList.remove('dragging-row')"
                   ondragover="event.preventDefault()"
                   ondrop="event.preventDefault();reorderDeviceByDrop(event.dataTransfer.getData('text/device-id'),'${device.deviceId}')">
                <span class="player-name">
                  ${state.network.isHost ? '<span class=\"drag-handle\" title=\"Drag to reorder\">☰</span>' : ''}
                  ${device.isHost ? '🛡️' : '📱'} ${device.deviceName}
                </span>
                <div class="player-item-actions">
                  <span style="font-size:0.8rem;color:var(--text-secondary)">${device.deviceId === state.network.deviceId ? 'This device' : 'Online'}</span>
                </div>
              </div>
            `).join('')}
          </div>
          <div style="font-size:0.8rem;color:var(--text-secondary);margin-top:8px">
            ${state.network.isHost ? 'Host can reorder which device goes first.' : 'Waiting for host device order.'}
          </div>
        </div>
      ` : ''}

      <div class="card">
        <div class="section-label">👥 Players (${state.players.length})</div>
        ${isRealtime ? `
          <div style="color:var(--text-secondary);font-size:0.88rem;margin-bottom:10px">Players are grouped by device. Drag by the ☰ handle to reorder.</div>
          <div class="player-list">
            ${groupedPlayers.map(group => `
              <div class="device-player-group">
                <div class="device-group-title">${group.isHost ? '🛡️' : '📱'} ${group.deviceName}</div>
                ${(group.players || []).map(player => `
                  <div class="player-item draggable-row" draggable="${state.network.isHost ? 'true' : 'false'}"
                       ondragstart="event.dataTransfer.setData('text/player-id','${player.id}');this.classList.add('dragging-row')"
                       ondragend="this.classList.remove('dragging-row')"
                       ondragover="event.preventDefault()"
                       ondrop="event.preventDefault();reorderPlayerByDrop(event.dataTransfer.getData('text/player-id'),'${player.id}')">
                    <span class="player-name">
                      ${state.network.isHost ? '<span class=\"drag-handle\" title=\"Drag to reorder\">☰</span>' : ''}
                      👤 ${player.name}
                    </span>
                    <div class="player-item-actions">
                      <button class="remove-btn" onclick="removePlayer('${player.id}')" title="Remove player">×</button>
                    </div>
                  </div>
                `).join('')}
                ${(group.players || []).length === 0 ? '<div style="color:var(--text-secondary);font-size:0.84rem;padding:6px 0 2px 2px">No players on this device yet.</div>' : ''}
              </div>
            `).join('')}
          </div>
        ` : `
          <div class="player-list">
            ${state.players.map((p) => `
              <div class="player-item draggable-row" draggable="true"
                   ondragstart="event.dataTransfer.setData('text/player-id','${p.id}');this.classList.add('dragging-row')"
                   ondragend="this.classList.remove('dragging-row')"
                   ondragover="event.preventDefault()"
                   ondrop="event.preventDefault();reorderPlayerByDrop(event.dataTransfer.getData('text/player-id'),'${p.id}')">
                <span class="player-name"><span class="drag-handle" title="Drag to reorder">☰</span> 👤 ${p.name}</span>
                <div class="player-item-actions">
                  <button class="remove-btn" onclick="removePlayer('${p.id}')" title="Remove player">×</button>
                </div>
              </div>
            `).join('')}
            ${state.players.length === 0 ? '<div style="color:var(--text-secondary);text-align:center;padding:12px">No players yet</div>' : ''}
          </div>
        `}
        <div class="input-row">
          <input type="text" class="input ${state.nameError ? 'input-error' : ''}" id="newPlayerInput" placeholder="Add player name..."/>
          <button class="btn btn-primary btn-small" onclick="addPlayerFromInput()">Add</button>
        </div>
        ${state.nameError ? `<div class="error-msg">${state.nameError}</div>` : ''}
      </div>

      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <span class="section-label" style="margin-bottom:0">🤖 Bots (${state.bots.length})</span>
          <button class="btn btn-secondary btn-small" onclick="addBot()" ${(allPlayers.length >= 16 || addBotBlocked) ? 'disabled' : ''}>+ Add Bot</button>
        </div>
        ${addBotBlocked ? '<div style="color:var(--text-secondary);font-size:0.82rem;margin-bottom:8px">Only the host can add or remove bots in multi-device mode.</div>' : ''}
        <div class="bot-list">
          ${state.bots.map(b => `
            <div class="player-item">
              <span class="player-name">🤖</span>
              <div class="player-item-actions" style="margin-left:auto">
                <input type="text" class="input inline-edit" value="${b.name.replace(/"/g, '&quot;')}"
                       onblur="renameBot('${b.id}', this.value)"
                       onkeydown="if(event.key==='Enter'){event.preventDefault();this.blur();}"
                       ${addBotBlocked ? 'disabled' : ''}/>
                <button class="remove-btn" onclick="removeBot('${b.id}')" ${addBotBlocked ? 'disabled' : ''}>×</button>
              </div>
            </div>
          `).join('')}
          ${state.bots.length === 0 ? '<div style="color:var(--text-secondary);text-align:center;padding:12px">No bots yet</div>' : ''}
        </div>
      </div>

      <div class="card">
        <div class="section-label">📖 Setting</div>
        <div class="grid-2">
          ${STORY_PRESETS.map(s => `
            <div class="story-card ${state.selectedStory.id === s.id ? 'selected' : ''}" onclick="selectStory('${s.id}')">
              <div class="story-name">${s.name}</div>
              <div class="story-intro">${s.intro}</div>
              <div class="story-setting">${s.setting}</div>
            </div>
          `).join('')}
        </div>
      </div>

      ${renderRoleConfig(allPlayers, total, warnings)}

      <button class="btn btn-danger btn-full btn-lg" onclick="startGame()" ${blockReason || waitingForHost ? 'disabled' : ''}>
        ${waitingForHost ? 'Waiting for Host to Start' : (blockReason || 'Start Game')}
      </button>
    </div>
    ${state.showInstructions ? renderInstructionsModal() : ''}
    ${state.showSettings ? renderSettingsModal() : ''}
  `;
}

// -----------------------------------------------------------------------------
// ROLE CONFIG (shared)
// -----------------------------------------------------------------------------

function renderRoleConfig(allPlayers, total, warnings) {
  return `
    <div class="card">
      <div class="section-label">⚖️ Role Balance</div>
      <div style="color:var(--text-secondary);font-size:0.84rem;margin:-4px 0 12px">Role presets only adjust role counts. Story atmosphere and other behavior settings are configured separately.</div>
      <div class="grid-2" style="margin-bottom:16px">
        ${ROLE_PRESETS.map(p => `
          <div class="preset-card ${state.selectedPreset?.id === p.id ? 'selected' : ''}"
               style="${state.selectedPreset?.id === p.id ? `border-color:${p.color};background:${p.color}20` : ''}"
               onclick="selectPreset('${p.id}')">
            <div class="preset-name" style="color:${p.color}">${p.name}</div>
            <div class="preset-desc">${p.description}</div>
          </div>
        `).join('')}
      </div>
      <div style="border-top:1px solid var(--border-color);padding-top:12px">
        ${['mafia', 'doctor', 'detective'].map(r => `
          <div class="role-row">
            <div class="role-info">
              <span>${ROLES[r].icon}</span>
              <span>${ROLES[r].name}</span>
            </div>
            <div class="role-controls">
              <button class="btn btn-secondary btn-adjust" onclick="adjustRole('${r}',-1)" ${state.roleConfig[r] <= 0 ? 'disabled' : ''}>−</button>
              <span class="role-count">${state.roleConfig[r] || 0}</span>
              <button class="btn btn-secondary btn-adjust" onclick="adjustRole('${r}',1)" ${isPlusDisabled(r) ? 'disabled' : ''}>+</button>
            </div>
          </div>
        `).join('')}
        <div class="role-summary">
          <span class="stat-display">👤 ${getRoleDisplayName('villager')}s: ${Math.max(0, allPlayers.length - state.roleConfig.mafia - state.roleConfig.doctor - state.roleConfig.detective)}</span>
          <span class="stat-display">Assigned: ${total}/${allPlayers.length}</span>
        </div>
        ${state.selectedPreset?.id === 'classic' ? '<div style="color:var(--text-secondary);font-size:0.85rem;margin-top:8px">Classic target at 12 players: 5 Mafia / 3 Doctor / 2 Detective.</div>' : ''}
        ${warnings.length > 0 ? `<div class="warning-msg">${warnings.join(' ')}</div>` : ''}
      </div>
    </div>
  `;
}

// -----------------------------------------------------------------------------
// GAME SCREEN
// -----------------------------------------------------------------------------

function renderGame() {
  const allPlayers = getAllPlayers();
  const alivePlayers = getAlivePlayers();
  const current = getCurrentPlayer();
  const showCornerChat = isMultiDeviceChatEnabled() && state.gamePhase !== 'gameover';
  const narratorCue = state.settings.narratorMode === 'human' ? getNarratorPhasePrompt(state.gamePhase) : '';
  const currentDeviceId = current?.deviceId || state.network.deviceId;
  const currentDeviceName = current?.deviceName || state.network.deviceName || 'Host device';
  const showDeviceTurnBanner = isMultiDeviceChatEnabled()
    && current
    && !['announcement', 'vote_announcement', 'gameover'].includes(state.gamePhase);
  const myDeviceTurn = currentDeviceId === state.network.deviceId;

  const phaseColors = {
    reveal: '#a855f7',
    day: '#eab308',
    night: '#6366f1',
    morning_doctor: '#f97316',
    announcement: '#ef4444',
    discussion: '#f97316',
    vote: '#eab308',
    vote_announcement: '#ef4444',
    gameover: '#ef4444'
  };

  const phaseLabels = {
    reveal: 'ROLE REVEAL',
    day: 'DAY',
    night: 'NIGHT',
    morning_doctor: 'MORNING',
    announcement: 'NEWS',
    discussion: 'DISCUSSION',
    vote: 'VOTE',
    vote_announcement: 'VERDICT',
    gameover: 'GAME OVER'
  };

  let content = '';
  const narratorTurnBlocking = typeof narratorTurnIsActive === 'function'
    ? narratorTurnIsActive(state.gamePhase)
    : false;

  if (narratorTurnBlocking) {
    const deliveryNote = isMultiDeviceChatEnabled()
      ? 'Narrator first turn: post this cue in chat, then continue.'
      : 'Narrator first turn: read this cue aloud, then continue.';
    content = `
      <div class="card narrator-turn-card">
        <div class="narrator-turn-title">🎙️ Narrator Turn</div>
        <div class="narrator-turn-text">${narratorCue || getNarratorPhasePrompt(state.gamePhase)}</div>
        <div class="narrator-turn-note">${deliveryNote}</div>
        <button class="btn btn-warning btn-lg" style="margin-top:12px" onclick="completeNarratorTurn()">Continue to Player Turns</button>
      </div>
    `;
  } else {
    // Announcement modal
    if ((state.gamePhase === 'announcement' || state.gamePhase === 'vote_announcement') && state.announcement) {
      content = `
        <div class="modal-overlay">
          <div class="modal-content">
            ${renderDeathAnimationCard()}
            <div class="modal-text">${state.announcement}</div>
            <button class="btn btn-danger btn-lg" onclick="${state.gamePhase === 'announcement' ? 'afterAnnouncement' : 'afterVoteAnnouncement'}()">Continue</button>
          </div>
        </div>
      `;
    }

    // Game over
    if (state.gamePhase === 'gameover') {
      // Build the final death message
      let finalDeathMessage = '';
      if (state.finalDeath) {
        if (state.finalDeath.type === 'night') {
          if (state.finalDeath.saved) {
            finalDeathMessage = `${state.finalDeath.victim} was attacked but saved by the Doctor.${state.finalDeath.method ? ` Attack method: ${state.finalDeath.method}.` : ''}`;
          } else if (state.finalDeath.victim) {
            finalDeathMessage = `${state.finalDeath.victim} (${state.finalDeath.role}) was killed during the night.${state.finalDeath.method ? ` Method: ${state.finalDeath.method}.` : ''}`;
          } else {
            finalDeathMessage = 'The night passed peacefully.';
          }
        } else if (state.finalDeath.type === 'vote') {
          if (state.finalDeath.victim) {
            finalDeathMessage = `${state.finalDeath.victim} (${state.finalDeath.role}) was eliminated by vote.`;
          } else {
            finalDeathMessage = 'The vote was tied. No one was eliminated.';
          }
        }
      }

      content = `
        <div class="gameover-container card">
          <div class="gameover-icon">${state.winner === 'town' ? '🎉' : '💀'}</div>
          <div class="gameover-title">${state.winner === 'town' ? 'Town Wins!' : 'Mafia Wins!'}</div>
          ${finalDeathMessage ? `
            <div class="gameover-death" style="color:var(--text-secondary);margin-bottom:12px;font-size:0.95rem">
              ${finalDeathMessage}
            </div>
          ` : ''}
          ${state.winReason ? `
            <div class="gameover-reason" style="color:${state.winner === 'town' ? '#4ade80' : '#f87171'};margin-bottom:16px;font-weight:500;text-align:center;padding:12px;background:rgba(0,0,0,0.2);border-radius:8px">
              ${state.winReason}
            </div>
          ` : ''}
          <div class="gameover-roles">
            ${allPlayers.map(p => `
              <span class="gameover-role" style="background:${ROLES[p.role]?.color}40">${ROLES[p.role]?.icon} ${p.name}</span>
            `).join('')}
          </div>
          <button class="btn btn-primary btn-lg" onclick="newGame()">New Game</button>
        </div>
      `;
    }

    // Phase-specific content
    if (state.gamePhase === 'reveal') content = renderRevealPhase(current);
    if (state.gamePhase === 'day') content = renderDayPhase(current, allPlayers);
    if (state.gamePhase === 'night') content = renderNightPhase(current, alivePlayers);
    if (state.gamePhase === 'morning_doctor') content = renderDoctorPhase(alivePlayers);
    if (state.gamePhase === 'discussion') content = renderDiscussionPhase(current);
    if (state.gamePhase === 'vote') content = renderVotePhase(current, alivePlayers);
  }

  return `
    <div class="container wide">
      <div class="header-bar" style="margin-bottom:8px">
        <span></span>
        <div class="header-actions">
          <button class="btn-icon btn-secondary" onclick="toggleMap()" title="Open map">🗺️</button>
          <button class="btn-icon btn-primary" onclick="showInstructions()">?</button>
        </div>
      </div>
      <div class="phase-header">
        <div class="phase-title" style="color:${phaseColors[state.gamePhase]}">${phaseLabels[state.gamePhase]}</div>
        ${!['reveal', 'gameover', 'announcement', 'vote_announcement'].includes(state.gamePhase)
          ? `<div class="phase-subtitle">Round ${state.dayNumber}</div>`
          : ''}
      </div>

      ${renderNarratorQuickControls()}

      ${showDeviceTurnBanner ? `
        <div class="device-turn-banner ${myDeviceTurn ? 'device-turn-local' : 'device-turn-remote'}">
          ${myDeviceTurn ? `Your device (${currentDeviceName}) is going now.` : `${currentDeviceName} is going now.`}
        </div>
      ` : ''}

      <div class="role-counter">
        ${Object.keys(ROLES).map(r => {
          const alive = alivePlayers.filter(p => p.role === r).length;
          const dead = allPlayers.filter(p => p.role === r && !p.alive).length;
          if (alive + dead === 0) return '';
          return `
            <div class="role-counter-item">
              <span>${ROLES[r].icon}</span>
              <span class="alive-count">${alive}</span>
              ${dead > 0 ? `<span class="dead-count">+${dead}☠</span>` : ''}
            </div>
          `;
        }).join('')}
      </div>

      ${!['gameover', 'announcement', 'vote_announcement'].includes(state.gamePhase) ? `
        <div class="setting-box">
          <div class="setting-name">📍 ${state.selectedStory.name}</div>
          <div class="setting-desc">${state.selectedStory.setting}</div>
        </div>
      ` : ''}

      ${state.narrative && !['announcement', 'vote_announcement'].includes(state.gamePhase) ? `
        <div class="narrative-box">
          <p class="narrative-text">${state.narrative}</p>
        </div>
      ` : ''}

      ${state.settings.narratorMode === 'human' ? renderNarratorConsole(allPlayers, alivePlayers) : ''}

      <div class="player-grid">
        ${allPlayers.map(p => `
          <div class="player-cell ${p.alive ? '' : 'dead'} ${current?.id === p.id && state.showRole ? 'current' : ''}">
            <div class="player-cell-icon">${p.alive ? (p.isBot ? '🤖' : '👤') : '💀'}</div>
            <div class="player-cell-name">${p.name}</div>
            ${!p.alive ? `<div style="color:var(--text-secondary);font-size:0.75rem">${ROLES[p.role]?.icon}</div>` : ''}
          </div>
        `).join('')}
      </div>

      ${content}
    </div>
    ${state.showMap ? renderMapModal() : ''}
    ${showCornerChat ? renderMultiDeviceChatPanel({ prominent: true, corner: true }) : ''}
  `;
}

function renderMapModal() {
  const graph = state.selectedStory?.mapGraph || { nodes: [], edges: [] };
  const nodes = graph.nodes || [];
  const edges = graph.edges || [];
  const exposureByNodeId = Object.fromEntries((state.selectedStory.locations || []).map(location => [location.id, location.exposure || 0.5]));
  const width = 560;
  const height = 330;
  const centerX = width / 2;
  const centerY = height / 2;
  const orbit = Math.min(width, height) * 0.35;
  const nodeCoords = {};

  nodes.forEach((node, index) => {
    const angle = (Math.PI * 2 * index) / Math.max(1, nodes.length);
    nodeCoords[node.id] = {
      x: Math.round(centerX + Math.cos(angle) * orbit),
      y: Math.round(centerY + Math.sin(angle) * orbit)
    };
  });

  return `
    <div class="modal-overlay" onclick="closeMap()">
      <div class="map-modal" onclick="event.stopPropagation()">
        <div class="map-modal-header">
          <div>
            <div class="section-label" style="margin-bottom:4px">🗺️ ${state.selectedStory.name} Map</div>
            <div style="color:var(--text-secondary);font-size:0.86rem">Exposure = your exposure to information and threats.</div>
          </div>
          <button class="btn btn-secondary btn-small" onclick="closeMap()">Close</button>
        </div>
        <svg viewBox="0 0 ${width} ${height}" class="map-svg">
          ${edges.map(edge => {
            const from = nodeCoords[edge.from];
            const to = nodeCoords[edge.to];
            if (!from || !to) return '';
            const opacity = Math.max(0.18, Math.min(0.85, Number(edge.hearing || 0.5)));
            return `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" stroke="rgba(148,163,184,${opacity})" stroke-width="${Math.max(1, Number(edge.distance || 1))}"/>`;
          }).join('')}
          ${nodes.map(node => {
            const point = nodeCoords[node.id];
            const exposure = getExposureColor(exposureByNodeId[node.id] ?? 0.5);
            return `
              <g>
                <circle cx="${point.x}" cy="${point.y}" r="21" fill="rgba(15,23,42,0.9)" stroke="${exposure}" stroke-width="2.6"/>
                <text x="${point.x}" y="${point.y - 28}" text-anchor="middle" font-size="11" fill="#e2e8f0">${node.name}</text>
              </g>
            `;
          }).join('')}
        </svg>
        <div class="map-node-grid">
          ${nodes.map(node => `
            <div class="map-node-pill">
              <span class="map-node-name">${node.name}</span>
              <span class="map-node-type">${node.type.replace(/_/g, ' ')}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function renderDeathAnimationCard() {
  if (!state.settings.deathAnimations || !state.deathAnimation) return '';

  const phaseLabel = state.deathAnimation.phase === 'vote' ? 'the vote' : 'the night';
  return `
    <div class="death-animation-card" data-death-animation="${state.deathAnimation.id}">
      <div class="death-animation-icon">💀</div>
      <div class="death-animation-title">${state.deathAnimation.victimName} was lost during ${phaseLabel}.</div>
      <div class="death-animation-subtitle">Role revealed: ${state.deathAnimation.roleName}</div>
    </div>
  `;
}

function renderNarratorConsole(allPlayers, alivePlayers) {
  const aliveCount = alivePlayers.length;
  const deadCount = allPlayers.length - aliveCount;
  const plannedCount = Object.keys(state.nightPlans || {}).length;
  const votesCast = Object.keys(state.votes || {}).length;
  const recentNarration = (state.narrationLog || []).slice(-4).reverse();

  return `
    <div class="card narrator-panel">
      <div class="narrator-title">🎙️ Human Narrator Console (No Secret Roles)</div>
      <div class="narrator-grid">
        <div><strong>Day:</strong> ${state.dayNumber}</div>
        <div><strong>Phase:</strong> ${state.gamePhase.replace('_', ' ')}</div>
        <div><strong>Alive:</strong> ${aliveCount}</div>
        <div><strong>Dead:</strong> ${deadCount}</div>
        <div><strong>Plans Locked:</strong> ${plannedCount}</div>
        <div><strong>Votes Cast:</strong> ${votesCast}</div>
      </div>
      <div class="narrator-feed">
        ${recentNarration.length === 0 ? `
          <div class="narrator-feed-item">No narrator updates yet.</div>
        ` : recentNarration.map(item => `
          <div class="narrator-feed-item">
            <span class="narrator-feed-phase">Day ${item.day} • ${item.phase.replace('_', ' ')}</span>
            <span>${item.text}</span>
          </div>
        `).join('')}
      </div>
      <div class="narrator-note">
        This panel is safe for moderation: it avoids role identities and team secrets.
      </div>
    </div>
  `;
}

// -----------------------------------------------------------------------------
// PHASE RENDERERS
// -----------------------------------------------------------------------------

function renderRevealPhase(current) {
  if (!current) return '';

  if (current.isBot) {
    scheduleAutoAdvance(`reveal_${current.id}`, 'nextReveal');
    return `
      <div class="card" style="text-align:center">
        <div style="color:var(--text-secondary);margin-bottom:12px">🤖 ${current.name} is reviewing their role ${renderThinkingDots()}</div>
        <div style="color:var(--text-secondary);font-size:0.9rem">Continuing in ~${state.botDelayMs}ms</div>
      </div>
    `;
  }
  clearAutoAdvance();

  // In solo mode, skip the turn prompt - go straight to role reveal
  if (!state.showRole && !isSoloMode()) {
    return `
      <div class="card" style="text-align:center">
        <div style="font-size:1.25rem;margin-bottom:8px">📲 Pass to <strong>${current.name}</strong></div>
        <p style="color:var(--text-secondary);margin-bottom:16px">Only ${current.name} should look at this screen.</p>
        <button class="btn btn-primary btn-lg" onclick="showCurrentRole()">Reveal My Role</button>
      </div>
    `;
  }

  // In solo mode, auto-show the role
  if (!state.showRole && isSoloMode()) {
    state.showRole = true;
  }

  const teammates = current.role === 'mafia'
    ? getAllPlayers().filter(p => p.role === 'mafia' && p.id !== current.id)
    : [];

  return `
    <div class="card role-reveal">
      <div class="role-icon">${ROLES[current.role]?.icon}</div>
      <div class="role-name" style="color:${ROLES[current.role]?.color}">${ROLES[current.role]?.name}</div>
      <div class="role-desc">${ROLES[current.role]?.description}</div>
      ${teammates.length > 0 ? `
        <div class="teammates-box">
          <div class="teammates-label">Your allies:</div>
          <div>${teammates.map(t => t.name).join(', ')}</div>
        </div>
      ` : ''}
      <button class="btn btn-primary btn-lg" onclick="nextReveal()">Got it!</button>
    </div>
  `;
}

function renderDayPhase(current, allPlayers) {
  if (!current) return '';

  if (current.isBot) {
    scheduleAutoAdvance(`day_${current.id}_${state.dayNumber}`, 'skipBotDay');
    return `
      <div class="card" style="text-align:center">
        <div style="color:var(--text-secondary);margin-bottom:12px">🤖 ${current.name} is planning ${renderThinkingDots()}</div>
        <div style="color:var(--text-secondary);font-size:0.9rem">Continuing in ~${state.botDelayMs}ms</div>
      </div>
    `;
  }
  clearAutoAdvance();

  // In solo mode, skip the turn prompt - go straight to planning
  if (!state.showRole && !isSoloMode()) {
    return `
      <div class="card" style="text-align:center">
        <div style="font-size:1.25rem;margin-bottom:8px">📲 Pass to <strong>${current.name}</strong></div>
        <p style="color:var(--text-secondary);margin-bottom:16px">Plan privately before passing again.</p>
        <button class="btn btn-warning btn-lg" onclick="showCurrentRole()">Plan My Night</button>
      </div>
    `;
  }

  const isMafia = current.role === 'mafia';
  const location = getLocationById(state.selectedLocation);
  const actions = getAvailableActionsForPlayer(current, location);
  const targetCandidates = allPlayers.filter(player =>
    player.alive
    && player.id !== current.id
    && (isMafia ? player.role !== 'mafia' : true)
  );

  const sortedLocations = [...state.selectedStory.locations].sort((x, y) => (x.exposure || 0) - (y.exposure || 0));
  const actionNeedsTarget = Boolean(state.selectedAction?.requiresTarget);
  const canConfirm = Boolean(
    state.selectedLocation
      && state.selectedAction
      && (!actionNeedsTarget || state.selectedActionTarget)
  );

  return `
    <div class="card">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">
        <span style="color:${ROLES[current.role]?.color}">${ROLES[current.role]?.icon}</span>
        <span>${current.name}</span>
      </div>

      <div class="section-label">1. Where will you be tonight?</div>
      <div style="color:var(--text-secondary);font-size:0.84rem;margin-bottom:10px">
        ${isMafia
          ? 'Risk reflects how exposed your route is to witnesses.'
          : 'Exposure means your exposure to information and threats.'}
      </div>
      <div class="location-grid">
        ${sortedLocations.map(l => `
            <div class="location-card ${state.selectedLocation === l.id ? 'selected' : ''}" onclick="selectLocation('${l.id}')">
              <div class="location-header">
                <span class="location-name">${l.name}</span>
                <span class="exposure-badge" style="color:${getExposureColor(l.exposure || 0)};border-color:${getExposureColor(l.exposure || 0)}">
                  ${isMafia ? 'Risk' : 'Exposure'} ${getExposurePct(l.exposure || 0)}%
                </span>
              </div>
              <span style="font-size:0.8rem;color:var(--text-secondary)">${(l.tags || []).join(' • ') || l.nodeType || ''}</span>
            </div>
          `).join('')}
      </div>

      ${location ? `
        <div class="section-label">
          ${isMafia ? '2. Route options (low risk → high risk)' : '2. Choose your action (low exposure → high exposure)'}
        </div>
        ${!isMafia ? '<div style="color:#fde68a;font-size:0.84rem;margin-bottom:8px">Tip: actions tagged "Snoop" are the quickest way to gather stronger clues.</div>' : ''}
        <div class="action-list">
          ${[...actions].sort((a, b) => (a.exposure || 0) - (b.exposure || 0)).map(ac => `
            <div class="action-card ${state.selectedAction?.id === ac.id ? 'selected' : ''}" onclick="selectAction('${ac.id}')">
              <div class="action-header">
                <span class="action-name">${ac.name} ${ac.kind === 'snoop' ? '<span class="action-tag">Snoop</span>' : ''}</span>
                <div class="action-stats">
                  <span class="exposure-chip" style="color:${getExposureColor(ac.exposure || 0)};border-color:${getExposureColor(ac.exposure || 0)}">
                    ${isMafia ? 'Risk' : 'Exposure'} ${getExposurePct(ac.exposure || 0)}%
                  </span>
                </div>
              </div>
              <div class="action-desc">${ac.desc}</div>
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${location && state.selectedAction && actionNeedsTarget ? `
        <div class="section-label">3. Who are you tracking?</div>
        <div class="target-grid">
          ${targetCandidates.map(player => `
            <button class="target-btn ${state.selectedActionTarget === player.id ? 'selected' : ''}"
                    onclick="selectActionTarget('${player.id}')">
              ${player.isBot ? '🤖 ' : '👤 '}${player.name}
            </button>
          `).join('')}
        </div>
      ` : ''}

      ${current.role === 'detective' ? `
        <div class="card detective-lock-note">
          <strong>Detective rule:</strong> detectives are always alert and never fully doze off, so they stay stealthier than most roles.
        </div>
      ` : ''}

      <button class="btn btn-primary btn-full btn-lg" onclick="confirmDayPlan()" ${!canConfirm ? 'disabled' : ''}>
        ${isMafia ? 'Confirm Route' : 'Confirm Plan'}
      </button>
    </div>
  `;
}

function renderNightPhase(current, alivePlayers) {
  if (!current) {
    return `
      <div class="card" style="text-align:center">
        <button class="btn btn-secondary" onclick="processNight()">Continue</button>
      </div>
    `;
  }

  const nightActors = getNightActors(alivePlayers);
  const isNightActor = nightActors.some(actor => actor.id === current.id);

  if (current.isBot || !isNightActor) {
    scheduleAutoAdvance(`night_${current.id}_${state.currentPlayerIndex}`, 'continueNight');
    return `
      <div class="card" style="text-align:center">
        <div style="font-size:1.25rem;margin-bottom:8px">🌙 Night falls...</div>
        <div style="color:var(--text-secondary);margin-bottom:16px">
          ${current.role === 'mafia' ? 'The shadows move...' : 'Everyone stays alert through the night.'}
        </div>
        <div style="color:var(--text-secondary);font-size:0.9rem">Continuing ${renderThinkingDots()}</div>
      </div>
    `;
  }
  clearAutoAdvance();

  // In solo mode, skip the turn prompt.
  if (!state.showRole && !isSoloMode()) {
    return `
      <div class="card" style="text-align:center">
        <div style="font-size:1.25rem;margin-bottom:8px">📲 Pass to <strong>${current.name}</strong></div>
        <p style="color:var(--text-secondary);margin-bottom:16px">Night action is private.</p>
        <button class="btn btn-warning btn-lg" onclick="showCurrentRole()">Open Night Console</button>
      </div>
    `;
  }

  if (current.role === 'mafia') {
    const mafiaView = getVisibleTargetsForMafia(current.id, alivePlayers);
    const targets = mafiaView.targets || [];
    const visionNote = mafiaView.mode === 'nearby'
      ? 'Visible targets are currently near your area.'
      : 'No nearby targets were visible, so your search widened across the map.';
    const snooperIntel = state.mafiaSnooperIntel[current.id] || {};
    const briefing = state.mafiaBriefing[current.id] || [];
    const sortedMethods = [...KILL_METHODS].sort((a, b) => (a.noise || 0) - (b.noise || 0));

    return `
      <div class="card">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">
          <span style="color:${ROLES.mafia.color}">${ROLES.mafia.icon}</span>
          <span>${current.name}</span>
          <span style="font-size:0.85rem;color:var(--text-secondary)">(Night strike)</span>
        </div>

        <div class="section-label">🎯 Choose your target</div>
        <div class="mafia-intel">
          <div class="mafia-intel-header">Night visibility</div>
          <div style="font-size:0.95rem;color:#e2e8f0">${visionNote}</div>
          ${briefing.map(line => `<div style="font-size:0.84rem;color:#e2e8f0;margin-top:5px">• ${line}</div>`).join('')}
        </div>

        ${targets.length > 0 ? `
        <div class="target-list">
          ${targets.map(p => {
            const plan = state.nightPlans[p.id];
            const snoopers = snooperIntel[p.id] || [];
            const trackedTargetName = plan?.actionTarget
              ? getAllPlayers().find(player => player.id === plan.actionTarget)?.name
              : null;
            return `
              <div class="target-card ${state.selectedTarget === p.id ? 'selected' : ''}" onclick="selectTarget('${p.id}')">
                <div class="target-info">
                  <div class="target-name">${p.isBot ? '🤖' : '👤'} ${p.name}</div>
                  <div class="target-details">
                    <span class="target-location">📍 ${plan?.locationName || 'Unknown'}</span>
                    ${plan?.action?.name ? `<span class="target-action">→ ${plan.action.name}</span>` : ''}
                    ${trackedTargetName ? `<span class="target-action">Tracking: ${trackedTargetName}</span>` : ''}
                  </div>
                  ${snoopers.length > 0 ? `<div class="target-snoopers">👀 Snoopers spotted around ${p.name}'s bedroom zone: ${snoopers.join(', ')}</div>` : ''}
                </div>
                <div class="target-kill-btn">🎯 Mark</div>
              </div>
            `;
          }).join('')}
        </div>
        ` : `
        <div class="card" style="margin-bottom:16px;text-align:center">
          <div style="color:var(--text-secondary)">No eligible targets visible.</div>
        </div>
        `}

        <div class="section-label">Choose attack method (low disturbance to high disturbance):</div>
        <div class="action-list">
          ${sortedMethods.map(method => `
            <div class="action-card ${state.selectedKillMethod === method.id ? 'selected' : ''}" onclick="selectKillMethod('${method.id}')">
              <div class="action-header">
                <span class="action-name">${method.name}</span>
                <span class="exposure-chip" style="color:${getExposureColor(method.noise || 0)};border-color:${getExposureColor(method.noise || 0)}">
                  Disturbance ${getExposurePct(method.noise || 0)}%
                </span>
              </div>
              <div class="action-desc">${method.desc}</div>
            </div>
          `).join('')}
        </div>

        <button class="btn btn-primary btn-full btn-lg" onclick="confirmMafiaTarget()" ${(!state.selectedTarget || !state.selectedKillMethod) ? 'disabled' : ''}>
          Confirm Night Strike
        </button>
      </div>
    `;
  }

  const selectedAwareness = state.selectedAwareness
    || state.nightAwareness[current.id]
    || NIGHT_AWARENESS_OPTIONS[1].id;
  const awarenessChoices = [...NIGHT_AWARENESS_OPTIONS].sort((a, b) => (a.exposureMod || 0) - (b.exposureMod || 0));
  const rolePrompt = current.role === 'doctor'
    ? 'Pick your night stance. In the morning, you will choose who to save.'
    : current.role === 'detective'
      ? 'Pick your night stance. Detectives stay alert and naturally harder to notice.'
      : 'Pick your night stance. Your choice affects how much you might notice.';

  return `
    <div class="card">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">
        <span style="color:${ROLES[current.role]?.color}">${ROLES[current.role]?.icon}</span>
        <span>${current.name}</span>
        <span style="font-size:0.85rem;color:var(--text-secondary)">(Night awareness turn)</span>
      </div>

      <div style="color:var(--text-secondary);margin-bottom:12px">${rolePrompt}</div>
      <div class="section-label">Night stance (low exposure to high exposure)</div>
      <div class="action-list">
        ${awarenessChoices.map(option => {
          const exposure = clampExposure(0.5 + (option.exposureMod || 0));
          return `
            <div class="action-card ${selectedAwareness === option.id ? 'selected' : ''}" onclick="selectNightAwareness('${option.id}')">
              <div class="action-header">
                <span class="action-name">${option.name}</span>
                <span class="exposure-chip" style="color:${getExposureColor(exposure)};border-color:${getExposureColor(exposure)}">
                  Exposure ${getExposurePct(exposure)}%
                </span>
              </div>
              <div class="action-desc">${option.desc}</div>
            </div>
          `;
        }).join('')}
      </div>

      <button class="btn btn-primary btn-full btn-lg" onclick="confirmNightAwareness()">
        Confirm Night Stance
      </button>
    </div>
  `;
}

function renderDoctorPhase(alivePlayers) {
  const doctor = alivePlayers.find(p => p.role === 'doctor' && !p.isBot);
  const method = getKillMethodById(state.nightAttackMethod || KILL_METHODS[0].id);
  const targetId = state.nightTarget;
  const likelyVictim = targetId ? alivePlayers.find(player => player.id === targetId) : null;
  const attackCount = targetId ? (state.nightAttackCounts[targetId] || 1) : 1;
  const saveChance = getDoctorSaveChance(method, attackCount);

  if (!doctor) {
    scheduleAutoAdvance(`doctor_auto_${state.dayNumber}`, 'skipDoctor');
    return `
      <div class="card" style="text-align:center">
        <div style="color:var(--text-secondary);margin-bottom:12px">💉 The doctor makes their choice ${renderThinkingDots()}</div>
        <div style="color:var(--text-secondary);font-size:0.9rem">Continuing in ~${state.botDelayMs}ms</div>
      </div>
    `;
  }
  clearAutoAdvance();

  if (!state.showRole && !isSoloMode()) {
    return `
      <div class="card" style="text-align:center">
        <div style="font-size:1.25rem;margin-bottom:8px">📲 Pass to <strong>${doctor.name}</strong></div>
        <p style="color:var(--text-secondary);margin-bottom:16px">Doctor choice is private.</p>
        <button class="btn btn-lg" style="background:linear-gradient(135deg,#2563eb 0%,#1d4ed8 100%);color:white" onclick="showCurrentRole()">
          Choose Who to Save
        </button>
      </div>
    `;
  }

  if (!state.showRole && isSoloMode()) state.showRole = true;

  return `
    <div class="card" style="border-color:#2563eb">
      <div class="section-label" style="color:#60a5fa">💉 Save one person from death tonight</div>
      <p style="color:var(--text-secondary);margin-bottom:6px">Save chance is never guaranteed and drops when multiple attackers focus one target.</p>
      <p style="color:var(--text-secondary);margin-bottom:12px">Current likely attack profile: <strong>${method.name}</strong> (disturbance ${getExposurePct(method.noise || 0)}%). Estimated save chance against this profile: <strong>${Math.round(saveChance * 100)}%</strong>.</p>
      ${likelyVictim ? `<p style="color:#bfdbfe;margin-bottom:10px">Most likely target by mafia vote pattern: <strong>${likelyVictim.name}</strong></p>` : ''}
      <div class="target-grid">
        ${alivePlayers.map(p => `
          <button class="target-btn ${state.selectedSave === p.id ? 'selected' : ''}"
                  style="${state.selectedSave === p.id ? 'background:rgba(37,99,235,0.4);border-color:#2563eb' : ''}"
                  onclick="selectSave('${p.id}')">
            ${p.isBot ? '🤖 ' : ''}${p.name}
            ${state.intelResults[p.id]?.heard ? `<div style="font-size:0.74rem;color:#cbd5e1;margin-top:3px">${state.intelResults[p.id].heard}</div>` : ''}
          </button>
        `).join('')}
      </div>
      <button class="btn btn-full btn-lg" style="background:linear-gradient(135deg,#2563eb 0%,#1d4ed8 100%);color:white"
              onclick="confirmDoctorSave()" ${!state.selectedSave ? 'disabled' : ''}>
        Confirm Save
      </button>
    </div>
  `;
}

function renderDiscussionPhase(current) {
  const isMultiDevice = isMultiDeviceChatEnabled();
  const remainingMs = Math.max(0, (state.discussionUnlockAt || 0) - Date.now());
  const timerLocked = !isSoloMode() && remainingMs > 0;
  if (timerLocked) {
    const waitMs = Math.min(600, remainingMs + 20);
    scheduleAutoAdvance(`discussion_tick_${Math.ceil(remainingMs / 400)}`, 'refreshDiscussion', waitMs);
  } else {
    clearAutoAdvance();
  }

  const hostBlocked = isMultiDevice && !state.network.isHost;
  const buttonLabel = hostBlocked
    ? 'Waiting for Host'
    : timerLocked
      ? `Continue in ${Math.ceil(remainingMs / 1000)}s`
      : 'Proceed to Voting';

  const myIntel = current ? (state.intelResults[current.id] || {
    heard: 'Nothing conclusive tonight. Compare stories before voting.',
    saw: null,
    nearby: null
  }) : null;

  return `
    <div class="card">
      <div style="font-size:1.5rem;margin-bottom:12px">💬 Discussion Time</div>
      <p style="color:var(--text-secondary);margin-bottom:14px">
        ${isMultiDevice
          ? 'Use the corner chat to compare clues. Narrator (if human mode) should set mood first, then host advances to voting.'
          : (isSoloMode()
            ? 'Review your intel, then continue into voting.'
            : 'Talk out loud for a few seconds, then continue to private voting turns.')}
      </p>

      ${isSoloMode() && myIntel ? `
        <div class="intel-box" style="text-align:left">
          <div class="intel-header">🔍 Your intel recap:</div>
          ${myIntel.heard ? `<div class="intel-item">👂 ${myIntel.heard}</div>` : ''}
          ${myIntel.saw ? `<div class="intel-item" style="font-weight:600">👁️ ${myIntel.saw}</div>` : ''}
          ${myIntel.nearby ? `<div class="intel-item" style="color:var(--text-secondary)">${myIntel.nearby}</div>` : ''}
          ${myIntel.tracked ? `<div class="intel-item" style="color:var(--text-secondary)">${myIntel.tracked}</div>` : ''}
          ${myIntel.cause ? `<div class="intel-item" style="color:var(--text-secondary)">${myIntel.cause}</div>` : ''}
        </div>
      ` : ''}

      <button class="btn btn-warning btn-lg" onclick="advanceDiscussion()" ${timerLocked || hostBlocked ? 'disabled' : ''}>
        ${buttonLabel}
      </button>
    </div>
  `;
}

function renderVotePhase(current, alivePlayers) {
  if (!current) {
    return `
      <div class="card" style="text-align:center">
        <div style="color:var(--text-secondary);margin-bottom:12px">⚖️ Tallying votes...</div>
        <button class="btn btn-secondary" onclick="processVote()">See Results</button>
      </div>
    `;
  }

  if (current.isBot) {
    scheduleAutoAdvance(`vote_bot_${current.id}_${state.dayNumber}`, 'skipBotVote');
    return `
      <div class="card" style="text-align:center">
        <div style="color:var(--text-secondary);margin-bottom:12px">🤖 ${current.name} is voting ${renderThinkingDots()}</div>
        <div style="color:var(--text-secondary);font-size:0.9rem">Continuing in ~${state.botDelayMs}ms</div>
      </div>
    `;
  }
  clearAutoAdvance();

  if (!current.alive) {
    scheduleAutoAdvance(`vote_dead_${current.id}_${state.dayNumber}`, 'skipDeadVote');
    return `
      <div class="card" style="text-align:center">
        <div style="font-size:1.25rem;margin-bottom:8px">💀 You are dead</div>
        <div style="color:var(--text-secondary);margin-bottom:16px">The dead cannot vote.</div>
        <div style="color:var(--text-secondary);font-size:0.9rem">Continuing ${renderThinkingDots()}</div>
      </div>
    `;
  }

  // In solo mode, skip the turn prompt - go straight to voting
  if (!state.showRole && !isSoloMode()) {
    return `
      <div class="card" style="text-align:center">
        <div style="font-size:1.25rem;margin-bottom:8px">📲 Pass to <strong>${current.name}</strong></div>
        <p style="color:var(--text-secondary);margin-bottom:16px">Cast your vote privately.</p>
        <button class="btn btn-warning btn-lg" onclick="showCurrentRole()">Cast My Vote</button>
      </div>
    `;
  }

  const isMafia = current.role === 'mafia';
  const myIntel = !isMafia ? (state.intelResults[current.id] || {
    heard: 'No strong clue from last night.',
    saw: null,
    nearby: null,
    awareness: null
  }) : null;
  const mafiaNotes = isMafia ? (state.mafiaBriefing[current.id] || []) : [];
  const otherPlayers = alivePlayers.filter(p => p.id !== current.id);

  return `
    <div class="card">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
        <span style="color:${ROLES[current.role]?.color}">${current.role !== 'mafia' ? ROLES[current.role]?.icon : '👤'}</span>
        <span>${current.name}</span>
      </div>

      ${!isMafia ? `
        <div class="intel-box" style="margin-bottom:16px">
          <div class="intel-header" style="font-size:0.8rem">Your intel:</div>
          ${myIntel.heard ? `<div style="font-size:0.9rem">👂 ${myIntel.heard}</div>` : ''}
          ${myIntel.saw ? `<div style="font-size:0.9rem;font-weight:600">👁️ ${myIntel.saw}</div>` : ''}
          ${myIntel.nearby ? `<div style="font-size:0.9rem;color:var(--text-secondary)">${myIntel.nearby}</div>` : ''}
          ${myIntel.awareness ? `<div style="font-size:0.9rem;color:var(--text-secondary)">${myIntel.awareness}</div>` : ''}
          ${myIntel.cause ? `<div style="font-size:0.9rem;color:var(--text-secondary)">${myIntel.cause}</div>` : ''}
        </div>
      ` : `
        <div class="mafia-intel" style="margin-bottom:16px">
          <div class="mafia-intel-header">Mafia tactical notes</div>
          ${mafiaNotes.length === 0
            ? '<div style="font-size:0.9rem;color:#e2e8f0">No special sightings were confirmed this night.</div>'
            : mafiaNotes.map(note => `<div style="font-size:0.88rem;color:#e2e8f0;margin-top:4px">• ${note}</div>`).join('')}
        </div>
      `}

      <div class="section-label">Vote to eliminate:</div>
      <div class="target-grid">
        ${otherPlayers.map(p => `
          <button class="target-btn ${state.selectedVote === p.id ? 'selected' : ''}"
                  style="${state.selectedVote === p.id ? 'background:rgba(202,138,4,0.4);border-color:var(--yellow-accent)' : ''}"
                  onclick="selectVote('${p.id}')">
            ${p.isBot ? '🤖 ' : ''}${p.name}
          </button>
        `).join('')}
      </div>

      <button class="btn btn-warning btn-full btn-lg" onclick="confirmVote()" ${!state.selectedVote ? 'disabled' : ''}>
        Submit Vote
      </button>
    </div>
  `;
}

// -----------------------------------------------------------------------------
// MODALS
// -----------------------------------------------------------------------------

function renderInstructionsModal() {
  const tabs = [
    { id: 'rules', label: '📘 Rules + Gameplay' },
    { id: 'modes', label: '👥 Modes' }
  ];
  const activeTab = tabs.some(tab => tab.id === state.instructionsTab) ? state.instructionsTab : 'rules';

  let content = '';
  if (activeTab === 'rules') {
    content = `
      <h3 style="color:var(--purple-accent);margin-bottom:12px">Read This Full Variant</h3>
      <p><strong>Win goals:</strong> Town wins by eliminating all Mafia. Mafia wins when Mafia living count is greater than Town living count.</p>
      <p style="margin-top:8px"><strong>Exposure:</strong> exposure is your exposure to information and threats. Higher exposure usually gives stronger clues, but it also makes you easier to notice.</p>
      <p style="margin-top:8px;color:var(--text-secondary)">Important social rule: a player saying something does not prove it is true. They may be reporting a real clue, lying as Mafia, or trolling. Use timelines, nearby sightings, and contradictions before voting.</p>
      <div style="margin-top:14px">
        <h4 style="margin-bottom:4px">1) Reveal</h4>
        <p style="color:var(--text-secondary)">Each player privately views their role. Keep this private.</p>
      </div>
      <div style="margin-top:10px">
        <h4 style="margin-bottom:4px">2) Day Planning</h4>
        <p style="color:var(--text-secondary)">Choose a location and action. Actions are ordered low exposure to high exposure. Snoop actions are the easiest way to gather stronger clues.</p>
      </div>
      <div style="margin-top:10px">
        <h4 style="margin-bottom:4px">3) Night</h4>
        <p style="color:var(--text-secondary)">Mafia choose target + attack method. Non-mafia players choose a night stance. Doctors choose who to save in the morning phase.</p>
      </div>
      <div style="margin-top:10px">
        <h4 style="margin-bottom:4px">4) Morning + Discussion + Vote</h4>
        <p style="color:var(--text-secondary)">Morning announces outcomes and cause details. Discussion happens before voting. Then each player votes; tallies are shown.</p>
      </div>
    `;
  } else {
    content = `
      <h3 style="color:var(--purple-accent);margin-bottom:12px">👥 Modes</h3>
      <p><strong>Solo:</strong> one human player + bots.</p>
      <p style="margin-top:8px"><strong>Multiplayer single-device:</strong> pass-and-play on one device. Discussion prompt appears before private vote turns.</p>
      <p style="margin-top:8px"><strong>Multiplayer multi-device:</strong> each device joins the same room. Keep the shared chat visible during discussion, then host advances to voting.</p>
      <p style="margin-top:8px"><strong>Narrator mode:</strong> narrator gets a phase turn at the start of each phase. In single-device, cue is read aloud. In multi-device, cue is posted in chat.</p>
      <p style="margin-top:8px"><strong>Device order:</strong> host can reorder devices and players on each device to control pass/vote flow.</p>
    `;
  }

  return `
    <div class="modal-overlay" onclick="hideInstructions()">
      <div class="instructions-modal" onclick="event.stopPropagation()">
        <div class="instructions-tabs">
          ${tabs.map(t => `
            <button class="instructions-tab ${activeTab === t.id ? 'active' : ''}" onclick="setInstructionsTab('${t.id}')">
              ${t.label}
            </button>
          `).join('')}
        </div>
        <div class="instructions-body">${content}</div>
        <div class="instructions-footer">
          <button class="btn btn-primary btn-full" onclick="hideInstructions()">Got it!</button>
        </div>
      </div>
    </div>
  `;
}

function renderSettingsModal() {
  return `
    <div class="modal-overlay" onclick="hideSettings()">
      <div class="modal-content" style="text-align:left;border-color:var(--border-color)" onclick="event.stopPropagation()">
        <h2 style="margin-bottom:16px">⚙️ Settings</h2>
        <div class="settings-row">
          <span>AI Narrator</span>
          <input type="checkbox" class="checkbox" ${state.settings.aiNarrator ? 'checked' : ''} onchange="toggleSetting('aiNarrator')"/>
        </div>
        <div class="settings-row">
          <span>Bot Chat (AI)</span>
          <input type="checkbox" class="checkbox" ${state.settings.botChat ? 'checked' : ''} onchange="toggleSetting('botChat')"/>
        </div>
        <div class="settings-row">
          <span>Death Animations</span>
          <input type="checkbox" class="checkbox" ${state.settings.deathAnimations ? 'checked' : ''} onchange="toggleSetting('deathAnimations')"/>
        </div>
        <div class="settings-row">
          <span>Sound Effects</span>
          <input type="checkbox" class="checkbox" ${state.settings.sounds ? 'checked' : ''} onchange="toggleSetting('sounds')"/>
        </div>
        <div class="settings-row" style="display:block">
          <div style="margin-bottom:8px">Narrator Mode</div>
          <div style="display:flex;gap:8px">
            <button class="btn btn-small ${state.settings.narratorMode === 'auto' ? 'btn-primary' : 'btn-secondary'}" onclick="setNarratorMode('auto')">Auto</button>
            <button class="btn btn-small ${state.settings.narratorMode === 'human' ? 'btn-primary' : 'btn-secondary'}" onclick="setNarratorMode('human')">Human</button>
          </div>
        </div>
        <div class="settings-row" style="display:block">
          <div style="margin-bottom:8px">Narrator Tone</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            ${['grim', 'cinematic', 'neutral'].map(tone => `
              <button class="btn btn-small ${state.settings.narratorTone === tone ? 'btn-primary' : 'btn-secondary'}"
                      onclick="setNarratorTone('${tone}')">
                ${tone.charAt(0).toUpperCase() + tone.slice(1)}
              </button>
            `).join('')}
          </div>
        </div>
        <div class="settings-row" style="display:block">
          <div style="margin-bottom:8px">Bot Turn Pace: ${state.botDelayMs}ms</div>
          <input type="range" min="700" max="2600" step="100" value="${state.botDelayMs}" oninput="setBotDelay(this.value)" style="width:100%"/>
        </div>
        <button class="btn btn-primary btn-full" style="margin-top:20px" onclick="hideSettings()">Done</button>
      </div>
    </div>
  `;
}

// -----------------------------------------------------------------------------
// EVENT LISTENERS
// -----------------------------------------------------------------------------

function attachEventListeners() {
  const soloInput = document.getElementById('soloNameInput');
  if (soloInput) {
    soloInput.addEventListener('input', e => {
      const hadName = state.soloPlayerName.trim().length > 0;
      state.soloPlayerName = e.target.value;
      const hasName = state.soloPlayerName.trim().length > 0;
      // Update role config when name presence changes (affects player count)
      if (hadName !== hasName) {
        updateRoleConfig();
        render();
      }
    });
    soloInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') e.target.blur();
    });
  }

  const newPlayerInput = document.getElementById('newPlayerInput');
  if (newPlayerInput) {
    newPlayerInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addPlayerFromInput();
      }
    });
  }
}

// Initialize on load
render();
