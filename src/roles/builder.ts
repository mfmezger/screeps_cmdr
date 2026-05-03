import { roomCanWorkUnderThreat, roomIsInEmergencyDefense } from "../defense";
import { collectWorkerEnergy, updateWorkingState } from "../energy";

const PRIORITY_STRUCTURE_GROUPS: BuildableStructureConstant[][] = [
  [STRUCTURE_SPAWN, STRUCTURE_EXTENSION],
  [STRUCTURE_TOWER],
  [STRUCTURE_CONTAINER, STRUCTURE_STORAGE],
  [STRUCTURE_RAMPART],
  [STRUCTURE_ROAD]
];

const EMERGENCY_PRIORITY_STRUCTURE_GROUPS: BuildableStructureConstant[][] = [
  [STRUCTURE_TOWER],
  [STRUCTURE_RAMPART],
  [STRUCTURE_SPAWN, STRUCTURE_EXTENSION],
  [STRUCTURE_CONTAINER, STRUCTURE_STORAGE],
  [STRUCTURE_ROAD]
];

export function runBuilder(creep: Creep): void {
  updateWorkingState(creep);

  if (!creep.memory.working) {
    delete creep.memory.buildTargetId;
    collectWorkerEnergy(creep);
    return;
  }

  if (!roomCanWorkUnderThreat(creep.room)) {
    return;
  }

  const site = getBuildTarget(creep);
  if (site) {
    if (creep.build(site) === ERR_NOT_IN_RANGE) {
      creep.moveTo(site, { visualizePathStyle: { stroke: "#ffffff" } });
    }
    return;
  }

  delete creep.memory.buildTargetId;
  const controller = creep.room.controller;
  if (controller && creep.upgradeController(controller) === ERR_NOT_IN_RANGE) {
    creep.moveTo(controller, { visualizePathStyle: { stroke: "#ffffff" } });
  }
}

function getBuildTarget(creep: Creep): ConstructionSite | undefined {
  if (creep.memory.buildTargetId) {
    const target = Game.getObjectById(creep.memory.buildTargetId);
    if (target) {
      return target;
    }

    delete creep.memory.buildTargetId;
  }

  const target = findBuildTarget(creep);
  if (target) {
    creep.memory.buildTargetId = target.id;
  }

  return target;
}

function findBuildTarget(creep: Creep): ConstructionSite | undefined {
  const priorityGroups = roomIsInEmergencyDefense(creep.room)
    ? EMERGENCY_PRIORITY_STRUCTURE_GROUPS
    : PRIORITY_STRUCTURE_GROUPS;

  for (const structureTypes of priorityGroups) {
    const target = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES, {
      filter: site => structureTypes.includes(site.structureType)
    });

    if (target) {
      return target;
    }
  }

  return creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES) ?? undefined;
}
