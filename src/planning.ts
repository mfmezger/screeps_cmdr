const PLAN_INTERVAL = 100;
const MAX_NEW_SITES_PER_RUN = 5;
const MAX_ROOM_SITES = 25;

export function runRoomPlanning(room: Room): void {
  if (Game.time % PLAN_INTERVAL !== 0) {
    return;
  }

  if (!room.controller?.my) {
    return;
  }

  let remainingSites = Math.max(0, MAX_ROOM_SITES - room.find(FIND_CONSTRUCTION_SITES).length);
  remainingSites = Math.min(remainingSites, MAX_NEW_SITES_PER_RUN);

  if (remainingSites === 0) {
    return;
  }

  remainingSites -= planSourceContainers(room, remainingSites);
  if (remainingSites === 0) {
    return;
  }

  planRoads(room, remainingSites);
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

function planRoads(room: Room, maxSites: number): number {
  const spawn = getPrimarySpawn(room);
  if (!spawn) {
    return 0;
  }

  let created = 0;
  const targets: RoomPosition[] = [
    ...room.find(FIND_SOURCES).map(source => source.pos)
  ];

  if (room.controller) {
    targets.push(room.controller.pos);
  }

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

function getPrimarySpawn(room: Room): StructureSpawn | undefined {
  return room.find(FIND_MY_STRUCTURES, {
    filter: (structure): structure is StructureSpawn => structure.structureType === STRUCTURE_SPAWN
  })[0];
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
  const positions = getAdjacentPositions(source.pos).filter(canBuildContainer);
  if (positions.length === 0) {
    return undefined;
  }

  if (!anchor) {
    return positions[0];
  }

  return positions.sort((left, right) => left.getRangeTo(anchor) - right.getRangeTo(anchor))[0];
}

function getAdjacentPositions(position: RoomPosition): RoomPosition[] {
  const positions: RoomPosition[] = [];

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

      positions.push(new RoomPosition(x, y, position.roomName));
    }
  }

  return positions;
}

function canBuildContainer(position: RoomPosition): boolean {
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
