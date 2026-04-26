export function cleanupDeadCreeps(): void {
  for (const creepName in Memory.creeps) {
    if (!Game.creeps[creepName]) {
      delete Memory.creeps[creepName];
    }
  }
}
