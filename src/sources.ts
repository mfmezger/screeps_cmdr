export function getAssignedSource(creep: Creep): Source | undefined {
  if (creep.memory.sourceId) {
    const source = Game.getObjectById(creep.memory.sourceId);
    if (source) {
      return source;
    }

    delete creep.memory.sourceId;
  }

  const source = chooseLeastAssignedSource(creep.room);
  if (!source) {
    return undefined;
  }

  creep.memory.sourceId = source.id;
  return source;
}

function chooseLeastAssignedSource(room: Room): Source | undefined {
  const sources = room.find(FIND_SOURCES);
  if (sources.length === 0) {
    return undefined;
  }

  return sources.reduce((best, source) => {
    return assignedCount(source) < assignedCount(best) ? source : best;
  });
}

function assignedCount(source: Source): number {
  return Object.values(Game.creeps).filter(creep => creep.memory.sourceId === source.id).length;
}
