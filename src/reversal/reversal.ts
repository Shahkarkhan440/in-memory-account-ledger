import type { Ledger } from "../ledger/ledger.js";
import type { Reversal } from "../domain/reversal.js";

export class ReversalService {
  constructor(private readonly ledgerService: Ledger) {}

  reverse(
    reversalId: string,
    accountId: string,
    originalLedgerEntryId: string,
    sourceEventId: string,
  ): Reversal {
    const entries = this.ledgerService.entriesForAccount(accountId);

    const originalEntry = entries.find(
      (entry) => entry.id === originalLedgerEntryId,
    );

    if (!originalEntry) {
      return {
        id: reversalId,
        accountId,
        originalLedgerEntryId,
        status: "FAILED",
      };
    }

    const reversalAmount = {
      currency: originalEntry.amount.currency,
      minorUnits: -originalEntry.amount.minorUnits,
    };

    this.ledgerService.append({
      id: reversalId,
      accountId,
      type: "REVERSAL",
      amount: reversalAmount,
      valueDate: originalEntry.valueDate,
      sourceEventId,
    });

    return {
      id: reversalId,
      accountId,
      originalLedgerEntryId,
      originalAmount: originalEntry.amount,
      reversalAmount,
      status: "REVERSED",
    };
  }
}
