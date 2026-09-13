import { describe, it } from "node:test";
import { Reporter } from "../src/reporting/reporter.js";
import { money } from "../src/domain/money.js";
import assert from "node:assert/strict";
import type { ReplayResult } from "../src/domain/replay-result.js";

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

it("formats authorization states and errors", () => {
  const reporter = new Reporter();

  const result: ReplayResult = {
    authorizations: [
      {
        id: "Auth-A",
        accountId: "ACC-001",
        holdAmount: money("AED", 20000n),
        status: "SETTLED",
        valueDate: 2,
        settlementAmount: money("AED", 18500n),
        settlementValueDate: 4,
      },
      {
        id: "Auth-B",
        accountId: "ACC-001",
        holdAmount: money("AED", 9000n),
        status: "DECLINED",
        valueDate: 5,
      },
    ],
    settlements: [],
    errors: [
      {
        eventId: "E6",
        message: "Settlement failed for authorization Auth-Z",
      },
    ],
  };

  const output = reporter.reportReplayResults(result);

  assert.ok(output.includes("Authorization States"));
  assert.ok(output.includes("Auth-A: SETTLED"));
  assert.ok(output.includes("Auth-B: DECLINED"));
  assert.ok(output.includes("Errors"));
  assert.ok(
    output.includes("E6: Settlement failed for authorization Auth-Z"),
  );
});


});
