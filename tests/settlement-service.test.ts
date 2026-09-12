import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { AuthorizationService } from "../src/authorization/authorization.js";
import { Ledger } from "../src/ledger/ledger.js";
import { SettlementService } from "../src/settlement/settlement.js";
import { money } from "../src/domain/money.js";

describe("SettlementService", () => {
  it("settles an approved authorization with a lower amount", () => {
    const authorizationService = new AuthorizationService();
    const ledger = new Ledger();
    const service = new SettlementService(
      authorizationService,
      ledger,
    );

    authorizationService.authorize(
      "Auth-A",
      "ACC-001",
      money("AED", 25000n),
      money("AED", 20000n),
    );

    const result = service.settle(
      "S1",
      "Auth-A",
      "ACC-001",
      money("AED", 18500n),
      4,
    );

    assert.equal(result.status, "SETTLED");
    assert.equal(result.holdAmount?.minorUnits, 20000n);
    assert.equal(result.amount.minorUnits, 18500n);

    const authorization = authorizationService.get("Auth-A");

    assert.equal(authorization?.status, "SETTLED");
    assert.equal(
      authorization?.settlementAmount?.minorUnits,
      18500n,
    );

    assert.equal(
      authorizationService.activeHoldsForAccount("ACC-001"),
      undefined,
    );

    const entries = ledger.entriesForAccount("ACC-001");

    assert.equal(entries.length, 1);
    assert.equal(entries[0]?.amount.minorUnits, -18500n);
    assert.equal(entries[0]?.valueDate, 4);
  });

  it("fails settlement for an unknown authorization", () => {
    const authorizationService = new AuthorizationService();
    const ledger = new Ledger();
    const service = new SettlementService(
      authorizationService,
      ledger,
    );

    const result = service.settle(
      "S1",
      "Auth-Z",
      "ACC-001",
      money("AED", 18000n),
      4,
    );

    assert.equal(result.status, "FAILED");
    assert.equal(result.holdAmount, undefined);

    assert.equal(
      ledger.entriesForAccount("ACC-001").length,
      0,
    );
  });

  it("fails settlement when amount exceeds the hold", () => {
    const authorizationService = new AuthorizationService();
    const ledger = new Ledger();
    const service = new SettlementService(
      authorizationService,
      ledger,
    );

    authorizationService.authorize(
      "Auth-A",
      "ACC-001",
      money("AED", 30000n),
      money("AED", 20000n),
    );

    const result = service.settle(
      "S1",
      "Auth-A",
      "ACC-001",
      money("AED", 25000n),
      4,
    );

    assert.equal(result.status, "FAILED");
    assert.equal(result.holdAmount?.minorUnits, 20000n);
    assert.equal(result.amount.minorUnits, 25000n);

    assert.equal(
      authorizationService.activeHoldsForAccount("ACC-001")?.minorUnits,
      20000n,
    );

    assert.equal(
      authorizationService.get("Auth-A")?.status,
      "APPROVED",
    );

    assert.equal(
      ledger.entriesForAccount("ACC-001").length,
      0,
    );
  });

  it("fails settlement when authorization belongs to another account", () => {
    const authorizationService = new AuthorizationService();
    const ledger = new Ledger();
    const service = new SettlementService(
      authorizationService,
      ledger,
    );

    authorizationService.authorize(
      "Auth-A",
      "ACC-001",
      money("AED", 30000n),
      money("AED", 20000n),
    );

    const result = service.settle(
      "S1",
      "Auth-A",
      "ACC-002",
      money("AED", 10000n),
      4,
    );

    assert.equal(result.status, "FAILED");

    assert.equal(
      authorizationService.get("Auth-A")?.status,
      "APPROVED",
    );

    assert.equal(
      authorizationService.activeHoldsForAccount("ACC-001")?.minorUnits,
      20000n,
    );

    assert.equal(
      ledger.entriesForAccount("ACC-001").length,
      0,
    );

    assert.equal(
      ledger.entriesForAccount("ACC-002").length,
      0,
    );
  });
});