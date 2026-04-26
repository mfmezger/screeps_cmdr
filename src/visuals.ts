import { getExpansionTargetRoom } from "./expansion";

const LOG_INTERVAL = 100;

export function runRoomVisuals(room: Room): void {
  drawRoomHeader(room);
  drawCreepRoles(room);
  drawSourceAssignments(room);
  logRoomStatus(room);
}

function drawRoomHeader(room: Room): void {
  const visual = room.visual;
  const targetRoom = getExpansionTargetRoom(room) ?? "none";
  const controllerText = room.controller
    ? `RCL ${room.controller.level} ${progressPercent(room.controller.progress, room.controller.progressTotal)}`
    : "no controller";

  visual.text(
    `${room.name} | ${controllerText} | energy ${room.energyAvailable}/${room.energyCapacityAvailable} | expand ${targetRoom}`,
    1,
    1,
    {
      align: "left",
      color: "#ffffff",
      font: 0.7
    }
  );
}

function drawCreepRoles(room: Room): void {
  for (const creep of room.find(FIND_MY_CREEPS)) {
    room.visual.text(creep.memory.role, creep.pos.x, creep.pos.y - 0.6, {
      color: roleColor(creep.memory.role),
      font: 0.45,
      stroke: "#000000",
      strokeWidth: 0.1
    });
  }
}

function drawSourceAssignments(room: Room): void {
  for (const source of room.find(FIND_SOURCES)) {
    const assigned = Object.values(Game.creeps).filter(creep => creep.memory.sourceId === source.id).length;
    room.visual.text(`src ${assigned}`, source.pos.x, source.pos.y + 0.8, {
      color: "#ffaa00",
      font: 0.5,
      stroke: "#000000",
      strokeWidth: 0.1
    });
  }
}

function logRoomStatus(room: Room): void {
  if (Game.time % LOG_INTERVAL !== 0 || !room.controller?.my) {
    return;
  }

  const creeps = room.find(FIND_MY_CREEPS);
  console.log(
    `${room.name}: energy ${room.energyAvailable}/${room.energyCapacityAvailable}, ` +
      `creeps ${creeps.length}, sites ${room.find(FIND_CONSTRUCTION_SITES).length}, ` +
      `hostiles ${room.find(FIND_HOSTILE_CREEPS).length}`
  );
}

function progressPercent(value: number, total: number): string {
  if (total === 0) {
    return "n/a";
  }

  return `${Math.floor((value / total) * 100)}%`;
}

function roleColor(role: CreepRole): string {
  switch (role) {
    case "miner":
      return "#ffaa00";
    case "hauler":
      return "#00aaff";
    case "builder":
      return "#00ff00";
    case "repairer":
      return "#ffff00";
    case "defender":
      return "#ff0000";
    case "scout":
      return "#ff00ff";
    default:
      return "#ffffff";
  }
}
