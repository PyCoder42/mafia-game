# TODO List

**This list is in priority order.** Add new items where they belong, not always at the end.

---

## Bugs to Fix

- [ ] **Confusing "Total" display** - Shows "Total: 5/6" when all 6 roles are assigned. Either show actual total or rename to "Special Roles"
- [ ] **Missing favicon** - Add `<link rel="icon" href="data:,">` to suppress 404

## Gameplay Improvements

- [ ] **Solo mode UX** - Don't bother with "reveal my role" button or "[player name]'s turn" text. It's one player, make it feel different.
- [ ] **Better role scaling** - 1 doctor/detective for 12 players is unbalanced. Scale roles with player count:
  - Classic: More doctors than detectives
  - Brutal: More detectives than doctors
  - Chaos: Very few doctors
- [ ] **Rework Mystery and Chaos presets** - Current ones aren't great
- [ ] **Deselect preset when customizing** - If you manually adjust roles, clear the preset selection
- [ ] **Enter key in multiplayer** - Press Enter to add player instead of clicking button

## Intel & Risk System

- [ ] **Risk/Intel display** - Show percentages with color gradient (green=low risk, yellow=medium, red=high)
- [ ] **Location-based actions** - Actions should vary by location risk level, not be generic
- [ ] **Bring back lock/listen options** - "Lock pod" vs "listen through door" mechanics got lost somewhere
- [ ] **Mafia vision** - Mafia should see who's around them and what they're doing
- [ ] **Snoopers get intel** - People actively snooping should learn more
- [ ] **Hide other players' plans** - You shouldn't see where others plan to go during day planning

## Multiplayer Features

- [ ] **Multi-device lobby** - Join code, device list (hide if single device)
- [ ] **Chat lobby** - Prominent chat for multi-device games
- [ ] **Message attribution** - If multiple players on one device, choose who sends message
- [ ] **WebSocket support** - Currently pass-and-play only

## Polish

- [ ] **Sound effects** - Settings toggle exists but not implemented
- [ ] **AI narrator** - Preset prompts for atmosphere (no API needed)
- [ ] **Bot chat** - Simple preset messages like "I think this person is suspicious"
- [ ] **Death animations** - Settings toggle exists but not implemented

## Code Quality

- [ ] **Keep files separate** - Don't squeeze into one file
- [ ] **Create compressed backup** - Single-file version in parent directory, update occasionally

---

## Completed

- [x] Game balance validation - Mafia >= Town now blocked with warning
- [x] Game ending explanation - Shows who died and why game ended
