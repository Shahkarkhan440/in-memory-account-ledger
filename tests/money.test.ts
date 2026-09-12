import { describe, it } from "node:test";
import { add, compare, isNegative, isPositive, isZero, money, precisionFor, subtract } from "../src/domain/money.js";
import assert from "node:assert/strict";

describe("Money", () => {
  it("uses 2 decimal places for AED", () => {
    assert.equal(precisionFor("AED"), 2);
  });

  it("uses 3 decimal places for BHD", () => {
    assert.equal(precisionFor("BHD"), 3);
  });

  it("adds money exactly using minor units", () => {
    const aed100 = money("AED", 10000n);
    const aed25 = money("AED", 2500n);
    const result = add(aed100, aed25);
    assert.equal(result.currency, "AED");
    assert.equal(result.minorUnits, 12500n);
  });

  it("subtracts money exactly using minor units", () => {
    const aed100 = money("AED", 10000n);
    const aed25 = money("AED", 2500n);
    const result = subtract(aed100, aed25);
    assert.equal(result.currency, "AED");
    assert.equal(result.minorUnits, 7500n);
  });

  it("supports negative balances", () => {
    const aed100 = money("AED", 10000n);
    const aed150 = money("AED", 15000n);
    const result = subtract(aed100, aed150);
    assert.equal(result.currency, "AED");
    assert.equal(result.minorUnits, -5000n);
    assert.equal(isNegative(result), true);
  });

  it("identifies positive and zero amounts", () => {
   assert.equal(isPositive(money("AED", 100n)), true);
   assert.equal(isZero(money("AED", 0n)), true);
   assert.equal(isNegative(money("AED", -100n)), true);  
  });

  it("compares money values", () => {
    const aed100 = money("AED", 10000n);
    const aed200= money("AED", 20000n);
    assert.equal(compare(aed100, aed200), -1);
    assert.equal(compare(aed200, aed100), 1);
    assert.equal(compare(aed100, aed100), 0);
    });

    it("rejects arithmetic across currencies", () => {
    const aed100 = money("AED", 10000n);
    const bhd100 = money("BHD", 100000n);
    assert.throws(() => add(aed100, bhd100), /Currency mismatch/);
    })


});

