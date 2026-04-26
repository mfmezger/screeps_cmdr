import { getAutomaticExpansionTarget } from "./scouting";

const EXPANSION_FLAG_NAMES = ["Expand", "Claim"];

export function getExpansionTargetRoom(homeRoom?: Room): string | undefined {
  for (const flagName of EXPANSION_FLAG_NAMES) {
    const flag = Game.flags[flagName];
    if (flag) {
      return flag.pos.roomName;
    }
  }

  if (!homeRoom) {
    return undefined;
  }

  return getAutomaticExpansionTarget(homeRoom);
}

export function isExpansionReady(room: Room): boolean {
  const controller = room.controller;
  if (!controller?.my || controller.level < 3) {
    return false;
  }

  if (room.find(FIND_HOSTILE_CREEPS).length > 0) {
    return false;
  }

  if (Game.cpu.bucket < 5000) {
    return false;
  }

  if (ownedRoomCount() >= Game.gcl.level) {
    return false;
  }

  const creeps = room.find(FIND_MY_CREEPS);
  const miners = creeps.filter(creep => creep.memory.role === "miner").length;
  const haulers = creeps.filter(creep => creep.memory.role === "hauler").length;

  return miners >= room.find(FIND_SOURCES).length &&
    haulers >= 1 &&
    room.energyCapacityAvailable >= 650;
}

export function countExpansionCreeps(role: CreepRole, targetRoom: string): number {
  return Object.values(Game.creeps).filter(creep =>
    creep.memory.role === role && creep.memory.targetRoom === targetRoom
  ).length;
}

function ownedRoomCount(): number {
  return Object.values(Game.rooms).filter(room => room.controller?.my).length;
}
