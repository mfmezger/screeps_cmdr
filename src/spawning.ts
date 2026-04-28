import { roomHasNonKeeperHostiles, roomNeedsDefender } from "./defense";
import { countExpansionCreeps, getExpansionTargetRoom, isExpansionReady } from "./expansion";
import { roomHasRepairTargets } from "./repair";
import { getNextScoutTarget, shouldSpawnScout } from "./scouting";
import { getSafeSources } from "./sources";

const ROLE_PRIORITY: CreepRole[] = ["hauler", "builder", "upgrader", "repairer"];

interface SpawnRequest {
  role: CreepRole;
  targetRoom?: string;
  sourceId?: Id<Source>;
  blockLowerPriority?: boolean;
}

export function runSpawner(spawn: StructureSpawn): void {
  if (spawn.spawning) {
    return;
  }

  for (const request of buildSpawnQueue(spawn.room)) {
    const body = chooseBody(request.role, spawn.room.energyAvailable);
    if (!body) {
      if (request.blockLowerPriority) {
        return;
      }
      continue;
    }

    spawnCreep(spawn, request, body);
    return;
  }
}

function spawnCreep(spawn: StructureSpawn, request: SpawnRequest, body: BodyPartConstant[]): void {
  const name = `${request.role}-${Game.time}`;
  const result = spawn.spawnCreep(body, name, {
    memory: {
      role: request.role,
      working: false,
      targetRoom: request.targetRoom,
      sourceId: request.sourceId
    }
  });

  if (result === OK) {
    console.log(`Spawning ${name}`);
  }
}

function buildSpawnQueue(room: Room): SpawnRequest[] {
  const queue: SpawnRequest[] = [];
  const creeps = room.find(FIND_MY_CREEPS);
  const roleCounts = countViableRoles(creeps);
  const safeSources = getSafeSources(room);

  if (roleCounts.harvester === 0 && roleCounts.miner === 0) {
    return [{ role: "harvester", blockLowerPriority: true }];
  }

  if (roomNeedsDefender(room) && roleCounts.defender < 1) {
    queue.push({ role: "defender", blockLowerPriority: true });
  }

  queue.push(...buildMinerQueue(room, creeps));

  const desiredCounts: Record<CreepRole, number> = {
    harvester: 0,
    miner: 0,
    hauler: safeSources.length > 0 ? Math.max(1, safeSources.length) : 0,
    upgrader: desiredUpgraderCount(room),
    builder: roomHasNonKeeperHostiles(room) ? 0 : desiredBuilderCount(room),
    repairer: roomHasNonKeeperHostiles(room) ? 0 : roomHasRepairTargets(room) ? 1 : 0,
    defender: 0,
    claimer: 0,
    pioneer: 0,
    scout: 0
  };

  for (const role of ROLE_PRIORITY) {
    if (roleCounts[role] < desiredCounts[role]) {
      queue.push({ role, blockLowerPriority: true });
    }
  }

  if (roomHasNonKeeperHostiles(room)) {
    return queue;
  }

  queue.push(...buildExpansionQueue(room));

  const scoutingRequest = buildScoutingRequest(room);
  if (scoutingRequest) {
    queue.push(scoutingRequest);
  }

  return queue;
}

function buildMinerQueue(room: Room, creeps: Creep[]): SpawnRequest[] {
  return getSafeSources(room).flatMap(source => {
    const desired = desiredMinersForSource(room, source);
    const assigned = countViableMinersForSource(creeps, source);
    if (assigned >= desired) {
      return [];
    }

    return [{ role: "miner", sourceId: source.id, blockLowerPriority: true }];
  });
}

function countViableMinersForSource(creeps: Creep[], source: Source): number {
  return creeps.filter(creep =>
    creep.memory.role === "miner" &&
    creep.memory.sourceId === source.id &&
    isViableForRole(creep, "miner")
  ).length;
}

function buildExpansionQueue(room: Room): SpawnRequest[] {
  const targetRoom = getExpansionTargetRoom(room);
  if (!targetRoom || !isExpansionReady(room)) {
    return [];
  }

  const queue: SpawnRequest[] = [];
  if (countExpansionCreeps("claimer", targetRoom) < 1) {
    queue.push({ role: "claimer", targetRoom, blockLowerPriority: true });
  }

  if (countExpansionCreeps("pioneer", targetRoom) < 2) {
    queue.push({ role: "pioneer", targetRoom });
  }

  return queue;
}

function buildScoutingRequest(room: Room): SpawnRequest | undefined {
  if (!shouldSpawnScout(room)) {
    return undefined;
  }

  const targetRoom = getNextScoutTarget(room);
  if (!targetRoom) {
    return undefined;
  }

  return { role: "scout", targetRoom };
}

function countViableRoles(creeps: Creep[]): Record<CreepRole, number> {
  return {
    harvester: countViableRole(creeps, "harvester"),
    miner: countViableRole(creeps, "miner"),
    hauler: countViableRole(creeps, "hauler"),
    upgrader: countViableRole(creeps, "upgrader"),
    builder: countViableRole(creeps, "builder"),
    repairer: countViableRole(creeps, "repairer"),
    defender: countViableRole(creeps, "defender"),
    claimer: countViableRole(creeps, "claimer"),
    pioneer: countViableRole(creeps, "pioneer"),
    scout: countViableRole(creeps, "scout")
  };
}

function countViableRole(creeps: Creep[], role: CreepRole): number {
  return creeps.filter(creep => creep.memory.role === role && isViableForRole(creep, role)).length;
}

function isViableForRole(creep: Creep, role: CreepRole): boolean {
  if (creep.spawning || creep.ticksToLive === undefined) {
    return true;
  }

  return creep.ticksToLive > replacementLeadTime(role);
}

function replacementLeadTime(role: CreepRole): number {
  switch (role) {
    case "miner":
    case "claimer":
      return 100;
    case "hauler":
    case "pioneer":
      return 75;
    default:
      return 50;
  }
}

function desiredMinersForSource(room: Room, source: Source): number {
  if (room.energyCapacityAvailable >= 550) {
    return 1;
  }

  if (source.energy < source.energyCapacity * 0.5) {
    return 1;
  }

  if (!hasAdjacentContainer(source) || walkableAdjacentPositions(source.pos) < 2) {
    return 1;
  }

  return 2;
}

function hasAdjacentContainer(source: Source): boolean {
  return source.pos.findInRange(FIND_STRUCTURES, 1, {
    filter: (structure): structure is StructureContainer => structure.structureType === STRUCTURE_CONTAINER
  }).length > 0;
}

function walkableAdjacentPositions(position: RoomPosition): number {
  let walkable = 0;

  for (let dx = -1; dx <= 1; dx += 1) {
    for (let dy = -1; dy <= 1; dy += 1) {
      if (dx === 0 && dy === 0) {
        continue;
      }

      const x = position.x + dx;
      const y = position.y + dy;
      if (x <= 0 || x >= 49 || y <= 0 || y >= 49) {
        continue;
      }

      const terrain = new RoomPosition(x, y, position.roomName).lookFor(LOOK_TERRAIN)[0];
      if (terrain !== "wall") {
        walkable += 1;
      }
    }
  }

  return walkable;
}

function desiredBuilderCount(room: Room): number {
  const sites = room.find(FIND_CONSTRUCTION_SITES);
  if (sites.length === 0) {
    return 0;
  }

  const importantSites = sites.filter(site => isImportantConstruction(site)).length;
  if (importantSites > 0 && room.energyAvailable >= room.energyCapacityAvailable * 0.8) {
    return 2;
  }

  if (sites.length >= 8 && room.energyCapacityAvailable >= 550) {
    return 2;
  }

  return 1;
}

function desiredUpgraderCount(room: Room): number {
  if (hasImportantConstruction(room)) {
    return 1;
  }

  const storedEnergy = storedRoomEnergy(room);
  if (storedEnergy >= 5000 && room.energyCapacityAvailable >= 800) {
    return 4;
  }

  if (storedEnergy >= 2500 && room.energyCapacityAvailable >= 550) {
    return 3;
  }

  if (room.energyAvailable >= room.energyCapacityAvailable * 0.8 && room.energyCapacityAvailable >= 550) {
    return 2;
  }

  return 1;
}

function storedRoomEnergy(room: Room): number {
  const containerEnergy = room.find(FIND_STRUCTURES, {
    filter: (structure): structure is StructureContainer => structure.structureType === STRUCTURE_CONTAINER
  }).reduce((total, container) => total + container.store.getUsedCapacity(RESOURCE_ENERGY), 0);

  return containerEnergy + (room.storage?.store.getUsedCapacity(RESOURCE_ENERGY) ?? 0);
}

function hasImportantConstruction(room: Room): boolean {
  return room.find(FIND_CONSTRUCTION_SITES, {
    filter: isImportantConstruction
  }).length > 0;
}

function isImportantConstruction(site: ConstructionSite): boolean {
  return site.structureType === STRUCTURE_EXTENSION ||
    site.structureType === STRUCTURE_TOWER ||
    site.structureType === STRUCTURE_CONTAINER ||
    site.structureType === STRUCTURE_STORAGE;
}

function chooseBody(role: CreepRole, energyAvailable: number): BodyPartConstant[] | undefined {
  switch (role) {
    case "miner":
      return chooseMinerBody(energyAvailable);
    case "hauler":
      return chooseHaulerBody(energyAvailable);
    case "defender":
      return chooseDefenderBody(energyAvailable);
    case "claimer":
      return energyAvailable >= 650 ? [CLAIM, MOVE] : undefined;
    case "pioneer":
      return chooseWorkerBody(energyAvailable);
    case "scout":
      return energyAvailable >= 50 ? [MOVE] : undefined;
    default:
      return chooseWorkerBody(energyAvailable);
  }
}

function chooseMinerBody(energyAvailable: number): BodyPartConstant[] | undefined {
  if (energyAvailable >= 550) {
    return [WORK, WORK, WORK, WORK, CARRY, MOVE, MOVE];
  }

  if (energyAvailable >= 300) {
    return [WORK, WORK, CARRY, MOVE];
  }

  if (energyAvailable >= 200) {
    return [WORK, CARRY, MOVE];
  }

  return undefined;
}

function chooseHaulerBody(energyAvailable: number): BodyPartConstant[] | undefined {
  if (energyAvailable >= 300) {
    return [CARRY, CARRY, CARRY, CARRY, MOVE, MOVE];
  }

  if (energyAvailable >= 200) {
    return [CARRY, CARRY, MOVE, MOVE];
  }

  return undefined;
}

function chooseDefenderBody(energyAvailable: number): BodyPartConstant[] | undefined {
  if (energyAvailable >= 260) {
    return [ATTACK, ATTACK, MOVE, MOVE];
  }

  if (energyAvailable >= 130) {
    return [ATTACK, MOVE];
  }

  return undefined;
}

function chooseWorkerBody(energyAvailable: number): BodyPartConstant[] | undefined {
  if (energyAvailable >= 550) {
    return [WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE];
  }

  if (energyAvailable >= 300) {
    return [WORK, WORK, CARRY, MOVE];
  }

  if (energyAvailable >= 200) {
    return [WORK, CARRY, MOVE];
  }

  return undefined;
}
