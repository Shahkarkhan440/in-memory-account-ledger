import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Ledger } from "../src/ledger/ledger.js";
import { BalanceCalculator } from "../src/ledger/balance-calculator.js";
import { ReversalService } from "../src/reversal/reversal.js";
import { money } from "../src/domain/money.js";

describe("Backdated reversal", () => {
  it("restores the historical balance from the original value date", () => {
    const ledger = new Ledger();
    const balanceCalculator = new BalanceCalculator();
    const reversalService = new ReversalService(ledger);

    ledger.append({
      id: "E1",
      accountId: "ACC-001",
      type: "CREDIT",
      amount: money("AED", 120000n),
      valueDate: 1,
      sourceEventId: "E1",
    });

    ledger.append({
      id: "E2",
      accountId: "ACC-001",
      type: "DEBIT",
      amount: money("AED", -95000n),
      valueDate: 1,
      sourceEventId: "E2",
    });

    ledger.append({
      id: "E7",
      accountId: "ACC-001",
      type: "DEBIT",
      amount: money("AED", -62000n),
      valueDate: 2,
      sourceEventId: "E7",
    });

    const balanceBeforeReversal = balanceCalculator.calculate(
      {
        id: "ACC-001",
        currency: "AED",
        openingBalance: money("AED", 0n),
      },
      ledger.entriesForAccount("ACC-001"),
      2,
    );

    assert.equal(balanceBeforeReversal.minorUnits, -37000n);

    const result = reversalService.reverse(
      "E9",
      "ACC-001",
      "E7",
      "E9",
    );

    assert.equal(result.status, "REVERSED");

    const balanceAfterReversal = balanceCalculator.calculate(
      {
        id: "ACC-001",
        currency: "AED",
        openingBalance: money("AED", 0n),
      },
      ledger.entriesForAccount("ACC-001"),
      2,
    );

    assert.equal(balanceAfterReversal.minorUnits, 25000n);

    const entries = ledger.entriesForAccount("ACC-001");

    assert.equal(entries.length, 4);
    assert.equal(entries[2]?.id, "E7");
    assert.equal(entries[2]?.amount.minorUnits, -62000n);
    assert.equal(entries[3]?.id, "E9");
    assert.equal(entries[3]?.amount.minorUnits, 62000n);
    assert.equal(entries[3]?.valueDate, 2);
  });
});