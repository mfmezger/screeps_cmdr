import { runDefense } from "./defense";
import { cleanupDeadCreeps } from "./memory";
import { runRoomPlanning } from "./planning";
import { runBuilder } from "./roles/builder";
import { runClaimer } from "./roles/claimer";
import { runDefender } from "./roles/defender";
import { runHarvester } from "./roles/harvester";
import { runHauler } from "./roles/hauler";
import { runMiner } from "./roles/miner";
import { runPioneer } from "./roles/pioneer";
import { runRepairer } from "./roles/repairer";
import { runScout } from "./roles/scout";
import { runUpgrader } from "./roles/upgrader";
import { recordScouting } from "./scouting";
import { runSpawner } from "./spawning";
import { recordStats } from "./stats";
import { runTowers } from "./towers";

export function loop(): void {
  cleanupDeadCreeps();

  for (const roomName in Game.rooms) {
    const room = Game.rooms[roomName];
    recordScouting(room);
    runDefense(room);
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
      case "defender":
        runDefender(creep);
        break;
      case "claimer":
        runClaimer(creep);
        break;
      case "pioneer":
        runPioneer(creep);
        break;
      case "scout":
        runScout(creep);
        break;
    }
  }

  recordStats();
}
