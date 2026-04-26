const { ScreepsAPI } = require("screeps-api");

const server = process.env.SCREEPS_SERVER || "main";
const configuredShard = process.env.SCREEPS_SHARD;
const outputJson = process.argv.includes("--json") || process.env.SCREEPS_STATUS_JSON === "1";
const historyLimit = Number(process.env.SCREEPS_HISTORY_LIMIT || 25);
const commonShards = ["shard0", "shard1", "shard2", "shard3"];

async function main() {
  const api = await ScreepsAPI.fromConfig(server);
  const result = await loadStats(api);

  if (!result) {
    const shardHint = configuredShard ? ` on ${configuredShard}` : " on any common shard";
    console.log(`No Memory.stats found${shardHint}. Upload the bot and wait a few ticks.`);
    return;
  }

  if (outputJson) {
    console.log(JSON.stringify(trimHistory({ ...result.stats, shard: result.shard }, historyLimit), null, 2));
    return;
  }

  printReport(result.stats, result.shard);
}

async function loadStats(api) {
  const shards = configuredShard ? [configuredShard] : commonShards;

  for (const shard of shards) {
    const response = await api.memory.get("stats", shard);
    const stats = parseMemoryResponse(response);
    if (stats && stats.current) {
      return { shard, stats };
    }
  }

  return undefined;
}

function parseMemoryResponse(response) {
  const raw = response && Object.prototype.hasOwnProperty.call(response, "data")
    ? response.data
    : response;

  if (raw === undefined || raw === null || raw === "undefined") {
    return undefined;
  }

  if (typeof raw === "string") {
    return JSON.parse(raw);
  }

  return raw;
}

function trimHistory(stats, limit) {
  return {
    ...stats,
    history: Array.isArray(stats.history) ? stats.history.slice(-limit) : []
  };
}

function printReport(stats, shard) {
  const current = stats.current;
  const history = Array.isArray(stats.history) ? stats.history : [];

  console.log(`Screeps status @ tick ${current.tick} (${shard})`);
  console.log(`CPU: ${current.cpu.used}/${current.cpu.limit}, bucket ${current.cpu.bucket}`);
  console.log(`GCL: ${current.gcl.level} (${percent(current.gcl.progress, current.gcl.progressTotal)})`);
  console.log(`Creeps: ${formatCreeps(current.creeps)}`);
  if (current.expansion) {
    console.log(`Expansion target: ${current.expansion.targetRoom || "none"}, scouted rooms: ${current.expansion.scoutedRooms}`);
  }
  console.log(`History: ${history.length} samples${history.length > 0 ? `, ticks ${history[0].tick}-${history[history.length - 1].tick}` : ""}`);

  for (const room of current.rooms) {
    printRoom(room, history);
  }
}

function printRoom(room, history) {
  console.log("");
  console.log(`Room ${room.name}`);
  console.log(`  Energy: ${room.energyAvailable}/${room.energyCapacityAvailable} (${percent(room.energyAvailable, room.energyCapacityAvailable)})`);

  if (room.controller) {
    console.log(`  Controller: RCL ${room.controller.level}, ${percent(room.controller.progress, room.controller.progressTotal)}`);
  }

  console.log(`  Creeps: ${formatCreeps(room.creeps)}`);
  console.log(`  Sites: ${room.constructionSites}, repair targets: ${room.repairTargets}, hostiles: ${room.hostiles}`);
  console.log(`  Towers: ${room.towers.count}, energy ${room.towers.energy}/${room.towers.capacity}`);
  console.log(`  Containers: ${room.containers.count}, energy ${room.containers.energy}/${room.containers.capacity}`);
  if (room.storage) {
    console.log(`  Storage: energy ${room.storage.energy}/${room.storage.capacity}`);
  }
  console.log(`  Sources: ${room.sources.map(source => `${shortId(source.id)} ${source.energy}/${source.energyCapacity} assigned=${source.assignedCreeps}`).join(", ") || "none"}`);
  console.log(`  Expansion ready: ${room.expansionReady ? "yes" : "no"}`);

  const trend = roomTrend(room.name, history);
  if (trend) {
    console.log(`  Trend: energy ${signed(trend.energyDelta)}, controller ${signed(trend.controllerProgressDelta)}, creeps ${signed(trend.creepDelta)} over ${trend.ticks} ticks`);
  }

  const insights = roomInsights(room);
  if (insights.length > 0) {
    console.log(`  Insights: ${insights.join("; ")}`);
  }
}

function roomTrend(roomName, history) {
  const roomHistory = history
    .map(snapshot => ({ tick: snapshot.tick, room: snapshot.rooms.find(room => room.name === roomName) }))
    .filter(entry => entry.room);

  if (roomHistory.length < 2) {
    return undefined;
  }

  const first = roomHistory[0];
  const last = roomHistory[roomHistory.length - 1];
  return {
    ticks: last.tick - first.tick,
    energyDelta: last.room.energyAvailable - first.room.energyAvailable,
    controllerProgressDelta: controllerProgress(last.room) - controllerProgress(first.room),
    creepDelta: totalCreeps(last.room.creeps) - totalCreeps(first.room.creeps)
  };
}

function roomInsights(room) {
  const insights = [];

  if (room.hostiles > 0) {
    insights.push(`${room.hostiles} hostile creep(s) present`);
  }

  if (room.energyCapacityAvailable > 0 && room.creeps.miner === 0 && room.creeps.harvester === 0) {
    insights.push("no miner/harvester active");
  }

  if (room.creeps.hauler === 0 && room.containers.energy > 0) {
    insights.push("stored container energy but no hauler");
  }

  if (room.energyCapacityAvailable > 0 && room.energyAvailable < room.energyCapacityAvailable * 0.5) {
    insights.push("spawn energy below 50%");
  }

  if (room.constructionSites > 10) {
    insights.push("many construction sites queued");
  }

  if (room.repairTargets > 10) {
    insights.push("many damaged structures");
  }

  return insights;
}

function formatCreeps(creeps) {
  return Object.entries(creeps)
    .filter(([, count]) => count > 0)
    .map(([role, count]) => `${role}=${count}`)
    .join(", ") || "none";
}

function controllerProgress(room) {
  if (!room.controller || typeof room.controller.progress !== "number") {
    return 0;
  }

  return room.controller.progress;
}

function totalCreeps(creeps) {
  return Object.values(creeps).reduce((total, count) => total + count, 0);
}

function percent(value, total) {
  if (!total) {
    return "n/a";
  }

  return `${Math.round((value / total) * 100)}%`;
}

function signed(value) {
  return value >= 0 ? `+${value}` : `${value}`;
}

function shortId(id) {
  return String(id).slice(-6);
}

main().catch(error => {
  console.error(error.message || error);
  process.exitCode = 1;
});
