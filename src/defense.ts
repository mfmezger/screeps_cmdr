export function runDefense(room: Room): void {
  const hostiles = room.find(FIND_HOSTILE_CREEPS);
  if (hostiles.length === 0) {
    return;
  }

  const towers = room.find(FIND_MY_STRUCTURES, {
    filter: (structure): structure is StructureTower => structure.structureType === STRUCTURE_TOWER
  });

  if (towers.length > 0) {
    return;
  }

  const controller = room.controller;
  if (!controller?.my || controller.safeMode || !controller.safeModeAvailable) {
    return;
  }

  const hostileCanAttack = hostiles.some(hostile =>
    hostile.getActiveBodyparts(ATTACK) > 0 ||
    hostile.getActiveBodyparts(RANGED_ATTACK) > 0 ||
    hostile.getActiveBodyparts(HEAL) > 0
  );

  if (hostileCanAttack) {
    const result = controller.activateSafeMode();
    if (result === OK) {
      console.log(`Activated safe mode in ${room.name}`);
    }
  }
}

export function roomNeedsDefender(room: Room): boolean {
  const hostiles = room.find(FIND_HOSTILE_CREEPS);
  if (hostiles.length === 0) {
    return false;
  }

  const towers = room.find(FIND_MY_STRUCTURES, {
    filter: (structure): structure is StructureTower => structure.structureType === STRUCTURE_TOWER
  });

  return towers.length === 0;
}
