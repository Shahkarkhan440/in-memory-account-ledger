import type { Account } from "../domain/account.js";
import type { DailyAccountState } from "../domain/daily-account-state.js";
import { money } from "../domain/money.js";
import type { Ledger } from "../ledger/ledger.js";

export class DailyAccountStateCalculator {
  constructor(
    private readonly ledgerService: Ledger,
  ) {}

  calculate(
    account: Account,
    days: readonly number[],
  ): DailyAccountState[] {
    return days.map((day) => ({
      accountId: account.id,
      day,
      closingLedgerBalance: this.ledgerService.balanceAt(
        account,
        day,
      ),
      activeHolds: money(account.currency, 0n),
      availableBalance: this.ledgerService.balanceAt(
        account,
        day,
      ),
      overdraftFee: money(account.currency, 0n),
      interestAccrual: money(account.currency, 0n),
    }));
  }
}