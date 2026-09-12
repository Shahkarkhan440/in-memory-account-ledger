import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Ledger } from "../src/ledger/ledger.js";
import { ReversalService } from "../src/reversal/reversal.js";
import { money } from "../src/domain/money.js";

describe("ReversalService", () => {
  it("reverses an existing ledger entry", () => {
    const ledger = new Ledger();
    const service = new ReversalService(ledger);

    ledger.append({
      id: "E7",
      accountId: "ACC-001",
      type: "DEBIT",
      amount: money("AED", -62000n),
      valueDate: 2,
      sourceEventId: "E7",
    });

    const result = service.reverse(
      "E9",
      "ACC-001",
      "E7",
      "E9",
    );

    assert.equal(result.status, "REVERSED");
    assert.equal(result.originalLedgerEntryId, "E7");
    assert.equal(result.originalAmount?.minorUnits, -62000n);
    assert.equal(result.reversalAmount?.minorUnits, 62000n);

    const entries = ledger.entriesForAccount("ACC-001");

    assert.equal(entries.length, 2);
    assert.equal(entries[0]?.amount.minorUnits, -62000n);
    assert.equal(entries[1]?.amount.minorUnits, 62000n);
  });

  it("uses the original entry value date for the reversal", () => {
    const ledger = new Ledger();
    const service = new ReversalService(ledger);

    ledger.append({
      id: "E7",
      accountId: "ACC-001",
      type: "DEBIT",
      amount: money("AED", -62000n),
      valueDate: 2,
      sourceEventId: "E7",
    });

    service.reverse(
      "E9",
      "ACC-001",
      "E7",
      "E9",
    );

    const entries = ledger.entriesForAccount("ACC-001");

    assert.equal(entries[1]?.valueDate, 2);
  });

  it("keeps the original ledger entry unchanged", () => {
    const ledger = new Ledger();
    const service = new ReversalService(ledger);

    ledger.append({
      id: "E7",
      accountId: "ACC-001",
      type: "DEBIT",
      amount: money("AED", -62000n),
      valueDate: 2,
      sourceEventId: "E7",
    });

    service.reverse(
      "E9",
      "ACC-001",
      "E7",
      "E9",
    );

    const entries = ledger.entriesForAccount("ACC-001");
    const original = entries[0];

    assert.equal(original?.id, "E7");
    assert.equal(original?.type, "DEBIT");
    assert.equal(original?.amount.minorUnits, -62000n);
    assert.equal(original?.valueDate, 2);
  });

  it("fails when the original ledger entry does not exist", () => {
    const ledger = new Ledger();
    const service = new ReversalService(ledger);

    const result = service.reverse(
      "E9",
      "ACC-001",
      "UNKNOWN",
      "E9",
    );

    assert.equal(result.status, "FAILED");
    assert.equal(result.originalAmount, undefined);
    assert.equal(result.reversalAmount, undefined);
    assert.equal(ledger.entriesForAccount("ACC-001").length, 0);
  });
});