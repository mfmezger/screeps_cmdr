const SOURCE_KEEPER_USERNAME = "Source Keeper";

export function isSourceKeeper(creep: Creep): boolean {
  return creep.owner.username === SOURCE_KEEPER_USERNAME;
}

export function findNonKeeperHostiles(room: Room): Creep[] {
  return room.find(FIND_HOSTILE_CREEPS, {
    filter: hostile => !isSourceKeeper(hostile)
  });
}

export function findDangerousHostiles(room: Room): Creep[] {
  return findNonKeeperHostiles(room).filter(isDangerousHostile);
}

export function isDangerousHostile(creep: Creep): boolean {
  return hostileThreatScore(creep) > 0;
}

export function hostileThreatScore(creep: Creep): number {
  return creep.getActiveBodyparts(ATTACK) * 3 +
    creep.getActiveBodyparts(RANGED_ATTACK) * 3 +
    creep.getActiveBodyparts(HEAL) * 4 +
    creep.getActiveBodyparts(WORK);
}
