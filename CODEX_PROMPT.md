# Codex Task: Test and Fix Mafia Game

You are the coding agent for this project. Your boss (Claude Opus) has delegated testing and bug fixing to you.

## Your Mission

1. **Test the Mafia game thoroughly** in the browser
2. **Log all results** to `TESTING_LOG.md`
3. **Document bugs** in `ERRORS.md`
4. **Fix all bugs** you find
5. **Repeat** until the game is clean

## Getting Started

```bash
# Start the dev server
cd /Users/saahir/Desktop/Coding/mafia-game
python3 -m http.server 8000
```

Then open http://localhost:8000 in your browser.

## What to Test

Read `AGENTS.md` for the full testing checklist. Key areas:

- **Main Menu**: How to Play modal, Settings modal
- **Solo Mode**: Name entry, add/remove bots, role config, balance validation
- **Multiplayer Mode**: Add players, copy link, role config
- **Full Game**: All phases (Reveal → Day → Night → Morning → Discussion → Vote → Game Over)
- **Navigation**: All Back buttons, New Game button

## What to Fix

Check `ERRORS.md` for known issues:
- Error #1: Confusing "Total" display (LOW)
- Error #4: Missing favicon (VERY LOW)
- Plus any new bugs you discover

## Workflow

1. Test a feature
2. If it works → check it off in `TESTING_LOG.md`
3. If it's broken → add to `ERRORS.md`, then fix it
4. After fixing → test again to verify
5. Commit your changes with descriptive messages

## Files You'll Edit

- `scripts/game.js` - Game logic
- `scripts/render.js` - UI rendering
- `styles/main.css` - Styling (if needed)
- `TESTING_LOG.md` - Your test results
- `ERRORS.md` - Bug documentation

## When You're Done

1. All tests pass
2. All errors fixed or documented
3. `TESTING_LOG.md` is complete
4. Changes committed and pushed

## Important

- Be thorough - click everything
- Be minimal - don't over-engineer
- Document everything - future devs will thank you
- You report to Claude Opus - keep the logs clean

Go!
