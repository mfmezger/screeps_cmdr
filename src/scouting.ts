const SCOUT_TTL = 1500;

export function recordScouting(room: Room): void {
  const memory = getScoutingMemory();
  memory.rooms[room.name] = {
    name: room.name,
    lastSeen: Game.time,
    sources: room.find(FIND_SOURCES).length,
    hostiles: room.find(FIND_HOSTILE_CREEPS).length,
    hasController: !!room.controller,
    owner: room.controller?.owner?.username,
    reservation: room.controller?.reservation?.username,
    my: room.controller?.my ?? false
  };
}

export function getNextScoutTarget(homeRoom: Room): string | undefined {
  const exits = Game.map.describeExits(homeRoom.name);
  if (!exits) {
    return undefined;
  }

  const activeScoutTargets = new Set(
    Object.values(Game.creeps)
      .filter(creep => creep.memory.role === "scout" && creep.memory.targetRoom)
      .map(creep => creep.memory.targetRoom!)
  );

  return Object.values(exits)
    .filter(roomName => !activeScoutTargets.has(roomName))
    .sort((left, right) => lastSeen(left) - lastSeen(right))[0];
}

export function shouldSpawnScout(homeRoom: Room): boolean {
  const controller = homeRoom.controller;
  if (!controller?.my || controller.level < 2) {
    return false;
  }

  if (Object.values(Game.creeps).some(creep => creep.memory.role === "scout")) {
    return false;
  }

  return getNextScoutTarget(homeRoom) !== undefined;
}

export function getAutomaticExpansionTarget(homeRoom: Room): string | undefined {
  const memory = getScoutingMemory();
  const candidates = Object.values(memory.rooms)
    .filter(room => isFresh(room))
    .filter(room => isClaimable(room))
    .map(room => ({
      room,
      score: scoreRoom(homeRoom.name, room)
    }))
    .sort((left, right) => right.score - left.score);

  return candidates[0]?.room.name;
}

function getScoutingMemory(): ScoutingMemory {
  if (!Memory.scouting) {
    Memory.scouting = {
      rooms: {}
    };
  }

  return Memory.scouting;
}

function lastSeen(roomName: string): number {
  const room = Memory.scouting?.rooms[roomName];
  if (!room) {
    return 0;
  }

  return room.lastSeen;
}

function isFresh(room: ScoutedRoomMemory): boolean {
  return Game.time - room.lastSeen <= SCOUT_TTL;
}

function isClaimable(room: ScoutedRoomMemory): boolean {
  return room.hasController &&
    !room.owner &&
    !room.reservation &&
    room.hostiles === 0 &&
    room.sources >= 2;
}

function scoreRoom(homeRoomName: string, room: ScoutedRoomMemory): number {
  const distance = Game.map.getRoomLinearDistance(homeRoomName, room.name);
  return room.sources * 100 - distance * 10;
}
