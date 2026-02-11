# Codex Agent Instructions

You are working on the Mafia party game project. Your supervisor (Claude Opus) has delegated testing and bug fixing to you.

## Your Role

You are the **coding agent** responsible for:
1. Testing the game thoroughly in the browser
2. Logging all test results to `TESTING_LOG.md`
3. Converting errors found into `ERRORS.md`
4. Fixing individual errors
5. Repeating the test-fix cycle until clean

## Project Overview

- **Tech**: Vanilla JavaScript, CSS3, no build step
- **Files**: `index.html`, `scripts/game.js`, `scripts/render.js`, `styles/main.css`
- **Server**: Run `python3 -m http.server 8000` then open http://localhost:8000

## Testing Workflow

### Step 1: Test the Game
Play through these scenarios and log results:

1. **Solo Mode Setup**
   - Click Solo (vs Bots)
   - Enter your name
   - Add 4-5 bots
   - Try different role presets (Classic, Brutal, Chaos, Mystery)
   - Test the +/- buttons for role adjustments
   - Verify Mafia >= Town shows warning and blocks start

2. **Multiplayer Mode Setup**
   - Click Multiplayer
   - Add human players by name
   - Add bots
   - Test role configuration
   - Test share link copy button

3. **Full Game Flow** (use Solo with 5 bots)
   - Role Reveal phase - click to see role
   - Day phase - select location and action
   - Night phase - if Mafia, select target
   - Morning - if Doctor, select save
   - Announcement - read death message
   - Discussion - review intel
   - Vote phase - cast vote
   - Vote announcement - see result
   - Repeat until game ends
   - Game Over - verify explanation shown

4. **Navigation**
   - Back buttons from Solo/Multiplayer lobbies
   - How to Play modal (all tabs)
   - Settings modal (all toggles)
   - New Game from Game Over

### Step 2: Log Results to TESTING_LOG.md

Format each test as:
```markdown
## Test: [Name]
**Status:** PASS | FAIL | ISSUE
**Steps:**
1. Did X
2. Did Y
**Expected:** Z
**Actual:** Z (or describe bug)
**Screenshot/Evidence:** (if applicable)
```

### Step 3: Convert Errors to ERRORS.md

When you find bugs, add them to ERRORS.md:
```markdown
## Error #[N]: [Short Title]
**Severity:** HIGH | MEDIUM | LOW
**Location:** [file:line if known]
**Description:** What's broken
**Steps to Reproduce:**
1. ...
2. ...
**Expected Behavior:** ...
**Actual Behavior:** ...
**Suggested Fix:** (if obvious)
```

### Step 4: Fix Errors

For each error in ERRORS.md:
1. Understand the root cause
2. Make minimal, focused fixes
3. Test the fix
4. Mark the error as FIXED in ERRORS.md
5. Move to next error

### Step 5: Repeat

After fixing all errors, run through tests again. New bugs may surface. Repeat until clean.

## Important Guidelines

- **Be thorough** - Click every button, try edge cases
- **Be minimal** - Don't over-engineer fixes
- **Be safe** - Don't break working code
- **Document everything** - Future you will thank you

## Files to Edit

- `scripts/game.js` - Game logic, state, event handlers
- `scripts/render.js` - UI rendering functions
- `styles/main.css` - Styling (rarely needs changes)
- `TESTING_LOG.md` - Your test log
- `ERRORS.md` - Bug tracker

## Communication

You report to Claude Opus. When done with a testing cycle:
1. Update TESTING_LOG.md with all results
2. Update ERRORS.md with any bugs found
3. Commit your changes with descriptive messages

## Current Status

Previous fixes completed:
- Game balance validation (Mafia >= Town blocked)
- Game ending explanation (shows why game ended)

Your job now: **Complete thorough browser testing and fix any remaining issues.**

Good luck!
