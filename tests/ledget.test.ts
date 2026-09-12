import { describe, it } from "node:test";
import type { Account } from "../src/domain/account.js";
import { money } from "../src/domain/money.js";
import { Ledger } from "../src/ledger/ledger.js";
import assert from "node:assert/strict";

const account: Account = {
  id: "ACC-001",
  currency: "AED",
  openingBalance: money("AED", 0n),
};

describe("Ledger", () => {
  it("appends ledger entries", () => {
    const ledger = new Ledger();
    ledger.append({
      id: "L1",
      accountId: "ACC-001",
      type: "CREDIT",
      amount: money("AED", 120000n),
      valueDate: 1,
      sourceEventId: "E1",
    });
    assert.equal(ledger.entriesForAccount("ACC-001").length, 1);
  });

  it("calculates balance using value dates", () => {
    const ledger = new Ledger();
    ledger.append({
      id: "L1",
      accountId: "ACC-001",
      type: "CREDIT",
      amount: money("AED", 120000n),
      valueDate: 1,
      sourceEventId: "E1",
    });
    ledger.append({
      id: "L2",
      accountId: "ACC-001",
      type: "DEBIT",
      amount: money("AED", -95000n),
      valueDate: 2,
      sourceEventId: "E2",
    });

    ledger.append({
      id: "L3",
      accountId: "ACC-001",
      type: "DEBIT",
      amount: money("AED", 40000n),
      valueDate: 3,
      sourceEventId: "E3",
    });
    assert.equal(ledger.balanceAt(account, 1).minorUnits, 120000n);
    assert.equal(ledger.balanceAt(account, 2).minorUnits, 25000n);
    assert.equal(ledger.balanceAt(account, 3).minorUnits, 65000n);
  });

  it("does not include future value-dated entries", () => {
    const ledger = new Ledger();

    ledger.append({
      id: "L1",
      accountId: "ACC-001",
      type: "CREDIT",
      amount: money("AED", 10000n),
      valueDate: 3,
      sourceEventId: "E1",
    }); 
    assert.equal(ledger.balanceAt(account, 2).minorUnits, 0n); 
    assert.equal(ledger.balanceAt(account, 3).minorUnits, 10000n);
  });

  it("keeps entries append only",()=>{
    const ledger = new Ledger();
    const entry={
      id: "L1",
      accountId: "ACC-001",
      type: "CREDIT" as const,
      amount: money("AED", 10000n),
      valueDate: 1,
      sourceEventId: "E1",
    };

    ledger.append(entry);

    const entries = ledger.entriesForAccount("ACC-001");

    assert.equal(entries.length, 1);
    assert.equal(entries[0]?.id, "L1"); 
    assert.equal(entries[0]?.amount.minorUnits, 10000n); 
  });
    


});
