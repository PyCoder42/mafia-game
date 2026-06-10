# Night-Stance + Intel Overhaul (12-item pass)

Owner directives (2026-06-09), with the caveat: *verify before assuming broken.* Audit findings (file:line) confirmed below.

## Verdicts from the audit + direct code reading

| # | Item | Verdict | Root cause |
|---|------|---------|-----------|
| 1 | Gimkit join | partial | Portal-URL row shows bare URL (render.js:437), fast link duplicated in second card (456-481); "Show Large" modal capped 500px, no QR (647-663) |
| 2 | Preset types | partial | ROLE_PRESETS ratio-only (game.js:23-28); ENVIRONMENT_PROFILES are the gameplay mechanism but disconnected from presets |
| 3 | Info values | missing | `intel` stat = exposure copy (296, 449); real divergence lives only in getPlanIntelChance (856-863), never rendered |
| 4 | Tradeoff descs | partial | Lock state never consulted in kill resolution (3387: target dies unless doctor save); "quick exit route" desc advertises nonexistent escape |
| 5 | Pod-snoop | partial | snoop_room exists (324) but target diluted into random 3-5 pool (2482-2488); payout only if target is the victim (3295); detection not proximity-gated (2555) |
| 6 | Reliability | partial | Probabilities computed then discarded (3283); definitive prose for random-mafia naming (3286 — draws from ALL mafia, not actual attackers); false_lead dead code (400) |
| 7 | Detective stealth | mostly works | Real: exposure −0.18 (851), intel +0.14 (859), witness 0.62/0.34 (3283), seen 0.35/0.72 (2555). Align copy with numbers |
| 8 | Night stance | redesign | morning_doctor is a doctor-only turn = identity leak; stances generic (106-125) |
| 9 | Chat in discussion | partial | Corner chat writable during discussion but discussion view only references it; embed prominent panel |
| 10 | Map | partial | Floorplan image + room-note cards exist (1077-1134); plain styling, no "you are here", no intro pointer |
| 11 | Intel generation | broken-ish | Watching a non-victim yields nothing (3295, 3328); no movement-based intel; channels too narrow → "no one got intel" |
| 12 | Tutorial | missing | No onboarding of any kind |

## Design

### A. Phase semantics (item 8)
- Keep internal ids (`day`, `night`); relabel UI DAY→EVENING.
- Night stances become role-flavored: mafia = target+method console (unchanged); detective = shadow one person / sweep routes / lay low; doctor = **choose who to protect (the save, before the attack resolves — classic Mafia)**; villager = existing 3 awareness options.
- Delete `morning_doctor` phase + bot branch; processNight resolves vs pre-chosen doctorSave → processMorning → announcement. No doctor identity leak.

### B. Intel rework (items 3/5/6/7/11)
- `INTEL_RELIABILITY = { confirmed: 0.97, likely: 0.78, uncertain: 0.55 }` used for BOTH generation and labels. Intel items become `{ text, confidence }` with renderer tolerant of legacy strings (realtime version skew).
- Channels: (1) pod-snoop payout — target's true night behavior at confirmed (det .97/.9 others), including "slipped out toward X" if target is a killer; (2) witness-near-attack (existing) with attacker-true naming (draw from state.mafiaVotes voters for the target, not all mafia); (3) NEW movement watchers — watchful stances within distance ≤1 of killer's evening node or victim node roll a likely-tier sighting (name correct at .78 else random non-victim); (4) labeled fallbacks. Implement `false_lead`: injects a plausible uncertain-tier decoy into nearby players' intel.
- Pod-snoop targeting: requiresTarget+actionTarget → assignments=[target] + primaryTarget flag; detection proximity-gated (mafia within ≤1 of the watched room: det .55 / others .85 — pod-snooping is dangerous even for detectives).
- Info values: actions get real `info` stat by kind (snoop .78–.9, linger .5, routine .3, hide .15); getPlanIntelChance consumes `info`; UI shows 🔍 Info + ⚠️ Exposure chips (info chip hidden for mafia route cards).

### C. Lock/exit mechanics (item 4)
resolveBedroomDefense() before the doctor save check: locked → 30% break-in abort (victim gets confirmed "someone forced your lock" intel; nearby hear boost), else disturbance +0.25 & save −0.08 (trapped); unlocked → disturbance −0.12, victim escape roll .22 (+.15 with alert adjacent non-mafia) → survives with confirmed personal sighting; porch_watch → no quiet approach, witness bonus. Descriptions rewritten to state exactly these tradeoffs. New state nightDefenseOutcome reset with night fields; included in snapshots automatically (full-state clone).

### D. Preset types (item 2)
- ROLE_PRESETS labeled **Ratio presets**; new **GAMEPLAY_PRESETS** (selectedGameplayPreset, default standard): Standard / Sharp Eyes (detective stealth+ & pod-snoop confirmed+) / Paranoid House (witness+, exposure+) / Deep Cover (witness−, save−). Implemented as multiplicative `gameplayMods` consumed alongside ENVIRONMENT_PROFILES in the adjusted-math helpers. Two labeled sections in lobby; both shown in non-host read-only view.

### E. Join UX (item 1)
- Host "Join portal URL" row now displays/copies getShareJoinUrl() (the fast link); fold the duplicate Fast-Join card into it (keep QR thumbnail + guide).
- "Show QR" button (replaces Show Large) + QR thumbnail click → fullscreen projector overlay: giant code (clamp to 12rem), 480px QR, fast link, light bg, click-anywhere closes. Degrades to giant-code-only if QR (external api.qrserver.com) unavailable.
- Don't touch getJoinPortalUrl() itself (relay derivation depends on it).

### F. Chat (9), Map (10), Tutorial (12)
- Discussion phase embeds renderMultiDeviceChatPanel({prominent:true}) for multi-device.
- Map: styled room cards w/ icons by node type, "📍 you are here" marker from the player's current plan, exposure heat strip, polished modal; one-time "check the map" pointer toast at game start.
- Tutorial: localStorage-gated 5-step overlay on first game start (evening plans → info vs exposure → night stances → intel reliability → map/chat); skippable; replayable via Instructions modal button.

## Verification
Deterministic page-context tests (save-as-stance, lock branches, pod-snoop payout+detection, reliability honesty, info chips); button sweep; 10-run matrix; live Pages + relay MP test.
