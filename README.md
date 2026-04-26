# screeps_cmdr

Minimal TypeScript bot for the Screeps game.

## What it does now

- Cleans up memory for dead creeps.
- Spawns a simple room workforce based on room state:
  - 1 miner per source
  - at least 1 hauler when sources exist
  - 1 upgrader
  - 1-2 builders when construction sites exist
  - 1 repairer when repair targets fall below useful thresholds
  - emergency harvester if the room has no harvester or miner
- Towers attack hostile creeps, then repair if they have spare energy.
- Room planning periodically places source containers and roads from spawn to sources/controller.
- Creeps gather energy from dropped energy, tombstones, ruins, containers, then active sources.
- Creeps that harvest directly remember an assigned source to reduce crowding.
- Miners harvest assigned sources and put energy into adjacent containers or drop it for haulers.
- Haulers fill spawns/extensions first, then towers, then upgrade if there is nowhere to deliver energy.
- Upgraders gather energy and upgrade the room controller.
- Builders gather energy and build construction sites, then upgrade if there is nothing to build.
- Repairers prioritize containers, then roads, then other damaged non-wall/rampart structures.
- Writes current status and rolling history into `Memory.stats` for external inspection.

## Commands

```bash
npm install
npm run build
```

The build output is `dist/main.js`.

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
SCREEPS_SERVER=main SCREEPS_SHARD=shard0 SCREEPS_HISTORY_LIMIT=100 task history
```
