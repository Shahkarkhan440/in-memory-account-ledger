import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { BalanceCalculator } from "../src/ledger/balance-calculator.js";
import type { Account } from "../src/domain/account.js";
import type { LedgerEntry } from "../src/domain/ledger-entry.js";
import { money } from "../src/domain/money.js";

const account: Account = {
  id: "ACC-001",
  currency: "AED",
  openingBalance: money("AED", 0n),
};

describe("BalanceCalculator", () => {
  it("calculates the closing balance for a value date", () => {
    const calculator = new BalanceCalculator();

    const entries: LedgerEntry[] = [
      {
        id: "L1",
        accountId: "ACC-001",
        type: "CREDIT",
        amount: money("AED", 120000n),
        valueDate: 1,
        sourceEventId: "E1",
      },
      {
        id: "L2",
        accountId: "ACC-001",
        type: "DEBIT",
        amount: money("AED", -95000n),
        valueDate: 1,
        sourceEventId: "E2",
      },
      {
        id: "L3",
        accountId: "ACC-001",
        type: "CREDIT",
        amount: money("AED", 40000n),
        valueDate: 3,
        sourceEventId: "E4",
      },
    ];

    assert.equal(
      calculator.calculate(account, entries, 1).minorUnits,
      25000n,
    );

    assert.equal(
      calculator.calculate(account, entries, 2).minorUnits,
      25000n,
    );

    assert.equal(
      calculator.calculate(account, entries, 3).minorUnits,
      65000n,
    );
  });

  it("handles a backdated entry", () => {
    const calculator = new BalanceCalculator();

    const entries: LedgerEntry[] = [
      {
        id: "L1",
        accountId: "ACC-001",
        type: "CREDIT",
        amount: money("AED", 120000n),
        valueDate: 1,
        sourceEventId: "E1",
      },
      {
        id: "L2",
        accountId: "ACC-001",
        type: "DEBIT",
        amount: money("AED", -95000n),
        valueDate: 1,
        sourceEventId: "E2",
      },
      {
        id: "L3",
        accountId: "ACC-001",
        type: "DEBIT",
        amount: money("AED", -62000n),
        valueDate: 2,
        sourceEventId: "E7",
      },
    ];

    // E7 was booked later but has value date Day 2.
    // Therefore it affects Day 2 and every later day.
    assert.equal(
      calculator.calculate(account, entries, 1).minorUnits,
      25000n,
    );

    assert.equal(
      calculator.calculate(account, entries, 2).minorUnits,
      -37000n,
    );

    assert.equal(
      calculator.calculate(account, entries, 6).minorUnits,
      -37000n,
    );
  });

  it("does not include entries belonging to another account", () => {
    const calculator = new BalanceCalculator();

    const entries: LedgerEntry[] = [
      {
        id: "L1",
        accountId: "ACC-001",
        type: "CREDIT",
        amount: money("AED", 10000n),
        valueDate: 1,
        sourceEventId: "E1",
      },
      {
        id: "L2",
        accountId: "ACC-002",
        type: "CREDIT",
        amount: money("BHD", 5000n),
        valueDate: 1,
        sourceEventId: "E2",
      },
    ];

    assert.equal(
      calculator.calculate(account, entries, 1).minorUnits,
      10000n,
    );
  });
});