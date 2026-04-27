import { isSourceKeeper } from "./hostiles";

const SOURCE_KEEPER_AVOID_RANGE = 6;
const HOSTILE_AVOID_RANGE = 5;
const ASSIGNMENT_PENALTY = 25;

export function getSafeSources(room: Room): Source[] {
  return room.find(FIND_SOURCES).filter(isSafeSource);
}

export function getAssignedSource(creep: Creep): Source | undefined {
  if (creep.memory.sourceId) {
    const source = Game.getObjectById(creep.memory.sourceId);
    if (source && isSafeSource(source) && !shouldReassignSource(creep, source)) {
      return source;
    }

    delete creep.memory.sourceId;
  }

  const source = chooseSource(creep);
  if (!source) {
    return undefined;
  }

  creep.memory.sourceId = source.id;
  return source;
}

export function findClosestSafeActiveSource(creep: Creep): Source | undefined {
  return creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE, {
    filter: source => isSafeSource(source)
  }) ?? undefined;
}

function chooseSource(creep: Creep): Source | undefined {
  const sources = getSafeSources(creep.room);
  if (sources.length === 0) {
    return undefined;
  }

  return sources.sort((left, right) => sourceScore(creep, left) - sourceScore(creep, right))[0];
}

function shouldReassignSource(creep: Creep, source: Source): boolean {
  if (creep.memory.role !== "miner") {
    return false;
  }

  const currentCount = assignedCount(source);
  return getSafeSources(creep.room).some(otherSource =>
    otherSource.id !== source.id && assignedCount(otherSource) + 1 < currentCount
  );
}

function sourceScore(creep: Creep, source: Source): number {
  if (creep.memory.role === "miner") {
    return assignedCount(source) * 1000 + pathDistance(creep, source);
  }

  return pathDistance(creep, source) + assignedCount(source) * ASSIGNMENT_PENALTY;
}

function pathDistance(creep: Creep, source: Source): number {
  const path = creep.pos.findPathTo(source, {
    ignoreCreeps: true,
    range: 1
  });

  return path.length > 0 ? path.length : creep.pos.getRangeTo(source);
}

export function isSafeSource(source: Source): boolean {
  const keeperLair = source.pos.findInRange(FIND_STRUCTURES, SOURCE_KEEPER_AVOID_RANGE, {
    filter: structure => structure.structureType === STRUCTURE_KEEPER_LAIR
  })[0];

  if (keeperLair) {
    return false;
  }

  return source.pos.findInRange(FIND_HOSTILE_CREEPS, HOSTILE_AVOID_RANGE, {
    filter: hostile => isSourceKeeper(hostile) || hostile.getActiveBodyparts(ATTACK) > 0 || hostile.getActiveBodyparts(RANGED_ATTACK) > 0
  }).length === 0;
}

function assignedCount(source: Source): number {
  return Object.values(Game.creeps).filter(creep => creep.memory.sourceId === source.id).length;
}
