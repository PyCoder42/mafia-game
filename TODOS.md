# TODO List

Status key:
- `[ ]` = not implemented yet
- `[x]` = implemented in code

Tracking rule:
- Keep active work here.
- After an item is thoroughly tested, remove it from this list.

Priority legend:
- `Priority-0` = highest urgency / gameplay-breaking
- `Priority-1` = core systems and mode flow
- `Priority-2` = UX, readability, and polish
- `Priority-3` = infrastructure/process

---

## Priority-0 Active Request (33 Items)

- [x] - Narrator turn flow: narrator gets device first each phase with distinct narrator UI; copy must clearly say verbal delivery for single-device and chat delivery for multi-device.
- [x] - Default device naming: sequential `Device 1`, `Device 2`, `Device 3` as devices are added.
- [x] - Lobby clarity: show players grouped by device; bots shown separately (not tied to a device); only host can add bots.
- [x] - Remove player-facing relay internals: hide `ws://...` and editable relay fields; show room code + join URL + direct hotlink.
- [x] - Help icon polish: keep rounded-square style but remove white focus ring/border artifact when clicked.
- [x] - Auto-generate user-friendly join links based on runtime context (`localhost`, `127.*`, `192.*`, `file://`) without technical setup text.
- [x] - Replace arrow reordering with drag-handle UX (3-line icon on left, drag/drop behavior).
- [x] - File-mode host/join split: support dedicated join entry path (separate join HTML path) and clear host/join choice in multiplayer.
- [x] - Fix multi-device connection reliability issue where both devices show `Connection: offline`.
- [x] - Add bot name editing.
- [x] - Keep `?` help access visible at all times during play/lobby.
- [x] - Instructions overhaul: always include exposure explanation, merge basics+gameplay tab content, and emphasize full-rules reading for this variant.
- [x] - Bot pace slider must visibly affect turns: add animated `...` thinking indicator and apply delay consistently.
- [x] - Fix `Blood Moon` preset balance so 11-player default does not start at mafia parity/outnumber.
- [x] - Rename preset currently labeled `Aftershock`.
- [x] - Separate role presets from non-role gameplay settings so role tuning can be edited independently.
- [x] - Expand setting descriptions beyond short fragments; make them readable and informative.
- [x] - Differentiate Station Prometheus `Cargo Hold` vs `Reactor Tunnel` (not identical exposure/routes).
- [x] - Mafia route system redesign: location-specific options and mafia-facing risk framing (not copy/paste same 3 actions everywhere).
- [x] - Sort action options by stat percent low -> high.
- [x] - Add a visible map toggle/icon at top that any player can open.
- [x] - Improve villager snoop discoverability (clear prompts/labels so it is easy to find).
- [x] - Standardize exposure definition in UI/docs: `your exposure to information and threats`.
- [x] - Remove technical narrator line tone (for example, `Exposure climbs as intel improves`) and replace with in-world narration.
- [x] - Ensure narrator phase cues are consistent and non-role-spoiling (no accidental per-player secret phrasing).
- [x] - Mafia target panel clarity: remove confusing snooper phrasing and increase contrast/readability of critical intel text.
- [x] - Replace `noise` wording in player copy with clearer wording tied to survival chance and witness likelihood.
- [x] - Sort attack methods and similar stat-based option lists low -> high by displayed percentage.
- [x] - Morning doctor flow: choose who to save using intel; remove confusing alternate prompt behavior.
- [x] - Remove medicine system completely.
- [x] - Add meaningful night turns for villagers (single-device handoff included).
- [x] - Endgame pacing: show event/narration sequence before declaring winner (avoid abrupt instant game-over).
- [x] - Adjust mafia win threshold so single early kill does not immediately end the game in low-player states.

---

## Major Overhaul (Track Only, Do Not Implement Yet)

- [ ] - Split project into a fuller multi-page structure (separate host/join and related JS modules) as a planned architecture cleanup after current gameplay fixes stabilize.
