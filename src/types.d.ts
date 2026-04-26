export {};

declare global {
  type CreepRole = "harvester" | "upgrader" | "builder";

  const console: {
    log(message?: unknown, ...optionalParams: unknown[]): void;
  };

  interface CreepMemory {
    role: CreepRole;
    working?: boolean;
  }
}
