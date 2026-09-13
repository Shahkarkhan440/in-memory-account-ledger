import { money, type Money } from "../domain/money.js";

export class InstallmentAllocator {
  allocate(total: Money, installmentCount: number): Money[] {
    if (installmentCount <= 0) {
      throw new Error("Installment count must be positive");
    }

    const baseAmount = total.minorUnits / BigInt(installmentCount);

    const allocated = Array.from(
      { length: installmentCount },
      () => baseAmount,
    );

    const allocatedTotal = baseAmount * BigInt(installmentCount);

    const remainder = total.minorUnits - allocatedTotal;

    const lastIndex = installmentCount - 1;
    const lastAmount = allocated[lastIndex];

    if (lastAmount === undefined) {
      throw new Error("Failed to allocate final installment");
    }

    allocated[lastIndex] = lastAmount + remainder;

    return allocated.map((minorUnits) => money(total.currency, minorUnits));
  }
}
