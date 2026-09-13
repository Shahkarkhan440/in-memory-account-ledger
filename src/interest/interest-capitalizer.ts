import type { Account } from "../domain/account.js";
import type { InterestAccrual } from "../domain/interest-accrual.js";
import type { Ledger } from "../ledger/ledger.js";
import { add, money } from "../domain/money.js";

export class InterestCapitalizer {
  constructor(
    private readonly ledgerService: Ledger,
  ) {}

  capitalize(
    entryId: string,
    account: Account,
    accruals: readonly InterestAccrual[],
    capitalizationDay: number,
  ): InterestAccrual {
    const total = accruals
      .filter((accrual) => accrual.accountId === account.id)
      .reduce(
        (totalAmount, accrual) => add(totalAmount, accrual.amount),
        money(account.currency, 0n),
      );

    const capitalization: InterestAccrual = {
      accountId: account.id,
      day: capitalizationDay,
      amount: total,
    };

    if (total.minorUnits !== 0n) {
      this.ledgerService.append({
        id: entryId,
        accountId: account.id,
        type: "INTEREST_CAPITALIZATION",
        amount: total,
        valueDate: capitalizationDay,
        sourceEventId: entryId,
      });
    }

    return capitalization;
  }
}