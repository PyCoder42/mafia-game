# Testing Log

This file tracks testing sessions. AI and humans add test results here.

---

## Session 1: Code Analysis (2026-02-09)

**Method:** Static code analysis (no browser)

| Test | Status |
|------|--------|
| Game Balance Validation | PASS |
| Full Game Flow | PASS |
| Game Ending Explanation | PASS |
| Multiplayer Mode | PASS |
| Back Button Navigation | PASS |

**Note:** Code looks correct. Manual browser testing still recommended.

---

## Test Checklist

Use this for browser testing sessions.

### Main Menu
- [ ] Page loads without errors
- [ ] How to Play modal opens
- [ ] How to Play tabs work (Basics, This Version, Multiplayer)
- [ ] Settings modal opens
- [ ] Settings toggles work

### Solo Mode
- [ ] Name entry works
- [ ] Add bot button works
- [ ] Remove bot button works
- [ ] Role presets change configuration
- [ ] Manual +/- role buttons work
- [ ] Mafia >= Town shows warning
- [ ] Start blocked when Mafia >= Town
- [ ] Back button returns to menu
- [ ] Start Game works with valid config

### Multiplayer Mode
- [ ] Add human players works
- [ ] Remove players works
- [ ] Add/remove bots works
- [ ] Copy link button works
- [ ] Back button returns to menu

### Game Phases
- [ ] Role Reveal shows role correctly
- [ ] Day phase - location selection
- [ ] Day phase - action selection
- [ ] Night phase - Mafia target selection
- [ ] Morning - Doctor save option
- [ ] Announcement shows death info
- [ ] Discussion shows intel
- [ ] Vote phase works
- [ ] Vote announcement shows result
- [ ] Day number increments

### Game End
- [ ] Game Over shows winner
- [ ] Shows final death info
- [ ] Shows win reason
- [ ] New Game button works

---

## Session Template

Copy this for new sessions:

```
## Session [N]: [Description] ([Date])

**Tester:** [Name]
**Method:** [Browser/Code Analysis]

### Results
| Test | Status | Notes |
|------|--------|-------|
| ... | PASS/FAIL | ... |

### Bugs Found
- [Description] → Added to TODOS.md

### Notes
[Any observations]
```
