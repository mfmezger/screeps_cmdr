import { isThreatOwner } from "./threats";

const SCOUT_TTL = 1500;
const MAX_SCOUT_DISTANCE = 3;

export function recordScouting(room: Room): void {
  const memory = getScoutingMemory();
  memory.rooms[room.name] = {
    name: room.name,
    lastSeen: Game.time,
    sources: room.find(FIND_SOURCES).length,
    hostiles: room.find(FIND_HOSTILE_CREEPS).length,
    keeperLairs: room.find(FIND_STRUCTURES, {
      filter: structure => structure.structureType === STRUCTURE_KEEPER_LAIR
    }).length,
    hasController: !!room.controller,
    owner: room.controller?.owner?.username,
    reservation: room.controller?.reservation?.username,
    my: room.controller?.my ?? false
  };
}

export function getNextScoutTarget(homeRoom: Room): string | undefined {
  const activeScoutTargets = new Set(
    Object.values(Game.creeps)
      .filter(creep => creep.memory.role === "scout" && creep.memory.targetRoom)
      .map(creep => creep.memory.targetRoom!)
  );

  const candidates = frontierRooms(homeRoom)
    .filter(roomName => roomName !== homeRoom.name)
    .filter(roomName => !activeScoutTargets.has(roomName))
    .filter(roomName => Game.map.getRoomLinearDistance(homeRoom.name, roomName) <= MAX_SCOUT_DISTANCE);

  return candidates.sort((left, right) => {
    const lastSeenDelta = lastSeen(left) - lastSeen(right);
    if (lastSeenDelta !== 0) {
      return lastSeenDelta;
    }

    return Game.map.getRoomLinearDistance(homeRoom.name, left) - Game.map.getRoomLinearDistance(homeRoom.name, right);
  })[0];
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
    .filter(room => Game.map.getRoomLinearDistance(homeRoom.name, room.name) <= MAX_SCOUT_DISTANCE)
    .map(room => ({
      room,
      score: scoreRoom(homeRoom.name, room)
    }))
    .sort((left, right) => right.score - left.score);

  return candidates[0]?.room.name;
}

function frontierRooms(homeRoom: Room): string[] {
  const candidates = new Set<string>();
  addExits(homeRoom.name, candidates);

  for (const room of Object.values(getScoutingMemory().rooms)) {
    if (!isFresh(room)) {
      continue;
    }

    if (Game.map.getRoomLinearDistance(homeRoom.name, room.name) >= MAX_SCOUT_DISTANCE) {
      continue;
    }

    if ((room.keeperLairs ?? 0) > 0 || room.hostiles > 0 || room.owner || isThreatOwner(room.owner)) {
      continue;
    }

    addExits(room.name, candidates);
  }

  return [...candidates];
}

function addExits(roomName: string, candidates: Set<string>): void {
  const exits = Game.map.describeExits(roomName);
  if (!exits) {
    return;
  }

  for (const roomName of Object.values(exits)) {
    candidates.add(roomName);
  }
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
    (room.keeperLairs ?? 0) === 0 &&
    !isThreatOwner(room.owner) &&
    !isThreatOwner(room.reservation) &&
    room.sources >= 2;
}

function scoreRoom(homeRoomName: string, room: ScoutedRoomMemory): number {
  const distance = Game.map.getRoomLinearDistance(homeRoomName, room.name);
  return room.sources * 100 - distance * 15;
}
