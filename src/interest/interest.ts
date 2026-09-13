import type { Account } from "../domain/account.js";
import type { InterestAccrual } from "../domain/interest-accrual.js";
import { isPositive, money, type Money } from "../domain/money.js";

const DAILY_INTEREST_RATE_BPS = 4;
const BASIS_POINTS_SCALE = 10_000n;

export class InterestService {
  calculateDailyAccrual(
    account: Account,
    day: number,
    closingBalance: Money,
  ): InterestAccrual {
    if (!isPositive(closingBalance)) {
      return {
        accountId: account.id,
        day,
        amount: money(account.currency, 0n),
      };
    }

    const numerator =
      closingBalance.minorUnits * BigInt(DAILY_INTEREST_RATE_BPS); //half up for rounding

    const rawMinorUnits =
      (numerator + BASIS_POINTS_SCALE / 2n) / BASIS_POINTS_SCALE;

    return {
      accountId: account.id,
      day,
      amount: money(account.currency, rawMinorUnits),
    };
  }
}
