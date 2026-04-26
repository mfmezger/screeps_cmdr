# Local Screeps simulation plan

This plan keeps local simulation support in this repo because the server exists to test this bot, not as a separate product.

## Goals

- Run the bot against a local Screeps private server.
- Seed repeatable test rooms.
- Upload `dist/main.js` to the local server.
- Run or wait for batches of ticks.
- Pull `Memory.stats` and compare results across changes.
- Use history-driven analysis to improve priorities, logistics, construction, and expansion behavior.

## Non-goals for the first version

- No full benchmark framework yet.
- No custom Screeps engine modifications.
- No bot-vs-bot combat suite initially.
- No separate repository unless this grows beyond this bot.

## Proposed repo structure

```txt
local-server/
  README.md                 # local setup notes
  .gitignore                # ignore db/logs/node_modules
  .screeps.yml.example      # local server credentials example if needed
  mods.json                 # optional committed mod list later
scripts/
  local/
    setup-server.cjs        # optional helper to initialize local server files
    upload-local.cjs        # upload dist/main.js to localhost
    seed-room.cjs           # create/reset a test room through server CLI/API
    status-local.cjs        # read local Memory.stats
    run-analysis.cjs        # summarize history and suggest improvements
```

We should commit setup/config examples and scripts, but never commit local server databases or logs.

## Setup approach

Start with the official private server path:

```bash
npm install screeps
npx screeps init
npx screeps start
```

Authentication options to evaluate:

1. Local Steam client auth.
2. Steam Web API key if running headless.
3. `screepsmod-auth` for username/password API automation.

For our automation, `screepsmod-auth` may be the most convenient once initial setup is working.

## Taskfile targets

Add tasks gradually:

```yaml
local:init       # create local-server/ and initialize private server config
local:start      # start local Screeps server
local:upload     # build and upload bot to localhost
local:status     # read Memory.stats from local server
local:history    # dump local stats history as JSON
local:analyze    # print bottlenecks and recommendations
local:reset      # reset local DB/test room, if safe
local:seed       # seed a selected scenario
```

## Test scenarios

Start with a small set of repeatable scenarios:

### 1. Bootstrap one-source room

Purpose:

- Verify no deadlocks.
- Measure first container, first extensions, and RCL2/RCL3 progress.

Metrics:

- ticks to stable miner/hauler economy
- average spawn energy
- construction site backlog
- source utilization

### 2. Two-source safe room

Purpose:

- Test source assignment and hauler throughput.
- Verify miners distribute properly.

Metrics:

- source energy remaining over time
- hauler idle time approximation
- container fill level

### 3. Far-source room

Purpose:

- Stress roads and hauler positioning.
- Validate critical-road planning.

Metrics:

- hauler travel efficiency
- spawn energy uptime
- ticks to build road/container infrastructure

### 4. Source Keeper nearby room

Purpose:

- Confirm Source Keeper sources are ignored.
- Confirm defenders do not suicide into Source Keepers.

Metrics:

- deaths near Keeper lairs
- invalid source assignments
- expansion target rejection

### 5. Hostile defense room

Purpose:

- Validate defender/tower/safe-mode behavior.

Metrics:

- survival of spawn/controller
- safe mode activation
- defender spawn timing

## Analysis output

`local:analyze` should read `Memory.stats.history` and print observations like:

- energy capacity stuck at 300
- construction backlog too high
- extensions not built before roads
- source under-harvested
- container full but spawn empty
- haulers idle too often
- repair targets consuming too much energy
- expansion blocked by RCL/GCL/target quality

Example output:

```txt
Room W0N0 over 5,000 ticks
- Energy capacity stayed at 300: prioritize extensions.
- Construction sites averaged 18: throttle road planning.
- Source averaged 2,600/3,000 energy: add miner/work parts or improve hauling.
- Controller progress: 42 / 100 ticks: acceptable while building, low otherwise.
```

## Iteration loop

Once local tasks work, use this loop:

1. Build bot.
2. Reset/seed scenario.
3. Upload bot locally.
4. Run for a fixed duration, e.g. 5,000 ticks.
5. Export history JSON.
6. Run analysis.
7. Make one focused change.
8. Repeat and compare metrics.

## Success criteria for first local harness

- Local server can be started from documented commands.
- Bot can be uploaded to local server.
- At least one room can run the bot and produce `Memory.stats`.
- `task local:history` can read local history.
- We can compare two runs manually using the same scenario.

## Risks / open questions

- Auth setup may require Steam or `screepsmod-auth` experimentation.
- Private server tick control may not be as simple as desired.
- Room seeding through CLI may require custom scripts or manual CLI commands.
- Local behavior may differ slightly from official MMO shards.

## First implementation steps

1. Add `local-server/README.md` with exact setup steps.
2. Add `.gitignore` entries for local server DB/log files.
3. Add a local server credentials example.
4. Add `Taskfile.yml` local task stubs.
5. Try starting a local server manually.
6. Add local upload/status scripts once auth is confirmed.
7. Add first seed script for a one-source bootstrap room.
