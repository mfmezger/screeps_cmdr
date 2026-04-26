import { getAssignedSource } from "../sources";

export function runMiner(creep: Creep): void {
  const source = getAssignedSource(creep);
  if (!source) {
    return;
  }

  if (!creep.pos.isNearTo(source)) {
    creep.moveTo(source, { visualizePathStyle: { stroke: "#ffaa00" } });
    return;
  }

  if (creep.store.getFreeCapacity() > 0) {
    creep.harvest(source);
    return;
  }

  const container = findAdjacentContainer(creep);
  if (container) {
    creep.transfer(container, RESOURCE_ENERGY);
    return;
  }

  creep.drop(RESOURCE_ENERGY);
}

function findAdjacentContainer(creep: Creep): StructureContainer | undefined {
  return creep.pos.findInRange(FIND_STRUCTURES, 1, {
    filter: (structure): structure is StructureContainer =>
      structure.structureType === STRUCTURE_CONTAINER &&
      structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
  })[0];
}
