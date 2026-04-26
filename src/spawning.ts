import { roomHasRepairTargets } from "./repair";

const ROLE_PRIORITY: CreepRole[] = ["miner", "hauler", "upgrader", "builder", "repairer"];

export function runSpawner(spawn: StructureSpawn): void {
  if (spawn.spawning) {
    return;
  }

  const roleToSpawn = chooseRoleToSpawn(spawn.room);
  if (!roleToSpawn) {
    return;
  }

  const body = chooseBody(roleToSpawn, spawn.room.energyAvailable);
  if (!body) {
    return;
  }

  const name = `${roleToSpawn}-${Game.time}`;
  const result = spawn.spawnCreep(body, name, {
    memory: {
      role: roleToSpawn,
      working: false
    }
  });

  if (result === OK) {
    console.log(`Spawning ${name}`);
  }
}

function chooseRoleToSpawn(room: Room): CreepRole | undefined {
  const creeps = room.find(FIND_MY_CREEPS);
  const roleCounts = countRoles(creeps);
  const sources = room.find(FIND_SOURCES);

  if (room.energyAvailable >= 200 && roleCounts.harvester === 0 && roleCounts.miner === 0) {
    return "harvester";
  }

  const desiredCounts: Record<CreepRole, number> = {
    harvester: 0,
    miner: sources.length,
    hauler: sources.length > 0 ? Math.max(1, sources.length) : 0,
    upgrader: 1,
    builder: desiredBuilderCount(room),
    repairer: roomHasRepairTargets(room) ? 1 : 0
  };

  for (const role of ROLE_PRIORITY) {
    if (roleCounts[role] < desiredCounts[role]) {
      return role;
    }
  }

  return undefined;
}

function countRoles(creeps: Creep[]): Record<CreepRole, number> {
  return {
    harvester: creeps.filter(creep => creep.memory.role === "harvester").length,
    miner: creeps.filter(creep => creep.memory.role === "miner").length,
    hauler: creeps.filter(creep => creep.memory.role === "hauler").length,
    upgrader: creeps.filter(creep => creep.memory.role === "upgrader").length,
    builder: creeps.filter(creep => creep.memory.role === "builder").length,
    repairer: creeps.filter(creep => creep.memory.role === "repairer").length
  };
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
