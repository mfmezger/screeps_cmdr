const REMOTE_ROLES: CreepRole[] = ["claimer", "pioneer", "scout"];

export function shouldAnchorToHome(role: CreepRole): boolean {
  return !REMOTE_ROLES.includes(role);
}

export function getDefaultHomeRoomName(): string | undefined {
  const spawn = Object.values(Game.spawns)[0];
  if (spawn) {
    return spawn.room.name;
  }

  return Object.values(Game.rooms).find(room => room.controller?.my)?.name;
}

export function ensureHomeRoom(creep: Creep): void {
  if (!shouldAnchorToHome(creep.memory.role) || creep.memory.homeRoom) {
    return;
  }

  const homeRoom = creep.room.controller?.my ? creep.room.name : getDefaultHomeRoomName();
  if (homeRoom) {
    creep.memory.homeRoom = homeRoom;
  }
}

export function returnToHomeRoom(creep: Creep): boolean {
  if (!shouldAnchorToHome(creep.memory.role)) {
    return false;
  }

  ensureHomeRoom(creep);
  const homeRoom = creep.memory.homeRoom;
  if (!homeRoom || creep.room.name === homeRoom) {
    return false;
  }

  creep.moveTo(new RoomPosition(25, 25, homeRoom), {
    visualizePathStyle: { stroke: "#ffffff" }
  });
  return true;
}
