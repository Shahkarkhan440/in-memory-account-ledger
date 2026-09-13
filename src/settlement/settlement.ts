import type { AuthorizationService } from "../authorization/authorization.js";
import { isNegative, subtract } from "../domain/money.js";
import type { Settlement } from "../domain/settlement.js";
import type { Ledger } from "../ledger/ledger.js";

export class SettlementService {
  constructor(
    private readonly authorizationService: AuthorizationService,
    private readonly ledgerService: Ledger,
  ) {}

  settle(
    settlementId: string,
    authorizationId: string,
    accountId: string,
    amount: Settlement["amount"],
    valueDate: number,
  ): Settlement {
    const authorization = this.authorizationService.get(authorizationId);
    if (
      !authorization ||
      authorization.accountId !== accountId ||
      authorization.status !== "APPROVED"
    ) {
      return {
        id: settlementId,
        authorizationId,
        accountId, 
        amount,
        status: "FAILED",
      };
    }

    const remainingHold = subtract(authorization.holdAmount, amount);
    if (isNegative(remainingHold)) {
      return {
        id: settlementId,
        authorizationId,
        accountId,
        holdAmount: authorization.holdAmount,
        amount,
        status: "FAILED",
      };
    }

    this.authorizationService.markSettled(authorizationId, amount,valueDate);

    this.ledgerService.append({
      id: settlementId,
      accountId,
      type: "DEBIT",
      amount: {
        currency: amount.currency,
        minorUnits: -amount.minorUnits,
      },
      valueDate,
      sourceEventId: settlementId,
    });

    return {
      id: settlementId,
      authorizationId,
      accountId,
      holdAmount: authorization.holdAmount,
      amount,
      status: "SETTLED",
    };
  }
}
