import { getNextScoutTarget } from "../scouting";

export function runScout(creep: Creep): void {
  if (!creep.memory.targetRoom || creep.room.name === creep.memory.targetRoom) {
    creep.memory.targetRoom = getNextScoutTarget(getHomeRoom());
  }

  if (!creep.memory.targetRoom) {
    return;
  }

  creep.moveTo(new RoomPosition(25, 25, creep.memory.targetRoom), {
    visualizePathStyle: { stroke: "#ffffff" }
  });
}

function getHomeRoom(): Room {
  const ownedRoom = Object.values(Game.rooms).find(room => room.controller?.my);
  return ownedRoom ?? creepRoomFallback();
}

function creepRoomFallback(): Room {
  return Object.values(Game.creeps)[0].room;
}
