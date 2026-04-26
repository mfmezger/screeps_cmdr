const HISTORY_INTERVAL = 20;
const MAX_HISTORY = 250;

export function recordStats(): void {
  const current = buildStatsSnapshot();

  if (!Memory.stats) {
    Memory.stats = {
      current,
      history: []
    };
  }

  Memory.stats.current = current;

  if (Game.time % HISTORY_INTERVAL !== 0) {
    return;
  }

  Memory.stats.history.push(current);
  if (Memory.stats.history.length > MAX_HISTORY) {
    Memory.stats.history.shift();
  }
}

function buildStatsSnapshot(): BotStatsSnapshot {
  return {
    tick: Game.time,
    cpu: {
      used: Math.round(Game.cpu.getUsed() * 100) / 100,
      limit: Game.cpu.limit,
      bucket: Game.cpu.bucket
    },
    gcl: {
      level: Game.gcl.level,
      progress: Game.gcl.progress,
      progressTotal: Game.gcl.progressTotal
    },
    creeps: countCreepsByRole(Object.values(Game.creeps)),
    rooms: Object.values(Game.rooms).map(buildRoomStats)
  };
}

function buildRoomStats(room: Room): RoomStatsSnapshot {
  const creeps = room.find(FIND_MY_CREEPS);
  const constructionSites = room.find(FIND_CONSTRUCTION_SITES);
  const repairTargets = room.find(FIND_STRUCTURES, {
    filter: structure =>
      structure.structureType !== STRUCTURE_WALL &&
      structure.structureType !== STRUCTURE_RAMPART &&
      structure.hits < structure.hitsMax
  });
  const towers = room.find(FIND_MY_STRUCTURES, {
    filter: (structure): structure is StructureTower => structure.structureType === STRUCTURE_TOWER
  });
  const containers = room.find(FIND_STRUCTURES, {
    filter: (structure): structure is StructureContainer => structure.structureType === STRUCTURE_CONTAINER
  });
  const sources = room.find(FIND_SOURCES);

  return {
    name: room.name,
    energyAvailable: room.energyAvailable,
    energyCapacityAvailable: room.energyCapacityAvailable,
    controller: room.controller
      ? {
          level: room.controller.level,
          progress: room.controller.progress,
          progressTotal: room.controller.progressTotal
        }
      : undefined,
    creeps: countCreepsByRole(creeps),
    constructionSites: constructionSites.length,
    repairTargets: repairTargets.length,
    hostiles: room.find(FIND_HOSTILE_CREEPS).length,
    towers: {
      count: towers.length,
      energy: sum(towers.map(tower => tower.store.getUsedCapacity(RESOURCE_ENERGY))),
      capacity: sum(towers.map(tower => tower.store.getCapacity(RESOURCE_ENERGY)))
    },
    containers: {
      count: containers.length,
      energy: sum(containers.map(container => container.store.getUsedCapacity(RESOURCE_ENERGY))),
      capacity: sum(containers.map(container => container.store.getCapacity(RESOURCE_ENERGY)))
    },
    sources: sources.map(source => ({
      id: source.id,
      energy: source.energy,
      energyCapacity: source.energyCapacity,
      assignedCreeps: Object.values(Game.creeps).filter(creep => creep.memory.sourceId === source.id).length
    }))
  };
}

function countCreepsByRole(creeps: Creep[]): Record<CreepRole, number> {
  return {
    harvester: creeps.filter(creep => creep.memory.role === "harvester").length,
    miner: creeps.filter(creep => creep.memory.role === "miner").length,
    hauler: creeps.filter(creep => creep.memory.role === "hauler").length,
    upgrader: creeps.filter(creep => creep.memory.role === "upgrader").length,
    builder: creeps.filter(creep => creep.memory.role === "builder").length,
    repairer: creeps.filter(creep => creep.memory.role === "repairer").length
  };
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}
