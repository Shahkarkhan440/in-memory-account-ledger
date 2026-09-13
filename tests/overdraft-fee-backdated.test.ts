import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Ledger } from "../src/ledger/ledger.js";
import { BalanceCalculator } from "../src/ledger/balance-calculator.js";
import { OverdraftFeeService } from "../src/fees/overdraft-fee.js";
import { money } from "../src/domain/money.js";

describe("Backdated overdraft fee", () => {
  it("assesses a Day 2 fee for the backdated E7 overdraft", () => {
    const ledger = new Ledger();
    const balanceCalculator = new BalanceCalculator();
    const feeService = new OverdraftFeeService(ledger);

    const account = {
      id: "ACC-001",
      currency: "AED" as const,
      openingBalance: money("AED", 0n),
    };

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

    const balanceBeforeFee = balanceCalculator.calculate(
      account,
      ledger.entriesForAccount("ACC-001"),
      2,
    );

    assert.equal(balanceBeforeFee.minorUnits, -37000n);

    const fee = feeService.assess(
      "FEE-D2",
      account,
      2,
      balanceBeforeFee,
    );

    assert.ok(fee);
    assert.equal(fee.amount.minorUnits, -2500n);
    assert.equal(fee.assessedDay, 2);

    const balanceAfterFee = balanceCalculator.calculate(
      account,
      ledger.entriesForAccount("ACC-001"),
      2,
    );

    assert.equal(balanceAfterFee.minorUnits, -39500n);
  });
});