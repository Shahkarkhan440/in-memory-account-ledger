import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { InterestCapitalizer } from "../src/interest/interest-capitalizer.js";
import { Ledger } from "../src/ledger/ledger.js";
import { money } from "../src/domain/money.js";

const account = {
  id: "ACC-001",
  currency: "AED" as const,
  openingBalance: money("AED", 0n),
};

describe("InterestCapitalizer", () => {
  it("capitalizes multiple daily accruals as one ledger credit", () => {
    const ledger = new Ledger();
    const service = new InterestCapitalizer(ledger);

    const accruals = [
      {
        accountId: "ACC-001",
        day: 1,
        amount: money("AED", 10n),
      },
      {
        accountId: "ACC-001",
        day: 2,
        amount: money("AED", 10n),
      },
      {
        accountId: "ACC-001",
        day: 3,
        amount: money("AED", 5n),
      },
    ];

    const result = service.capitalize(
      "INT-D6",
      account,
      accruals,
      6,
    );

    assert.equal(result.amount.minorUnits, 25n);
    assert.equal(result.day, 6);

    const entries = ledger.entriesForAccount("ACC-001");

    assert.equal(entries.length, 1);
    assert.equal(entries[0]?.id, "INT-D6");
    assert.equal(entries[0]?.type, "INTEREST_CAPITALIZATION");
    assert.equal(entries[0]?.amount.minorUnits, 25n);
    assert.equal(entries[0]?.valueDate, 6);
  });

  it("ignores accruals belonging to another account", () => {
    const ledger = new Ledger();
    const service = new InterestCapitalizer(ledger);

    const accruals = [
      {
        accountId: "ACC-001",
        day: 1,
        amount: money("AED", 10n),
      },
      {
        accountId: "ACC-002",
        day: 1,
        amount: money("AED", 100n),
      },
    ];

    const result = service.capitalize(
      "INT-D6",
      account,
      accruals,
      6,
    );

    assert.equal(result.amount.minorUnits, 10n);

    const entries = ledger.entriesForAccount("ACC-001");

    assert.equal(entries.length, 1);
    assert.equal(entries[0]?.amount.minorUnits, 10n);
  });

  it("does not create a ledger entry when total interest is zero", () => {
    const ledger = new Ledger();
    const service = new InterestCapitalizer(ledger);

    const accruals = [
      {
        accountId: "ACC-001",
        day: 1,
        amount: money("AED", 0n),
      },
      {
        accountId: "ACC-001",
        day: 2,
        amount: money("AED", 0n),
      },
    ];

    const result = service.capitalize(
      "INT-D6",
      account,
      accruals,
      6,
    );

    assert.equal(result.amount.minorUnits, 0n);
    assert.equal(ledger.entriesForAccount("ACC-001").length, 0);
  });
});