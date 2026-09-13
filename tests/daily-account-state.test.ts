import assert from "node:assert/strict";
import { money } from "../src/domain/money.js";
import { DailyAccountStateCalculator } from "../src/account-daily-state/daily-account-state-calculator.js";
import { Ledger } from "../src/ledger/ledger.js";
import { AuthorizationService } from "../src/authorization/authorization.js";
import { describe, it } from "node:test";

const account = {
  id: "ACC-001",
  currency: "AED" as const,
  openingBalance: money("AED", 0n),
};

describe("DailyAccountState", () => {
  it("calculates the closing ledger balance for each requested value date", () => {
    const ledger = new Ledger();

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
      id: "E3",
      accountId: "ACC-001",
      type: "CREDIT",
      amount: money("AED", 40000n),
      valueDate: 3,
      sourceEventId: "E3",
    });

    const authorizationService = new AuthorizationService();
    const calculator = new DailyAccountStateCalculator(
      ledger,
      authorizationService,
    );

    const states = calculator.calculate(account, [1, 2, 3]);

    assert.equal(states.length, 3);

    assert.equal(states[0]?.closingLedgerBalance.minorUnits, 25000n);

    assert.equal(states[1]?.closingLedgerBalance.minorUnits, 25000n);

    assert.equal(states[2]?.closingLedgerBalance.minorUnits, 65000n);
  });

  it("includes an approved authorization hold from its value date", () => {
    const ledger = new Ledger();
    const authorizationService = new AuthorizationService();
    ledger.append({
      id: "E1",
      accountId: "ACC-001",
      type: "CREDIT",
      amount: money("AED", 25000n),
      valueDate: 1,
      sourceEventId: "E1",
    });

    authorizationService.authorize(
      "Auth-A",
      "ACC-001",
      money("AED", 25000n),
      money("AED", 20000n),
      2,
    );

    const calculator = new DailyAccountStateCalculator(
      ledger,
      authorizationService,
    );

    const states = calculator.calculate(account, [1, 2, 3]);

    assert.equal(states[0]?.activeHolds.minorUnits, 0n);
    assert.equal(states[1]?.activeHolds.minorUnits, 20000n);
    assert.equal(states[2]?.activeHolds.minorUnits, 20000n);

    assert.equal(states[0]?.availableBalance.minorUnits, 25000n);
    assert.equal(states[1]?.availableBalance.minorUnits, 5000n);
    assert.equal(states[2]?.availableBalance.minorUnits, 5000n);
  });

  it("releases an authorization hold when the authorization is settled", () => {
    const ledger = new Ledger();
    const authorizationService = new AuthorizationService();

    ledger.append({
      id: "E1",
      accountId: "ACC-001",
      type: "CREDIT",
      amount: money("AED", 25000n),
      valueDate: 1,
      sourceEventId: "E1",
    });

    authorizationService.authorize(
      "Auth-A",
      "ACC-001",
      money("AED", 25000n),
      money("AED", 20000n),
      2,
    );

    authorizationService.markSettled("Auth-A", money("AED", 18500n), 4);

    const calculator = new DailyAccountStateCalculator(
      ledger,
      authorizationService,
    );

    const states = calculator.calculate(account, [1, 2, 3, 4]);

    assert.equal(states[0]?.activeHolds.minorUnits, 0n);
    assert.equal(states[1]?.activeHolds.minorUnits, 20000n);
    assert.equal(states[2]?.activeHolds.minorUnits, 20000n);
    assert.equal(states[3]?.activeHolds.minorUnits, 0n);

    assert.equal(states[0]?.availableBalance.minorUnits, 25000n);
    assert.equal(states[1]?.availableBalance.minorUnits, 5000n);
    assert.equal(states[2]?.availableBalance.minorUnits, 5000n);
    assert.equal(states[3]?.availableBalance.minorUnits, 25000n);
  });
});
