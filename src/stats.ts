import { getExpansionTargetRoom, isExpansionReady } from "./expansion";
import { findNonKeeperHostiles, hostileThreatScore } from "./hostiles";

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
  const homeRoom = Object.values(Game.rooms).find(room => room.controller?.my);

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
    rooms: Object.values(Game.rooms).map(buildRoomStats),
    expansion: {
      targetRoom: homeRoom ? getExpansionTargetRoom(homeRoom) : undefined,
      scoutedRooms: Object.keys(Memory.scouting?.rooms ?? {}).length
    }
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
  const hostiles = findNonKeeperHostiles(room);

  return {
    name: room.name,
    energyAvailable: room.energyAvailable,
    energyCapacityAvailable: room.energyCapacityAvailable,
    controller: room.controller
      ? {
          level: room.controller.level,
          progress: room.controller.progress,
          progressTotal: room.controller.progressTotal,
          safeMode: room.controller.safeMode,
          safeModeAvailable: room.controller.safeModeAvailable,
          safeModeCooldown: room.controller.safeModeCooldown
        }
      : undefined,
    creeps: countCreepsByRole(creeps),
    constructionSites: constructionSites.length,
    constructionSitesByType: countConstructionSitesByType(constructionSites),
    repairTargets: repairTargets.length,
    hostiles: hostiles.length,
    hostileOwners: countHostileOwners(hostiles),
    hostileBodyParts: {
      attack: sumActiveBodyparts(hostiles, ATTACK),
      rangedAttack: sumActiveBodyparts(hostiles, RANGED_ATTACK),
      heal: sumActiveBodyparts(hostiles, HEAL),
      work: sumActiveBodyparts(hostiles, WORK)
    },
    hostileThreatScore: sum(hostiles.map(hostileThreatScore)),
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
    structures: {
      spawns: room.find(FIND_MY_SPAWNS).length,
      extensions: room.find(FIND_MY_STRUCTURES, {
        filter: structure => structure.structureType === STRUCTURE_EXTENSION
      }).length,
      roads: room.find(FIND_STRUCTURES, {
        filter: structure => structure.structureType === STRUCTURE_ROAD
      }).length,
      ramparts: room.find(FIND_MY_STRUCTURES, {
        filter: structure => structure.structureType === STRUCTURE_RAMPART
      }).length
    },
    storage: room.storage
      ? {
          energy: room.storage.store.getUsedCapacity(RESOURCE_ENERGY),
          capacity: room.storage.store.getCapacity(RESOURCE_ENERGY)
        }
      : undefined,
    sources: sources.map(source => ({
      id: source.id,
      energy: source.energy,
      energyCapacity: source.energyCapacity,
      assignedCreeps: Object.values(Game.creeps).filter(creep => creep.memory.sourceId === source.id).length
    })),
    expansionReady: isExpansionReady(room)
  };
}

function countConstructionSitesByType(sites: ConstructionSite[]): Record<string, number> {
  return sites.reduce<Record<string, number>>((counts, site) => {
    counts[site.structureType] = (counts[site.structureType] ?? 0) + 1;
    return counts;
  }, {});
}

function countHostileOwners(hostiles: Creep[]): Record<string, number> {
  return hostiles.reduce<Record<string, number>>((counts, hostile) => {
    counts[hostile.owner.username] = (counts[hostile.owner.username] ?? 0) + 1;
    return counts;
  }, {});
}

function sumActiveBodyparts(creeps: Creep[], bodyPart: BodyPartConstant): number {
  return sum(creeps.map(creep => creep.getActiveBodyparts(bodyPart)));
}

function countCreepsByRole(creeps: Creep[]): Record<CreepRole, number> {
  return {
    harvester: creeps.filter(creep => creep.memory.role === "harvester").length,
    miner: creeps.filter(creep => creep.memory.role === "miner").length,
    hauler: creeps.filter(creep => creep.memory.role === "hauler").length,
    upgrader: creeps.filter(creep => creep.memory.role === "upgrader").length,
    builder: creeps.filter(creep => creep.memory.role === "builder").length,
    repairer: creeps.filter(creep => creep.memory.role === "repairer").length,
    defender: creeps.filter(creep => creep.memory.role === "defender").length,
    claimer: creeps.filter(creep => creep.memory.role === "claimer").length,
    pioneer: creeps.filter(creep => creep.memory.role === "pioneer").length,
    scout: creeps.filter(creep => creep.memory.role === "scout").length
  };
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}
