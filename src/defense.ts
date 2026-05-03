import { findDangerousHostiles, findNonKeeperHostiles } from "./hostiles";

const MIN_DEFENSIVE_TOWER_ENERGY = 150;

export function runDefense(room: Room): void {
  const hostiles = findDangerousHostiles(room);
  if (hostiles.length === 0) {
    return;
  }

  const controller = room.controller;
  if (!controller?.my || controller.safeMode || !controller.safeModeAvailable) {
    return;
  }

  if (roomHasChargedTower(room)) {
    return;
  }

  const result = controller.activateSafeMode();
  if (result === OK) {
    console.log(`Activated safe mode in ${room.name}`);
  }
}

export function roomNeedsDefender(room: Room): boolean {
  if (room.controller?.safeMode) {
    return false;
  }

  return roomHasDangerousHostiles(room) && !roomHasChargedTower(room);
}

export function desiredDefenderCount(room: Room): number {
  if (!roomNeedsDefender(room)) {
    return 0;
  }

  return Math.min(3, findDangerousHostiles(room).length);
}

export function roomHasNonKeeperHostiles(room: Room): boolean {
  return findNonKeeperHostiles(room).length > 0;
}

export function roomHasDangerousHostiles(room: Room): boolean {
  return findDangerousHostiles(room).length > 0;
}

export function roomIsInEmergencyDefense(room: Room): boolean {
  const controller = room.controller;
  if (!controller?.my || controller.level < 3) {
    return false;
  }

  return builtTowerCount(room) === 0;
}

export function roomCanWorkUnderThreat(room: Room): boolean {
  return !roomHasDangerousHostiles(room) || Boolean(room.controller?.safeMode);
}

function roomHasChargedTower(room: Room): boolean {
  return room.find(FIND_MY_STRUCTURES, {
    filter: (structure): structure is StructureTower =>
      structure.structureType === STRUCTURE_TOWER &&
      structure.store.getUsedCapacity(RESOURCE_ENERGY) >= MIN_DEFENSIVE_TOWER_ENERGY
  }).length > 0;
}

function builtTowerCount(room: Room): number {
  return room.find(FIND_MY_STRUCTURES, {
    filter: structure => structure.structureType === STRUCTURE_TOWER
  }).length;
}
