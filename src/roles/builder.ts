export function runBuilder(creep: Creep): void {
  updateWorkingState(creep);

  if (!creep.memory.working) {
    harvestEnergy(creep);
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

function updateWorkingState(creep: Creep): void {
  if (creep.memory.working && creep.store[RESOURCE_ENERGY] === 0) {
    creep.memory.working = false;
  }

  if (!creep.memory.working && creep.store.getFreeCapacity() === 0) {
    creep.memory.working = true;
  }
}

function harvestEnergy(creep: Creep): void {
  const source = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
  if (!source) {
    return;
  }

  if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
    creep.moveTo(source, { visualizePathStyle: { stroke: "#ffaa00" } });
  }
}
