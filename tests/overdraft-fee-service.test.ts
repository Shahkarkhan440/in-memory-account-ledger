import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { OverdraftFeeService } from "../src/fees/overdraft-fee.js";
import { Ledger } from "../src/ledger/ledger.js";
import { money } from "../src/domain/money.js";

const account = {
  id: "ACC-001",
  currency: "AED" as const,
  openingBalance: money("AED", 0n),
};

describe("OverdraftFeeService", () => {
  it("assesses an AED 25 fee when the closing balance is negative", () => {
    const ledger = new Ledger();
    const service = new OverdraftFeeService(ledger);

    const fee = service.assess(
      "FEE-D2",
      account,
      2,
      money("AED", -37000n),
    );

    assert.ok(fee);
    assert.equal(fee.id, "FEE-D2");
    assert.equal(fee.accountId, "ACC-001");
    assert.equal(fee.amount.minorUnits, -2500n);
    assert.equal(fee.assessedDay, 2);

    const entries = ledger.entriesForAccount("ACC-001");

    assert.equal(entries.length, 1);
    assert.equal(entries[0]?.type, "OVERDRAFT_FEE");
    assert.equal(entries[0]?.amount.minorUnits, -2500n);
    assert.equal(entries[0]?.valueDate, 2);
  });

  it("does not assess a fee when the closing balance is zero", () => {
    const ledger = new Ledger();
    const service = new OverdraftFeeService(ledger);

    const fee = service.assess(
      "FEE-D2",
      account,
      2,
      money("AED", 0n),
    );

    assert.equal(fee, undefined);
    assert.equal(ledger.entriesForAccount("ACC-001").length, 0);
  });

  it("does not assess a fee when the closing balance is positive", () => {
    const ledger = new Ledger();
    const service = new OverdraftFeeService(ledger);

    const fee = service.assess(
      "FEE-D2",
      account,
      2,
      money("AED", 25000n),
    );

    assert.equal(fee, undefined);
    assert.equal(ledger.entriesForAccount("ACC-001").length, 0);
  });


  //fee once per day
  it("assesses at most one fee per account per day", () => {
  const ledger = new Ledger();
  const service = new OverdraftFeeService(ledger);

  const firstFee = service.assess(
    "FEE-D2",
    account,
    2,
    money("AED", -37000n),
  );

  const secondFee = service.assess(
    "FEE-D2-SECOND",
    account,
    2,
    money("AED", -39500n),
  );

  assert.ok(firstFee);
  assert.equal(secondFee, undefined);

  const entries = ledger.entriesForAccount("ACC-001");

  assert.equal(entries.length, 1);
  assert.equal(entries[0]?.id, "FEE-D2");
  assert.equal(entries[0]?.amount.minorUnits, -2500n);
});
});