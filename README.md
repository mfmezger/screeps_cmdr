# screeps_cmdr

A TypeScript Screeps bot focused on simple, observable colony automation.

The current goal is not to be a huge framework. It is a small bot that can bootstrap a room, improve its economy, collect history, and give us enough telemetry to make better decisions over time.

## Current capabilities

### Economy

- Cleans up memory for dead creeps.
- Uses a simple spawn queue for emergency, economy, construction, defense, expansion, and scouting needs.
- Maintains a room workforce:
  - miners for safe sources
  - haulers for energy delivery
  - upgraders for controller progress
  - builders for construction
  - repairers for meaningful damage
  - defenders when hostiles appear and no tower exists
  - scouts for expansion discovery
- Adds replacement creeps before important creeps expire.
- Assigns miners to specific safe sources so source usage stays balanced.
- Can add a second miner to underworked container sources at low energy capacity.
- Converts full containers/storage into faster upgrading by adding upgrader capacity when construction is done.
- Avoids Source Keeper sources and ignores Source Keepers for now.

### Energy logistics

- Creeps collect energy from dropped resources, tombstones, ruins, containers, storage, then safe active sources.
- Miners harvest assigned safe sources and fill adjacent containers or drop energy.
- Haulers fill spawns/extensions first, then towers, then a base container/storage.
- Idle haulers wait near pickup or delivery points to reduce wasted travel.
- Builders, upgraders, and repairers prefer stored energy before harvesting directly.

### Construction and planning

- Room planning prioritizes speed:
  1. extensions
  2. tower
  3. source/base containers
  4. storage/extractor
  5. only critical source roads before RCL3
- Builders prioritize construction by value:
  1. spawn/extensions
  2. towers
  3. containers/storage
  4. roads
  5. everything else
- Repair thresholds are lower while important construction exists so early energy is not wasted on minor road damage.
- Basic ramparts are planned over spawns and towers, then maintained to modest early thresholds.

### Defense

- Tower construction is prioritized as soon as RCL3 unlocks it.
- Towers prioritize healers, then attackers/ranged attackers, then other hostile creeps.
- Towers heal damaged friendly creeps before spending spare energy on repairs.
- Safe mode can activate when dangerous non-Source-Keeper hostiles appear and no charged tower is available.
- Basic defenders are spawned for non-Source-Keeper hostiles when tower defense is missing or low on energy.
- During attacks, haulers prioritize tower refills and expansion/scouting/non-critical build/repair work pauses.
- Hostile player names are remembered in `Memory.threats`.

### Scouting and expansion

- Scouts nearby rooms automatically, including frontier rooms beyond immediate exits.
- Scouting data is stored in `Memory.scouting`.
- Automatic expansion can pick a safe, unowned, unreserved, two-source room.
- Known threat-owned rooms are avoided for scout frontier expansion.
- Manual flags named `Expand` or `Claim` override automatic expansion target selection.
- Expansion waits until the home room is ready.

### Observability

- Lightweight room visuals show:
  - room energy/RCL/expansion target
  - creep roles
  - source assignment counts
- The bot writes current status and rolling history into `Memory.stats`.
- Local scripts can read status/history from Screeps through the API.

## Project layout

```txt
src/
  main.ts              # tick entrypoint
  spawning.ts          # spawn queue and body selection
  planning.ts          # construction planning
  energy.ts            # shared energy collection helpers
  sources.ts           # safe source assignment
  scouting.ts          # room scouting and target scoring
  stats.ts             # Memory.stats snapshots/history
  roles/               # creep role behavior
scripts/
  upload-screeps.cjs   # deploy dist/main.js
  status-screeps.cjs   # read Memory.stats
```

## Setup

Install dependencies:

```bash
npm install
```

Build the bundled Screeps module:

```bash
npm run build
```

The build output is:

```txt
dist/main.js
```

For the Screeps in-browser simulator/training rooms, copy the contents of `dist/main.js` as the `main` module.

## Uploading to Screeps

Create a local credentials file:

```bash
cp .screeps.yml.example .screeps.yml
```

Then edit `.screeps.yml` and replace `YOUR_SCREEPS_AUTH_TOKEN` with a Screeps auth token from your account settings.

Upload to the default Screeps branch:

```bash
task upload
```

Or use the shorter alias:

```bash
task push
```

Optional environment variables:

```bash
SCREEPS_SERVER=main SCREEPS_BRANCH=default task upload
```

`.screeps.yml` is ignored by git so your token is not committed.

## Status and history

After uploading the bot and waiting a few ticks, print a readable status report:

```bash
task status
```

Print recent stats history as JSON for later analysis:

```bash
task history
```

Useful environment variables:

```bash
SCREEPS_SERVER=main SCREEPS_SHARD=shard3 SCREEPS_HISTORY_LIMIT=100 task history
```

If `SCREEPS_SHARD` is not set, the status script tries common shards automatically.

## Expansion behavior

Expansion is conservative.

The bot expands only when:

- GCL allows another owned room
- home room is RCL3+
- home room has no hostile creeps
- CPU bucket is healthy
- miners and haulers are online
- energy capacity is high enough to spawn a claimer
- a valid target room exists from scouting or a manual flag

Manual override:

```txt
Expand
Claim
```

Place one of those flags in a target room to override automatic target selection.

## Local simulation plan

We want to add a local Screeps private-server harness for faster testing and optimization. See:

```txt
docs/local-simulation-plan.md
```

The intended loop is:

```txt
build → upload locally → run ticks → collect Memory.stats → analyze → improve
```
