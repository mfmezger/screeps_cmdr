import { findDangerousHostiles, isSourceKeeper } from "../hostiles";

export function runDefender(creep: Creep): void {
  const dangerousTargets = findDangerousHostiles(creep.room);
  const target = creep.pos.findClosestByPath(dangerousTargets) ?? creep.pos.findClosestByPath(FIND_HOSTILE_CREEPS, {
    filter: hostile => !isSourceKeeper(hostile)
  });
  if (target) {
    if (creep.attack(target) === ERR_NOT_IN_RANGE) {
      creep.moveTo(target, { visualizePathStyle: { stroke: "#ff0000" } });
    }
    return;
  }

  const spawn = creep.pos.findClosestByPath(FIND_MY_SPAWNS);
  if (spawn && !creep.pos.inRangeTo(spawn, 3)) {
    creep.moveTo(spawn, { visualizePathStyle: { stroke: "#ffffff" } });
  }
}
