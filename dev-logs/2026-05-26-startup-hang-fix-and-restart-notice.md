# Dev Log — 2026-05-26 — Fix 10 s startup hang & prominent restart notice

## Version: 0.9.0 (patch)

---

### Context

Two issues reported after the 0.9.0 upgrade:

1. **Startup hang** — AI Tools took ~10 seconds to become usable every time
   Obsidian opened. The chat panel sat unresponsive while the plugin loaded.
2. **Restart not obvious** — The post-upgrade Notice said "open Settings to
   update the npm package" but never told the user to restart Obsidian. The
   new code only takes effect after a restart, so users were confused when
   changes didn't appear.

---

### 1. `commandExists` → `commandExistsAsync` (root-cause freeze fix)

**Status**: ✅ Fixed

**File changed:** `src/adapters/acp/acp.adapter.ts`

**Problem:** `commandExists()` used `spawnSync` — which **blocks the Node.js
event loop** (and therefore the Electron renderer) for its entire timeout
duration. On macOS/Linux it spawns a login shell (`-l` flag) that sources
`.zshrc`, `.nvm`, `.bashrc`, conda init, etc. On a typical developer machine
this easily takes 3–5 seconds and freezes the Obsidian UI completely while
`initialize()` runs during workspace restoration at startup.

**Fix:** Replaced with `commandExistsAsync()` using async `spawn` wrapped in
a Promise. Key design decisions:

- **Timeout resolves `true`** (not `false`): if the shell check times out we
  assume the command *might* exist and proceed. The real agent-spawn attempt
  will surface a meaningful error if the binary is actually missing. A
  false-positive is far safer than a false-negative here.
- **Reduced timeout 4000ms → 3000ms**: the async version doesn't block
  anything, but tighter is still better for UX.
- Removed the now-unused `spawnSync` import.

**Why the login shell is still needed:** Obsidian is a GUI app — its
inherited PATH from launchctl/Windows desktop doesn't include
`/usr/local/bin`, `~/.npm-global/bin`, or nvm-managed paths. The async check
uses the same login shell the agent-spawn itself uses, so both agree on
whether the binary is findable.

---

### 2. `runNpmListGlobal` and `runForVersion` timeouts halved

**Status**: ✅ Fixed

**File changed:** `src/shared/version-checker.ts`

| Function | Before | After |
|---|---|---|
| `runForVersion` (node/npm --version, npm root -g) | 5 000 ms | 3 000 ms |
| `runNpmListGlobal` (npm list -g --json fallback) | 10 000 ms | 5 000 ms |

These are async so they don't freeze the UI, but they do gate the version
check completion. The 10-second `runNpmListGlobal` was the worst case: if
none of the fast filesystem lookups succeeded, the version check hung for 10
seconds before showing (or not showing) the update banner. Halved to 5 s max
with no loss of functionality — npm responds well under that on any
reasonable machine.

---

### 3. Version-check effect delayed 3 s on startup

**Status**: ✅ Fixed

**File changed:** `src/components/chat/ChatView.tsx`

The agent npm-package version-check `useEffect` previously fired immediately
on mount. Even though the check itself is async, it spawns several child
processes (npm, where.exe/which, cmd.exe) right as the agent process is also
being initialised — adding process-spawn pressure during the most sensitive
moment of startup.

Added a `window.setTimeout(..., 3000)` around the entire async body. The
delay is cancelled cleanly on unmount and when the dependency array changes
(agent switch), so no stale checks can fire after the component tears down.

---

### 4. Persistent upgrade notice with "Restart Now" button

**Status**: ✅ Complete

**Files changed:** `src/plugin.ts`, `styles.css`

**Before:** 12-second auto-dismissing Notice that said:
> "AI Tools updated from v0.8.9 to v0.9.0. If Claude Agent fails to connect,
> open Settings → AI Tools to update the npm package."

No mention of restarting Obsidian.

**After:** Persistent Notice (timeout = 0, stays until dismissed) with:

```
✅ AI Tools updated v0.8.9 → v0.9.0
Restart Obsidian to apply the update.
[Restart Now]  [Later]
```

**Restart Now** calls
`app.commands.executeCommandById('app:reload')` — Obsidian's built-in
reload command. Falls back to `window.location.reload()` if the command
isn't available (edge case in older Obsidian versions).

**Later** dismisses the Notice without restarting.

The styled button row uses `mod-cta` on the primary button so it renders as
a highlighted action inside the notice, matching Obsidian's HIG for
primary/secondary controls. Corresponding CSS added to `styles.css`.

---

### Files touched

```
M  src/adapters/acp/acp.adapter.ts    spawnSync → spawn (commandExistsAsync)
M  src/components/chat/ChatView.tsx   3-second delay on version-check effect
M  src/plugin.ts                      persistent restart notice with button
M  src/shared/version-checker.ts      10s → 5s, 5s → 3s timeouts
M  styles.css                         upgrade-notice button-row styles
```

---

### Tested

- ✅ TypeScript build clean (`tsc -noEmit -skipLibCheck`)
- ✅ Paul's Obsidian — pushed and deployed

### Not yet tested

- Cold-start timing on macOS (login shell async path)
- "Restart Now" button in a live Obsidian instance

---

**End of Log**
