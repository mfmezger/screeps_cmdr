const PLAN_INTERVAL = 100;
const MAX_NEW_SITES_PER_RUN = 3;
const MAX_ROOM_SITES = 12;
const ROAD_SITE_BACKLOG_LIMIT = 8;
const EARLY_ROAD_SITE_BACKLOG_LIMIT = 5;

export function runRoomPlanning(room: Room): void {
  if (Game.time % PLAN_INTERVAL !== 0) {
    return;
  }

  if (!room.controller?.my) {
    return;
  }

  if (needsCriticalTowerSite(room)) {
    planTower(room, 1);
  }

  const siteCount = room.find(FIND_CONSTRUCTION_SITES).length;
  let remainingSites = Math.max(0, MAX_ROOM_SITES - siteCount);
  remainingSites = Math.min(remainingSites, MAX_NEW_SITES_PER_RUN);

  if (remainingSites === 0) {
    return;
  }

  remainingSites -= planTower(room, remainingSites);
  remainingSites -= planDefensiveRamparts(room, remainingSites);
  remainingSites -= planExtensions(room, remainingSites);
  remainingSites -= planSourceContainers(room, remainingSites);
  remainingSites -= planSpawnContainer(room, remainingSites);
  remainingSites -= planStorage(room, remainingSites);
  remainingSites -= planExtractor(room, remainingSites);

  if (remainingSites > 0 && shouldPlanRoads(room)) {
    planRoads(room, remainingSites);
  }
}

function needsCriticalTowerSite(room: Room): boolean {
  if (!room.controller || room.controller.level < 3) {
    return false;
  }

  return plannedOrBuiltCount(room, STRUCTURE_TOWER) < allowedStructureCount(room, STRUCTURE_TOWER);
}

function shouldPlanRoads(room: Room): boolean {
  const siteCount = room.find(FIND_CONSTRUCTION_SITES).length;
  const controllerLevel = room.controller?.level ?? 0;

  if (controllerLevel < 3 && siteCount >= EARLY_ROAD_SITE_BACKLOG_LIMIT) {
    return false;
  }

  if (siteCount >= ROAD_SITE_BACKLOG_LIMIT) {
    return false;
  }

  if (!allAllowedStructuresPlanned(room, STRUCTURE_EXTENSION)) {
    return false;
  }

  if (controllerLevel >= 3 && !allAllowedStructuresPlanned(room, STRUCTURE_TOWER)) {
    return false;
  }

  return true;
}

function planDefensiveRamparts(room: Room, maxSites: number): number {
  if (maxSites <= 0 || !room.controller || room.controller.level < 2) {
    return 0;
  }

  let created = 0;
  for (const target of defensiveRampartTargets(room)) {
    if (created >= maxSites) {
      return created;
    }

    if (!hasRampartOrSite(target.pos) && target.pos.createConstructionSite(STRUCTURE_RAMPART) === OK) {
      created += 1;
    }
  }

  return created;
}

function defensiveRampartTargets(room: Room): Structure[] {
  const targets: Structure[] = [];
  targets.push(...room.find(FIND_MY_SPAWNS));

  targets.push(...room.find(FIND_MY_STRUCTURES, {
    filter: structure => structure.structureType === STRUCTURE_TOWER
  }));

  return targets;
}

function hasRampartOrSite(position: RoomPosition): boolean {
  const rampart = position.lookFor(LOOK_STRUCTURES).some(structure => structure.structureType === STRUCTURE_RAMPART);
  if (rampart) {
    return true;
  }

  return position.lookFor(LOOK_CONSTRUCTION_SITES).some(site => site.structureType === STRUCTURE_RAMPART);
}

function planSourceContainers(room: Room, maxSites: number): number {
  let created = 0;
  const anchor = getPrimarySpawn(room)?.pos;

  for (const source of room.find(FIND_SOURCES)) {
    if (created >= maxSites) {
      return created;
    }

    if (hasNearbyContainerOrSite(source)) {
      continue;
    }

    const position = chooseContainerPosition(source, anchor);
    if (position && position.createConstructionSite(STRUCTURE_CONTAINER) === OK) {
      created += 1;
    }
  }

  return created;
}

function planSpawnContainer(room: Room, maxSites: number): number {
  if (maxSites <= 0 || !room.controller || room.controller.level < 2 || room.storage) {
    return 0;
  }

  if (!allAllowedStructuresPlanned(room, STRUCTURE_EXTENSION)) {
    return 0;
  }

  if (room.energyAvailable < room.energyCapacityAvailable) {
    return 0;
  }

  const spawn = getPrimarySpawn(room);
  if (!spawn || hasNearbySpawnContainerOrSite(spawn)) {
    return 0;
  }

  const position = getPositionsInRange(spawn.pos, 2)
    .filter(canBuildStructure)
    .sort((left, right) => left.getRangeTo(spawn) - right.getRangeTo(spawn))[0];

  return position && position.createConstructionSite(STRUCTURE_CONTAINER) === OK ? 1 : 0;
}

function planExtensions(room: Room, maxSites: number): number {
  if (maxSites <= 0 || !room.controller || room.controller.level < 2) {
    return 0;
  }

  return planStructureNearSpawn(room, STRUCTURE_EXTENSION, maxSites, 3);
}

function planTower(room: Room, maxSites: number): number {
  if (maxSites <= 0 || !room.controller || room.controller.level < 3) {
    return 0;
  }

  return planStructureNearSpawn(room, STRUCTURE_TOWER, maxSites, 4);
}

function planStorage(room: Room, maxSites: number): number {
  if (maxSites <= 0 || !room.controller || room.controller.level < 4) {
    return 0;
  }

  return planStructureNearSpawn(room, STRUCTURE_STORAGE, maxSites, 4);
}

function planExtractor(room: Room, maxSites: number): number {
  if (maxSites <= 0 || !room.controller || room.controller.level < 6) {
    return 0;
  }

  if (plannedOrBuiltCount(room, STRUCTURE_EXTRACTOR) >= allowedStructureCount(room, STRUCTURE_EXTRACTOR)) {
    return 0;
  }

  const mineral = room.find(FIND_MINERALS)[0];
  if (!mineral || !canBuildStructure(mineral.pos)) {
    return 0;
  }

  return mineral.pos.createConstructionSite(STRUCTURE_EXTRACTOR) === OK ? 1 : 0;
}

function planStructureNearSpawn(
  room: Room,
  structureType: BuildableStructureConstant,
  maxSites: number,
  range: number
): number {
  const spawn = getPrimarySpawn(room);
  if (!spawn) {
    return 0;
  }

  const allowed = allowedStructureCount(room, structureType);
  const existing = plannedOrBuiltCount(room, structureType);
  let remainingForType = Math.min(maxSites, allowed - existing);
  if (remainingForType <= 0) {
    return 0;
  }

  let created = 0;
  const positions = getPositionsInRange(spawn.pos, range)
    .filter(canBuildStructure)
    .sort((left, right) => left.getRangeTo(spawn) - right.getRangeTo(spawn));

  for (const position of positions) {
    if (remainingForType <= 0) {
      return created;
    }

    if (position.createConstructionSite(structureType) === OK) {
      created += 1;
      remainingForType -= 1;
    }
  }

  return created;
}

function planRoads(room: Room, maxSites: number): number {
  const spawn = getPrimarySpawn(room);
  if (!spawn) {
    return 0;
  }

  let created = 0;
  const targets = roadTargets(room);

  for (const target of targets) {
    if (created >= maxSites) {
      return created;
    }

    const path = spawn.pos.findPathTo(target, {
      ignoreCreeps: true,
      range: 1
    });

    for (const step of path) {
      if (created >= maxSites) {
        return created;
      }

      const position = new RoomPosition(step.x, step.y, room.name);
      if (canBuildRoad(position) && position.createConstructionSite(STRUCTURE_ROAD) === OK) {
        created += 1;
      }
    }
  }

  return created;
}

function roadTargets(room: Room): RoomPosition[] {
  const controllerLevel = room.controller?.level ?? 0;
  const targets = room.find(FIND_SOURCES).map(source => source.pos);

  if (controllerLevel >= 3 && room.controller) {
    targets.push(room.controller.pos);
  }

  return targets;
}

function getPrimarySpawn(room: Room): StructureSpawn | undefined {
  return room.find(FIND_MY_STRUCTURES, {
    filter: (structure): structure is StructureSpawn => structure.structureType === STRUCTURE_SPAWN
  })[0];
}

function hasNearbySpawnContainerOrSite(spawn: StructureSpawn): boolean {
  const containers = spawn.pos.findInRange(FIND_STRUCTURES, 2, {
    filter: (structure): structure is StructureContainer => structure.structureType === STRUCTURE_CONTAINER
  });

  if (containers.length > 0) {
    return true;
  }

  const sites = spawn.pos.findInRange(FIND_CONSTRUCTION_SITES, 2, {
    filter: site => site.structureType === STRUCTURE_CONTAINER
  });

  return sites.length > 0;
}

function hasNearbyContainerOrSite(source: Source): boolean {
  const containers = source.pos.findInRange(FIND_STRUCTURES, 1, {
    filter: (structure): structure is StructureContainer => structure.structureType === STRUCTURE_CONTAINER
  });

  if (containers.length > 0) {
    return true;
  }

  const sites = source.pos.findInRange(FIND_CONSTRUCTION_SITES, 1, {
    filter: site => site.structureType === STRUCTURE_CONTAINER
  });

  return sites.length > 0;
}

function chooseContainerPosition(source: Source, anchor: RoomPosition | undefined): RoomPosition | undefined {
  const positions = getAdjacentPositions(source.pos).filter(canBuildStructure);
  if (positions.length === 0) {
    return undefined;
  }

  if (!anchor) {
    return positions[0];
  }

  return positions.sort((left, right) => left.getRangeTo(anchor) - right.getRangeTo(anchor))[0];
}

function allAllowedStructuresPlanned(room: Room, structureType: BuildableStructureConstant): boolean {
  return plannedOrBuiltCount(room, structureType) >= allowedStructureCount(room, structureType);
}

function allowedStructureCount(room: Room, structureType: BuildableStructureConstant): number {
  if (!room.controller) {
    return 0;
  }

  return CONTROLLER_STRUCTURES[structureType][room.controller.level] ?? 0;
}

function plannedOrBuiltCount(room: Room, structureType: BuildableStructureConstant): number {
  const built = room.find(FIND_MY_STRUCTURES, {
    filter: structure => structure.structureType === structureType
  }).length;
  const sites = room.find(FIND_MY_CONSTRUCTION_SITES, {
    filter: site => site.structureType === structureType
  }).length;

  return built + sites;
}

function getAdjacentPositions(position: RoomPosition): RoomPosition[] {
  return getPositionsInRange(position, 1);
}

function getPositionsInRange(position: RoomPosition, range: number): RoomPosition[] {
  const positions: RoomPosition[] = [];

  for (let dx = -range; dx <= range; dx += 1) {
    for (let dy = -range; dy <= range; dy += 1) {
      if (dx === 0 && dy === 0) {
        continue;
      }

      const x = position.x + dx;
      const y = position.y + dy;
      if (x <= 0 || x >= 49 || y <= 0 || y >= 49) {
        continue;
      }

      positions.push(new RoomPosition(x, y, position.roomName));
    }
  }

  return positions;
}

function canBuildStructure(position: RoomPosition): boolean {
  if (isWall(position)) {
    return false;
  }

  if (position.lookFor(LOOK_CONSTRUCTION_SITES).length > 0) {
    return false;
  }

  return position.lookFor(LOOK_STRUCTURES).length === 0;
}

function canBuildRoad(position: RoomPosition): boolean {
  if (isWall(position)) {
    return false;
  }

  const structures = position.lookFor(LOOK_STRUCTURES);
  if (structures.some(structure => structure.structureType === STRUCTURE_ROAD)) {
    return false;
  }

  if (position.lookFor(LOOK_CONSTRUCTION_SITES).length > 0) {
    return false;
  }

  return !structures.some(structure => structure.structureType !== STRUCTURE_RAMPART);
}

function isWall(position: RoomPosition): boolean {
  return position.lookFor(LOOK_TERRAIN)[0] === "wall";
}
