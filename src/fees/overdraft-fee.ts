import type { Account } from "../domain/account.js";
import type { OverdraftFee } from "../domain/overdraft-fee.js";
import { isNegative, money } from "../domain/money.js";
import type { Ledger } from "../ledger/ledger.js";

const OVERDRAFT_FEE = money("AED", 2500n);

export class OverdraftFeeService {
  private readonly assessedFees = new Set<string>();

  constructor(private readonly ledgerService: Ledger) {}

  assess(
    feeId: string,
    account: Account,
    day: number,
    closingBalance: Parameters<typeof isNegative>[0],
  ): OverdraftFee | undefined {
    
    const feeKey = `${account.id}:${day}`;

    if (this.assessedFees.has(feeKey)) {
      return undefined;
    }

    if (!isNegative(closingBalance)) {
      return undefined;
    }

    this.assessedFees.add(feeKey);

    const fee: OverdraftFee = {
      id: feeId,
      accountId: account.id,
      amount: {
        currency: OVERDRAFT_FEE.currency,
        minorUnits: -OVERDRAFT_FEE.minorUnits,
      },
      assessedDay: day,
    };

    this.ledgerService.append({
      id: feeId,
      accountId: account.id,
      type: "OVERDRAFT_FEE",
      amount: fee.amount,
      valueDate: day,
      sourceEventId: feeId,
    });

    return fee;
  }
}
