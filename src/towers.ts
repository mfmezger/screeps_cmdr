import { findNonKeeperHostiles } from "./hostiles";
import { findTowerRepairTarget } from "./repair";

const REPAIR_ENERGY_RATIO = 0.7;

export function runTowers(room: Room): void {
  const towers = room.find(FIND_MY_STRUCTURES, {
    filter: (structure): structure is StructureTower => structure.structureType === STRUCTURE_TOWER
  });

  for (const tower of towers) {
    runTower(tower);
  }
}

function runTower(tower: StructureTower): void {
  const hostile = chooseHostileTarget(tower);
  if (hostile) {
    tower.attack(hostile);
    return;
  }

  const wounded = tower.pos.findClosestByRange(FIND_MY_CREEPS, {
    filter: creep => creep.hits < creep.hitsMax
  });
  if (wounded) {
    tower.heal(wounded);
    return;
  }

  if (tower.store.getUsedCapacity(RESOURCE_ENERGY) < tower.store.getCapacity(RESOURCE_ENERGY) * REPAIR_ENERGY_RATIO) {
    return;
  }

  const repairTarget = findTowerRepairTarget(tower);
  if (repairTarget) {
    tower.repair(repairTarget);
  }
}

function chooseHostileTarget(tower: StructureTower): Creep | undefined {
  const hostiles = findNonKeeperHostiles(tower.room);
  if (hostiles.length === 0) {
    return undefined;
  }

  return hostiles.sort((left, right) => hostilePriority(left) - hostilePriority(right) || left.hits - right.hits)[0];
}

function hostilePriority(creep: Creep): number {
  if (creep.getActiveBodyparts(HEAL) > 0) {
    return 1;
  }

  if (creep.getActiveBodyparts(ATTACK) > 0 || creep.getActiveBodyparts(RANGED_ATTACK) > 0) {
    return 2;
  }

  if (creep.getActiveBodyparts(WORK) > 0) {
    return 3;
  }

  return 4;
}
