import { collectEnergy, updateWorkingState } from "../energy";

export function runPioneer(creep: Creep): void {
  const targetRoom = creep.memory.targetRoom;
  if (!targetRoom) {
    return;
  }

  if (creep.room.name !== targetRoom) {
    creep.moveTo(new RoomPosition(25, 25, targetRoom), { visualizePathStyle: { stroke: "#ffffff" } });
    return;
  }

  updateWorkingState(creep);

  if (!creep.memory.working) {
    collectEnergy(creep);
    return;
  }

  const site = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
  if (site) {
    if (creep.build(site) === ERR_NOT_IN_RANGE) {
      creep.moveTo(site, { visualizePathStyle: { stroke: "#ffffff" } });
    }
    return;
  }

  const controller = creep.room.controller;
  if (controller && creep.upgradeController(controller) === ERR_NOT_IN_RANGE) {
    creep.moveTo(controller, { visualizePathStyle: { stroke: "#ffffff" } });
  }
}
