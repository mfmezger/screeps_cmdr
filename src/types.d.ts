export {};

declare global {
  type CreepRole = "harvester" | "miner" | "hauler" | "upgrader" | "builder" | "repairer";

  const console: {
    log(message?: unknown, ...optionalParams: unknown[]): void;
  };

  interface CreepMemory {
    role: CreepRole;
    working?: boolean;
    sourceId?: Id<Source>;
  }
}
