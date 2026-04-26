import { cleanupDeadCreeps } from "./memory";
import { runRoomPlanning } from "./planning";
import { runBuilder } from "./roles/builder";
import { runHarvester } from "./roles/harvester";
import { runHauler } from "./roles/hauler";
import { runMiner } from "./roles/miner";
import { runRepairer } from "./roles/repairer";
import { runUpgrader } from "./roles/upgrader";
import { runSpawner } from "./spawning";
import { recordStats } from "./stats";
import { runTowers } from "./towers";

export function loop(): void {
  cleanupDeadCreeps();

  for (const roomName in Game.rooms) {
    const room = Game.rooms[roomName];
    runRoomPlanning(room);
    runTowers(room);
  }

  for (const spawnName in Game.spawns) {
    runSpawner(Game.spawns[spawnName]);
  }

  for (const creepName in Game.creeps) {
    const creep = Game.creeps[creepName];

    switch (creep.memory.role) {
      case "harvester":
        runHarvester(creep);
        break;
      case "miner":
        runMiner(creep);
        break;
      case "hauler":
        runHauler(creep);
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

  recordStats();
}
