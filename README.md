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
