import type { Authorization } from "./authorization.js";
import type { Settlement } from "./settlement.js";

export interface ReplayError {
  readonly eventId: string;
  readonly message: string;
}

export interface ReplayResult {
  readonly authorizations: readonly Authorization[];
  readonly settlements: readonly Settlement[];
  readonly errors: readonly ReplayError[];
}