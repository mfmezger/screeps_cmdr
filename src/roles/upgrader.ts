import { collectWorkerEnergy, updateWorkingState } from "../energy";

export function runUpgrader(creep: Creep): void {
  updateWorkingState(creep);

  if (!creep.memory.working) {
    collectWorkerEnergy(creep);
    return;
  }

  const controller = creep.room.controller;
  if (!controller) {
    return;
  }

  if (creep.upgradeController(controller) === ERR_NOT_IN_RANGE) {
    creep.moveTo(controller, { visualizePathStyle: { stroke: "#ffffff" } });
  }
}
