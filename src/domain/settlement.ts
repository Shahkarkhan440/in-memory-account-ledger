import type { Money } from "./money.js";

export type SettlementStatus = "SETTLED" | "FAILED";

export interface Settlement {
  readonly id: string;
  readonly authorizationId: string;
  readonly accountId: string;
  readonly holdAmount?: Money;
  readonly amount: Money;
  readonly status: SettlementStatus;
}