import { ensureHomeRoom, shouldAnchorToHome } from "./home";

export function cleanupDeadCreeps(): void {
  for (const creepName in Memory.creeps) {
    if (!Game.creeps[creepName]) {
      delete Memory.creeps[creepName];
    }
  }

  normalizeCreepMemory();
}

function normalizeCreepMemory(): void {
  for (const creep of Object.values(Game.creeps)) {
    if (creep.memory.role !== "miner") {
      delete creep.memory.sourceId;
    }

    if (shouldAnchorToHome(creep.memory.role)) {
      ensureHomeRoom(creep);
    }
  }
}
