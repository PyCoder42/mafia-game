# Error Log - Mafia Game Testing

Testing Date: 2026-02-07

## Testing Session 1

### Main Menu
- [x] How to Play button - WORKS (opens modal with 3 tabs: Basics, This Version, Multiplayer)
- [x] Solo (vs Bots) button - WORKS
- [ ] Multiplayer button - NOT TESTED YET

### Solo Mode Setup
- [x] Name input field - WORKS (persists between sessions)
- [x] Add Bot button - WORKS (adds bots with random names: Blake, Morgan, Parker, Jordan, etc.)
- [x] Remove Bot functionality - WORKS (X button removes bot)
- [x] Setting selection (all 4 options) - WORKS (tested Blackwood Estate, Midnight Express)
- [x] Role Balance selection (all 4 options) - WORKS (tested Classic, Brutal)
- [x] Mafia +/- buttons - WORKS
- [x] Doctor +/- buttons - WORKS
- [x] Detective +/- buttons - WORKS
- [x] Start Game button (with valid config) - WORKS
- [ ] Back button - NOT TESTED

### Multiplayer Mode Setup
- [ ] Name input field
- [ ] Add Player functionality
- [ ] Remove Player functionality
- [ ] Setting selection
- [ ] Role configuration
- [ ] Start Game button
- [ ] Back button

### Game Flow (Solo)
- [x] Role Reveal phase - WORKS (shows role with description and icon)
- [x] Day phase - location selection - WORKS (4 locations with risk levels)
- [x] Day phase - action selection - WORKS (actions vary by location)
- [x] Night phase - WORKS
- [x] Morning phase - WORKS ("The doctor makes their choice...")
- [ ] Discussion phase - NOT FULLY TESTED (game ended due to balance issue)
- [ ] Vote phase - NOT FULLY TESTED
- [x] Win/Lose conditions - WORKS (showed "Mafia Wins!" with role reveals)

### Settings Modal
- [x] Settings button (gear icon) - WORKS
- [x] Sound Effects toggle - WORKS
- [x] AI Narrator toggle - WORKS
- [x] Bot Chat (AI) toggle - WORKS
- [x] Death Animations toggle - WORKS
- [x] Done button - WORKS (closes modal)

### Console Errors
No JavaScript errors detected in console during testing.

---

## Errors Found

### Error #1: Confusing "Total" Display in Role Configuration
**Location:** Solo Game Setup > Role Balance section
**Description:** The "Total: X/Y" display is confusing. With 6 players and roles set to 1 Mafia + 1 Doctor + 1 Detective + 3 Villagers, it displays "Total: 5/6" instead of "6/6". The first number seems to count only special roles (non-villagers), but this is unclear to users. Users expect "Total" to show all assigned roles.
**Steps to Reproduce:**
1. Go to Solo Game
2. Add 5 bots (6 players total)
3. Select "Classic" role balance
4. Observe "Total: 5/6" even though all 6 players have roles (1+1+1+3=6)
**Severity:** Low (UI/UX confusion)
**Suggested Fix:** Change display to show actual total assigned roles, or rename to "Special Roles: X/Y"

### Error #2: Game Allows Unwinnable Starting Configurations
**Location:** Game Start / Win Condition Check
**Description:** The game allows starting with 2 Mafia vs 2 Town (1 Villager + 1 Doctor). Since Mafia wins when they "equal or outnumber town", this configuration means Mafia wins immediately on game start - the game ends after just the first night without any player interaction or voting.
**Steps to Reproduce:**
1. Go to Solo Game
2. Add 3 bots (4 players total)
3. Select "Brutal" role balance
4. Set Mafia to 2, Doctor to 1, Detective to 0
5. Start game
6. Complete role reveal
7. Plan night action
8. Game immediately ends with "Mafia Wins!"
**Severity:** High (Game balance - unplayable configuration)
**Suggested Fix:** Either:
- Prevent starting game when Mafia >= Town (show validation error)
- Add warning message about unbalanced configuration
- Adjust role presets to ensure playable ratios (Mafia should be < 50% of players)

### Error #3: Game Skips Discussion and Vote Phases (When Mafia Wins Immediately)
**Location:** Game Flow
**Description:** After the Morning phase, the game jumped directly to "Game Over" without showing the Discussion or Vote phases. This is because the win condition was met (Mafia >= Town after a kill), but the UX doesn't explain why the game ended so abruptly.
**Steps to Reproduce:** See Error #2 steps
**Severity:** Medium (UX issue - game ending feels abrupt)
**Suggested Fix:** Show a brief explanation of why the game ended (e.g., "Mafia now equals Town - they have won!")

### Error #4: Missing Favicon
**Location:** Browser tab
**Description:** When loading the page, the browser shows a 404 error for favicon.ico in the server logs.
**Steps to Reproduce:** Load http://localhost:8000 and check server logs
**Severity:** Very Low (cosmetic)
**Suggested Fix:** Add a favicon.ico file or add `<link rel="icon" href="data:,">` to suppress the request

---

## Features Working Well
- Beautiful UI with dark theme and purple accents
- Smooth animations and transitions
- Role reveal with icons and descriptions
- Location-based gameplay with risk/intel system
- Settings persistence within session
- Bot name generation
- All 4 story settings available
- All 4 role balance presets available

## Areas Needing More Testing
- Multiplayer mode
- Full game flow with balanced team (Discussion and Vote phases)
- Back button navigation
- Edge cases (max bots, empty name, etc.)
