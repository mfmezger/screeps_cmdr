export function updateWorkingState(creep: Creep): void {
  if (creep.memory.working && creep.store[RESOURCE_ENERGY] === 0) {
    creep.memory.working = false;
  }

  if (!creep.memory.working && creep.store.getFreeCapacity() === 0) {
    creep.memory.working = true;
  }
}

export function collectEnergy(creep: Creep): void {
  if (creep.store.getFreeCapacity() === 0) {
    return;
  }

  if (pickupDroppedEnergy(creep)) {
    return;
  }

  if (withdrawFromTombstone(creep)) {
    return;
  }

  if (withdrawFromRuin(creep)) {
    return;
  }

  if (withdrawFromContainer(creep)) {
    return;
  }

  harvestSource(creep);
}

function pickupDroppedEnergy(creep: Creep): boolean {
  const target = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
    filter: resource => resource.resourceType === RESOURCE_ENERGY && resource.amount > 0
  });

  if (!target) {
    return false;
  }

  if (creep.pickup(target) === ERR_NOT_IN_RANGE) {
    creep.moveTo(target, { visualizePathStyle: { stroke: "#ffaa00" } });
  }
  return true;
}

function withdrawFromTombstone(creep: Creep): boolean {
  const target = creep.pos.findClosestByPath(FIND_TOMBSTONES, {
    filter: tombstone => tombstone.store.getUsedCapacity(RESOURCE_ENERGY) > 0
  });

  if (!target) {
    return false;
  }

  if (creep.withdraw(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
    creep.moveTo(target, { visualizePathStyle: { stroke: "#ffaa00" } });
  }
  return true;
}

function withdrawFromRuin(creep: Creep): boolean {
  const target = creep.pos.findClosestByPath(FIND_RUINS, {
    filter: ruin => ruin.store.getUsedCapacity(RESOURCE_ENERGY) > 0
  });

  if (!target) {
    return false;
  }

  if (creep.withdraw(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
    creep.moveTo(target, { visualizePathStyle: { stroke: "#ffaa00" } });
  }
  return true;
}

function withdrawFromContainer(creep: Creep): boolean {
  const target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
    filter: (structure): structure is StructureContainer =>
      structure.structureType === STRUCTURE_CONTAINER &&
      structure.store.getUsedCapacity(RESOURCE_ENERGY) > 0
  });

  if (!target) {
    return false;
  }

  if (creep.withdraw(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
    creep.moveTo(target, { visualizePathStyle: { stroke: "#ffaa00" } });
  }
  return true;
}

function harvestSource(creep: Creep): boolean {
  const target = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
  if (!target) {
    return false;
  }

  if (creep.harvest(target) === ERR_NOT_IN_RANGE) {
    creep.moveTo(target, { visualizePathStyle: { stroke: "#ffaa00" } });
  }
  return true;
}
