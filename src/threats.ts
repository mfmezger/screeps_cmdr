import { findNonKeeperHostiles } from "./hostiles";

const THREAT_TTL = 100000;

export function recordThreats(room: Room): void {
  const hostiles = findNonKeeperHostiles(room);
  if (hostiles.length === 0) {
    return;
  }

  if (!Memory.threats) {
    Memory.threats = {};
  }

  for (const hostile of hostiles) {
    const username = hostile.owner.username;
    const existing = Memory.threats[username] ?? {
      username,
      lastSeen: Game.time,
      rooms: {}
    };

    existing.lastSeen = Game.time;
    existing.rooms[room.name] = Game.time;
    Memory.threats[username] = existing;
  }
}

export function isThreatOwner(username: string | undefined): boolean {
  if (!username || !Memory.threats?.[username]) {
    return false;
  }

  return Game.time - Memory.threats[username].lastSeen <= THREAT_TTL;
}
