import type { Money } from "./money.ts";

export type AuthorizationStatus =
  | "APPROVED"
  | "DECLINED"
  | "SETTLED";

export interface Authorization {
  readonly id: string;
  readonly accountId: string;
  readonly holdAmount: Money;
  readonly status: AuthorizationStatus;
  readonly valueDate: number;
  readonly settlementAmount?: Money;
  readonly settlementValueDate?: number;
}