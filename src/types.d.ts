export {};

declare global {
  type CreepRole =
    | "harvester"
    | "miner"
    | "hauler"
    | "upgrader"
    | "builder"
    | "repairer"
    | "defender"
    | "claimer"
    | "pioneer"
    | "scout";

  const console: {
    log(message?: unknown, ...optionalParams: unknown[]): void;
  };

  interface CreepCountsByRole {
    harvester: number;
    miner: number;
    hauler: number;
    upgrader: number;
    builder: number;
    repairer: number;
    defender: number;
    claimer: number;
    pioneer: number;
    scout: number;
  }

  interface SourceStatsSnapshot {
    id: Id<Source>;
    energy: number;
    energyCapacity: number;
    assignedCreeps: number;
  }

  interface RoomStatsSnapshot {
    name: string;
    energyAvailable: number;
    energyCapacityAvailable: number;
    controller?: {
      level: number;
      progress: number;
      progressTotal: number;
    };
    creeps: CreepCountsByRole;
    constructionSites: number;
    repairTargets: number;
    hostiles: number;
    towers: {
      count: number;
      energy: number;
      capacity: number;
    };
    containers: {
      count: number;
      energy: number;
      capacity: number;
    };
    storage?: {
      energy: number;
      capacity: number;
    };
    sources: SourceStatsSnapshot[];
    expansionReady: boolean;
  }

  interface BotStatsSnapshot {
    tick: number;
    cpu: {
      used: number;
      limit: number;
      bucket: number;
    };
    gcl: {
      level: number;
      progress: number;
      progressTotal: number;
    };
    creeps: CreepCountsByRole;
    rooms: RoomStatsSnapshot[];
    expansion: {
      targetRoom?: string;
      scoutedRooms: number;
    };
  }

  interface BotStatsMemory {
    current: BotStatsSnapshot;
    history: BotStatsSnapshot[];
  }

  interface ScoutedRoomMemory {
    name: string;
    lastSeen: number;
    sources: number;
    hostiles: number;
    keeperLairs?: number;
    hasController: boolean;
    owner?: string;
    reservation?: string;
    my: boolean;
  }

  interface ScoutingMemory {
    rooms: Record<string, ScoutedRoomMemory>;
  }

  interface CreepMemory {
    role: CreepRole;
    working?: boolean;
    sourceId?: Id<Source>;
    targetRoom?: string;
  }

  interface Memory {
    stats?: BotStatsMemory;
    scouting?: ScoutingMemory;
  }
}
