import { roomHasDangerousHostiles } from "../defense";
import { collectEnergy, updateWorkingState } from "../energy";

const IDLE_RANGE = 3;

export function runHauler(creep: Creep): void {
  updateWorkingState(creep);

  if (!creep.memory.working) {
    delete creep.memory.deliveryTargetId;

    if (hasAvailableEnergy(creep.room)) {
      collectEnergy(creep);
      return;
    }

    moveNearEnergyPickup(creep);
    return;
  }

  const target = getDeliveryTarget(creep);
  if (target) {
    if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
      creep.moveTo(target, { visualizePathStyle: { stroke: "#ffaa00" } });
    }
    return;
  }

  delete creep.memory.deliveryTargetId;
  moveNearDeliveryPoint(creep);
}

function getDeliveryTarget(
  creep: Creep
): StructureExtension | StructureSpawn | StructureTower | StructureContainer | StructureStorage | undefined {
  if (creep.memory.deliveryTargetId) {
    const target = Game.getObjectById(creep.memory.deliveryTargetId);
    if (target && target.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
      return target;
    }

    delete creep.memory.deliveryTargetId;
  }

  const target = findDeliveryTarget(creep);
  if (target) {
    creep.memory.deliveryTargetId = target.id;
  }

  return target;
}

function hasAvailableEnergy(room: Room): boolean {
  if (room.find(FIND_DROPPED_RESOURCES, {
    filter: resource => resource.resourceType === RESOURCE_ENERGY && resource.amount > 0
  }).length > 0) {
    return true;
  }

  if (room.find(FIND_TOMBSTONES, {
    filter: tombstone => tombstone.store.getUsedCapacity(RESOURCE_ENERGY) > 0
  }).length > 0) {
    return true;
  }

  if (room.find(FIND_RUINS, {
    filter: ruin => ruin.store.getUsedCapacity(RESOURCE_ENERGY) > 0
  }).length > 0) {
    return true;
  }

  return room.find(FIND_STRUCTURES, {
    filter: structure =>
      (structure.structureType === STRUCTURE_CONTAINER || structure.structureType === STRUCTURE_STORAGE) &&
      structure.store.getUsedCapacity(RESOURCE_ENERGY) > 0
  }).length > 0;
}

function moveNearEnergyPickup(creep: Creep): void {
  const target = findPrimaryEnergyPickup(creep.room);
  if (target && !creep.pos.inRangeTo(target, IDLE_RANGE)) {
    creep.moveTo(target, { visualizePathStyle: { stroke: "#ffaa00" } });
  }
}

function moveNearDeliveryPoint(creep: Creep): void {
  const target = findPrimaryDeliveryPoint(creep.room);
  if (target && !creep.pos.inRangeTo(target, IDLE_RANGE)) {
    creep.moveTo(target, { visualizePathStyle: { stroke: "#ffffff" } });
  }
}

function findPrimaryEnergyPickup(room: Room): StructureContainer | StructureStorage | Source | undefined {
  const container = room.find(FIND_STRUCTURES, {
    filter: (structure): structure is StructureContainer => structure.structureType === STRUCTURE_CONTAINER
  })[0];

  if (container) {
    return container;
  }

  if (room.storage) {
    return room.storage;
  }

  return room.find(FIND_SOURCES)[0];
}

function findPrimaryDeliveryPoint(room: Room): StructureSpawn | StructureStorage | undefined {
  const spawn = room.find(FIND_MY_SPAWNS)[0];
  if (spawn) {
    return spawn;
  }

  return room.storage;
}

function findDeliveryTarget(
  creep: Creep
): StructureExtension | StructureSpawn | StructureTower | StructureContainer | StructureStorage | undefined {
  if (roomHasDangerousHostiles(creep.room)) {
    return findTower(creep) ?? findSpawnOrExtension(creep) ?? findBaseContainer(creep) ?? findStorage(creep);
  }

  return findSpawnOrExtension(creep) ?? findTower(creep) ?? findBaseContainer(creep) ?? findStorage(creep);
}

function findSpawnOrExtension(creep: Creep): StructureExtension | StructureSpawn | undefined {
  return creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
    filter: (structure): structure is StructureExtension | StructureSpawn =>
      (structure.structureType === STRUCTURE_SPAWN || structure.structureType === STRUCTURE_EXTENSION) &&
      structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
  }) ?? undefined;
}

function findTower(creep: Creep): StructureTower | undefined {
  return creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
    filter: (structure): structure is StructureTower =>
      structure.structureType === STRUCTURE_TOWER &&
      structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
  }) ?? undefined;
}

function findBaseContainer(creep: Creep): StructureContainer | undefined {
  const spawn = creep.room.find(FIND_MY_SPAWNS)[0];
  if (!spawn || creep.room.storage) {
    return undefined;
  }

  return spawn.pos.findInRange(FIND_STRUCTURES, 2, {
    filter: (structure): structure is StructureContainer =>
      structure.structureType === STRUCTURE_CONTAINER &&
      structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
  })[0];
}

function findStorage(creep: Creep): StructureStorage | undefined {
  const storage = creep.room.storage;
  if (!storage || storage.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
    return undefined;
  }

  return storage;
}
