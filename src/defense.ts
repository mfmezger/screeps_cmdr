import { findNonKeeperHostiles } from "./hostiles";

const MIN_DEFENSIVE_TOWER_ENERGY = 150;

export function runDefense(room: Room): void {
  const hostiles = findNonKeeperHostiles(room);
  if (hostiles.length === 0) {
    return;
  }

  const controller = room.controller;
  if (!controller?.my || controller.safeMode || !controller.safeModeAvailable) {
    return;
  }

  if (!hostiles.some(canDamageOrHeal)) {
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
  const hostiles = findNonKeeperHostiles(room);
  if (hostiles.length === 0) {
    return false;
  }

  return !roomHasChargedTower(room);
}

export function roomHasNonKeeperHostiles(room: Room): boolean {
  return findNonKeeperHostiles(room).length > 0;
}

function roomHasChargedTower(room: Room): boolean {
  return room.find(FIND_MY_STRUCTURES, {
    filter: (structure): structure is StructureTower =>
      structure.structureType === STRUCTURE_TOWER &&
      structure.store.getUsedCapacity(RESOURCE_ENERGY) >= MIN_DEFENSIVE_TOWER_ENERGY
  }).length > 0;
}

function canDamageOrHeal(creep: Creep): boolean {
  return creep.getActiveBodyparts(ATTACK) > 0 ||
    creep.getActiveBodyparts(RANGED_ATTACK) > 0 ||
    creep.getActiveBodyparts(HEAL) > 0 ||
    creep.getActiveBodyparts(WORK) > 0;
}
