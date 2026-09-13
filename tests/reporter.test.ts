import { describe, it } from "node:test";
import { Reporter } from "../src/reporting/reporter.js";
import { money } from "../src/domain/money.js";
import assert from "node:assert/strict";

describe("Reporter", () => {
  it("formats daily financial state", () => {
    const reporter = new Reporter();

    const output = reporter.reportDailyStates([
      {
        accountId: "ACC-001",
        day: 1,
        closingLedgerBalance: money("AED", 25000n),
        activeHolds: money("AED", 0n),
        availableBalance: money("AED", 25000n),
        overdraftFee: money("AED", 0n),
        interestAccrual: money("AED", 10n),
      },
    ]);

    assert.ok(output.includes("Day 1"));
    assert.ok(output.includes("Closing Ledger Balance: AED 250.00"));
    assert.ok(output.includes("Overdraft Fee: AED 0.00"));
    assert.ok(output.includes("Interest Accrual: AED 0.10"));
  });
});
