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
      1,
    );

    assert.equal(result.status, "APPROVED");
    assert.equal(result.holdAmount.minorUnits, 20000n);
    assert.equal(result.valueDate, 1);
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
      1,
    );

    assert.equal(result.status, "DECLINED");
    assert.equal(result.valueDate, 1);

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
      1,
    );

    assert.equal(first.status, "APPROVED");

    const second = service.authorize(
      "Auth-B",
      "ACC-001",
      money("AED", 50000n),
      money("AED", 25000n),
      1,
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
      2,
    );

    // Authorization state contains the hold,
    // but no ledger entry is created by this service.
    assert.equal(service.get("Auth-A")?.status, "APPROVED");
    assert.equal(service.get("Auth-A")?.valueDate, 2);
  });

  it("marks an approved authorization as settled", () => {
    const service = new AuthorizationService();

    service.authorize(
      "Auth-A",
      "ACC-001",
      money("AED", 25000n),
      money("AED", 20000n),
      2,
    );

    const result = service.markSettled("Auth-A", money("AED", 18500n), 4);

    assert.equal(result, true);

    const authorization = service.get("Auth-A");

    assert.equal(authorization?.status, "SETTLED");
    assert.equal(authorization?.settlementAmount?.minorUnits, 18500n);
    assert.equal(authorization?.valueDate, 2);
    assert.equal(authorization?.settlementValueDate, 4);
    assert.equal(service.activeHoldsForAccount("ACC-001"), undefined);
  });

  it("does not settle an unknown authorization", () => {
    const service = new AuthorizationService();

    const result = service.markSettled("Auth-Z", money("AED", 18000n), 4);

    assert.equal(result, false);
  });

  it("does not settle an already settled authorization", () => {
    const service = new AuthorizationService();

    service.authorize(
      "Auth-A",
      "ACC-001",
      money("AED", 25000n),
      money("AED", 20000n),
      2,
    );
    assert.equal(service.markSettled("Auth-A", money("AED", 18500n), 4), true);
    assert.equal(service.markSettled("Auth-A", money("AED", 18000n), 5), false);
    assert.equal(service.get("Auth-A")?.settlementAmount?.minorUnits, 18500n);
    assert.equal(service.get("Auth-A")?.settlementValueDate, 4);
  });

  it("returns all stored authorizations", () => {
    const service = new AuthorizationService();

    const first = service.authorize(
      "AUTH-001",
      "ACC-001",
      money("AED", 10000n),
      money("AED", 2000n),
      1,
    );

    const second = service.authorize(
      "AUTH-002",
      "ACC-001",
      money("AED", 8000n),
      money("AED", 1000n),
      2,
    );

    assert.equal(first.status, "APPROVED");
    assert.equal(second.status, "APPROVED");

    const authorizations = service.all();

    assert.equal(authorizations.length, 2);
    assert.equal(authorizations[0]?.id, "AUTH-001");
    assert.equal(authorizations[0]?.valueDate, 1);
    assert.equal(authorizations[1]?.id, "AUTH-002");
    assert.equal(authorizations[1]?.valueDate, 2);
  });
});
