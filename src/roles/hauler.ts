import { collectEnergy, updateWorkingState } from "../energy";

export function runHauler(creep: Creep): void {
  updateWorkingState(creep);

  if (!creep.memory.working) {
    collectEnergy(creep);
    return;
  }

  const target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
    filter: structure =>
      (structure.structureType === STRUCTURE_SPAWN ||
        structure.structureType === STRUCTURE_EXTENSION ||
        structure.structureType === STRUCTURE_TOWER) &&
      structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
  });

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
