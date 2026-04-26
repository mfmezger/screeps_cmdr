import { roomNeedsDefender } from "./defense";
import { countExpansionCreeps, getExpansionTargetRoom, isExpansionReady } from "./expansion";
import { roomHasRepairTargets } from "./repair";

const ROLE_PRIORITY: CreepRole[] = ["defender", "miner", "hauler", "upgrader", "builder", "repairer"];

interface SpawnRequest {
  role: CreepRole;
  targetRoom?: string;
}

export function runSpawner(spawn: StructureSpawn): void {
  if (spawn.spawning) {
    return;
  }

  const request = chooseSpawnRequest(spawn.room);
  if (!request) {
    return;
  }

  const body = chooseBody(request.role, spawn.room.energyAvailable);
  if (!body) {
    return;
  }

  const name = `${request.role}-${Game.time}`;
  const result = spawn.spawnCreep(body, name, {
    memory: {
      role: request.role,
      working: false,
      targetRoom: request.targetRoom
    }
  });

  if (result === OK) {
    console.log(`Spawning ${name}`);
  }
}

function chooseSpawnRequest(room: Room): SpawnRequest | undefined {
  const creeps = room.find(FIND_MY_CREEPS);
  const roleCounts = countViableRoles(creeps);
  const sources = room.find(FIND_SOURCES);

  if (room.energyAvailable >= 200 && roleCounts.harvester === 0 && roleCounts.miner === 0) {
    return { role: "harvester" };
  }

  const desiredCounts: Record<CreepRole, number> = {
    harvester: 0,
    miner: sources.length,
    hauler: sources.length > 0 ? Math.max(1, sources.length) : 0,
    upgrader: 1,
    builder: desiredBuilderCount(room),
    repairer: roomHasRepairTargets(room) ? 1 : 0,
    defender: roomNeedsDefender(room) ? 1 : 0,
    claimer: 0,
    pioneer: 0
  };

  for (const role of ROLE_PRIORITY) {
    if (roleCounts[role] < desiredCounts[role]) {
      return { role };
    }
  }

  return chooseExpansionSpawnRequest(room);
}

function chooseExpansionSpawnRequest(room: Room): SpawnRequest | undefined {
  const targetRoom = getExpansionTargetRoom();
  if (!targetRoom || !isExpansionReady(room)) {
    return undefined;
  }

  if (countExpansionCreeps("claimer", targetRoom) < 1) {
    return { role: "claimer", targetRoom };
  }

  if (countExpansionCreeps("pioneer", targetRoom) < 2) {
    return { role: "pioneer", targetRoom };
  }

  return undefined;
}

function countViableRoles(creeps: Creep[]): Record<CreepRole, number> {
  return {
    harvester: countViableRole(creeps, "harvester"),
    miner: countViableRole(creeps, "miner"),
    hauler: countViableRole(creeps, "hauler"),
    upgrader: countViableRole(creeps, "upgrader"),
    builder: countViableRole(creeps, "builder"),
    repairer: countViableRole(creeps, "repairer"),
    defender: countViableRole(creeps, "defender"),
    claimer: countViableRole(creeps, "claimer"),
    pioneer: countViableRole(creeps, "pioneer")
  };
}

function countViableRole(creeps: Creep[], role: CreepRole): number {
  return creeps.filter(creep => creep.memory.role === role && isViableForRole(creep, role)).length;
}

function isViableForRole(creep: Creep, role: CreepRole): boolean {
  if (creep.spawning || creep.ticksToLive === undefined) {
    return true;
  }

  return creep.ticksToLive > replacementLeadTime(role);
}

function replacementLeadTime(role: CreepRole): number {
  switch (role) {
    case "miner":
    case "claimer":
      return 100;
    case "hauler":
    case "pioneer":
      return 75;
    default:
      return 50;
  }
}

function desiredBuilderCount(room: Room): number {
  const sites = room.find(FIND_CONSTRUCTION_SITES).length;
  if (sites === 0) {
    return 0;
  }

  return sites >= 5 && room.energyCapacityAvailable >= 550 ? 2 : 1;
}

function chooseBody(role: CreepRole, energyAvailable: number): BodyPartConstant[] | undefined {
  switch (role) {
    case "miner":
      return chooseMinerBody(energyAvailable);
    case "hauler":
      return chooseHaulerBody(energyAvailable);
    case "defender":
      return chooseDefenderBody(energyAvailable);
    case "claimer":
      return energyAvailable >= 650 ? [CLAIM, MOVE] : undefined;
    case "pioneer":
      return chooseWorkerBody(energyAvailable);
    default:
      return chooseWorkerBody(energyAvailable);
  }
}

function chooseMinerBody(energyAvailable: number): BodyPartConstant[] | undefined {
  if (energyAvailable >= 550) {
    return [WORK, WORK, WORK, WORK, CARRY, MOVE, MOVE];
  }

  if (energyAvailable >= 300) {
    return [WORK, WORK, CARRY, MOVE];
  }

  if (energyAvailable >= 200) {
    return [WORK, CARRY, MOVE];
  }

  return undefined;
}

function chooseHaulerBody(energyAvailable: number): BodyPartConstant[] | undefined {
  if (energyAvailable >= 300) {
    return [CARRY, CARRY, CARRY, CARRY, MOVE, MOVE];
  }

  if (energyAvailable >= 200) {
    return [CARRY, CARRY, MOVE, MOVE];
  }

  return undefined;
}

function chooseDefenderBody(energyAvailable: number): BodyPartConstant[] | undefined {
  if (energyAvailable >= 260) {
    return [ATTACK, ATTACK, MOVE, MOVE];
  }

  if (energyAvailable >= 130) {
    return [ATTACK, MOVE];
  }

  return undefined;
}

function chooseWorkerBody(energyAvailable: number): BodyPartConstant[] | undefined {
  if (energyAvailable >= 550) {
    return [WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE];
  }

  if (energyAvailable >= 300) {
    return [WORK, WORK, CARRY, MOVE];
  }

  if (energyAvailable >= 200) {
    return [WORK, CARRY, MOVE];
  }

  return undefined;
}
