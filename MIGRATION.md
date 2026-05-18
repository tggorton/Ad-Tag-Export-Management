# Migration Guide — Old Mac → New Mac (via Dropbox)

This project is being moved from one mac to another. The two accounts
differ in username AND the new mac will host the project inside a
Dropbox folder for sync/backup, not on Desktop.

| | Old mac | New mac |
|---|---|---|
| Username | `grantgorton` | `ggorton` |
| Project location | Desktop | Dropbox (offline-available) |
| Likely project path | `/Users/grantgorton/Desktop/Projects/Radius-AdTags-Prototype` | `/Users/ggorton/Dropbox/Grant Gorton/Projects/Radius-AdTags-Prototype` |

Two things make this trickier than a same-machine same-username move:

1. **Path with spaces.** `"Grant Gorton"` has a space, which Claude
   Code's transcript-folder naming may or may not preserve as-is. The
   exact folder name has to be confirmed on the new mac before
   restoring transcripts. There's a one-line discovery command for
   this below.
2. **Dropbox vs. local disk.** Modern Dropbox on macOS mounts at
   `~/Library/CloudStorage/Dropbox-<account>/` with `~/Dropbox` as a
   legacy symlink. Whatever path VSCode opens with is what Claude Code
   sees, but the symlink may or may not get resolved depending on
   tooling. Plus there are real Dropbox-specific pitfalls (node_modules,
   `.git/`) that need a deliberate choice before you start using the
   folder for active development.

---

## Dropbox setup — read this before copying anything

### 1. Confirm Dropbox is set to "make available offline"

You already noted this. Double-check on the new mac that the
`Radius-AdTags-Prototype` folder (and its parents) shows the green
checkmark / "available offline" indicator in Finder. If any part of
the path is cloud-only, Claude Code / VSCode / `node` will see
placeholder files instead of real content. Symptoms: bizarre EPERM
errors, npm installs that hang, files that "exist" in `ls` but can't
be read.

### 2. Exclude `node_modules/` from Dropbox sync

This is the single most important rule for putting a JavaScript
project in Dropbox. A populated `node_modules/` is tens of thousands
of small files; syncing it cripples Dropbox and bloats your cloud
storage. Two options:

**Option A — Dropbox "Selective Sync" / "Ignore" (recommended).**
Right-click `node_modules/` in Finder once it exists (after your
first `npm install` on the new mac) → **Sync → Ignore** (or
**Selective Sync** in older Dropbox). Dropbox stops syncing that
subtree.

If Dropbox doesn't offer the Sync menu directly, you can set the
ignore attribute manually:

```bash
xattr -w com.dropbox.ignored 1 "/Users/ggorton/Dropbox/Grant Gorton/Projects/Radius-AdTags-Prototype/node_modules"
```

**Option B — symlink `node_modules/` outside Dropbox.** Slightly
more involved; useful if you've had problems with Option A:

```bash
cd "/Users/ggorton/Dropbox/Grant Gorton/Projects/Radius-AdTags-Prototype"
mkdir -p ~/.node_modules_cache/radius-adtags-prototype
ln -s ~/.node_modules_cache/radius-adtags-prototype ./node_modules
npm install   # populates the cache dir; Dropbox sees only the symlink
```

### 3. Consider whether `.git/` belongs in Dropbox

Git's internal state (refs, packed objects, hooks) is sensitive to
partial sync. The risk only really materializes if you have the
project open on two machines simultaneously and git operations race;
for a one-mac-at-a-time workflow it's not a problem. Since the OLD
mac is going to keep working alongside the new one for ~a week, this
is worth thinking about.

Pragmatic recommendation: **don't open the project on the old mac
once it lives in Dropbox on the new mac.** Treat the old mac as
read-only / scratch. Or use Dropbox's ignore feature on `.git/` too:

```bash
xattr -w com.dropbox.ignored 1 "/Users/ggorton/Dropbox/Grant Gorton/Projects/Radius-AdTags-Prototype/.git"
```

Downside: `.git/` no longer backs up to Dropbox. Mitigation: `origin/main`
on GitHub is the durable source anyway.

### 4. Confirm what path Claude Code actually sees

After you've put the project at the Dropbox location on the new mac
and you open VSCode + Claude Code there, the very first thing to
check is what path Claude reports as its working directory. Either:

- Ask Claude Code in chat: *"What is your current working directory?"*
- Or run via bash inside Claude: `pwd`

Note that path verbatim. It might be either:
- `/Users/ggorton/Dropbox/Grant Gorton/Projects/Radius-AdTags-Prototype` (legacy symlink path), or
- `/Users/ggorton/Library/CloudStorage/Dropbox-<account>/Grant Gorton/Projects/Radius-AdTags-Prototype` (canonical Dropbox path)

That path determines the transcript folder name. Step 2 of the
post-migration setup below tells you how to derive the folder name
from whatever path you saw.

---

## Claude Code state — project-level vs. user-level

It helps to know up front what Claude Code stores where, because some
of it travels with the project folder copy and some doesn't.

| Type of state | Location | Travels with project folder? |
|---|---|---|
| **Project skills** | `<project>/.claude/skills/<name>/` | ✅ Yes — inside the folder |
| **Project conversation transcripts** | `~/.claude/projects/<encoded-path>/*.jsonl` | ❌ No — needs snapshot |
| **Project auto-memory** | `~/.claude/projects/<encoded-path>/memory/` | ❌ No — needs snapshot |
| **User-level skills** | `~/.claude/skills/<name>/` | ❌ No — needs snapshot |
| **User-level agents** | `~/.claude/agents/<name>/` (if any) | ❌ No — needs snapshot |
| **Global settings** | `~/.claude/settings.json` | ❌ No — copy manually if wanted |
| **Global user memory / instructions** | `~/.claude/CLAUDE.md` (if it exists) | ❌ No — copy manually if wanted |

For this project specifically: we built one skill (`log-time`) and it's
project-level — it lives at `<project>/.claude/skills/log-time/SKILL.md`
and rides along with the folder copy for free. The new Claude Code
instance auto-discovers it as soon as you open the project on the new
mac. No extra step.

Other user-level state needs explicit snapshot steps, below.

## What travels automatically (folder copy alone)

- All source code under `src/`
- `package.json` / `package-lock.json` / configs (`tsconfig.json`,
  `vite.config.ts`)
- Committed docs at the project root: `TIME_LOG.md`, `SESSION_LOG.md`,
  this `MIGRATION.md`
- `_Code-Reference/`, `_Image-Reference/` (design source-of-truth)
- The `.claude/skills/log-time/SKILL.md` skill — the new Claude Code
  instance auto-discovers it from inside the project
- `.git/` and the full commit history
- `.gitignore`

## What does NOT travel without the snapshot step

- Claude Code conversation transcripts (`~/.claude/projects/.../*.jsonl`)
- Auto-memory entries (`~/.claude/projects/.../memory/MEMORY.md` and
  per-rule files like `feedback_dev_server_ports.md`)
- Background task outputs (`~/.claude/projects/.../tasks/`)
- **User-level skills** (`~/.claude/skills/`) — anything you've built
  or installed globally that's not tied to a specific project
- **User-level agents** (`~/.claude/agents/`) if you've configured any
- **Global settings** (`~/.claude/settings.json`)
- **Global user memory** (`~/.claude/CLAUDE.md`) if you've created one
- `node_modules/` (gitignored, will be reinstalled via `npm install`)
- `dist/`, `.vite/` (build artifacts, regenerated)
- App's localStorage in the browser (different browser profile)

---

## Pre-migration steps (run on the OLD mac, right before transferring)

### 1. Commit and push any in-flight work

```bash
cd /Users/grantgorton/Desktop/Projects/Radius-AdTags-Prototype
git status
# resolve any uncommitted changes, then push
git push origin main
```

This ensures the GitHub repo is your durable source of truth in case
anything goes wrong with the local copy or the Dropbox sync.

### 2. Snapshot the Claude Code transcripts into the project folder

```bash
cd /Users/grantgorton/Desktop/Projects/Radius-AdTags-Prototype
mkdir -p _claude-transcripts/snapshot
cp -R ~/.claude/projects/-Users-grantgorton-Desktop-Projects-Radius-AdTags-Prototype/. \
  _claude-transcripts/snapshot/
echo "_claude-transcripts/" >> .gitignore
```

Notes:
- `_claude-transcripts/` is gitignored on purpose — transcripts
  contain every PAT pasted into chat (revoked, but scanners still
  flag them) plus a lot of tool-output bulk.
- The leading underscore puts it visually next to `_Code-Reference/`
  and `_Image-Reference/` but stays clearly separated from source.
- Expected size: ~10–20 MB depending on conversation length.

### 3. Verify the snapshot

```bash
du -sh _claude-transcripts
ls _claude-transcripts/snapshot
```

You should see at least one `<uuid>.jsonl` file (the transcript) and
a `memory/` subdirectory (auto-memory entries). If `memory/` is
missing, the auto-memory restoration won't work — that's not
catastrophic, just means the new Claude Code session starts without
saved memories.

### 4. Confirm the gitignore stuck

```bash
git status _claude-transcripts/
# should show nothing — the folder is gitignored
```

### 5. Snapshot user-level Claude Code state (skills + agents + settings)

This bundles everything in `~/.claude/` *except* the per-project
`projects/` subfolder (already handled in step 2).

```bash
cd /Users/grantgorton/Desktop/Projects/Radius-AdTags-Prototype
mkdir -p _claude-user-state/snapshot
rsync -a --exclude='projects/' ~/.claude/ _claude-user-state/snapshot/
echo "_claude-user-state/" >> .gitignore
```

What this captures (whichever of these exist on the old mac):
- `~/.claude/skills/` — every user-level skill
- `~/.claude/agents/` — every user-level agent definition
- `~/.claude/settings.json` — your global Claude Code settings
  (permission allowlist, hooks, statusline, theme, model picks, etc.)
- `~/.claude/CLAUDE.md` — global user memory / instructions, if any
- any other top-level files Claude Code uses (history, etc.)

Verify the snapshot:

```bash
du -sh _claude-user-state
ls _claude-user-state/snapshot
```

If `_claude-user-state/snapshot/skills/` doesn't exist after the
rsync, you have no user-level skills currently — only project-level
(which already travels with the folder copy). That's fine; the
rsync is a no-op for missing source directories.

> Privacy / hygiene note: `settings.json` may contain machine-specific
> hook commands or absolute paths that reference `/Users/grantgorton/...`.
> Skim it on the new mac during the restore step before you accept
> it wholesale, and edit out anything that doesn't apply to the new
> machine.

---

## Copy the project folder to the new mac

Pick whichever path is least error-prone:

- **External SSD** (fastest, no internet required)
- **AirDrop the folder** (works for folders this size, mac-to-mac)
- **rsync over local network** (`rsync -avh --progress`)
- **Upload to Dropbox manually from the OLD mac**, then on the new mac
  it appears in Dropbox automatically. This may be slow given the
  reference assets, but it does the move and the cloud copy in one
  step. If you go this route, copy into the destination Dropbox
  folder (not Desktop), so the new mac sees it at the right path
  immediately.

The unit being moved is the entire `Radius-AdTags-Prototype/` folder
including `_claude-transcripts/`.

**Place it on the new mac at:**

```
/Users/ggorton/Dropbox/Grant Gorton/Projects/Radius-AdTags-Prototype/
```

(Or wherever Dropbox actually mounts on your new mac — see §1.4 above
about confirming the path.)

---

## Post-migration setup (run on the NEW mac)

### 1. Install runtime dependencies

```bash
cd "/Users/ggorton/Dropbox/Grant Gorton/Projects/Radius-AdTags-Prototype"
# (the quotes are needed because of the space in "Grant Gorton")
npm install
npm run dev   # verify the dev server starts at http://localhost:5174
```

After `npm install` succeeds, immediately do the `node_modules/`
Dropbox-ignore step from §1.2 above, so Dropbox doesn't try to sync
the thousands of files it just created.

### 2. Discover the exact path Claude Code sees

Open VSCode at the project folder. Open Claude Code in the project.
In Claude, run:

```bash
pwd
```

(Yes, ask Claude to run `pwd` for you — it'll report exactly what
its working directory is, which is what determines the transcript
folder name.)

Copy that path. Then transform it for the transcript folder name:

1. Replace each `/` with `-`
2. **Leave spaces as-is** unless Claude's behavior on your system
   differs (we'll verify in the next step)

Example: if `pwd` returns:

```
/Users/ggorton/Dropbox/Grant Gorton/Projects/Radius-AdTags-Prototype
```

Then the candidate transcript folder name is:

```
-Users-ggorton-Dropbox-Grant Gorton-Projects-Radius-AdTags-Prototype
```

Verify this by asking Claude to send any message, then check:

```bash
ls ~/.claude/projects/ | grep -i radius
```

The folder Claude creates is the **authoritative** answer. If the
real folder name differs from what you derived, use the real one for
the restore step below.

### 3. Restore the transcripts

Replace `<FOLDER>` with whatever you confirmed in step 2:

```bash
mkdir -p ~/.claude/projects/<FOLDER>
cp -R "/Users/ggorton/Dropbox/Grant Gorton/Projects/Radius-AdTags-Prototype/_claude-transcripts/snapshot/." \
  ~/.claude/projects/<FOLDER>/
```

Concrete example assuming spaces are preserved:

```bash
mkdir -p "~/.claude/projects/-Users-ggorton-Dropbox-Grant Gorton-Projects-Radius-AdTags-Prototype"
cp -R "/Users/ggorton/Dropbox/Grant Gorton/Projects/Radius-AdTags-Prototype/_claude-transcripts/snapshot/." \
  "/Users/ggorton/.claude/projects/-Users-ggorton-Dropbox-Grant Gorton-Projects-Radius-AdTags-Prototype/"
```

(Tilde expansion sometimes misbehaves inside double-quoted strings on
zsh; using the full `/Users/ggorton/...` path is the safest.)

### 4. Restore user-level Claude Code state (skills, agents, settings)

This is the inverse of pre-migration step 5. Be a little more careful
here than the transcript restore — `settings.json` can carry
old-machine paths that you may want to edit before merging.

**Recommended approach: review before merging.**

```bash
# Inspect what's in the snapshot
ls "/Users/ggorton/Dropbox/Grant Gorton/Projects/Radius-AdTags-Prototype/_claude-user-state/snapshot/"

# Inspect settings.json specifically for stale paths
cat "/Users/ggorton/Dropbox/Grant Gorton/Projects/Radius-AdTags-Prototype/_claude-user-state/snapshot/settings.json" 2>/dev/null
```

If `settings.json` references `/Users/grantgorton/...` paths in
hooks or commands, edit those to `/Users/ggorton/...` first (the
snapshot is a file you can `vim` / `code` open and tweak before
restoring).

**Then merge into the user-level Claude Code directory:**

```bash
mkdir -p ~/.claude
rsync -a "/Users/ggorton/Dropbox/Grant Gorton/Projects/Radius-AdTags-Prototype/_claude-user-state/snapshot/" ~/.claude/
```

The trailing slash on the source path means "contents of, not the
directory itself" — so files land under `~/.claude/skills/...`,
`~/.claude/agents/...`, `~/.claude/settings.json`, etc.

Verify by asking Claude Code (after relaunch) what skills it knows:

```
What skills are available?
```

The `log-time` skill should appear (project-level) plus any
user-level skills you brought across.

If the new Claude Code is already running, restart it (Cmd+Q in the
extension host or `claude-code --restart` depending on your install)
so it re-reads the user-level directories.

### 5. Restore git author identity (if needed)

```bash
git config --global user.name   # check
git config --global user.email  # check
```

If blank or wrong on the new account, set them:

```bash
git config --global user.name "tggorton"
git config --global user.email "ggorton@kerv.ai"
```

### 6. Verify

Open the project in VSCode + Claude Code. Ask Claude to:

- *"Read SESSION_LOG.md and summarize where this project stands."*
- *"What's the last commit?"*

If the restored transcripts loaded correctly, Claude has the prior
conversation context available as reference (not as replay).

---

## What's preserved vs. lost

| | Preserved | Lost |
|---|---|---|
| Source code, docs, git history | ✅ (folder copy) | |
| Design references (`_Code-Reference/`, `_Image-Reference/`) | ✅ (folder copy) | |
| Claude Code skill (`.claude/skills/log-time/`) | ✅ (folder copy) | |
| Past conversation transcripts | ✅ (via `_claude-transcripts/` snapshot + restore) | |
| Auto-memory entries | ✅ (via snapshot — includes the `memory/` subfolder) | |
| App's localStorage (saved distros) | | ❌ (different browser profile on new mac) |
| Global Claude Code settings | | ❌ (`~/.claude/settings.json` not copied — re-configure if needed) |
| `node_modules/` | | Recreated via `npm install` |

---

## Rollback / troubleshooting

If anything goes sideways on the new mac, the GitHub repo
(`origin/main`) is the durable source. A clean `git clone` into a
fresh location (Dropbox or otherwise) reproduces the full project
state minus the local-only items (`_claude-transcripts/`,
`node_modules/`). The design references and TIME/SESSION/MIGRATION
docs are all committed, so they come down with the clone.

If Claude Code on the new mac doesn't seem to see the restored
transcripts:

1. Re-run `pwd` from Claude inside the project. Compare to the
   folder name you created under `~/.claude/projects/`. They must
   match exactly, including spaces / casing.
2. File permissions are user-readable:
   ```bash
   chmod -R u+rwX "/Users/ggorton/.claude/projects/<FOLDER>"
   ```
3. The `.jsonl` file is there and non-empty:
   ```bash
   ls -lah "/Users/ggorton/.claude/projects/<FOLDER>/"
   ```

If `npm install` hangs or fails with weird permission errors:

- Confirm Dropbox is fully sync'd ("available offline" green check)
  on the whole project tree.
- Confirm `node_modules/` isn't being synced by Dropbox (§1.2 above).
- As a last resort, run the install with `node_modules/` symlinked
  outside Dropbox (§1.2 Option B).

---

## Why this approach

Keeping the snapshot inside the project folder makes the migration
unit simple: "copy the project folder, follow MIGRATION.md on the new
mac." Without the snapshot step, you'd be hand-tracking two separate
things (project + `~/.claude/` state), which is easy to forget on the
day of the move.

Once the new mac is bootstrapped and working, you can delete
`_claude-transcripts/` if you want — it's a one-time artifact for
the migration, not an ongoing requirement.

If you ever do this again (another machine swap, a different project),
this doc is a reusable template: update the paths + usernames table
at the top, re-run the same two `cp -R` commands.
