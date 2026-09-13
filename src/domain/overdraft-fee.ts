import type { Money } from "./money.js";

export interface OverdraftFee {
  readonly id: string;
  readonly accountId: string;
  readonly amount: Money;
  readonly assessedDay: number;
}