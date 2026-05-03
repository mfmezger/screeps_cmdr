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
      safeMode?: number;
      safeModeAvailable?: number;
      safeModeCooldown?: number;
    };
    creeps: CreepCountsByRole;
    constructionSites: number;
    constructionSitesByType?: Record<string, number>;
    repairTargets: number;
    hostiles: number;
    hostileOwners?: Record<string, number>;
    hostileBodyParts?: {
      attack: number;
      rangedAttack: number;
      heal: number;
      work: number;
    };
    hostileThreatScore?: number;
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
    structures?: {
      spawns: number;
      extensions: number;
      roads: number;
      ramparts: number;
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

  interface ThreatMemory {
    username: string;
    lastSeen: number;
    rooms: Record<string, number>;
  }

  interface CreepMemory {
    role: CreepRole;
    working?: boolean;
    sourceId?: Id<Source>;
    targetRoom?: string;
    deliveryTargetId?: Id<StructureExtension | StructureSpawn | StructureTower | StructureContainer | StructureStorage>;
    buildTargetId?: Id<ConstructionSite>;
  }

  interface Memory {
    stats?: BotStatsMemory;
    scouting?: ScoutingMemory;
    threats?: Record<string, ThreatMemory>;
  }
}
