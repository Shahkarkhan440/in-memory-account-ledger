import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { InterestService } from "../src/interest/interest.js";
import { money } from "../src/domain/money.js";

const service = new InterestService();

const aedAccount = {
  id: "ACC-001",
  currency: "AED" as const,
  openingBalance: money("AED", 0n),
};

const bhdAccount = {
  id: "ACC-002",
  currency: "BHD" as const,
  openingBalance: money("BHD", 0n),
};

describe("InterestService", () => {
  it("calculates 0.04% daily interest on a positive AED balance", () => {
    const accrual = service.calculateDailyAccrual(
      aedAccount,
      1,
      money("AED", 25000n),
    );

    assert.equal(accrual.amount.minorUnits, 10n);
    assert.equal(accrual.amount.currency, "AED");
    assert.equal(accrual.day, 1);
  });

  it("returns zero interest for a zero balance", () => {
    const accrual = service.calculateDailyAccrual(
      aedAccount,
      1,
      money("AED", 0n),
    );

    assert.equal(accrual.amount.minorUnits, 0n);
  });

  it("returns zero interest for a negative balance", () => {
    const accrual = service.calculateDailyAccrual(
      aedAccount,
      2,
      money("AED", -37000n),
    );

    assert.equal(accrual.amount.minorUnits, 0n);
  });

  it("uses BHD three-decimal precision", () => {
    const accrual = service.calculateDailyAccrual(
      bhdAccount,
      5,
      money("BHD", 10000n),
    );

    assert.equal(accrual.amount.minorUnits, 4n);
    assert.equal(accrual.amount.currency, "BHD");
  });

  it("rounds down when the calculated interest is below one minor unit", () => {
    const accrual = service.calculateDailyAccrual(
      aedAccount,
      3,
      money("AED", 500n),
    );

    assert.equal(accrual.amount.minorUnits, 0n);
  });

  it("rounds a fractional minor unit using half-up rounding", () => {
    const accrual = service.calculateDailyAccrual(
      aedAccount,
      4,
      money("AED", 1250n),
    );

    // AED 12.50 × 0.04% = AED 0.005
    // Half-up to 2 decimals = AED 0.01
    assert.equal(accrual.amount.minorUnits, 1n);
  });

  it("calculates each day's interest independently", () => {
    const day1 = service.calculateDailyAccrual(
      aedAccount,
      1,
      money("AED", 25000n),
    );

    const day2 = service.calculateDailyAccrual(
      aedAccount,
      2,
      money("AED", 25000n),
    );

    const day3 = service.calculateDailyAccrual(
      aedAccount,
      3,
      money("AED", 500n),
    );

    assert.equal(day1.amount.minorUnits, 10n);
    assert.equal(day2.amount.minorUnits, 10n);
    assert.equal(day3.amount.minorUnits, 0n);
  });
});
