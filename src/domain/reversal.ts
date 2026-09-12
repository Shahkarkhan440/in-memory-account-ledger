import type { Money } from "./money.ts";

export interface Reversal {
  readonly id: string;
  readonly accountId: string;
  readonly originalLedgerEntryId: string;
  readonly originalAmount?: Money;
  readonly reversalAmount?: Money;
  readonly status: ReversalStatus;
}

export type ReversalStatus = "REVERSED" | "FAILED";