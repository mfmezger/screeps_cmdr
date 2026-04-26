import { isSourceKeeper } from "./hostiles";
import { findTowerRepairTarget } from "./repair";

export function runTowers(room: Room): void {
  const towers = room.find(FIND_MY_STRUCTURES, {
    filter: (structure): structure is StructureTower => structure.structureType === STRUCTURE_TOWER
  });

  for (const tower of towers) {
    runTower(tower);
  }
}

function runTower(tower: StructureTower): void {
  const hostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
    filter: creep => !isSourceKeeper(creep)
  });
  if (hostile) {
    tower.attack(hostile);
    return;
  }

  if (tower.store.getUsedCapacity(RESOURCE_ENERGY) < tower.store.getCapacity(RESOURCE_ENERGY) / 2) {
    return;
  }

  const repairTarget = findTowerRepairTarget(tower);
  if (repairTarget) {
    tower.repair(repairTarget);
  }
}
