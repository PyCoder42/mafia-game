# Mafia Game

A browser-based implementation of the classic Mafia party game with location-based gameplay mechanics.

## Project Structure

```
mafia-game/
├── index.html          # Main entry point
├── styles/
│   └── main.css        # All CSS styles
├── scripts/
│   ├── game.js         # Game logic, state management, event handlers
│   └── render.js       # All rendering/UI functions
├── venv/               # Python virtual environment (for dev server)
├── .gitignore
└── CLAUDE.md           # This file
```

## Tech Stack

- **Frontend**: Vanilla JavaScript (no framework)
- **Styling**: CSS3 with CSS custom properties (variables)
- **Fonts**: Google Fonts (Playfair Display, Crimson Text)
- **No build step required** - runs directly in browser

## Architecture

### State Management
Single global `state` object in `game.js` holds all game data:
- Screen/phase tracking
- Player/bot lists
- Role configurations
- Night plans, votes, intel results
- UI state (modals, selections)

### Rendering
Pure functions in `render.js` that generate HTML strings:
- `render()` - main dispatcher based on `state.screen`
- `renderSetup()`, `renderSoloLobby()`, `renderMultiLobby()` - lobby screens
- `renderGame()` - game screen with phase-specific sub-renderers
- Phase renderers: `renderRevealPhase()`, `renderDayPhase()`, `renderNightPhase()`, etc.

### Event Handling
Global functions attached to `window` for onclick handlers:
- Navigation: `goToSetup()`, `goToSoloLobby()`, etc.
- Player management: `addBot()`, `removeBot()`, `addPlayer()`
- Game actions: `selectLocation()`, `selectAction()`, `confirmDayPlan()`

## Game Mechanics

### Roles
- **Villager**: Basic town role, survives and votes
- **Mafia**: Knows teammates, eliminates one player per night
- **Doctor**: Can save one player from death each night
- **Detective**: Higher intel gathering from actions

### Game Flow
1. **Role Reveal** - Each player sees their role
2. **Day** - Players choose location + action for the night
3. **Night** - Mafia chooses target, actions resolve
4. **Morning** - Doctor saves (if applicable), death announced
5. **Discussion** - Players share intel, discuss
6. **Vote** - Majority vote eliminates one player
7. Repeat until win condition

### Intel System
- Actions have `intel` (0-1) and `risk` (0-5) values
- Higher intel = better chance to learn info
- Being at same location as murder = chance to witness
- Risk correlates with exposure to danger

## Development

### Running Locally
```bash
# Option 1: Python server
cd mafia-game
python3 -m http.server 8000

# Option 2: Any static server
npx serve .
```

Then open http://localhost:8000

### Virtual Environment
```bash
# Activate
source venv/bin/activate

# Install pip (if needed)
python3 -m ensurepip --upgrade

# Deactivate
deactivate
```

## Key Patterns

### Adding New Locations
Add to `STORY_PRESETS[].locations[]` in `game.js`:
```js
{
  id: 'unique_id',
  name: 'Display Name',
  risk: 0-5,
  canLock: true/false,
  actions: [
    { id: 'action_id', name: '🎯 Action Name', intel: 0-1, risk: 0-5, desc: 'Short description' }
  ]
}
```

### Adding New Roles
1. Add to `ROLES` constant in `game.js`
2. Update `calculateRolesFromPreset()` if role should be auto-assigned
3. Add UI controls in `renderRoleConfig()`
4. Handle role-specific behavior in phase processors

### Styling
CSS uses custom properties defined in `:root`:
- `--bg-dark`, `--bg-card` - backgrounds
- `--text-primary`, `--text-secondary` - text colors
- `--purple-accent`, `--red-accent`, etc. - theme colors

## TODO / Future Improvements

- [ ] Add sound effects (settings placeholder exists)
- [ ] AI narrator for atmosphere (settings placeholder exists)
- [ ] Bot chat during discussion
- [ ] Death animations
- [ ] WebSocket multiplayer (currently pass-and-play)
- [ ] Persistent game state (localStorage)
- [ ] More story settings
- [ ] Additional roles (Jester, Vigilante, etc.)
