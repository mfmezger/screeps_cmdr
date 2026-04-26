# screeps_cmdr

Minimal TypeScript bot for the Screeps game.

## What it does now

- Cleans up memory for dead creeps.
- Spawns a small starter workforce:
  - 2 harvesters
  - 1 upgrader
  - 1 builder when construction sites exist
- Harvesters fill spawns, extensions, and towers, then upgrade if there is nowhere to deliver energy.
- Upgraders harvest and upgrade the room controller.
- Builders harvest and build construction sites, then upgrade if there is nothing to build.

## Commands

```bash
npm install
npm run build
```

The build output is `dist/main.js`. Upload that file as your Screeps `main` module.
