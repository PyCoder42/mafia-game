# Error Log - Mafia Game

This file tracks bugs found during testing. Codex agent updates this file.

---

## Fixed Errors

### Error #2: Game Allows Unwinnable Starting Configurations [FIXED]
**Severity:** HIGH
**Location:** `scripts/game.js` - `canStart()`, `getStartWarnings()`, `getStartBlockReason()`
**Description:** Game allowed starting with Mafia >= Town, causing instant Mafia win.
**Fix Applied:** Added validation to block start when Mafia >= Town, shows warning message.

### Error #3: Game Skips to Game Over Without Explanation [FIXED]
**Severity:** MEDIUM
**Location:** `scripts/game.js` - `checkWin()`, `scripts/render.js` - `renderGameOverPhase()`
**Description:** Game ended abruptly without explaining why.
**Fix Applied:** Added `winReason` and `finalDeath` to state, displayed on Game Over screen.

---

## Open Errors

### Error #1: Confusing "Total" Display in Role Configuration
**Severity:** LOW
**Location:** `scripts/render.js` - Role configuration section
**Description:** "Total: X/Y" shows special roles only, not all assigned roles. Confusing UX.
**Steps to Reproduce:**
1. Go to Solo Game
2. Add 5 bots (6 players total)
3. Select "Classic" role balance
4. Observe "Total: 5/6" even though all 6 players have roles
**Suggested Fix:** Change to show actual total, or rename to "Special Roles: X/Y"

### Error #4: Missing Favicon
**Severity:** VERY LOW
**Location:** `index.html`
**Description:** Browser requests favicon.ico and gets 404.
**Suggested Fix:** Add `<link rel="icon" href="data:,">` to suppress request.

---

## Errors Found This Session

(Codex: Add new errors below this line using this format)

```
### Error #[N]: [Title]
**Severity:** HIGH | MEDIUM | LOW
**Location:** [file and function/line]
**Description:** What's broken
**Steps to Reproduce:**
1. ...
2. ...
**Expected:** ...
**Actual:** ...
**Suggested Fix:** ...
```

---

## Workflow for Codex

1. **Find bug during testing** → Add to "Errors Found This Session"
2. **Fix the bug** → Move to "Fixed Errors" with [FIXED] tag
3. **Can't fix** → Leave in Open Errors with notes

When all errors are fixed, run full test again. Repeat until clean.
