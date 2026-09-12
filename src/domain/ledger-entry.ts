import type { Money } from "./money.ts";

export type LedgerEntryType =
  | "CREDIT"
  | "DEBIT"
  | "OVERDRAFT_FEE"
  | "REVERSAL"
  | "INTEREST_CAPITALIZATION";

export interface LedgerEntry {
  readonly id: string;
  readonly accountId: string;
  readonly type: LedgerEntryType;
  readonly amount: Money;
  readonly valueDate: number;
  readonly sourceEventId: string;
  readonly reversesEntryId?: string;
}