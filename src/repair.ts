type RepairKind = "creep" | "tower";

export function findRepairTarget(creep: Creep): Structure | undefined {
  return findClosestRepairTarget(creep.pos, creep.room, "creep");
}

export function findTowerRepairTarget(tower: StructureTower): Structure | undefined {
  return findClosestRepairTarget(tower.pos, tower.room, "tower");
}

export function roomHasRepairTargets(room: Room): boolean {
  return room.find(FIND_STRUCTURES, {
    filter: structure => repairPriority(structure, "creep") !== undefined
  }).length > 0;
}

function findClosestRepairTarget(pos: RoomPosition, room: Room, kind: RepairKind): Structure | undefined {
  const targets = room.find(FIND_STRUCTURES, {
    filter: structure => repairPriority(structure, kind) !== undefined
  });

  if (targets.length === 0) {
    return undefined;
  }

  targets.sort((left, right) => {
    const priorityDelta = repairPriority(left, kind)! - repairPriority(right, kind)!;
    if (priorityDelta !== 0) {
      return priorityDelta;
    }

    return left.hits / left.hitsMax - right.hits / right.hitsMax;
  });

  const bestPriority = repairPriority(targets[0], kind);
  const bestTargets = targets.filter(target => repairPriority(target, kind) === bestPriority);
  return pos.findClosestByPath(bestTargets) ?? bestTargets[0];
}

function repairPriority(structure: Structure, kind: RepairKind): number | undefined {
  if (structure.structureType === STRUCTURE_WALL || structure.structureType === STRUCTURE_RAMPART) {
    return undefined;
  }

  const ratio = structure.hits / structure.hitsMax;
  const threshold = kind === "tower" ? towerRepairThreshold(structure) : creepRepairThreshold(structure);
  if (ratio >= threshold) {
    return undefined;
  }

  if (structure.structureType === STRUCTURE_CONTAINER) {
    return 1;
  }

  if (structure.structureType === STRUCTURE_ROAD) {
    return 2;
  }

  return 3;
}

function creepRepairThreshold(structure: Structure): number {
  if (hasImportantConstruction(structure.room)) {
    return earlyRepairThreshold(structure);
  }

  if (structure.structureType === STRUCTURE_CONTAINER) {
    return 0.8;
  }

  if (structure.structureType === STRUCTURE_ROAD) {
    return 0.7;
  }

  return 0.5;
}

function earlyRepairThreshold(structure: Structure): number {
  if (structure.structureType === STRUCTURE_CONTAINER) {
    return 0.55;
  }

  if (structure.structureType === STRUCTURE_ROAD) {
    return 0.3;
  }

  return 0.4;
}

function towerRepairThreshold(structure: Structure): number {
  if (hasImportantConstruction(structure.room)) {
    return 0.25;
  }

  if (structure.structureType === STRUCTURE_CONTAINER) {
    return 0.6;
  }

  if (structure.structureType === STRUCTURE_ROAD) {
    return 0.5;
  }

  return 0.4;
}

function hasImportantConstruction(room: Room): boolean {
  return room.find(FIND_CONSTRUCTION_SITES, {
    filter: site =>
      site.structureType === STRUCTURE_EXTENSION ||
      site.structureType === STRUCTURE_TOWER ||
      site.structureType === STRUCTURE_CONTAINER ||
      site.structureType === STRUCTURE_STORAGE
  }).length > 0;
}
