import { cleanupDeadCreeps } from "./memory";
import { runBuilder } from "./roles/builder";
import { runHarvester } from "./roles/harvester";
import { runRepairer } from "./roles/repairer";
import { runUpgrader } from "./roles/upgrader";
import { runSpawner } from "./spawning";

export function loop(): void {
  cleanupDeadCreeps();

  for (const spawnName in Game.spawns) {
    runSpawner(Game.spawns[spawnName]);
  }

  for (const creepName in Game.creeps) {
    const creep = Game.creeps[creepName];

    switch (creep.memory.role) {
      case "harvester":
        runHarvester(creep);
        break;
      case "upgrader":
        runUpgrader(creep);
        break;
      case "builder":
        runBuilder(creep);
        break;
      case "repairer":
        runRepairer(creep);
        break;
    }
  }
}
