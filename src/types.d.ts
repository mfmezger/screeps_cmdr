export {};

declare global {
  type CreepRole = "harvester" | "upgrader" | "builder" | "repairer";

  const console: {
    log(message?: unknown, ...optionalParams: unknown[]): void;
  };

  interface CreepMemory {
    role: CreepRole;
    working?: boolean;
  }
}
