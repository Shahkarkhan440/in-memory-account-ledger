export type Currency = "AED" | "BHD";


export interface Money {
  readonly currency: Currency;
  readonly minorUnits: bigint;
}

const CURRENCY_PRECISION: Record<Currency, number> = {
  AED: 2,
  BHD: 3,
};

const CURRENCY_SCALE: Record<Currency, bigint> = {
  AED: 100n,
  BHD: 1000n,
};


export function precisionFor(currency: Currency): number {
  return CURRENCY_PRECISION[currency];
}

export function scaleFor(currency: Currency): bigint {
  return CURRENCY_SCALE[currency];
}

export function money(currency: Currency, minorUnits: bigint): Money {
  return { currency, minorUnits };
}

export function add(a: Money, b: Money): Money {
    assertSameCurrency(a, b);
    return money(a.currency, a.minorUnits + b.minorUnits);
}

export function subtract(a: Money, b: Money): Money {
    assertSameCurrency(a, b);
    return money(a.currency, a.minorUnits - b.minorUnits);
}

export function isPositive(value: Money): boolean {
    return value.minorUnits > 0n;
}

export function isNegative(value: Money): boolean {
    return value.minorUnits < 0n;
}

export function isZero(value: Money): boolean {
    return value.minorUnits === 0n;
}

export function compare(a: Money, b: Money): number {
    assertSameCurrency(a, b);
    if (a.minorUnits < b.minorUnits) {
        return -1;
    } else if (a.minorUnits > b.minorUnits) {
        return 1;
    } else {
        return 0;
    }
}



function assertSameCurrency(a: Money, b: Money) {
    if (a.currency !== b.currency) {
        throw new Error(`Currency mismatch: ${a.currency} and ${b.currency}`);
    }
}


