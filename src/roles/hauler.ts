import { collectEnergy, updateWorkingState } from "../energy";

export function runHauler(creep: Creep): void {
  updateWorkingState(creep);

  if (!creep.memory.working) {
    collectEnergy(creep);
    return;
  }

  const target = findDeliveryTarget(creep);
  if (target) {
    if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
      creep.moveTo(target, { visualizePathStyle: { stroke: "#ffaa00" } });
    }
    return;
  }

  const controller = creep.room.controller;
  if (controller && creep.upgradeController(controller) === ERR_NOT_IN_RANGE) {
    creep.moveTo(controller, { visualizePathStyle: { stroke: "#ffffff" } });
  }
}

function findDeliveryTarget(
  creep: Creep
): StructureExtension | StructureSpawn | StructureTower | StructureStorage | undefined {
  return findSpawnOrExtension(creep) ?? findTower(creep) ?? findStorage(creep);
}

function findSpawnOrExtension(creep: Creep): StructureExtension | StructureSpawn | undefined {
  return creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
    filter: (structure): structure is StructureExtension | StructureSpawn =>
      (structure.structureType === STRUCTURE_SPAWN || structure.structureType === STRUCTURE_EXTENSION) &&
      structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
  }) ?? undefined;
}

function findTower(creep: Creep): StructureTower | undefined {
  return creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
    filter: (structure): structure is StructureTower =>
      structure.structureType === STRUCTURE_TOWER &&
      structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
  }) ?? undefined;
}

function findStorage(creep: Creep): StructureStorage | undefined {
  const storage = creep.room.storage;
  if (!storage || storage.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
    return undefined;
  }

  return storage;
}
