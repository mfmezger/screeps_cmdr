export function runClaimer(creep: Creep): void {
  const targetRoom = creep.memory.targetRoom;
  if (!targetRoom) {
    return;
  }

  if (creep.room.name !== targetRoom) {
    creep.moveTo(new RoomPosition(25, 25, targetRoom), { visualizePathStyle: { stroke: "#ffffff" } });
    return;
  }

  const controller = creep.room.controller;
  if (!controller) {
    return;
  }

  const result = creep.claimController(controller);
  if (result === ERR_NOT_IN_RANGE) {
    creep.moveTo(controller, { visualizePathStyle: { stroke: "#ffffff" } });
    return;
  }

  if (result === ERR_GCL_NOT_ENOUGH || result === ERR_FULL) {
    if (creep.reserveController(controller) === ERR_NOT_IN_RANGE) {
      creep.moveTo(controller, { visualizePathStyle: { stroke: "#ffffff" } });
    }
  }
}
