import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { money } from "../src/domain/money.js";
import { AuthorizationService } from "../src/authorization/authorization.js";

describe("AuthorizationService", () => {
  it("approves authorization when sufficient funds are available", () => {
    const service = new AuthorizationService();

    const result = service.authorize(
      "Auth-A",
      "ACC-001",
      money("AED", 25000n),
      money("AED", 20000n),
    );

    assert.equal(result.status, "APPROVED");
    assert.equal(result.holdAmount.minorUnits, 20000n);

    const holds = service.activeHoldsForAccount("ACC-001");

    assert.equal(holds?.minorUnits, 20000n);
  });

  it("declines authorization when hold would make available balance negative", () => {
    const service = new AuthorizationService();

    const result = service.authorize(
      "Auth-B",
      "ACC-001",
      money("AED", 10000n),
      money("AED", 20000n),
    );

    assert.equal(result.status, "DECLINED");

    const holds = service.activeHoldsForAccount("ACC-001");

    assert.equal(holds, undefined);
  });

  it("multiple approved holds reduce available balance together", () => {
    const service = new AuthorizationService();

    const first = service.authorize(
      "Auth-A",
      "ACC-001",
      money("AED", 50000n),
      money("AED", 20000n),
    );

    assert.equal(first.status, "APPROVED");

    const second = service.authorize(
      "Auth-B",
      "ACC-001",
      money("AED", 50000n),
      money("AED", 25000n),
    );

    assert.equal(second.status, "APPROVED");

    const holds = service.activeHoldsForAccount("ACC-001");

    assert.equal(holds?.minorUnits, 45000n);
  });

  it("does not create a ledger entry for an authorization", () => {
    const service = new AuthorizationService();

    service.authorize(
      "Auth-A",
      "ACC-001",
      money("AED", 25000n),
      money("AED", 20000n),
    );

    // Authorization state contains the hold,
    // but no ledger entry is created by this service.
    assert.equal(service.get("Auth-A")?.status, "APPROVED");
  });

  it("marks an approved authorization as settled", () => {
    const service = new AuthorizationService();

    service.authorize(
      "Auth-A",
      "ACC-001",
      money("AED", 25000n),
      money("AED", 20000n),
    );

    const result = service.markSettled("Auth-A", money("AED", 18500n));

    assert.equal(result, true);

    const authorization = service.get("Auth-A");

    assert.equal(authorization?.status, "SETTLED");
    assert.equal(authorization?.settlementAmount?.minorUnits, 18500n);

    assert.equal(service.activeHoldsForAccount("ACC-001"), undefined);
  });

  it("does not settle an unknown authorization", () => {
    const service = new AuthorizationService();

    const result = service.markSettled("Auth-Z", money("AED", 18000n));

    assert.equal(result, false);
  });

  it("does not settle an already settled authorization", () => {
    const service = new AuthorizationService();

    service.authorize(
      "Auth-A",
      "ACC-001",
      money("AED", 25000n),
      money("AED", 20000n),
    ); 
    assert.equal(service.markSettled("Auth-A", money("AED", 18500n)), true); 
    assert.equal(service.markSettled("Auth-A", money("AED", 18000n)), false); 
    assert.equal(service.get("Auth-A")?.settlementAmount?.minorUnits, 18500n);
  });
});
