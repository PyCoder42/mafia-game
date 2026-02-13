// =============================================================================
// MAFIA GAME - Main Game Logic
// =============================================================================

// -----------------------------------------------------------------------------
// CONSTANTS & DATA
// -----------------------------------------------------------------------------

const ROLES = {
  villager: { name: 'Villager', color: '#6b8e23', icon: '👤', description: 'Survive and find the Mafia' },
  mafia: { name: 'Mafia', color: '#8b0000', icon: '🎭', description: 'Eliminate villagers without being caught' },
  doctor: { name: 'Doctor', color: '#4169e1', icon: '💉', description: 'Save one person from death each night' },
  detective: { name: 'Detective', color: '#9932cc', icon: '🔍', description: 'Investigate locations to find clues' }
};

const STORY_TOWN_LABELS = {
  mansion: 'Guest',
  train: 'Passenger',
  island: 'Survivor',
  space: 'Crewmate'
};

const ROLE_PRESETS = [
  { id: 'classic', name: 'Classic', description: 'Balanced default with strong Mafia pressure and steady support roles.', mafia: 20, doctor: 10, detective: 10, color: '#22c55e' },
  { id: 'brutal', name: 'Blood Moon', description: 'Aggressive Mafia numbers with limited support and tense mornings.', mafia: 30, doctor: 8, detective: 6, color: '#f97316' },
  { id: 'chaos', name: 'Crossfire', description: 'Volatile nights where loud strikes and mixed clues create chaos.', mafia: 28, doctor: 14, detective: 8, color: '#ef4444' },
  { id: 'detective', name: 'Forensics', description: 'Investigation-heavy setup with stronger detective presence.', mafia: 18, doctor: 8, detective: 26, color: '#a855f7' }
];

const KILL_METHODS = [
  {
    id: 'silent_blade',
    name: 'Silent Blade',
    desc: 'Low disturbance. Harder for witnesses to spot, slightly easier to stabilize.',
    noise: 0.25,
    cureDifficulty: 0.72,
    deathLabel: 'deep stab wounds',
    evidenceHint: 'a sharp metallic scrape'
  },
  {
    id: 'stranglehold',
    name: 'Stranglehold',
    desc: 'Moderate disturbance. Balanced visibility and survivability.',
    noise: 0.5,
    cureDifficulty: 0.66,
    deathLabel: 'airway trauma',
    evidenceHint: 'a muffled struggle'
  },
  {
    id: 'toxin',
    name: 'Toxin Dose',
    desc: 'Very low disturbance. Hard to witness directly, easier to miss in real time.',
    noise: 0.18,
    cureDifficulty: 0.58,
    deathLabel: 'acute toxin exposure',
    evidenceHint: 'chemical residue'
  },
  {
    id: 'incendiary',
    name: 'Incendiary Burst',
    desc: 'Extreme disturbance. Easier for others to notice, hardest to survive.',
    noise: 0.92,
    cureDifficulty: 0.86,
    deathLabel: 'severe burn trauma',
    evidenceHint: 'a sudden flash and heat'
  }
];

const STORY_PRESETS = [
  {
    id: 'mansion',
    name: 'Blackwood Estate',
    intro: 'Thunder rolls over the moors...',
    mood: 'A Victorian mansion shrouded in secrets.',
    setting: 'Old guest corridors feed into a foyer, veranda, parlor, kitchen routes, and deep cellar stairs where sound travels strangely.',
    narrationPack: 'gothic'
  },
  {
    id: 'train',
    name: 'Midnight Express',
    intro: 'The train plunges through a blizzard...',
    mood: 'A luxury train with secrets.',
    setting: 'Cabins, linked corridors, lounge traffic, service passages, and exposed exterior platforms create shifting lines of sight.',
    narrationPack: 'noir'
  },
  {
    id: 'island',
    name: 'Coral Bay Resort',
    intro: 'Paradise turns to prison...',
    mood: 'A tropical resort turned nightmare.',
    setting: 'Bungalow rows and porches overlook the beach while trails split toward the dock, clinic, jungle edge, and lighthouse ridge.',
    narrationPack: 'tropical_horror'
  },
  {
    id: 'space',
    name: 'Station Prometheus',
    intro: 'Life support failing...',
    mood: 'A research station at the edge of space.',
    setting: 'Sleep pods and surveillance routes connect through a central hub to medbay, cargo logistics, reactor tunnels, the observation ring, and the airlock.',
    narrationPack: 'sci_fi'
  }
];

const BOT_NAMES = ['Alex', 'Jordan', 'Casey', 'Morgan', 'Riley', 'Quinn', 'Avery', 'Parker', 'Sage', 'Blake', 'Drew', 'Reese'];

const NIGHT_AWARENESS_OPTIONS = [
  {
    id: 'low_profile',
    name: 'Keep a low profile',
    desc: 'Stay quiet and reduce the chance of getting noticed.',
    exposureMod: -0.1
  },
  {
    id: 'listen_posts',
    name: 'Listen at nearby routes',
    desc: 'Moderate awareness with balanced safety and clue quality.',
    exposureMod: 0
  },
  {
    id: 'active_watch',
    name: 'Actively watch movement',
    desc: 'Higher exposure but stronger chance to catch useful clues.',
    exposureMod: 0.12
  }
];

const EXPOSURE_BY_NODE_TYPE = {
  private_cluster: 0.2,
  vantage: 0.38,
  investigation: 0.62,
  shared: 0.48,
  isolated: 0.78,
  transit: 0.58,
  utility: 0.45
};

const NARRATION_PRESETS = window.NARRATION_PRESETS || {
  gothic: {
    intro: 'Stormlight cuts across old stone walls. Every corridor carries a rumor.',
    day: 'Dust hangs in the light. Choose where to stand before the house chooses for you.',
    night: 'Floorboards complain under unseen weight. Someone is hunting.',
    morning: 'A gray dawn reaches the estate. The truth did not sleep.',
    discussion: 'Voices gather in anxious circles. Compare details before panic wins.',
    vote: 'Every raised hand feels irreversible.'
  },
  noir: {
    intro: 'The train slices through snow and silence. Compartments hide uneasy faces.',
    day: 'Steel rattles beneath your feet. Exposure buys clues, but costs safety.',
    night: 'Between car links and dark glass, the predator moves.',
    morning: 'Cold morning light floods the corridor. Someone did not make it.',
    discussion: 'Everyone has a story. Line them up and find the one that bends.',
    vote: 'A verdict on rails. No one can step off.'
  },
  tropical_horror: {
    intro: 'Warm wind carries salt and fear. Paradise has already curdled.',
    day: 'Waves hide whispers. Higher exposure means bigger clues and bigger danger.',
    night: 'Palm shadows stretch over the sand. The hunter knows the paths.',
    morning: 'Sunrise reveals disturbed footprints and hard truths.',
    discussion: 'Gather under open sky and test every timeline against the map.',
    vote: 'The group chooses who faces the next dawn.'
  },
  sci_fi: {
    intro: 'Station Prometheus hums at the edge of nowhere. Trust is oxygen.',
    day: 'Route choices echo through bulkheads. Every move can uncover clues and invite danger.',
    night: 'Warning lights dim. Mechanical noise masks deliberate footsteps.',
    morning: 'Systems stabilize at shift change, but the crew does not.',
    discussion: 'Cross-check logs, locations, and timing before the vote window closes.',
    vote: 'One name is condemned to keep the station alive.'
  },
  default: {
    intro: 'Tension settles over the map. Nobody is safe.',
    day: 'Choose a location and commit to an action.',
    night: 'Night actions resolve in secret.',
    morning: 'Morning reports are in.',
    discussion: 'Compare intel before voting.',
    vote: 'Vote carefully.'
  }
};

const JOIN_CODE_PARAM = new URLSearchParams(window.location.search).get('join');
const DEFAULT_REALTIME_URL = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.hostname || 'localhost'}:8765`;

const realtime = {
  socket: null,
  applyingRemoteState: false,
  replayingRemoteAction: false,
  lastBroadcastPayload: ''
};

function clamp01(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}

function toLegacyRisk(exposure) {
  return Math.round(clamp01(exposure) * 5);
}

function inferActionKind(action) {
  const text = `${action.id} ${action.name}`.toLowerCase();
  if (/snoop|search|observe|peek|monitor|records|follow|scan|track/.test(text)) return 'snoop';
  if (/linger|smoke|watch|porch|balcony|bar|drink|listen/.test(text)) return 'linger';
  if (/lock|seal|hide/.test(text)) return 'hide';
  return 'routine';
}

function buildAction(id, name, desc, exposure, options = {}) {
  const normalizedExposure = clamp01(exposure);
  const kind = options.kind || inferActionKind({ id, name });
  return {
    id,
    name,
    desc,
    kind,
    exposure: normalizedExposure,
    intel: normalizedExposure,
    risk: toLegacyRisk(normalizedExposure),
    requiresTarget: Boolean(options.requiresTarget),
    detectivePreferred: Boolean(options.detectivePreferred ?? (kind === 'snoop' || kind === 'linger')),
    mafiaOnly: Boolean(options.mafiaOnly)
  };
}

function getNodeExposure(node) {
  return clamp01(node.exposure ?? EXPOSURE_BY_NODE_TYPE[node.type] ?? 0.5);
}

function buildLocationActions(node, baseExposure) {
  const high = clamp01(baseExposure + 0.12);
  const med = clamp01(baseExposure);
  const low = clamp01(baseExposure - 0.14);

  if (node.type === 'private_cluster') {
    return [
      buildAction('sleep_lock', '🛏️ Sleep and lock', 'Stay in their bedroom with doors secured.', low, { kind: 'hide' }),
      buildAction('sleep_unlocked', '🛏️ Sleep without locking', 'Rest lightly and keep a quick exit route.', med, { kind: 'routine' }),
      buildAction('porch_watch', '🪟 Porch watch', 'Step out near the porch and watch nearby routes.', clamp01(baseExposure + 0.08), { kind: 'linger' })
    ];
  }

  if (node.type === 'investigation') {
    return [
      buildAction('snoop_routes', '🕵️ Snoop routes', 'Track movement patterns across connected rooms.', high, { kind: 'snoop', detectivePreferred: true }),
      buildAction('snoop_room', '🕵️ Snoop someone\'s room', 'Choose one person and shadow their bedroom zone.', clamp01(high + 0.04), { kind: 'snoop', requiresTarget: true, detectivePreferred: true }),
      buildAction('linger_logs', '📒 Linger over clues', 'Stay alert and catalog suspicious details.', med, { kind: 'linger', detectivePreferred: true })
    ];
  }

  if (node.type === 'vantage') {
    return [
      buildAction('overwatch', '👀 Watch from cover', 'Use elevation or angle for better sightlines.', med, { kind: 'linger' }),
      buildAction('smoke_break', '🚬 Smoke and listen', 'Blend in while hearing nearby conversations.', clamp01(med + 0.06), { kind: 'linger' }),
      buildAction('line_of_sight', '🎯 Focus one window', 'Watch one room route for precise movement.', clamp01(med + 0.08), { kind: 'snoop', requiresTarget: true, detectivePreferred: true })
    ];
  }

  if (node.type === 'isolated') {
    return [
      buildAction('deep_search', '🔦 Deep search', 'Push deeper for strong clues at high exposure.', high, { kind: 'snoop' }),
      buildAction('hide_wait', '🫥 Hide and wait', 'Stay concealed and read movement around you.', clamp01(med + 0.03), { kind: 'hide' }),
      buildAction('quick_pass', '🚶 Quick pass', 'Grab what you can and leave fast.', low, { kind: 'routine' })
    ];
  }

  if (node.type === 'transit') {
    return [
      buildAction('patrol', '🚶 Patrol route', 'Walk the route and log who crosses your path.', med, { kind: 'linger' }),
      buildAction('tail_target', '👣 Tail someone', 'Follow one person between nearby nodes.', high, { kind: 'snoop', requiresTarget: true, detectivePreferred: true }),
      buildAction('duck_corner', '🧱 Duck into cover', 'Keep exposure lower while watching movement.', low, { kind: 'hide' })
    ];
  }

  if (node.type === 'utility') {
    return [
      buildAction('check_systems', '🖥️ Check systems', 'Use logs and records to spot anomalies.', clamp01(med + 0.08), { kind: 'snoop', detectivePreferred: true }),
      buildAction('standby', '🔧 Stay on standby', 'Hold position and keep nearby awareness.', med, { kind: 'routine' }),
      buildAction('quiet_corner', '🪤 Quiet corner', 'Wait where you can hear but stay unseen.', low, { kind: 'hide' })
    ];
  }

  return [
    buildAction('mingle', '🗣️ Mingle', 'Blend with traffic and gather baseline clues.', med, { kind: 'routine' }),
    buildAction('eavesdrop', '👂 Eavesdrop', 'Risk extra exposure for better audio clues.', high, { kind: 'snoop' }),
    buildAction('hang_back', '🧍 Hang back', 'Stay near exits and watch who leaves.', low, { kind: 'linger' })
  ];
}

function buildMafiaActions(node, locationExposure) {
  const low = clamp01(locationExposure - 0.12);
  const med = clamp01(locationExposure - 0.02);
  const high = clamp01(locationExposure + 0.14);

  if (node.type === 'private_cluster') {
    return [
      buildAction('plant_alibi', 'Plant an alibi', 'Move quietly through bedroom routes to avoid attention.', low, { mafiaOnly: true, kind: 'hide' }),
      buildAction('doorway_watch', 'Watch doorways', 'Track exits from bedroom lanes before selecting a target.', med, { mafiaOnly: true, kind: 'linger' }),
      buildAction('ambush_window', 'Ambush window', 'Force a close-range opening near private rooms.', high, { mafiaOnly: true, kind: 'snoop' })
    ];
  }

  if (node.id === 'cargo_hold') {
    return [
      buildAction('crate_shadow', 'Crate shadow', 'Use stacked cargo for concealed movement.', low, { mafiaOnly: true, kind: 'hide' }),
      buildAction('manifest_scan', 'Manifest scan', 'Scan routes and identify isolated targets.', med, { mafiaOnly: true, kind: 'linger' }),
      buildAction('freight_crush', 'Freight crush route', 'Risk a violent route that leaves obvious traces.', high, { mafiaOnly: true, kind: 'snoop' })
    ];
  }

  if (node.id === 'reactor_tunnel') {
    return [
      buildAction('coolant_listen', 'Coolant line listen', 'Use machinery noise to mask movement.', low, { mafiaOnly: true, kind: 'hide' }),
      buildAction('power_flicker', 'Trigger power flicker', 'Create confusion and move through blind spots.', med, { mafiaOnly: true, kind: 'linger' }),
      buildAction('containment_breach', 'Containment feint', 'High-risk pressure route with severe fallout.', high, { mafiaOnly: true, kind: 'snoop' })
    ];
  }

  if (node.type === 'investigation') {
    return [
      buildAction('erase_traces', 'Erase traces', 'Clean key clues before sunrise.', low, { mafiaOnly: true, kind: 'hide' }),
      buildAction('false_lead', 'Plant false lead', 'Leave believable but misleading intel.', med, { mafiaOnly: true, kind: 'linger' }),
      buildAction('monitor_snoopers', 'Monitor snoopers', 'Track who is gathering information tonight.', high, { mafiaOnly: true, kind: 'snoop' })
    ];
  }

  if (node.type === 'vantage') {
    return [
      buildAction('stay_shaded', 'Stay shaded', 'Hold a low profile and watch crossings.', low, { mafiaOnly: true, kind: 'hide' }),
      buildAction('sightline_track', 'Track sightlines', 'Study movement and likely escape paths.', med, { mafiaOnly: true, kind: 'linger' }),
      buildAction('sniper_window', 'High-risk strike window', 'Take a bold route that risks exposure.', high, { mafiaOnly: true, kind: 'snoop' })
    ];
  }

  if (node.type === 'transit') {
    return [
      buildAction('blend_route', 'Blend route', 'Merge with traffic and avoid attention.', low, { mafiaOnly: true, kind: 'hide' }),
      buildAction('crosspath_hunt', 'Crosspath hunt', 'Follow movement between connected nodes.', med, { mafiaOnly: true, kind: 'linger' }),
      buildAction('rail_cutoff', 'Route cutoff', 'Pin targets between exits at higher risk.', high, { mafiaOnly: true, kind: 'snoop' })
    ];
  }

  return [
    buildAction('quiet_scout', 'Quiet scout', 'Track movement with minimal risk.', low, { mafiaOnly: true, kind: 'hide' }),
    buildAction('pressure_route', 'Pressure route', 'Push the area to flush out vulnerable targets.', med, { mafiaOnly: true, kind: 'linger' }),
    buildAction('commit_strike', 'Commit strike route', 'High-risk route built for fast elimination.', high, { mafiaOnly: true, kind: 'snoop' })
  ];
}

function normalizeStoryData() {
  const geoData = window.GEOGRAPHY_DATA || {};

  STORY_PRESETS.forEach(story => {
    const graph = geoData[story.id];
    const graphNodes = Array.isArray(graph?.nodes) ? graph.nodes : [];

    story.locations = graphNodes.map(node => {
      const exposure = getNodeExposure(node);
      const actions = buildLocationActions(node, exposure);
      const mafiaActions = buildMafiaActions(node, exposure);
      const isBedroomZone = node.id === graph?.bedroomHubNode || node.type === 'private_cluster';
      const isSnoopZone = node.id === graph?.detectiveSnoopNode || node.type === 'investigation';

      return {
        id: node.id,
        name: node.name,
        nodeType: node.type,
        tags: Array.isArray(node.tags) ? node.tags : [],
        exposure,
        risk: toLegacyRisk(exposure),
        intel: exposure,
        privateRoom: Boolean(isBedroomZone),
        isBedroomZone: Boolean(isBedroomZone),
        isSnoopZone: Boolean(isSnoopZone),
        actions,
        mafiaActions
      };
    });

    story.mapGraph = graph || { nodes: [], edges: [], bedroomHubNode: null, detectiveSnoopNode: null };
  });
}

normalizeStoryData();

// -----------------------------------------------------------------------------
// SOUND EFFECTS (Web Audio API)
// -----------------------------------------------------------------------------

const SoundEffects = {
  audioContext: null,

  init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    // Resume context if suspended (browser autoplay policy)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  },

  isEnabled() {
    return state.settings.sounds;
  },

  // Simple click sound - short high-pitched blip
  playClick() {
    if (!this.isEnabled()) return;
    this.init();

    const ctx = this.audioContext;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.05);

    gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.05);
  },

  // Dramatic death sound - descending ominous tone
  playDeath() {
    if (!this.isEnabled()) return;
    this.init();

    const ctx = this.audioContext;

    // Low rumble
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(150, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.8);
    gain1.gain.setValueAtTime(0.3, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.8);

    // Dissonant overlay
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(200, ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.6);
    gain2.gain.setValueAtTime(0.15, ctx.currentTime);
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
    osc2.start(ctx.currentTime);
    osc2.stop(ctx.currentTime + 0.6);
  },

  // Victory sound - ascending triumphant fanfare
  playVictory() {
    if (!this.isEnabled()) return;
    this.init();

    const ctx = this.audioContext;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 - major chord arpeggio

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      const startTime = ctx.currentTime + i * 0.12;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);

      osc.start(startTime);
      osc.stop(startTime + 0.4);
    });
  },

  // Defeat sound - descending minor chord
  playDefeat() {
    if (!this.isEnabled()) return;
    this.init();

    const ctx = this.audioContext;
    const notes = [440, 349.23, 293.66, 220]; // A4, F4, D4, A3 - descending minor

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      const startTime = ctx.currentTime + i * 0.15;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.12, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5);

      osc.start(startTime);
      osc.stop(startTime + 0.5);
    });
  }
};

// -----------------------------------------------------------------------------
// GAME STATE
// -----------------------------------------------------------------------------

const state = {
  screen: 'setup',
  gameCode: (JOIN_CODE_PARAM || Math.random().toString(36).substring(2, 8)).toUpperCase(),
  joinCode: JOIN_CODE_PARAM ? JOIN_CODE_PARAM.toUpperCase() : '',
  multiplayerMode: JOIN_CODE_PARAM ? 'realtime' : 'passplay',
  realtimePanelMode: JOIN_CODE_PARAM ? 'join' : 'host',
  network: {
    connected: false,
    status: 'offline',
    isHost: !JOIN_CODE_PARAM,
    hostDeviceId: null,
    deviceId: `dev_${Math.random().toString(36).slice(2, 8)}`,
    deviceName: 'Device 1',
    devices: [],
    deviceOrder: []
  },
  soloPlayerName: '',
  settings: {
    aiNarrator: true,
    narratorMode: 'auto',
    narratorTone: 'grim',
    botChat: true,
    deathAnimations: true,
    sounds: true
  },
  players: [],
  bots: [],
  selectedPreset: ROLE_PRESETS[0],
  roleConfig: { mafia: 1, doctor: 1, detective: 0, villager: 0 },
  selectedStory: STORY_PRESETS[0],
  gamePhase: 'reveal',
  dayNumber: 1,
  narrative: '',
  currentPlayerIndex: 0,
  showRole: false,
  nightPlans: {},
  snoopAssignments: {},
  snoopersByTarget: {},
  mafiaSnooperIntel: {},
  mafiaBriefing: {},
  nightAwareness: {},
  nightAttackCounts: {},
  nightAttackMethod: null,
  mafiaVisionMode: {},
  nightTarget: null,
  mafiaVotes: {},
  mafiaKillMethods: {},
  doctorSave: null,
  votes: {},
  intelResults: {},
  chatMessages: [],
  chatDraft: '',
  chatSenderId: null,
  discussionUnlockAt: 0,
  lastNarratorPromptKey: null,
  pendingNarratorPhase: null,
  narrationLog: [],
  lastBotChatDay: null,
  botChatTimerIds: [],
  deathAnimation: null,
  winner: null,
  winReason: null,
  pendingWin: null,
  finalDeath: null,
  announcement: null,
  selectedLocation: null,
  selectedAction: null,
  selectedActionTarget: null,
  selectedTarget: null,
  selectedKillMethod: null,
  selectedAwareness: null,
  selectedSave: null,
  selectedVote: null,
  showInstructions: false,
  showSettings: false,
  showMap: false,
  instructionsTab: 'rules',
  nameError: '',
  autoAdvance: { key: null, timerId: null },
  botDelayMs: 1200
};

// -----------------------------------------------------------------------------
// UTILITY FUNCTIONS
// -----------------------------------------------------------------------------

function getAllPlayers() {
  // In solo lobby, include the solo player name as a player
  if (state.screen === 'solo_lobby' && state.soloPlayerName.trim() && state.players.length === 0) {
    return [{ name: state.soloPlayerName.trim(), isBot: false }, ...state.bots];
  }
  return [...state.players, ...state.bots];
}

function getAlivePlayers() {
  return getAllPlayers().filter(p => p.alive);
}

function getCurrentPlayer() {
  return getAllPlayers()[state.currentPlayerIndex];
}

function getRoleDisplayName(role, story = state.selectedStory) {
  if (role === 'villager') {
    return STORY_TOWN_LABELS[story?.id] || ROLES.villager.name;
  }
  return ROLES[role]?.name || role;
}

function getLocationById(locationId) {
  return state.selectedStory.locations.find(location => location.id === locationId);
}

function getAvailableActionsForPlayer(player, location) {
  if (!player || !location) return [];
  if (player.role === 'mafia') return location.mafiaActions || [];

  const actions = location.actions || [];
  if (player.role !== 'detective') return actions;

  const detectiveActions = actions.filter(action => action.detectivePreferred);
  return detectiveActions.length > 0 ? detectiveActions : actions;
}

function getStoryGraph(story = state.selectedStory) {
  return story?.mapGraph || { nodes: [], edges: [], bedroomHubNode: null, detectiveSnoopNode: null };
}

function buildGraphAdjacency(story = state.selectedStory) {
  const graph = getStoryGraph(story);
  const adjacency = {};
  (graph.nodes || []).forEach(node => {
    adjacency[node.id] = [];
  });

  (graph.edges || []).forEach(edge => {
    if (!adjacency[edge.from]) adjacency[edge.from] = [];
    if (!adjacency[edge.to]) adjacency[edge.to] = [];
    adjacency[edge.from].push({ id: edge.to, distance: edge.distance || 1, hearing: edge.hearing || 0, sight: edge.sight || 0 });
    adjacency[edge.to].push({ id: edge.from, distance: edge.distance || 1, hearing: edge.hearing || 0, sight: edge.sight || 0 });
  });
  return adjacency;
}

function getGraphDistance(fromNodeId, toNodeId, story = state.selectedStory) {
  if (!fromNodeId || !toNodeId) return Infinity;
  if (fromNodeId === toNodeId) return 0;

  const adjacency = buildGraphAdjacency(story);
  const visited = new Set();
  const queue = [{ id: fromNodeId, dist: 0 }];

  while (queue.length > 0) {
    queue.sort((a, b) => a.dist - b.dist);
    const current = queue.shift();
    if (!current || visited.has(current.id)) continue;
    visited.add(current.id);
    if (current.id === toNodeId) return current.dist;

    (adjacency[current.id] || []).forEach(next => {
      if (!visited.has(next.id)) {
        queue.push({
          id: next.id,
          dist: current.dist + Math.max(1, Number(next.distance) || 1)
        });
      }
    });
  }

  return Infinity;
}

function getPlanNodeId(plan, player = null) {
  if (!plan?.location) return null;
  const location = getLocationById(plan.location);
  if (!location) return plan.location;
  if (location.privateRoom) {
    const targetRoomId = plan.actionTarget || player?.id;
    return `${location.id}:${targetRoomId || 'shared'}`;
  }
  return location.id;
}

function resolveNodeBaseId(nodeId) {
  if (!nodeId) return null;
  return String(nodeId).split(':')[0];
}

function getPlanExposure(player, plan) {
  if (!player || !plan?.action) return 0;
  const location = getLocationById(plan.location);
  const locationExposure = clamp01(location?.exposure ?? 0.4);
  const actionExposure = clamp01(plan.action.exposure ?? locationExposure);
  let exposure = clamp01((locationExposure * 0.55) + (actionExposure * 0.45));

  if (plan.action.id === 'sleep_lock') exposure = clamp01(exposure - 0.14);
  if (plan.action.id === 'sleep_unlocked') exposure = clamp01(exposure - 0.03);
  if (plan.action.id === 'porch_watch') exposure = clamp01(exposure + 0.08);

  if (player.role === 'detective') exposure = clamp01(exposure - 0.18);

  return exposure;
}

function getPlanIntelChance(player, plan) {
  const exposure = getPlanExposure(player, plan);
  let chance = clamp01(0.2 + (exposure * 0.7));
  if (player.role === 'detective') chance = clamp01(chance + 0.14);
  if (plan?.action?.kind === 'snoop') chance = clamp01(chance + 0.08);
  if (plan?.action?.kind === 'hide') chance = clamp01(chance - 0.06);
  return chance;
}

function getNightActors(alivePlayers = getAlivePlayers()) {
  const livingHumans = alivePlayers.filter(player => player.alive && !player.isBot);
  const mafia = livingHumans.filter(player => player.role === 'mafia');
  const detectives = livingHumans.filter(player => player.role === 'detective');
  const doctors = livingHumans.filter(player => player.role === 'doctor');
  const villagers = livingHumans.filter(player => player.role === 'villager');
  return [...mafia, ...detectives, ...villagers, ...doctors];
}

function getKillMethodById(methodId) {
  return KILL_METHODS.find(method => method.id === methodId) || KILL_METHODS[0];
}

function getAliveHumans() {
  return getAlivePlayers().filter(player => !player.isBot);
}

function findFirstAliveHumanIndex() {
  return getAllPlayers().findIndex(player => player.alive && !player.isBot);
}

function getNextAliveHumanIndex(startIndex) {
  const players = getAllPlayers();
  for (let i = startIndex + 1; i < players.length; i++) {
    if (players[i].alive && !players[i].isBot) return i;
  }
  return -1;
}

function withBotDelay(callback, delay = state.botDelayMs) {
  setTimeout(callback, delay);
}

function randomChoice(items) {
  if (!items || items.length === 0) return null;
  return items[Math.floor(Math.random() * items.length)];
}

function addNarrationLog(text, phase = state.gamePhase) {
  if (!text) return;
  state.narrationLog.push({
    id: `nar_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    day: state.dayNumber,
    phase,
    text,
    at: new Date().toISOString()
  });
  if (state.narrationLog.length > 10) {
    state.narrationLog = state.narrationLog.slice(-10);
  }
}

function getNarratorPhasePrompt(phase = state.gamePhase) {
  const prompts = {
    reveal: 'Narrator turn: set the scene and remind players that role reveals stay private.',
    day: 'Narrator turn: warn players that exposure brings both information and danger.',
    night: 'Narrator turn: describe the night atmosphere without revealing secret role actions.',
    morning_doctor: 'Narrator turn: frame the aftermath before doctors lock in a save attempt.',
    announcement: 'Narrator turn: deliver the public night outcome before discussion begins.',
    discussion: 'Narrator turn: open discussion and ask players to compare timelines.',
    vote: 'Narrator turn: call for calm voting and evidence-based choices.',
    vote_announcement: 'Narrator turn: narrate the vote result and consequences.',
    gameover: 'Narrator turn: close the story and summarize the final chain of events.'
  };
  return prompts[phase] || 'Narrator turn: set the mood for this phase.';
}

function shouldUseNarratorTurn(phase = state.gamePhase) {
  if (state.settings.narratorMode !== 'human') return false;
  if (state.screen !== 'game') return false;
  return phase !== 'gameover';
}

function primeNarratorTurn(phase = state.gamePhase) {
  state.pendingNarratorPhase = shouldUseNarratorTurn(phase) ? phase : null;
}

function clearNarratorTurn() {
  state.pendingNarratorPhase = null;
}

function narratorTurnIsActive(phase = state.gamePhase) {
  return shouldUseNarratorTurn(phase) && state.pendingNarratorPhase === phase;
}

function queueNarratorChatPrompt(phase = state.gamePhase) {
  if (state.settings.narratorMode !== 'human') return;
  if (!(isRealtimeMode() && (state.network.devices || []).length > 1)) return;
  const key = `${state.dayNumber}:${phase}`;
  if (state.lastNarratorPromptKey === key) return;
  state.lastNarratorPromptKey = key;

  state.chatMessages.push({
    id: `msg_narrator_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    day: state.dayNumber,
    senderId: 'narrator',
    senderName: 'Narrator',
    text: getNarratorPhasePrompt(phase),
    at: new Date().toISOString()
  });
}

function getDeviceNameById(deviceId) {
  if (!deviceId) return state.network.deviceName || 'Host device';
  const found = (state.network.devices || []).find(device => device.deviceId === deviceId);
  if (found?.deviceName) return found.deviceName;
  if (deviceId === state.network.deviceId) return state.network.deviceName || 'This device';
  return 'Device';
}

function refreshPlayerDeviceNames() {
  state.players = state.players.map(player => ({
    ...player,
    deviceName: getDeviceNameById(player.deviceId)
  }));
}

function clearBotChatTimers() {
  state.botChatTimerIds.forEach(timerId => clearTimeout(timerId));
  state.botChatTimerIds = [];
}

function setDeathAnimation(victimName, roleName, phase) {
  if (!state.settings.deathAnimations || !victimName) {
    state.deathAnimation = null;
    return;
  }
  state.deathAnimation = {
    id: `death_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    victimName,
    roleName,
    phase
  };
}

function clearDeathAnimation() {
  state.deathAnimation = null;
}

function sanitizeRoomCode(code) {
  const cleaned = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!cleaned) return state.gameCode;
  return cleaned.slice(0, 8);
}

function isDefaultDeviceLabel(name) {
  return /^Device \d+$/i.test(String(name || '').trim());
}

function extractDeviceNumber(name) {
  const match = String(name || '').trim().match(/^Device (\d+)$/i);
  return match ? Number(match[1]) : null;
}

function getNextDeviceNumber(devices = state.network.devices || []) {
  const used = new Set();
  devices.forEach(device => {
    const n = extractDeviceNumber(device.deviceName);
    if (Number.isFinite(n)) used.add(n);
  });
  const selfN = extractDeviceNumber(state.network.deviceName);
  if (Number.isFinite(selfN)) used.add(selfN);
  let candidate = 1;
  while (used.has(candidate)) candidate++;
  return candidate;
}

function maybeAutoAssignDeviceName(devices = state.network.devices || []) {
  if (!isDefaultDeviceLabel(state.network.deviceName)) return;
  const next = getNextDeviceNumber(devices);
  state.network.deviceName = `Device ${next}`;
}

function getJoinPortalBasePath() {
  const pathname = window.location.pathname || '/';
  if (pathname.endsWith('/join.html')) return pathname;
  if (pathname.endsWith('/index.html')) return pathname.replace(/index\.html$/, 'join.html');
  if (pathname.endsWith('/')) return `${pathname}join.html`;
  const slash = pathname.lastIndexOf('/');
  if (slash === -1) return '/join.html';
  return `${pathname.slice(0, slash + 1)}join.html`;
}

function getJoinPortalUrl() {
  const protocol = window.location.protocol;
  const path = getJoinPortalBasePath();
  if (protocol === 'http:' || protocol === 'https:') {
    return `${window.location.origin}${path}`;
  }
  if (protocol === 'file:') {
    const current = window.location.href.split('?')[0];
    if (current.endsWith('/join.html')) return current;
    return current.endsWith('/index.html')
      ? current.replace(/index\.html$/, 'join.html')
      : `${current.substring(0, current.lastIndexOf('/') + 1)}join.html`;
  }
  return '';
}

function getShareJoinUrl(code = state.gameCode) {
  const joinPortal = getJoinPortalUrl();
  if (!joinPortal) return '';
  const roomCode = sanitizeRoomCode(code);
  if (!roomCode) return joinPortal;
  return `${joinPortal}?join=${roomCode}`;
}

function getRelayCandidates() {
  const protocol = window.location.protocol;
  const wsProto = protocol === 'https:' ? 'wss' : 'ws';
  const hostname = window.location.hostname || 'localhost';
  const candidates = new Set();
  candidates.add(`${wsProto}://${hostname}:8765`);
  if (hostname === 'localhost') candidates.add(`${wsProto}://127.0.0.1:8765`);
  if (hostname === '127.0.0.1') candidates.add(`${wsProto}://localhost:8765`);
  if (protocol === 'file:') {
    candidates.add('ws://localhost:8765');
    candidates.add('ws://127.0.0.1:8765');
  }
  return [...candidates];
}

function getConnectionGuideText() {
  const protocol = window.location.protocol;
  if (protocol === 'file:') {
    return 'Open this same folder on each device, launch join.html, and enter the room code.';
  }
  if (/^(localhost|127\.|192\.168\.|10\.)/.test(window.location.hostname || '')) {
    return 'Open this site URL on each device in the same network, then join with the room code.';
  }
  return 'Share the portal URL or direct hotlink and join with the same room code.';
}

function isRealtimeMode() {
  return state.multiplayerMode === 'realtime';
}

function isRealtimeClient() {
  return isRealtimeMode() && state.network.connected && !state.network.isHost;
}

function sendRealtimeMessage(payload) {
  if (!realtime.socket || realtime.socket.readyState !== WebSocket.OPEN) return false;
  try {
    realtime.socket.send(JSON.stringify(payload));
    return true;
  } catch (error) {
    console.error('Realtime send failed:', error);
    return false;
  }
}

function buildRealtimeStateSnapshot() {
  const clone = JSON.parse(JSON.stringify(state));
  clone._networkDeviceOrder = [...(state.network.deviceOrder || [])];
  delete clone.network;
  return clone;
}

function applyRealtimeStateSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') return;
  realtime.applyingRemoteState = true;
  try {
    const keepNetwork = state.network;
    const keepJoinCode = state.joinCode;
    const keepMode = state.multiplayerMode;
    const keepInstructions = state.showInstructions;
    const keepSettings = state.showSettings;
    const incomingDeviceOrder = Array.isArray(snapshot._networkDeviceOrder) ? [...snapshot._networkDeviceOrder] : null;

    Object.keys(snapshot).forEach(key => {
      if (key === 'network') return;
      if (key === '_networkDeviceOrder') return;
      state[key] = snapshot[key];
    });

    state.network = keepNetwork;
    if (incomingDeviceOrder) {
      state.network.deviceOrder = incomingDeviceOrder;
    }
    state.joinCode = keepJoinCode || state.gameCode;
    state.multiplayerMode = keepMode;
    state.showInstructions = keepInstructions;
    state.showSettings = keepSettings;
  } finally {
    realtime.applyingRemoteState = false;
  }
}

function reconcileDeviceOrder(devices) {
  const incomingIds = (devices || []).map(device => device.deviceId);
  const existing = state.network.deviceOrder || [];
  const kept = existing.filter(deviceId => incomingIds.includes(deviceId));
  const missing = incomingIds.filter(deviceId => !kept.includes(deviceId));
  state.network.deviceOrder = [...kept, ...missing];
}

function updateRealtimePresence(devices, hostDeviceId = null) {
  state.network.devices = Array.isArray(devices) ? devices : [];
  maybeAutoAssignDeviceName(state.network.devices);
  const selfDevice = state.network.devices.find(device => device.deviceId === state.network.deviceId);
  if (selfDevice?.deviceName) state.network.deviceName = selfDevice.deviceName;
  reconcileDeviceOrder(state.network.devices);
  state.network.hostDeviceId = hostDeviceId || null;
  if (hostDeviceId) state.network.isHost = hostDeviceId === state.network.deviceId;
  refreshPlayerDeviceNames();
}

function broadcastRealtimeState(force = false) {
  if (!isRealtimeMode()) return;
  if (!state.network.connected || !state.network.isHost) return;
  if (realtime.applyingRemoteState) return;

  const snapshot = buildRealtimeStateSnapshot();
  const serialized = JSON.stringify(snapshot);
  if (!force && serialized === realtime.lastBroadcastPayload) return;
  realtime.lastBroadcastPayload = serialized;

  sendRealtimeMessage({
    type: 'state_update',
    code: state.gameCode,
    state: snapshot
  });
}

function disconnectRealtimeSession({ keepMode = true } = {}) {
  clearBotChatTimers();
  if (realtime.socket) {
    try {
      realtime.socket.close();
    } catch (error) {
      console.error('Realtime close failed:', error);
    }
  }
  realtime.socket = null;
  realtime.lastBroadcastPayload = '';
  state.network.connected = false;
  state.network.status = 'offline';
  state.network.relayUrl = null;
  state.network.devices = [];
  state.network.deviceOrder = [];
  state.network.hostDeviceId = null;
  if (!keepMode) state.multiplayerMode = 'passplay';
}

function handleRealtimeMessage(message) {
  if (!message || typeof message !== 'object') return;

  if (message.type === 'presence') {
    updateRealtimePresence(message.devices, message.hostDeviceId);
    render();
    return;
  }

  if (message.type === 'state_update') {
    if (state.network.isHost) return;
    applyRealtimeStateSnapshot(message.state);
    render();
    return;
  }

  if (message.type === 'action_request') {
    if (!state.network.isHost) return;
    const action = message.action;
    const args = Array.isArray(message.args) ? message.args : [];
    const handler = window[action];
    if (typeof handler !== 'function') return;
    realtime.replayingRemoteAction = true;
    try {
      handler(...args);
    } finally {
      realtime.replayingRemoteAction = false;
    }
    return;
  }

  if (message.type === 'request_state') {
    if (state.network.isHost) broadcastRealtimeState(true);
    return;
  }

  if (message.type === 'host_changed') {
    updateRealtimePresence(state.network.devices, message.hostDeviceId || null);
    if (state.network.isHost) broadcastRealtimeState(true);
    render();
    return;
  }

  if (message.type === 'error') {
    state.network.status = 'error';
    render();
  }
}

function connectRealtimeSession() {
  if (!isRealtimeMode()) return;
  if (state.network.connected) return;

  const roomCode = sanitizeRoomCode(state.joinCode || state.gameCode);
  state.gameCode = roomCode;
  state.joinCode = roomCode;
  state.network.status = 'connecting';
  render();
  const relayCandidates = getRelayCandidates();
  let candidateIndex = 0;

  const tryNextCandidate = () => {
    if (candidateIndex >= relayCandidates.length) {
      state.network.status = 'offline';
      state.network.connected = false;
      realtime.socket = null;
      render();
      return;
    }

    const relayUrl = relayCandidates[candidateIndex++];
    let socket;
    try {
      socket = new WebSocket(relayUrl);
    } catch (error) {
      tryNextCandidate();
      return;
    }

    let opened = false;
    let advanced = false;
    const timeoutId = setTimeout(() => {
      if (opened || advanced) return;
      advanced = true;
      try {
        socket.close();
      } catch (error) {
        // no-op
      }
      tryNextCandidate();
    }, 1800);

    const advanceIfNeeded = () => {
      if (opened || advanced) return;
      advanced = true;
      clearTimeout(timeoutId);
      try {
        socket.close();
      } catch (error) {
        // no-op
      }
      tryNextCandidate();
    };

    socket.onopen = () => {
      opened = true;
      advanced = true;
      clearTimeout(timeoutId);
      realtime.socket = socket;
      state.network.connected = true;
      state.network.status = 'connected';
      state.network.relayUrl = relayUrl;
      sendRealtimeMessage({
        type: 'join_room',
        code: roomCode,
        deviceId: state.network.deviceId,
        deviceName: state.network.deviceName,
        isHost: state.network.isHost
      });
      if (state.network.isHost) {
        broadcastRealtimeState(true);
      } else {
        sendRealtimeMessage({ type: 'request_state', code: roomCode });
      }
      render();
    };

    socket.onmessage = (event) => {
      let parsed;
      try {
        parsed = JSON.parse(event.data);
      } catch (error) {
        return;
      }
      handleRealtimeMessage(parsed);
    };

    socket.onerror = () => {
      advanceIfNeeded();
    };

    socket.onclose = () => {
      clearTimeout(timeoutId);
      if (!opened) {
        advanceIfNeeded();
        return;
      }
      disconnectRealtimeSession();
      render();
    };
  };

  tryNextCandidate();
}

function forwardRealtimeAction(action, args = []) {
  if (!isRealtimeClient()) return false;
  return sendRealtimeMessage({
    type: 'action_request',
    code: state.gameCode,
    action,
    args
  });
}

function buildBotDiscussionLine(bot, alivePlayers, triggerText = '') {
  const others = alivePlayers.filter(player => player.id !== bot.id);
  const suspects = samplePlayers(others, 2);
  const lead = suspects[0];
  const fallback = suspects[1] || lead;
  const plan = state.nightPlans[bot.id];
  const intel = state.intelResults[bot.id];
  const triggerEcho = triggerText.trim().slice(0, 40);

  const lines = [
    lead ? `I heard movement around ${lead.name}'s area.` : 'I heard footsteps but could not confirm who it was.',
    plan?.locationName ? `I was around ${plan.locationName}. Something felt wrong there.` : 'My route was quiet, but someone still made a move.',
    lead && fallback ? `Let's compare ${lead.name} and ${fallback.name}. Their stories do not line up.` : 'No hard proof yet. Compare timelines before voting.',
    intel?.heard ? `${intel.heard}` : 'I do not have proof, but we should pressure contradictions.',
    triggerEcho ? `On that point ("${triggerEcho}"), we should question who was nearby.` : 'Who had opportunity last night? Start there.'
  ].filter(Boolean);

  return randomChoice(lines) || 'I am still sorting clues. Keep sharing intel.';
}

function queueBotDiscussion(initial = false, triggerText = '') {
  if (state.gamePhase !== 'discussion') return;
  if (!state.settings.botChat) return;

  const alivePlayers = getAlivePlayers();
  const aliveBots = alivePlayers.filter(player => player.isBot);
  if (aliveBots.length === 0) return;

  if (initial) {
    if (state.lastBotChatDay === state.dayNumber) return;
    state.lastBotChatDay = state.dayNumber;
    clearBotChatTimers();

    const queuedDay = state.dayNumber;
    const speakers = samplePlayers(aliveBots, Math.min(2, aliveBots.length));
    speakers.forEach((bot, index) => {
      const delay = Math.max(500, Math.round(state.botDelayMs * (0.9 + index * 0.4)));
      const timerId = setTimeout(() => {
        state.botChatTimerIds = state.botChatTimerIds.filter(id => id !== timerId);
        if (state.gamePhase !== 'discussion' || state.dayNumber !== queuedDay) return;
        state.chatMessages.push({
          id: `msg_${Date.now()}_${Math.random().toString(16).slice(2)}`,
          day: state.dayNumber,
          senderId: bot.id,
          senderName: bot.name,
          text: buildBotDiscussionLine(bot, getAlivePlayers()),
          at: new Date().toISOString()
        });
        render();
      }, delay);
      state.botChatTimerIds.push(timerId);
    });
    return;
  }

  if (Math.random() > 0.55) return;
  const bot = randomChoice(aliveBots);
  if (!bot) return;

  const delay = Math.max(450, Math.round(state.botDelayMs * (0.8 + Math.random() * 0.45)));
  const timerId = setTimeout(() => {
    state.botChatTimerIds = state.botChatTimerIds.filter(id => id !== timerId);
    if (state.gamePhase !== 'discussion') return;
    state.chatMessages.push({
      id: `msg_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      day: state.dayNumber,
      senderId: bot.id,
      senderName: bot.name,
      text: buildBotDiscussionLine(bot, getAlivePlayers(), triggerText),
      at: new Date().toISOString()
    });
    render();
  }, delay);
  state.botChatTimerIds.push(timerId);
}

function scheduleAutoAdvance(key, handlerName, delay = state.botDelayMs) {
  if (isRealtimeClient()) return;
  if (state.autoAdvance.key === key) return;
  if (state.autoAdvance.timerId) clearTimeout(state.autoAdvance.timerId);
  state.autoAdvance.key = key;
  state.autoAdvance.timerId = setTimeout(() => {
    state.autoAdvance.key = null;
    state.autoAdvance.timerId = null;
    if (typeof window[handlerName] === 'function') window[handlerName]();
  }, delay);
}

function clearAutoAdvance() {
  if (state.autoAdvance.timerId) clearTimeout(state.autoAdvance.timerId);
  state.autoAdvance.key = null;
  state.autoAdvance.timerId = null;
}

function getPlanRoomKey(player, plan) {
  if (!plan?.location) return 'unknown';
  const location = getLocationById(plan.location);
  if (!location) return `missing:${plan.location}`;

  if (location.privateRoom) {
    const targetPlayerId = plan.actionTarget || player?.id || 'shared';
    return `${location.id}:${targetPlayerId}`;
  }

  return `${location.id}:shared`;
}

function samplePlayers(players, count) {
  const copy = [...players];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(count, copy.length));
}

function buildSnoopAssignments(alivePlayers) {
  const assignments = {};
  const candidates = alivePlayers.filter(player => player.role !== 'mafia');

  candidates.forEach(player => {
    const plan = state.nightPlans[player.id];
    if (!plan?.action) return;
    const location = getLocationById(plan.location);
    const isSnoopZone = Boolean(location?.isSnoopZone || location?.nodeType === 'investigation');
    const isSnooper = plan.action.kind === 'snoop' || (isSnoopZone && plan.action.kind === 'linger');
    if (!isSnooper) return;

    const sampleSize = player.role === 'detective' ? 5 : 3;
    const pool = alivePlayers.filter(candidate => candidate.id !== player.id);
    const targetIds = samplePlayers(pool, sampleSize).map(candidate => candidate.id);

    if (plan.actionTarget && !targetIds.includes(plan.actionTarget)) {
      targetIds[0] = plan.actionTarget;
    }

    assignments[player.id] = targetIds;
  });

  return assignments;
}

function getVisibleTargetsForMafia(mafiaPlayerId, alivePlayers = getAlivePlayers()) {
  const mafiaPlayer = alivePlayers.find(player => player.id === mafiaPlayerId);
  if (!mafiaPlayer || mafiaPlayer.role !== 'mafia') return { targets: [], mode: 'none' };

  const mafiaPlan = state.nightPlans[mafiaPlayer.id];
  if (!mafiaPlan) {
    return {
      targets: alivePlayers.filter(player => player.role !== 'mafia'),
      mode: 'search'
    };
  }

  const mafiaNode = resolveNodeBaseId(getPlanNodeId(mafiaPlan, mafiaPlayer));
  const nonMafia = alivePlayers.filter(player => player.role !== 'mafia');
  const nearby = nonMafia.filter(player => {
    const plan = state.nightPlans[player.id];
    if (!plan) return false;
    const node = resolveNodeBaseId(getPlanNodeId(plan, player));
    return getGraphDistance(mafiaNode, node) <= 1;
  });

  if (nearby.length > 0) {
    return { targets: nearby, mode: 'nearby' };
  }

  return { targets: nonMafia, mode: 'search' };
}

function prepareNightContext() {
  const alivePlayers = getAlivePlayers();
  state.snoopAssignments = buildSnoopAssignments(alivePlayers);
  state.snoopersByTarget = {};
  state.mafiaSnooperIntel = {};
  state.mafiaBriefing = {};
  state.mafiaVisionMode = {};

  Object.entries(state.snoopAssignments).forEach(([snooperId, targetIds]) => {
    targetIds.forEach(targetId => {
      if (!state.snoopersByTarget[targetId]) state.snoopersByTarget[targetId] = [];
      if (!state.snoopersByTarget[targetId].includes(snooperId)) {
        state.snoopersByTarget[targetId].push(snooperId);
      }
    });
  });

  alivePlayers
    .filter(player => player.role === 'mafia')
    .forEach(mafiaPlayer => {
      const view = getVisibleTargetsForMafia(mafiaPlayer.id, alivePlayers);
      state.mafiaVisionMode[mafiaPlayer.id] = view.mode;
      state.mafiaBriefing[mafiaPlayer.id] = [];

      state.mafiaSnooperIntel[mafiaPlayer.id] = {};
      Object.entries(state.snoopersByTarget).forEach(([targetId, snooperIds]) => {
        const seen = snooperIds
          .map(id => alivePlayers.find(player => player.id === id))
          .filter(Boolean)
          .filter(snooper => snooper.role !== 'mafia')
          .filter(snooper => {
            const detectChance = snooper.role === 'detective' ? 0.35 : 0.72;
            return Math.random() < detectChance;
          })
          .map(snooper => snooper.name);

        if (seen.length > 0) {
          state.mafiaSnooperIntel[mafiaPlayer.id][targetId] = seen;
          const targetPlayer = alivePlayers.find(player => player.id === targetId);
          if (targetPlayer) {
            state.mafiaBriefing[mafiaPlayer.id].push(
              `${targetPlayer.name}'s room drew snoopers: ${seen.join(', ')}.`
            );
          }
        }
      });

      if (view.mode === 'nearby') {
        state.mafiaBriefing[mafiaPlayer.id].push('Only nearby targets are currently visible from your route.');
      } else {
        state.mafiaBriefing[mafiaPlayer.id].push('No close targets; search widened across the map.');
      }
    });
}

function getIntelFallback(player) {
  const base = player.role === 'detective'
    ? 'Inconclusive: your route was quiet, but your notes may matter later.'
    : 'Inconclusive: no clear evidence from your position tonight.';
  return {
    heard: base,
    saw: null,
    nearby: null,
    tracked: null,
    cause: null,
    awareness: null
  };
}

function getNightAwarenessChoice(playerId) {
  const selectedId = state.nightAwareness?.[playerId];
  return NIGHT_AWARENESS_OPTIONS.find(option => option.id === selectedId) || NIGHT_AWARENESS_OPTIONS[1];
}

function buildNarration(eventName, context = {}) {
  const packId = state.selectedStory.narrationPack || 'default';
  const pack = NARRATION_PRESETS[packId] || NARRATION_PRESETS.default;
  const tone = state.settings.narratorTone || 'grim';
  const dramaticSuffix = tone === 'cinematic'
    ? ' Keep your story consistent.'
    : tone === 'neutral'
      ? ' Use concrete timing and location details.'
      : ' Fear and confidence are both useful masks.';

  if (eventName === 'intro') {
    const backstory = pack.backstory ? `${pack.backstory} ` : '';
    return `${backstory}${pack.intro} ${state.selectedStory.mood}`;
  }
  if (eventName === 'day') return `${pack.day}${dramaticSuffix}`;
  if (eventName === 'night') return `${pack.night}${dramaticSuffix}`;
  if (eventName === 'morning') {
    if (context.attackHappened && context.saved) {
      return `${pack.morning} Someone survived by a narrow margin.`;
    }
    if (context.attackHappened) {
      return `${pack.morning} A body tells part of the story.`;
    }
    return `${pack.morning} No confirmed kill, but danger remains.`;
  }
  if (eventName === 'discussion') return pack.discussion;
  if (eventName === 'vote') return pack.vote;
  return `${state.selectedStory.mood}`;
}

function calculateRolesFromPreset(preset, count) {
  if (count < 3) return { mafia: 0, doctor: 0, detective: 0, villager: 0 };

  let mafia, doctor, detective;

  if (preset.id === 'classic') {
    // Target curve: at 12 players, trend to 5 Mafia / 3 Doctor / 2 Detective.
    if (count <= 4) mafia = 1, doctor = 1, detective = 0;
    else if (count <= 6) mafia = 2, doctor = 1, detective = 1;
    else if (count <= 8) mafia = 3, doctor = 2, detective = 1;
    else if (count <= 10) mafia = 4, doctor = 2, detective = 2;
    else if (count <= 12) mafia = 5, doctor = 3, detective = 2;
    else if (count <= 14) mafia = 5, doctor = 3, detective = 3;
    else mafia = Math.round(count * 0.38), doctor = Math.max(2, Math.round(count * 0.22)), detective = Math.max(1, Math.round(count * 0.14));
  } else if (preset.id === 'brutal') {
    // Blood Moon: aggressive but should not auto-trigger parity warnings in normal lobbies.
    if (count <= 4) mafia = 1, doctor = 1, detective = 0;
    else if (count <= 6) mafia = 2, doctor = 1, detective = 0;
    else if (count <= 8) mafia = 3, doctor = 1, detective = 1;
    else if (count <= 10) mafia = 4, doctor = 1, detective = 1;
    else if (count <= 12) mafia = 4, doctor = 2, detective = 1;
    else if (count <= 14) mafia = 5, doctor = 2, detective = 1;
    else mafia = Math.round(count * 0.34), doctor = Math.max(1, Math.round(count * 0.14)), detective = Math.max(1, Math.round(count * 0.1));
  } else if (preset.id === 'chaos') {
    // Crossfire: volatile but not pure mafia; more doctors than Blood Moon.
    if (count <= 4) mafia = 1, doctor = 1, detective = 0;
    else if (count <= 6) mafia = 2, doctor = 1, detective = 1;
    else if (count <= 8) mafia = 3, doctor = 2, detective = 1;
    else if (count <= 10) mafia = 4, doctor = 2, detective = 1;
    else if (count <= 12) mafia = 5, doctor = 2, detective = 2;
    else if (count <= 14) mafia = 6, doctor = 3, detective = 2;
    else mafia = Math.round(count * 0.36), doctor = Math.max(2, Math.round(count * 0.2)), detective = Math.max(1, Math.round(count * 0.11));
  } else if (preset.id === 'detective') {
    // Forensics: information-heavy town side.
    if (count <= 4) mafia = 1, doctor = 1, detective = 1;
    else if (count <= 6) mafia = 1, doctor = 1, detective = 2;
    else if (count <= 8) mafia = 2, doctor = 1, detective = 3;
    else if (count <= 10) mafia = 2, doctor = 2, detective = 4;
    else if (count <= 12) mafia = 3, doctor = 2, detective = 4;
    else if (count <= 14) mafia = 3, doctor = 2, detective = 5;
    else mafia = Math.max(3, Math.round(count * 0.24)), doctor = Math.max(2, Math.round(count * 0.14)), detective = Math.max(2, Math.round(count * 0.28));
  } else {
    mafia = Math.max(1, Math.round(count * preset.mafia / 100));
    doctor = preset.doctor === 0 ? 0 : Math.max(1, Math.round(count * preset.doctor / 100));
    detective = count >= 5 ? Math.max(0, Math.round(count * preset.detective / 100)) : 0;
  }

  // Clamp to avoid invalid setups for small groups.
  mafia = Math.max(1, Math.min(mafia, count - 2));
  doctor = Math.max(0, Math.min(doctor, count - mafia - 1));
  detective = Math.max(0, Math.min(detective, count - mafia - doctor - 1));

  return {
    mafia,
    doctor,
    detective,
    villager: Math.max(0, count - mafia - doctor - detective)
  };
}

function updateRoleConfig() {
  // Only recalculate from preset if one is selected
  if (state.selectedPreset) {
    state.roleConfig = calculateRolesFromPreset(state.selectedPreset, getAllPlayers().length);
  } else {
    // Keep current role config but update villager count based on player count
    const count = getAllPlayers().length;
    state.roleConfig.villager = Math.max(0, count - state.roleConfig.mafia - state.roleConfig.doctor - state.roleConfig.detective);
  }
}

function getTotalRoles() {
  return state.roleConfig.mafia + state.roleConfig.doctor + state.roleConfig.detective + (state.roleConfig.villager || 0);
}

function getStartWarnings() {
  const warnings = [];
  const total = getAllPlayers().length;
  const mafia = state.roleConfig.mafia || 0;
  const town = total - mafia;
  if (state.roleConfig.villager < 0) warnings.push('Not enough villagers!');
  if (state.roleConfig.mafia === 0 && getAllPlayers().length >= 3) warnings.push('No mafia assigned!');
  if (mafia >= town && total >= 3) warnings.push('Mafia currently outnumber or match Town.');
  return warnings;
}

function canStart() {
  const allPlayers = getAllPlayers();
  const humans = state.players.filter(p => !p.isBot);
  const mafia = state.roleConfig.mafia || 0;
  const town = allPlayers.length - mafia;
  const minPlayers = state.screen === 'multi_lobby' ? 2 : 3;
  if (isRealtimeMode() && !state.network.connected) return false;
  if (isRealtimeMode() && !state.network.isHost) return false;
  if (allPlayers.length < minPlayers) return false;
  if (state.screen === 'multi_lobby' && humans.length === 0) return false;
  if (state.roleConfig.villager < 0) return false;
  if (mafia >= town) return false;
  return true;
}

function getStartBlockReason() {
  const allPlayers = getAllPlayers();
  const humans = state.players.filter(p => !p.isBot);
  const mafia = state.roleConfig.mafia || 0;
  const town = allPlayers.length - mafia;
  const minPlayers = state.screen === 'multi_lobby' ? 2 : 3;
  if (isRealtimeMode() && !state.network.connected) return 'Connect multi-device first';
  if (isRealtimeMode() && !state.network.isHost) return 'Waiting for host to start';
  if (allPlayers.length < minPlayers) return `Need ${minPlayers}+ players (${allPlayers.length})`;
  if (state.screen === 'solo_lobby' && !state.soloPlayerName.trim()) return 'Enter your name';
  if (state.screen === 'multi_lobby' && humans.length === 0) return 'Need at least 1 human';
  if (state.roleConfig.villager < 0) return 'Too many special roles!';
  if (mafia >= town) return 'Mafia must be fewer than Town';
  return null;
}

function validateName(name) {
  if (!name.trim()) return 'Enter a name';
  if (getAllPlayers().some(p => p.name.toLowerCase() === name.trim().toLowerCase())) return 'Name already taken';
  return null;
}

function canHostManageBots() {
  return !isRealtimeMode() || state.network.isHost;
}

function sortPlayersByDeviceOrder() {
  const orderedDevices = state.network.deviceOrder || [];
  if (!isRealtimeMode() || orderedDevices.length === 0) return;

  const grouped = {};
  state.players.forEach(player => {
    const key = player.deviceId || 'unknown';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(player);
  });

  const reordered = [];
  orderedDevices.forEach(deviceId => {
    if (grouped[deviceId]) reordered.push(...grouped[deviceId]);
    delete grouped[deviceId];
  });

  Object.values(grouped).forEach(group => reordered.push(...group));
  state.players = reordered;
}

// -----------------------------------------------------------------------------
// PLAYER/BOT MANAGEMENT
// -----------------------------------------------------------------------------

function addBot() {
  if (!canHostManageBots()) return;
  const allPlayers = getAllPlayers();
  const usedNames = allPlayers.map(p => p.name);
  const available = BOT_NAMES.filter(n => !usedNames.includes(n));
  if (!available.length || allPlayers.length >= 16) return;

  state.bots.push({
    id: 'bot' + Date.now(),
    name: available[Math.floor(Math.random() * available.length)],
    isBot: true,
    alive: true
  });
  updateRoleConfig();
  render();

  setTimeout(() => {
    const list = document.querySelector('.bot-list');
    if (list) list.scrollTop = list.scrollHeight;
  }, 50);
}

function removeBot(id) {
  if (!canHostManageBots()) return;
  state.bots = state.bots.filter(b => b.id !== id);
  updateRoleConfig();
  render();
}

function renameBot(id, value) {
  if (!canHostManageBots()) return;
  const nextName = String(value || '').trim();
  if (!nextName) return;
  const duplicate = getAllPlayers().some(player => player.id !== id && player.name.toLowerCase() === nextName.toLowerCase());
  if (duplicate) {
    state.nameError = 'Name already taken';
    render();
    return;
  }
  state.bots = state.bots.map(bot => bot.id === id ? { ...bot, name: nextName } : bot);
  state.nameError = '';
  render();
}

function addPlayer(name, deviceId = null) {
  const error = validateName(name);
  if (error) {
    state.nameError = error;
    render();
    return false;
  }
  state.players.push({
    id: 'p' + Date.now(),
    name: name.trim(),
    isBot: false,
    alive: true,
    deviceId: deviceId || state.network.deviceId,
    deviceName: getDeviceNameById(deviceId || state.network.deviceId)
  });
  state.nameError = '';
  updateRoleConfig();
  render();
  setTimeout(() => {
    const list = document.querySelector('.player-list');
    if (list) list.scrollTop = list.scrollHeight;
  }, 50);
  return true;
}

function removePlayer(id) {
  state.players = state.players.filter(p => p.id !== id);
  updateRoleConfig();
  render();
}

function movePlayer(id, direction) {
  const index = state.players.findIndex(player => player.id === id);
  if (index === -1) return;
  const targetIndex = index + Number(direction || 0);
  if (targetIndex < 0 || targetIndex >= state.players.length) return;
  const reordered = [...state.players];
  [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
  state.players = reordered;
  render();
}

function moveDevice(deviceId, direction) {
  const order = [...(state.network.deviceOrder || [])];
  const index = order.indexOf(deviceId);
  if (index === -1) return;
  const targetIndex = index + Number(direction || 0);
  if (targetIndex < 0 || targetIndex >= order.length) return;
  [order[index], order[targetIndex]] = [order[targetIndex], order[index]];
  state.network.deviceOrder = order;

  // Keep player ordering grouped by device order while preserving within-device order.
  sortPlayersByDeviceOrder();
  render();
}

function movePlayerToIndex(playerId, targetIndex) {
  const sourceIndex = state.players.findIndex(player => player.id === playerId);
  if (sourceIndex === -1) return;
  const boundedTarget = Math.max(0, Math.min(targetIndex, state.players.length - 1));
  if (boundedTarget === sourceIndex) return;

  const reordered = [...state.players];
  const [item] = reordered.splice(sourceIndex, 1);
  reordered.splice(boundedTarget, 0, item);
  state.players = reordered;
  render();
}

function movePlayerWithinDevice(playerId, targetPlayerId) {
  const player = state.players.find(item => item.id === playerId);
  const target = state.players.find(item => item.id === targetPlayerId);
  if (!player || !target) return;
  if ((player.deviceId || '') !== (target.deviceId || '')) return;

  const sourceIndex = state.players.findIndex(item => item.id === playerId);
  const targetIndex = state.players.findIndex(item => item.id === targetPlayerId);
  if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) return;

  const reordered = [...state.players];
  const [item] = reordered.splice(sourceIndex, 1);
  reordered.splice(targetIndex, 0, item);
  state.players = reordered;
  render();
}

function moveDeviceToIndex(deviceId, targetDeviceId) {
  const order = [...(state.network.deviceOrder || [])];
  const sourceIndex = order.indexOf(deviceId);
  const targetIndex = order.indexOf(targetDeviceId);
  if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) return;
  const [item] = order.splice(sourceIndex, 1);
  order.splice(targetIndex, 0, item);
  state.network.deviceOrder = order;
  sortPlayersByDeviceOrder();
  render();
}

function adjustRole(role, delta) {
  const newValue = Math.max(0, (state.roleConfig[role] || 0) + delta);
  const allPlayers = getAllPlayers();
  const otherTotal = getTotalRoles() - (state.roleConfig[role] || 0);
  const newTotal = otherTotal + newValue;

  if (delta > 0 && newTotal > allPlayers.length && state.roleConfig.villager <= 0) return;

  state.roleConfig[role] = newValue;
  state.roleConfig.villager = Math.max(0, allPlayers.length - state.roleConfig.mafia - state.roleConfig.doctor - state.roleConfig.detective);

  // Clear preset when manually adjusting roles
  state.selectedPreset = null;

  render();
}

function isPlusDisabled(role) {
  const allPlayers = getAllPlayers();
  const total = getTotalRoles();
  return total >= allPlayers.length && state.roleConfig.villager <= 0;
}

// -----------------------------------------------------------------------------
// TURN MANAGEMENT
// -----------------------------------------------------------------------------

function findNextHuman(startIndex, filter = null) {
  const allPlayers = getAllPlayers();
  for (let i = startIndex + 1; i < allPlayers.length; i++) {
    if (allPlayers[i].alive && !allPlayers[i].isBot && (!filter || filter(allPlayers[i]))) return i;
  }
  return -1;
}

function findNextAlive(startIndex) {
  const allPlayers = getAllPlayers();
  for (let i = startIndex + 1; i < allPlayers.length; i++) {
    if (allPlayers[i].alive && !allPlayers[i].isBot) return i;
  }
  return -1;
}

function beginNightPhase() {
  state.gamePhase = 'night';
  state.currentPlayerIndex = 0;
  state.showRole = false;
  state.selectedTarget = null;
  state.selectedKillMethod = null;
  state.selectedAwareness = null;
  state.selectedSave = null;
  state.mafiaKillMethods = {};
  state.nightAwareness = {};
  state.nightAttackMethod = null;
  state.narrative = buildNarration('night');
  addNarrationLog(state.narrative, 'night');
  primeNarratorTurn('night');
  queueNarratorChatPrompt('night');
  clearBotChatTimers();
  prepareNightContext();

  const allPlayers = getAllPlayers();
  const nightActors = getNightActors();
  if (nightActors.length > 0) {
    const firstActorId = nightActors[0].id;
    const actorIndex = allPlayers.findIndex(player => player.id === firstActorId);
    state.currentPlayerIndex = actorIndex !== -1 ? actorIndex : 0;
  } else {
    const firstHuman = findFirstAliveHumanIndex();
    state.currentPlayerIndex = firstHuman !== -1 ? firstHuman : 0;
  }

  withBotDelay(() => botMakeDecisions('night'), Math.max(700, state.botDelayMs));
}

// -----------------------------------------------------------------------------
// GAME START
// -----------------------------------------------------------------------------

function startGame() {
  if (!canStart()) return;

  if (state.screen === 'solo_lobby') {
    state.players = [{
      id: 'p_solo',
      name: state.soloPlayerName.trim(),
      isBot: false,
      alive: true
    }];
  }

  const allPlayers = getAllPlayers();
  const roles = [];

  roles.push(...Array(state.roleConfig.mafia).fill('mafia'));
  roles.push(...Array(state.roleConfig.doctor).fill('doctor'));
  roles.push(...Array(state.roleConfig.detective).fill('detective'));
  while (roles.length < allPlayers.length) roles.push('villager');

  // Shuffle roles
  for (let i = roles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [roles[i], roles[j]] = [roles[j], roles[i]];
  }

  state.players = state.players.map((p, i) => ({ ...p, role: roles[i], alive: true }));
  state.bots = state.bots.map((b, i) => ({ ...b, role: roles[state.players.length + i], alive: true }));

  state.screen = 'game';
  state.gamePhase = 'reveal';
  state.dayNumber = 1;
  state.narrative = buildNarration('intro');
  state.currentPlayerIndex = 0;
  state.showRole = false;
  state.nightPlans = {};
  state.snoopAssignments = {};
  state.nightAttackCounts = {};
  state.nightAttackMethod = null;
  state.mafiaSnooperIntel = {};
  state.mafiaBriefing = {};
  state.nightAwareness = {};
  state.mafiaVotes = {};
  state.mafiaKillMethods = {};
  state.doctorSave = null;
  state.votes = {};
  state.intelResults = {};
  state.chatMessages = [];
  state.chatDraft = '';
  state.chatSenderId = null;
  state.selectedLocation = null;
  state.selectedAction = null;
  state.selectedActionTarget = null;
  state.selectedTarget = null;
  state.selectedKillMethod = null;
  state.selectedAwareness = null;
  state.selectedSave = null;
  state.selectedVote = null;
  state.discussionUnlockAt = 0;
  state.nightPlans = {};
  state.snoopAssignments = {};
  state.snoopersByTarget = {};
  state.mafiaSnooperIntel = {};
  state.mafiaBriefing = {};
  state.nightAwareness = {};
  state.mafiaVotes = {};
  state.mafiaKillMethods = {};
  state.nightAttackCounts = {};
  state.nightAttackMethod = null;
  state.intelResults = {};
  state.lastNarratorPromptKey = null;
  state.pendingNarratorPhase = null;
  state.narrationLog = [];
  state.lastBotChatDay = null;
  clearBotChatTimers();
  clearDeathAnimation();
  state.winner = null;
  state.winReason = null;
  state.pendingWin = null;
  state.finalDeath = null;
  clearAutoAdvance();
  addNarrationLog(state.narrative, 'reveal');
  primeNarratorTurn('reveal');
  queueNarratorChatPrompt('reveal');

  const allPlayers2 = getAllPlayers();
  let firstHuman = allPlayers2.findIndex(p => !p.isBot);
  if (firstHuman === -1) firstHuman = 0;
  state.currentPlayerIndex = firstHuman;

  render();
}

// -----------------------------------------------------------------------------
// BOT AI
// -----------------------------------------------------------------------------

function botMakeDecisions(phase) {
  const alivePlayers = getAlivePlayers();
  const aliveBots = alivePlayers.filter(p => p.isBot);

  if (phase === 'day') {
    aliveBots.forEach(bot => {
      const location = state.selectedStory.locations[Math.floor(Math.random() * state.selectedStory.locations.length)];
      const actions = getAvailableActionsForPlayer(bot, location);
      const action = actions[Math.floor(Math.random() * actions.length)];
      const otherPlayers = alivePlayers.filter(player =>
        player.id !== bot.id && (bot.role === 'mafia' ? player.role !== 'mafia' : true)
      );
      const actionTarget = action?.requiresTarget
        ? otherPlayers[Math.floor(Math.random() * otherPlayers.length)]?.id || null
        : null;
      state.nightPlans[bot.id] = {
        location: location.id,
        locationName: location.name,
        action,
        actionTarget
      };
    });
  }

  if (phase === 'night') {
    const mafiaBots = aliveBots.filter(b => b.role === 'mafia');
    mafiaBots.forEach(bot => {
      const view = getVisibleTargetsForMafia(bot.id, alivePlayers);
      const targets = view.targets.length > 0
        ? view.targets
        : alivePlayers.filter(player => player.role !== 'mafia');
      const investigatingTargets = targets.filter(target => {
        const plan = state.nightPlans[target.id];
        return getPlanIntelChance(target, plan) >= 0.5;
      });
      const target = investigatingTargets.length > 0 && Math.random() > 0.35
        ? investigatingTargets[Math.floor(Math.random() * investigatingTargets.length)]
        : targets[Math.floor(Math.random() * targets.length)];
      if (target) {
        state.mafiaVotes[bot.id] = target.id;
        const methodPool = [...KILL_METHODS].sort((a, b) => b.noise - a.noise);
        const preferred = Math.random() > 0.5 ? methodPool[0] : randomChoice(KILL_METHODS);
        state.mafiaKillMethods[bot.id] = preferred?.id || KILL_METHODS[0].id;
      }
    });
    aliveBots
      .filter(bot => bot.role !== 'mafia')
      .forEach(bot => {
        const pick = randomChoice(NIGHT_AWARENESS_OPTIONS) || NIGHT_AWARENESS_OPTIONS[1];
        state.nightAwareness[bot.id] = pick.id;
      });
  }

  if (phase === 'morning_doctor') {
    const doctorBot = aliveBots.find(b => b.role === 'doctor');
    if (doctorBot) {
      const preferred = state.nightTarget ? alivePlayers.find(player => player.id === state.nightTarget) : null;
      const fallback = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
      const choice = preferred && Math.random() > 0.35 ? preferred : fallback;
      state.doctorSave = choice?.id || null;
    }
  }

  if (phase === 'vote') {
    aliveBots.forEach(bot => {
      const targets = alivePlayers.filter(p =>
        p.id !== bot.id && (bot.role === 'mafia' ? p.role !== 'mafia' : true)
      );
      const target = targets[Math.floor(Math.random() * targets.length)];
      if (target) state.votes[bot.id] = target.id;
    });
  }
}

// -----------------------------------------------------------------------------
// NIGHT PHASE PROCESSING
// -----------------------------------------------------------------------------

function processNight() {
  prepareNightContext();

  const voteCounts = {};
  const methodCountsByTarget = {};

  Object.entries(state.mafiaVotes).forEach(([mafiaId, targetId]) => {
    if (!targetId) return;
    voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
    const methodId = state.mafiaKillMethods[mafiaId] || KILL_METHODS[0].id;
    if (!methodCountsByTarget[targetId]) methodCountsByTarget[targetId] = {};
    methodCountsByTarget[targetId][methodId] = (methodCountsByTarget[targetId][methodId] || 0) + 1;
  });

  const sorted = Object.entries(voteCounts).sort((a, b) => b[1] - a[1]);
  const targetId = sorted[0]?.[0];
  const methodCounts = targetId ? methodCountsByTarget[targetId] || {} : {};
  const sortedMethodCounts = Object.entries(methodCounts).sort((a, b) => b[1] - a[1]);
  const resolvedMethodId = sortedMethodCounts[0]?.[0] || KILL_METHODS[0].id;
  const resolvedMethod = getKillMethodById(resolvedMethodId);

  state.nightAttackCounts = voteCounts;
  state.nightTarget = targetId;
  state.nightAttackMethod = resolvedMethod.id;

  const alivePlayers = getAlivePlayers();
  const targetPlayer = alivePlayers.find(player => player.id === targetId);
  const targetPlan = targetPlayer ? state.nightPlans[targetPlayer.id] : null;
  const targetNode = targetPlan ? resolveNodeBaseId(getPlanNodeId(targetPlan, targetPlayer)) : null;
  const newIntel = {};

  alivePlayers.forEach(player => {
    const plan = state.nightPlans[player.id];
    if (!plan) {
      if (player.role !== 'mafia') newIntel[player.id] = getIntelFallback(player);
      return;
    }

    if (player.role === 'mafia') return;

    const playerNode = resolveNodeBaseId(getPlanNodeId(plan, player));
    const awarenessChoice = getNightAwarenessChoice(player.id);
    const awarenessBoost = Number(awarenessChoice?.exposureMod || 0);
    const effectiveIntel = clamp01(getPlanIntelChance(player, plan) + awarenessBoost);
    const intel = getIntelFallback(player);
    const noiseWeight = clamp01(resolvedMethod.noise || 0.3);
    const distanceToAttack = targetNode ? getGraphDistance(playerNode, targetNode) : Infinity;
    const witnessedFromNearby = targetId && player.id !== targetId && distanceToAttack <= 1;

    if (witnessedFromNearby) {
      intel.heard = `You were nearby during the attack and heard ${resolvedMethod.evidenceHint}.`;
      const witnessChance = clamp01((player.role === 'detective' ? 0.62 : 0.34) + (noiseWeight * 0.42) + (awarenessBoost * 0.45));
      if (Math.random() < witnessChance) {
        const killers = alivePlayers.filter(candidate => candidate.role === 'mafia');
        const killer = killers[Math.floor(Math.random() * killers.length)];
        intel.saw = player.role === 'detective'
          ? `${killer?.name} fled from ${targetPlayer?.name}'s area after the strike.`
          : `You saw a fleeing attacker near ${targetPlayer?.name}'s area.`;
      }
      intel.cause = `Likely method: ${resolvedMethod.name}.`;
    }

    const trackedTargets = state.snoopAssignments[player.id] || [];
    if (targetId && trackedTargets.includes(targetId)) {
      if (Math.random() < effectiveIntel) {
        intel.heard = `Your snoop route passed close to ${targetPlayer?.name}'s room.`;
        if (player.role === 'detective' || Math.random() < effectiveIntel * 0.8) {
          const killers = alivePlayers.filter(candidate => candidate.role === 'mafia');
          const killer = killers[Math.floor(Math.random() * killers.length)];
          intel.saw = `${killer?.name} was seen moving near ${targetPlayer?.name}'s room.`;
        } else {
          intel.saw = `You saw movement around ${targetPlayer?.name}'s room but no clear identity.`;
        }
      } else {
        intel.heard = `You tracked ${targetPlayer?.name}'s room but found no clear proof.`;
      }
    }

    const othersNearby = alivePlayers.filter(candidate => {
      if (candidate.id === player.id) return false;
      const candidatePlan = state.nightPlans[candidate.id];
      if (!candidatePlan) return false;
      const candidateNode = resolveNodeBaseId(getPlanNodeId(candidatePlan, candidate));
      return getGraphDistance(playerNode, candidateNode) <= 1;
    });

    if (othersNearby.length > 0) {
      intel.nearby = `Nearby: ${othersNearby.map(candidate => candidate.name).join(', ')}`;
    } else if (!intel.nearby) {
      intel.nearby = 'Nearby: no one in your immediate area.';
    }
    intel.awareness = `Night stance: ${awarenessChoice.name}.`;

    if (plan.action?.requiresTarget && plan.actionTarget) {
      const target = alivePlayers.find(candidate => candidate.id === plan.actionTarget);
      if (target) {
        intel.tracked = `You focused on ${target.name}'s room tonight.`;
      }
    }

    if (plan.action?.id === 'sleep_lock' && !intel.saw) {
      intel.heard = 'You slept behind a locked door; nothing conclusive reached you.';
    } else if (plan.action?.id === 'sleep_unlocked' && !intel.saw && !intel.tracked) {
      intel.heard = 'You slept without locking up. Inconclusive sounds drifted in and out.';
    }

    newIntel[player.id] = intel;
  });

  getAlivePlayers()
    .filter(player => player.role !== 'mafia')
    .forEach(player => {
      if (!newIntel[player.id]) newIntel[player.id] = getIntelFallback(player);
    });

  state.intelResults = newIntel;
  state.narrative = buildNarration('morning', { attackHappened: Boolean(targetId), saved: false });
  addNarrationLog(state.narrative, shouldRunDoctorPhase() ? 'morning_doctor' : 'announcement');
  state.showRole = false;
  state.selectedSave = null;
  state.selectedAwareness = null;
  if (shouldRunDoctorPhase()) {
    state.gamePhase = 'morning_doctor';
    primeNarratorTurn('morning_doctor');
    queueNarratorChatPrompt('morning_doctor');
    withBotDelay(() => {
      botMakeDecisions('morning_doctor');
      render();
    }, Math.max(700, state.botDelayMs));
    return;
  }
  withBotDelay(() => {
    processMorning();
  }, Math.max(700, state.botDelayMs));
}

// -----------------------------------------------------------------------------
// MORNING PHASE PROCESSING
// -----------------------------------------------------------------------------

function processMorning() {
  const allPlayers = getAllPlayers();
  const target = allPlayers.find(p => p.id === state.nightTarget);
  const method = getKillMethodById(state.nightAttackMethod || KILL_METHODS[0].id);
  let deathMessage = '';
  let savedByDoctor = false;

  const attackCount = target ? (state.nightAttackCounts[target.id] || 1) : 0;
  const doctorTriedSave = Boolean(target && state.doctorSave && state.doctorSave === target.id);
  let saveChance = 0;
  if (doctorTriedSave) {
    saveChance = getDoctorSaveChance(method, attackCount);
    savedByDoctor = Math.random() < saveChance;
  }

  if (target && !savedByDoctor) {
    if (target.isBot) {
      state.bots = state.bots.map(b => b.id === target.id ? { ...b, alive: false } : b);
    } else {
      state.players = state.players.map(p => p.id === target.id ? { ...p, alive: false } : p);
    }
    SoundEffects.playDeath();
    deathMessage = `${target.name} was found dead.\n\nCause of death: ${method.deathLabel} (${method.name}).\nDisturbance level: ${Math.round((method.noise || 0) * 100)}%.\n\nThey were the ${getRoleDisplayName(target.role)}.`;
    state.finalDeath = {
      type: 'night',
      victim: target.name,
      role: getRoleDisplayName(target.role),
      saved: false,
      method: method.name
    };
    setDeathAnimation(target.name, getRoleDisplayName(target.role), 'night');
  } else if (target && savedByDoctor) {
    const methodLine = `Attack method: ${method.name}.`;
    deathMessage = `${target.name} was attacked but survived.\n\n${methodLine}\nDoctor save chance this morning: ${Math.round(saveChance * 100)}%.`;
    state.finalDeath = {
      type: 'night',
      victim: target.name,
      role: getRoleDisplayName(target.role),
      saved: true,
      method: method.name
    };
    clearDeathAnimation();
  } else {
    deathMessage = 'The night passed peacefully.';
    state.finalDeath = { type: 'night', victim: null, role: null, saved: false, method: null };
    clearDeathAnimation();
  }
  addNarrationLog(deathMessage, 'announcement');

  state.nightTarget = null;
  state.nightAttackMethod = null;
  state.mafiaVotes = {};
  state.mafiaKillMethods = {};
  state.nightAttackCounts = {};
  state.doctorSave = null;
  state.pendingWin = evaluateWinCondition();
  state.announcement = deathMessage;
  state.gamePhase = 'announcement';
  primeNarratorTurn('announcement');
  state.narrative = buildNarration('morning', {
    attackHappened: Boolean(target),
    saved: Boolean(target && savedByDoctor)
  });
  queueNarratorChatPrompt('announcement');
  render();
}

function afterAnnouncement() {
  state.announcement = null;
  clearDeathAnimation();
  if (state.pendingWin) {
    finalizeGameOver();
    return;
  }
  state.gamePhase = 'discussion';
  const firstHuman = findFirstAliveHumanIndex();
  state.currentPlayerIndex = firstHuman !== -1 ? firstHuman : 0;
  state.showRole = false;
  state.chatDraft = '';
  state.chatSenderId = getAllPlayers()[state.currentPlayerIndex]?.id || null;
  state.discussionUnlockAt = isSoloMode() ? 0 : Date.now() + 5000;
  primeNarratorTurn('discussion');
  state.narrative = buildNarration('discussion');
  addNarrationLog(state.narrative, 'discussion');
  queueNarratorChatPrompt('discussion');
  queueBotDiscussion(true);

  render();
}

// -----------------------------------------------------------------------------
// VOTE PROCESSING
// -----------------------------------------------------------------------------

function processVote() {
  const allPlayers = getAllPlayers();
  const voteCounts = {};

  Object.values(state.votes).forEach(targetId => {
    if (targetId) voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
  });

  const sorted = Object.entries(voteCounts).sort((x, y) => y[1] - x[1]);
  const tallyLines = sorted
    .map(([targetId, count]) => {
      const player = allPlayers.find(candidate => candidate.id === targetId);
      if (!player) return null;
      return `${player.name}: ${count}`;
    })
    .filter(Boolean);
  let voteMessage = '';

  if (sorted.length > 0 && (sorted.length === 1 || sorted[0][1] > (sorted[1]?.[1] || 0))) {
    const eliminated = allPlayers.find(p => p.id === sorted[0][0]);
    if (eliminated) {
      if (eliminated.isBot) {
        state.bots = state.bots.map(b => b.id === eliminated.id ? { ...b, alive: false } : b);
      } else {
        state.players = state.players.map(p => p.id === eliminated.id ? { ...p, alive: false } : p);
      }
      voteMessage = `Vote decided.\n\n${eliminated.name} eliminated.\n\nThey were the ${getRoleDisplayName(eliminated.role)}.`;
      state.finalDeath = {
        type: 'vote',
        victim: eliminated.name,
        role: getRoleDisplayName(eliminated.role),
        saved: false
      };
      setDeathAnimation(eliminated.name, getRoleDisplayName(eliminated.role), 'vote');
    }
  } else {
    voteMessage = 'Vote tied. No one eliminated.';
    state.finalDeath = { type: 'vote', victim: null, role: null, saved: false };
    clearDeathAnimation();
  }
  if (tallyLines.length > 0) {
    voteMessage += `\n\nVote tally:\n${tallyLines.join('\n')}`;
  }
  addNarrationLog(voteMessage, 'vote_announcement');

  state.votes = {};
  state.nightPlans = {};
  state.snoopAssignments = {};
  state.snoopersByTarget = {};
  state.mafiaSnooperIntel = {};
  state.mafiaBriefing = {};
  state.mafiaVotes = {};
  state.mafiaKillMethods = {};
  state.nightAttackCounts = {};
  state.nightAttackMethod = null;
  state.doctorSave = null;
  state.intelResults = {};
  state.pendingWin = evaluateWinCondition();
  state.announcement = voteMessage;
  state.gamePhase = 'vote_announcement';
  primeNarratorTurn('vote_announcement');
  queueNarratorChatPrompt('vote_announcement');
  render();
}

function afterVoteAnnouncement() {
  state.announcement = null;
  clearDeathAnimation();
  clearBotChatTimers();
  if (state.pendingWin) {
    finalizeGameOver();
    return;
  }
  state.gamePhase = 'day';
  state.dayNumber++;
  state.currentPlayerIndex = 0;
  state.showRole = false;
  state.selectedLocation = null;
  state.selectedAction = null;
  state.selectedActionTarget = null;
  state.selectedTarget = null;
  state.selectedKillMethod = null;
  state.selectedAwareness = null;
  state.chatSenderId = null;
  state.chatDraft = '';
  state.discussionUnlockAt = 0;
  primeNarratorTurn('day');
  queueNarratorChatPrompt('day');
  state.narrative = buildNarration('day');

  const firstHuman = findFirstAliveHumanIndex();
  if (firstHuman !== -1) state.currentPlayerIndex = firstHuman;

  withBotDelay(() => {
    botMakeDecisions('day');
    render();
  }, Math.max(700, state.botDelayMs));
}

// -----------------------------------------------------------------------------
// WIN CONDITION
// -----------------------------------------------------------------------------

function evaluateWinCondition() {
  const alivePlayers = getAlivePlayers();
  const mafiaAlive = alivePlayers.filter(p => p.role === 'mafia').length;
  const townAlive = alivePlayers.filter(p => p.role !== 'mafia').length;
  const humansAlive = alivePlayers.filter(p => !p.isBot).length;

  if (state.screen === 'game' && humansAlive === 0) {
    return {
      winner: 'mafia',
      reason: 'All human-controlled players were eliminated.'
    };
  }

  if (mafiaAlive === 0) {
    return {
      winner: 'town',
      reason: 'Town removed every Mafia member.'
    };
  }

  if (mafiaAlive > townAlive) {
    return {
      winner: 'mafia',
      reason: 'Mafia now outnumber Town.'
    };
  }

  return null;
}

function finalizeGameOver() {
  if (!state.pendingWin) return;
  state.winner = state.pendingWin.winner;
  state.winReason = state.pendingWin.reason;
  state.pendingWin = null;
  state.gamePhase = 'gameover';
  clearNarratorTurn();
  addNarrationLog(`Final outcome: ${state.winReason}`, 'gameover');
  if (state.winner === 'town') SoundEffects.playVictory();
  else SoundEffects.playDefeat();
  render();
}

function checkWin() {
  state.pendingWin = evaluateWinCondition();
  if (!state.pendingWin) return false;
  finalizeGameOver();
  return true;
}

function hasDoctorAlive() {
  return getAlivePlayers().some(player => player.role === 'doctor');
}

function shouldRunDoctorPhase() {
  return hasDoctorAlive() && Boolean(state.nightTarget);
}

function getDoctorSaveChance(method, attackCount = 1) {
  const attackerPenalty = Math.max(0, attackCount - 1) * 0.23;
  const methodPenalty = (method?.cureDifficulty || 0.6) * 0.3;
  return clamp01(0.74 - methodPenalty - attackerPenalty);
}

function getNightAwarenessById(id) {
  return NIGHT_AWARENESS_OPTIONS.find(option => option.id === id) || NIGHT_AWARENESS_OPTIONS[1];
}

function confirmNightAwarenessForCurrent() {
  const current = getCurrentPlayer();
  if (!current || current.role === 'mafia') return;
  const selected = getNightAwarenessById(state.selectedAwareness);
  state.nightAwareness[current.id] = selected.id;
  state.selectedAwareness = null;
}

function advanceNightActor() {
  const allPlayers = getAllPlayers();
  const nightActors = getNightActors();
  const currentActor = getCurrentPlayer();
  const currentActorIndex = nightActors.findIndex(actor => actor.id === currentActor?.id);
  const nextActor = currentActorIndex !== -1 ? nightActors[currentActorIndex + 1] : null;
  if (nextActor) {
    const nextIndex = allPlayers.findIndex(player => player.id === nextActor.id);
    state.currentPlayerIndex = nextIndex !== -1 ? nextIndex : state.currentPlayerIndex;
    state.showRole = false;
    render();
    return;
  }
  processNight();
  render();
}

function ensureDoctorSaveChoice() {
  if (!hasDoctorAlive()) return;
  if (state.doctorSave) return;
  const fallback = getAlivePlayers().find(player => player.id === state.nightTarget) || getAlivePlayers()[0];
  state.doctorSave = fallback?.id || null;
}

function completeDoctorPhase() {
  ensureDoctorSaveChoice();
  state.selectedSave = null;
  processMorning();
}

function normalizeCodeFromInput(raw) {
  const code = sanitizeRoomCode(raw || state.gameCode);
  state.gameCode = code;
  state.joinCode = code;
}

function regenerateRoomCode() {
  const next = Math.random().toString(36).slice(2, 8).toUpperCase();
  normalizeCodeFromInput(next);
}

function applyRealtimePanelMode(mode) {
  state.realtimePanelMode = mode === 'join' ? 'join' : 'host';
  if (state.realtimePanelMode === 'host') {
    state.network.isHost = true;
  }
}

function applyJoinCodeInput(value) {
  normalizeCodeFromInput(value);
}

function hostRealtimeRoom() {
  applyRealtimePanelMode('host');
  state.multiplayerMode = 'realtime';
  state.network.isHost = true;
  if (state.network.connected) disconnectRealtimeSession({ keepMode: true });
  connectRealtimeSession();
}

function joinRealtimeRoom() {
  applyRealtimePanelMode('join');
  state.multiplayerMode = 'realtime';
  state.network.isHost = false;
  if (state.network.connected) disconnectRealtimeSession({ keepMode: true });
  connectRealtimeSession();
}

function applyRealtimeDeviceName(value) {
  const next = String(value || '').trim();
  if (!next) return;
  state.network.deviceName = next.slice(0, 32);
  try {
    localStorage.setItem('mafia_device_name', state.network.deviceName);
  } catch (error) {
    // ignore
  }
}

function setNightAwareness(value) {
  const option = getNightAwarenessById(value);
  state.selectedAwareness = option.id;
  render();
}

function renamePlayer(id, value) {
  const nextName = String(value || '').trim();
  if (!nextName) return;
  if (state.players.some(player => player.id !== id && player.name.toLowerCase() === nextName.toLowerCase())) {
    state.nameError = 'Name already taken';
    render();
    return;
  }
  state.players = state.players.map(player => player.id === id ? { ...player, name: nextName } : player);
  state.nameError = '';
  render();
}

function toggleMap() {
  state.showMap = !state.showMap;
  render();
}

function closeMap() {
  state.showMap = false;
  render();
}

function getDeviceGroupedPlayers() {
  const devices = state.network.devices || [];
  const order = state.network.deviceOrder || [];
  const byDevice = {};
  state.players.forEach(player => {
    const key = player.deviceId || state.network.deviceId;
    if (!byDevice[key]) byDevice[key] = [];
    byDevice[key].push(player);
  });
  const ordered = order.length > 0 ? order : devices.map(device => device.deviceId);
  const mapped = ordered.map(deviceId => {
    const device = devices.find(item => item.deviceId === deviceId) || {
      deviceId,
      deviceName: deviceId === state.network.deviceId ? state.network.deviceName : getDeviceNameById(deviceId),
      isHost: deviceId === state.network.hostDeviceId
    };
    return {
      ...device,
      players: byDevice[deviceId] || []
    };
  });
  Object.entries(byDevice).forEach(([deviceId, players]) => {
    if (mapped.some(item => item.deviceId === deviceId)) return;
    mapped.push({
      deviceId,
      deviceName: getDeviceNameById(deviceId),
      isHost: deviceId === state.network.hostDeviceId,
      players
    });
  });
  return mapped;
}

function reorderPlayerByDrop(sourcePlayerId, targetPlayerId) {
  if (!sourcePlayerId || !targetPlayerId || sourcePlayerId === targetPlayerId) return;
  const source = state.players.find(player => player.id === sourcePlayerId);
  const target = state.players.find(player => player.id === targetPlayerId);
  if (!source || !target) return;
  if (isRealtimeMode() && (source.deviceId || '') !== (target.deviceId || '')) return;
  if (isRealtimeMode()) {
    movePlayerWithinDevice(sourcePlayerId, targetPlayerId);
  } else {
    const targetIndex = state.players.findIndex(player => player.id === targetPlayerId);
    movePlayerToIndex(sourcePlayerId, targetIndex);
  }
}

function reorderDeviceByDrop(sourceDeviceId, targetDeviceId) {
  if (!sourceDeviceId || !targetDeviceId || sourceDeviceId === targetDeviceId) return;
  moveDeviceToIndex(sourceDeviceId, targetDeviceId);
}

function initializeDeviceNameFromContext() {
  try {
    const stored = localStorage.getItem('mafia_device_name');
    if (stored && stored.trim()) {
      state.network.deviceName = stored.trim().slice(0, 32);
    }
  } catch (error) {
    // localStorage unavailable
  }
}

initializeDeviceNameFromContext();
if (!state.network.deviceName.trim()) state.network.deviceName = 'Device 1';
state.network.deviceName = state.network.deviceName.slice(0, 32);
if (window.location.pathname.endsWith('/join.html')) state.realtimePanelMode = 'join';
if (JOIN_CODE_PARAM) {
  normalizeCodeFromInput(JOIN_CODE_PARAM);
  state.multiplayerMode = 'realtime';
  state.realtimePanelMode = 'join';
  state.network.isHost = false;
}
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    try {
      localStorage.setItem('mafia_device_name', state.network.deviceName || 'Device 1');
    } catch (error) {
      // ignore
    }
  });
}

// -----------------------------------------------------------------------------
// RENDERING (imported from render.js)
// -----------------------------------------------------------------------------

// Main render function is defined in render.js

// -----------------------------------------------------------------------------
// EVENT HANDLERS (Global)
// -----------------------------------------------------------------------------

window.goToSetup = () => {
  clearAutoAdvance();
  clearBotChatTimers();
  clearDeathAnimation();
  disconnectRealtimeSession({ keepMode: Boolean(state.joinCode) });
  if (!state.joinCode) state.multiplayerMode = 'passplay';
  state.screen = 'setup';
  state.bots = [];
  state.players = [];
  state.chatMessages = [];
  state.chatDraft = '';
  state.chatSenderId = null;
  state.selectedLocation = null;
  state.selectedAction = null;
  state.selectedActionTarget = null;
  state.selectedTarget = null;
  state.selectedKillMethod = null;
  state.selectedAwareness = null;
  state.selectedSave = null;
  state.selectedVote = null;
  state.discussionUnlockAt = 0;
  state.showMap = false;
  state.lastNarratorPromptKey = null;
  state.pendingNarratorPhase = null;
  state.narrationLog = [];
  state.lastBotChatDay = null;
  state.pendingWin = null;
  render();
};

window.goToSoloLobby = () => {
  disconnectRealtimeSession({ keepMode: false });
  state.multiplayerMode = 'passplay';
  state.screen = 'solo_lobby';
  updateRoleConfig();
  render();
};

window.goToMultiLobby = () => {
  state.screen = 'multi_lobby';
  if (state.realtimePanelMode === 'join' || state.joinCode) {
    state.multiplayerMode = 'realtime';
    state.network.isHost = false;
    state.gameCode = sanitizeRoomCode(state.joinCode || state.gameCode);
    state.joinCode = state.gameCode;
  }
  maybeAutoAssignDeviceName(state.network.devices);
  updateRoleConfig();
  if (isRealtimeMode() && !state.network.connected && state.realtimePanelMode === 'join' && state.joinCode) {
    connectRealtimeSession();
  }
  render();
};

window.showInstructions = () => {
  state.showInstructions = true;
  render();
};

window.hideInstructions = () => {
  state.showInstructions = false;
  render();
};

window.setInstructionsTab = (tab) => {
  state.instructionsTab = tab;
  render();
};

window.showSettings = () => {
  state.showSettings = true;
  render();
};

window.hideSettings = () => {
  state.showSettings = false;
  render();
};

window.toggleSetting = (key) => {
  state.settings[key] = !state.settings[key];
  if (key === 'botChat' && !state.settings.botChat) {
    clearBotChatTimers();
  }
  if (key === 'deathAnimations' && !state.settings.deathAnimations) {
    clearDeathAnimation();
  }
  render();
};

window.setNarratorMode = (mode) => {
  state.settings.narratorMode = mode === 'human' ? 'human' : 'auto';
  state.lastNarratorPromptKey = null;
  if (state.settings.narratorMode === 'human') {
    primeNarratorTurn(state.gamePhase);
  } else {
    clearNarratorTurn();
  }
  queueNarratorChatPrompt(state.gamePhase);
  render();
};

window.setNarratorTone = (tone) => {
  const allowed = new Set(['grim', 'cinematic', 'neutral']);
  state.settings.narratorTone = allowed.has(tone) ? tone : 'grim';
  state.narrative = buildNarration('intro');
  render();
};

window.setBotDelay = (ms) => {
  const value = Number(ms);
  if (Number.isNaN(value)) return;
  state.botDelayMs = Math.max(700, Math.min(2600, Math.round(value)));
  render();
};

window.setMultiplayerMode = (mode) => {
  const nextMode = mode === 'realtime' ? 'realtime' : 'passplay';
  state.multiplayerMode = nextMode;
  if (nextMode === 'realtime') {
    if (!state.realtimePanelMode) state.realtimePanelMode = 'host';
    state.network.isHost = state.realtimePanelMode !== 'join';
    if (state.realtimePanelMode === 'join' && state.joinCode && !state.network.connected) connectRealtimeSession();
  } else {
    disconnectRealtimeSession({ keepMode: true });
  }
  render();
};

window.setRealtimeDeviceName = (value) => {
  applyRealtimeDeviceName(value);
  render();
};

window.setRealtimePanelMode = (mode) => {
  applyRealtimePanelMode(mode);
  render();
};

window.setJoinCodeInput = (value) => {
  applyJoinCodeInput(value);
  render();
};

window.regenerateRoomCode = () => {
  regenerateRoomCode();
  render();
};

window.connectAsHost = () => {
  hostRealtimeRoom();
  render();
};

window.connectAsJoiner = () => {
  joinRealtimeRoom();
  render();
};

window.disconnectRealtime = () => {
  disconnectRealtimeSession({ keepMode: true });
  render();
};

window.addBot = addBot;
window.removeBot = removeBot;
window.renameBot = renameBot;
window.removePlayer = removePlayer;
window.renamePlayer = renamePlayer;
window.movePlayer = movePlayer;
window.moveDevice = moveDevice;
window.reorderPlayerByDrop = reorderPlayerByDrop;
window.reorderDeviceByDrop = reorderDeviceByDrop;
window.scheduleAutoAdvance = scheduleAutoAdvance;
window.clearAutoAdvance = clearAutoAdvance;
window.getVisibleTargetsForMafia = getVisibleTargetsForMafia;
window.toggleMap = toggleMap;
window.closeMap = closeMap;

window.addPlayerFromInput = (nameOverride = null, deviceIdOverride = null) => {
  const input = document.getElementById('newPlayerInput');
  const candidateName = typeof nameOverride === 'string'
    ? nameOverride
    : (input?.value || '');
  if (!candidateName.trim()) return;

  if (addPlayer(candidateName, deviceIdOverride || state.network.deviceId) && input) {
    input.value = '';
    const ensureFocus = () => {
      const refreshed = document.getElementById('newPlayerInput');
      if (refreshed) refreshed.focus();
    };
    requestAnimationFrame(ensureFocus);
    setTimeout(ensureFocus, 24);
  }
};

window.selectPreset = (id) => {
  state.selectedPreset = ROLE_PRESETS.find(p => p.id === id) || ROLE_PRESETS[0];
  updateRoleConfig();
  render();
};

window.selectStory = (id) => {
  state.selectedStory = STORY_PRESETS.find(s => s.id === id) || STORY_PRESETS[0];
  render();
};

window.adjustRole = adjustRole;

function fallbackCopyText(text) {
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    return true;
  } catch (error) {
    return false;
  }
}

window.copyLink = async () => {
  const shareUrl = getShareJoinUrl(state.gameCode);
  const fallbackCode = sanitizeRoomCode(state.gameCode);
  const textToCopy = shareUrl || fallbackCode;
  let copied = false;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(textToCopy);
      copied = true;
    }
  } catch (error) {
    copied = fallbackCopyText(textToCopy);
  }
  if (!copied) {
    fallbackCopyText(textToCopy);
  }
  const btn = document.getElementById('copyBtn');
  if (btn) {
    btn.textContent = copied ? (shareUrl ? '✓ Link Copied!' : '✓ Code Copied!') : 'Copied best-effort';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.textContent = '📋 Copy';
      btn.classList.remove('copied');
    }, 2000);
  }
};

window.startGame = startGame;

window.newGame = () => {
  clearAutoAdvance();
  clearBotChatTimers();
  clearDeathAnimation();
  disconnectRealtimeSession({ keepMode: Boolean(state.joinCode) });
  if (!state.joinCode) state.multiplayerMode = 'passplay';
  state.screen = 'setup';
  state.players = [];
  state.bots = [];
  state.winner = null;
  state.winReason = null;
  state.finalDeath = null;
  state.gamePhase = 'reveal';
  state.nightPlans = {};
  state.snoopAssignments = {};
  state.snoopersByTarget = {};
  state.mafiaSnooperIntel = {};
  state.mafiaBriefing = {};
  state.mafiaVotes = {};
  state.mafiaKillMethods = {};
  state.nightAwareness = {};
  state.nightAttackCounts = {};
  state.nightAttackMethod = null;
  state.doctorSave = null;
  state.votes = {};
  state.intelResults = {};
  state.chatMessages = [];
  state.chatDraft = '';
  state.chatSenderId = null;
  state.selectedLocation = null;
  state.selectedAction = null;
  state.selectedActionTarget = null;
  state.selectedTarget = null;
  state.selectedKillMethod = null;
  state.selectedAwareness = null;
  state.selectedSave = null;
  state.selectedVote = null;
  state.pendingWin = null;
  state.showMap = false;
  state.discussionUnlockAt = 0;
  state.lastNarratorPromptKey = null;
  state.pendingNarratorPhase = null;
  state.narrationLog = [];
  state.lastBotChatDay = null;
  render();
};

window.showCurrentRole = () => {
  state.showRole = true;
  render();
};

window.nextReveal = () => {
  const next = findNextHuman(state.currentPlayerIndex);
  if (next !== -1) {
    state.currentPlayerIndex = next;
    state.showRole = false;
  } else {
    state.gamePhase = 'day';
    state.currentPlayerIndex = 0;
    state.showRole = false;
    state.narrative = buildNarration('day');
    primeNarratorTurn('day');
    const firstHuman = findFirstAliveHumanIndex();
    if (firstHuman !== -1) state.currentPlayerIndex = firstHuman;
    queueNarratorChatPrompt('day');
    withBotDelay(() => botMakeDecisions('day'), Math.max(700, state.botDelayMs));
  }
  render();
};

window.selectLocation = (id) => {
  state.selectedLocation = id;
  state.selectedAction = null;
  state.selectedActionTarget = null;
  render();
};

window.selectAction = (id) => {
  const current = getCurrentPlayer();
  const location = getLocationById(state.selectedLocation);
  const actions = getAvailableActionsForPlayer(current, location);
  state.selectedAction = actions.find(a => a.id === id);
  if (!state.selectedAction?.requiresTarget) state.selectedActionTarget = null;
  render();
};

window.selectActionTarget = (id) => {
  state.selectedActionTarget = id;
  render();
};

window.skipBotDay = () => {
  const next = findNextAlive(state.currentPlayerIndex);
  if (next !== -1) {
    state.currentPlayerIndex = next;
    state.showRole = false;
  } else {
    beginNightPhase();
  }
  render();
};

window.confirmDayPlan = () => {
  const current = getCurrentPlayer();
  const location = getLocationById(state.selectedLocation);
  const action = state.selectedAction;
  const actionTarget = action?.requiresTarget ? state.selectedActionTarget : null;

  state.nightPlans[current.id] = {
    location: state.selectedLocation,
    locationName: location?.name,
    action,
    actionTarget
  };
  state.selectedLocation = null;
  state.selectedAction = null;
  state.selectedActionTarget = null;

  const next = findNextAlive(state.currentPlayerIndex);
  if (next !== -1) {
    state.currentPlayerIndex = next;
    state.showRole = false;
  } else {
    beginNightPhase();
  }
  render();
};

window.selectTarget = (id) => {
  state.selectedTarget = id;
  render();
};

window.selectKillMethod = (methodId) => {
  state.selectedKillMethod = methodId;
  render();
};

window.selectNightAwareness = (awarenessId) => {
  setNightAwareness(awarenessId);
};

window.confirmNightAwareness = () => {
  confirmNightAwarenessForCurrent();
  advanceNightActor();
};

window.skipNightAwareness = () => {
  const fallback = getNightAwarenessById('listen_posts');
  state.selectedAwareness = fallback.id;
  confirmNightAwarenessForCurrent();
  advanceNightActor();
};

window.selectSave = (id) => {
  state.selectedSave = id;
  render();
};

window.continueNight = () => {
  advanceNightActor();
};

window.confirmMafiaTarget = () => {
  const current = getCurrentPlayer();
  if (!state.selectedTarget || !state.selectedKillMethod) return;
  state.mafiaVotes[current.id] = state.selectedTarget;
  state.mafiaKillMethods[current.id] = state.selectedKillMethod;
  state.selectedTarget = null;
  state.selectedKillMethod = null;
  advanceNightActor();
};

window.skipDoctor = () => {
  completeDoctorPhase();
};

window.confirmDoctorSave = () => {
  state.doctorSave = state.selectedSave;
  completeDoctorPhase();
};

window.afterAnnouncement = afterAnnouncement;
window.afterVoteAnnouncement = afterVoteAnnouncement;

window.openDiscussionForCurrent = () => {
  state.showRole = true;
  if (!state.chatSenderId) {
    state.chatSenderId = getCurrentPlayer()?.id || null;
  }
  render();
};

window.advanceDiscussion = () => {
  const remainingMs = Math.max(0, (state.discussionUnlockAt || 0) - Date.now());
  const isMultiDevice = state.multiplayerMode === 'realtime' && (state.network.devices || []).length > 1;
  if (remainingMs > 0) {
    render();
    return;
  }
  if (isMultiDevice && !state.network.isHost) {
    render();
    return;
  }
  window.proceedToVote();
};

window.proceedToVote = () => {
  clearBotChatTimers();
  state.discussionUnlockAt = 0;
  state.gamePhase = 'vote';
  state.currentPlayerIndex = 0;
  state.showRole = false;
  state.narrative = buildNarration('vote');
  primeNarratorTurn('vote');
  addNarrationLog(state.narrative, 'vote');
  queueNarratorChatPrompt('vote');
  state.chatSenderId = null;
  state.chatDraft = '';
  const firstHuman = findFirstAliveHumanIndex();
  if (firstHuman !== -1) state.currentPlayerIndex = firstHuman;
  withBotDelay(() => botMakeDecisions('vote'), Math.max(700, state.botDelayMs));
  render();
};

window.setChatDraft = (value) => {
  state.chatDraft = value;
};

window.setChatSender = (playerId) => {
  state.chatSenderId = playerId;
  render();
};

window.sendDiscussionMessage = (textOverride = null) => {
  if (state.gamePhase !== 'discussion') return;
  const source = typeof textOverride === 'string' ? textOverride : state.chatDraft;
  const text = source.trim();
  if (!text) return;

  const aliveHumans = getAliveHumans();
  const sender = aliveHumans.find(player => player.id === state.chatSenderId)
    || getCurrentPlayer()
    || aliveHumans[0];
  if (!sender) return;

  state.chatMessages.push({
    id: `msg_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    day: state.dayNumber,
    senderId: sender.id,
    senderName: sender.name,
    text,
    at: new Date().toISOString()
  });
  state.chatDraft = '';
  queueBotDiscussion(false, text);
  render();
};

window.refreshDiscussion = () => {
  if (state.gamePhase !== 'discussion') return;
  render();
};

window.selectVote = (id) => {
  state.selectedVote = id;
  render();
};

window.skipBotVote = () => {
  const next = getNextAliveHumanIndex(state.currentPlayerIndex);
  if (next !== -1) {
    state.currentPlayerIndex = next;
    state.showRole = false;
    render();
  } else {
    processVote();
  }
};

window.skipDeadVote = () => {
  const next = getNextAliveHumanIndex(state.currentPlayerIndex);
  if (next !== -1) {
    state.currentPlayerIndex = next;
    state.showRole = false;
    render();
  } else {
    processVote();
  }
};

window.confirmVote = () => {
  const current = getCurrentPlayer();
  state.votes[current.id] = state.selectedVote;
  state.selectedVote = null;

  const next = getNextAliveHumanIndex(state.currentPlayerIndex);
  if (next !== -1) {
    state.currentPlayerIndex = next;
    state.showRole = false;
    render();
  } else {
    processVote();
  }
};

window.processVote = processVote;

window.completeNarratorTurn = () => {
  if (!narratorTurnIsActive(state.gamePhase)) return;
  clearNarratorTurn();
  render();
};

const REALTIME_FORWARD_ACTIONS = new Set([
  'goToSetup',
  'goToMultiLobby',
  'removePlayer',
  'renamePlayer',
  'movePlayer',
  'moveDevice',
  'reorderPlayerByDrop',
  'reorderDeviceByDrop',
  'addPlayerFromInput',
  'addBot',
  'removeBot',
  'renameBot',
  'selectPreset',
  'selectStory',
  'adjustRole',
  'startGame',
  'newGame',
  'showCurrentRole',
  'nextReveal',
  'selectLocation',
  'selectAction',
  'selectActionTarget',
  'confirmDayPlan',
  'selectTarget',
  'selectKillMethod',
  'selectNightAwareness',
  'confirmNightAwareness',
  'skipNightAwareness',
  'continueNight',
  'confirmMafiaTarget',
  'selectSave',
  'confirmDoctorSave',
  'completeNarratorTurn',
  'afterAnnouncement',
  'afterVoteAnnouncement',
  'openDiscussionForCurrent',
  'advanceDiscussion',
  'proceedToVote',
  'setChatSender',
  'setChatDraft',
  'sendDiscussionMessage',
  'selectVote',
  'confirmVote'
]);

const REALTIME_ARG_MAPPERS = {
  addPlayerFromInput: (args) => {
    if (typeof args[0] === 'string') {
      return [args[0], args[1] || state.network.deviceId];
    }
    const input = document.getElementById('newPlayerInput');
    return [input?.value || '', state.network.deviceId];
  },
  sendDiscussionMessage: (args) => {
    if (typeof args[0] === 'string') return args;
    return [state.chatDraft];
  }
};

let realtimeWrappersInstalled = false;

function installRealtimeActionWrappers() {
  if (realtimeWrappersInstalled) return;
  realtimeWrappersInstalled = true;

  REALTIME_FORWARD_ACTIONS.forEach(actionName => {
    const original = window[actionName];
    if (typeof original !== 'function') return;

    window[actionName] = (...args) => {
      if (isRealtimeClient() && !realtime.replayingRemoteAction) {
        const mapper = REALTIME_ARG_MAPPERS[actionName];
        const mappedArgs = mapper ? mapper(args) : args;
        const forwarded = forwardRealtimeAction(actionName, mappedArgs);
        if (forwarded) return;
      }
      return original(...args);
    };
  });
}

installRealtimeActionWrappers();

window.afterRender = () => {
  if (isRealtimeMode() && state.network.connected && state.network.isHost && !realtime.applyingRemoteState) {
    broadcastRealtimeState();
  }
};
