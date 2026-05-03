import { roomCanWorkUnderThreat } from "../defense";
import { collectWorkerEnergy, updateWorkingState } from "../energy";
import { findRepairTarget } from "../repair";

export function runRepairer(creep: Creep): void {
  updateWorkingState(creep);

  if (!creep.memory.working) {
    collectWorkerEnergy(creep);
    return;
  }

  if (!roomCanWorkUnderThreat(creep.room)) {
    return;
  }

  const target = findRepairTarget(creep);
  if (target) {
    if (creep.repair(target) === ERR_NOT_IN_RANGE) {
      creep.moveTo(target, { visualizePathStyle: { stroke: "#ffffff" } });
    }
    return;
  }

  const controller = creep.room.controller;
  if (controller && creep.upgradeController(controller) === ERR_NOT_IN_RANGE) {
    creep.moveTo(controller, { visualizePathStyle: { stroke: "#ffffff" } });
  }
}
