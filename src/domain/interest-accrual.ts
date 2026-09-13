import type { Money } from "./money.js";

export interface InterestAccrual {
  readonly accountId: string;
  readonly day: number;
  readonly amount: Money;
}