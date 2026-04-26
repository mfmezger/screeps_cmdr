const ROLE_PRIORITY: CreepRole[] = ["harvester", "upgrader", "builder"];

export function runSpawner(spawn: StructureSpawn): void {
  if (spawn.spawning) {
    return;
  }

  const roleToSpawn = chooseRoleToSpawn(spawn.room);
  if (!roleToSpawn) {
    return;
  }

  const body = chooseBody(spawn.room.energyAvailable);
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
  const desiredCounts: Record<CreepRole, number> = {
    harvester: 2,
    upgrader: 1,
    builder: room.find(FIND_CONSTRUCTION_SITES).length > 0 ? 1 : 0
  };

  const creeps = room.find(FIND_MY_CREEPS);

  for (const role of ROLE_PRIORITY) {
    const currentCount = creeps.filter(creep => creep.memory.role === role).length;
    if (currentCount < desiredCounts[role]) {
      return role;
    }
  }

  return undefined;
}

function chooseBody(energyAvailable: number): BodyPartConstant[] | undefined {
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
