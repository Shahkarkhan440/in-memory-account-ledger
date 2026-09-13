import type { AuthorizationService } from "../authorization/authorization.js";
import type { Account } from "../domain/account.js";
import type { DailyAccountState } from "../domain/daily-account-state.js";
import { add, money, subtract, type Money } from "../domain/money.js";
import type { Ledger } from "../ledger/ledger.js";

export class DailyAccountStateCalculator {
  constructor(
    private readonly ledgerService: Ledger,
    private readonly authorizationService: AuthorizationService,
  ) {}

  private activeHoldsForDay(account: Account, day: number): Money {
    return this.authorizationService
      .all()
      .filter(
        (authorization) =>
          authorization.accountId === account.id &&
          authorization.holdAmount.currency === account.currency &&
          authorization.valueDate <= day &&
          (authorization.status === "APPROVED" ||
            (authorization.status === "SETTLED" &&
              authorization.settlementValueDate !== undefined &&
              authorization.settlementValueDate > day)),
      ).reduce(
        (total, authorization) => add(total, authorization.holdAmount),
        money(account.currency, 0n),
      );
  }

  calculate(account: Account, days: readonly number[]): DailyAccountState[] {
    return days.map((day) => {
      const closingLedgerBalance = this.ledgerService.balanceAt(account, day);

      const activeHolds = this.activeHoldsForDay(account, day);

      return {
        accountId: account.id,
        day,
        closingLedgerBalance,
        activeHolds,
        availableBalance: subtract(closingLedgerBalance, activeHolds),
        overdraftFee: money(account.currency, 0n),
        interestAccrual: money(account.currency, 0n),
      };
    });
  }
}
