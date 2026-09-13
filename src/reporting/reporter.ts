import type { DailyAccountState } from "../domain/daily-account-state.js";
import type { ReplayResult } from "../domain/replay-result.js";

export class Reporter {
  reportDailyStates(states: readonly DailyAccountState[]): string {
    return states
      .map(
        (state) =>
          [
            `Day ${state.day}`,
            `  Closing Ledger Balance: ${state.closingLedgerBalance.currency} ${this.formatAmount(state.closingLedgerBalance)}`,
            `  Overdraft Fee: ${state.overdraftFee.currency} ${this.formatAmount(state.overdraftFee)}`,
            `  Interest Accrual: ${state.interestAccrual.currency} ${this.formatAmount(state.interestAccrual)}`,
          ].join("\n"),
      )
      .join("\n\n");
  }


  reportReplayResults(result: ReplayResult): string {
    const authorizations = result.authorizations.length
      ? result.authorizations.map(
          (authorization) =>
            `  ${authorization.id}: ${authorization.status}`,
        )
      : ["  None"];

    const errors = result.errors.length
      ? result.errors.map(
          (error) => `  ${error.eventId}: ${error.message}`,
        )
      : ["  None"];

    return [
      "Authorization States",
      ...authorizations,
      "",
      "Errors",
      ...errors,
    ].join("\n");
  }
  
  private formatAmount(money: DailyAccountState["closingLedgerBalance"]): string {
    const scale = money.currency === "AED" ? 100n : 1000n;
    const absoluteMinorUnits =
      money.minorUnits < 0n ? -money.minorUnits : money.minorUnits;

    const whole = absoluteMinorUnits / scale;
    const fraction = (absoluteMinorUnits % scale)
      .toString()
      .padStart(money.currency === "AED" ? 2 : 3, "0");

    const sign = money.minorUnits < 0n ? "-" : "";

    return `${sign}${whole}.${fraction}`;
  }
}