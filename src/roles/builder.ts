import { collectWorkerEnergy, updateWorkingState } from "../energy";

const PRIORITY_STRUCTURE_GROUPS: BuildableStructureConstant[][] = [
  [STRUCTURE_SPAWN, STRUCTURE_EXTENSION],
  [STRUCTURE_TOWER],
  [STRUCTURE_CONTAINER, STRUCTURE_STORAGE],
  [STRUCTURE_ROAD]
];

export function runBuilder(creep: Creep): void {
  updateWorkingState(creep);

  if (!creep.memory.working) {
    collectWorkerEnergy(creep);
    return;
  }

  const site = findBuildTarget(creep);
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

function findBuildTarget(creep: Creep): ConstructionSite | undefined {
  for (const structureTypes of PRIORITY_STRUCTURE_GROUPS) {
    const target = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES, {
      filter: site => structureTypes.includes(site.structureType)
    });

    if (target) {
      return target;
    }
  }

  return creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES) ?? undefined;
}
