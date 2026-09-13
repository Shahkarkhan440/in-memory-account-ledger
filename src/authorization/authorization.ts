import type { Authorization } from "../domain/authorization.ts";
import {
  add,
  isNegative,
  money,
  subtract,
  type Money,
} from "../domain/money.js";

export class AuthorizationService {
  private readonly authorizations = new Map<string, Authorization>();

  authorize(
    authorizationId: string,
    accountId: string,
    ledgerBalance: Money,
    amount: Money,
    valueDate: number,
  ): Authorization {
    const currentHolds = [...this.authorizations.values()]
      .filter(
        (authorization) =>
          authorization.accountId === accountId &&
          authorization.status === "APPROVED",
      )
      .reduce(
        (total, authorization) => add(total, authorization.holdAmount),
        money(amount.currency, 0n),
      );

    const availableAfterHold = subtract(
      subtract(ledgerBalance, currentHolds),
      amount,
    );

    if (isNegative(availableAfterHold)) {
      const authorization: Authorization = {
        id: authorizationId,
        accountId,
        holdAmount: amount,
        status: "DECLINED",
        valueDate,
      };
      this.authorizations.set(authorizationId, authorization);
      return authorization;
    }

    const authorization: Authorization = {
      id: authorizationId,
      accountId,
      holdAmount: amount,
      status: "APPROVED",
        valueDate,
    };
    this.authorizations.set(authorizationId, authorization);
    return authorization;
  }

  activeHoldsForAccount(accountId: string): Money | undefined {
    const approvals = [...this.authorizations.values()].filter(
      (authorization) =>
        authorization.accountId === accountId &&
        authorization.status === "APPROVED",
    );

    if (approvals.length === 0) {
      return undefined;
    }

    return approvals
      .map((authorization) => authorization.holdAmount)
      .reduce((total, holdAmount) => add(total, holdAmount));
  }

  get(authorizationId: string): Authorization | undefined {
    return this.authorizations.get(authorizationId);
  }

  //settlement
  markSettled(authorizationId: string, settlementAmount: Money,   settlementValueDate: number): boolean {
    const authorization = this.authorizations.get(authorizationId);

    if (!authorization || authorization.status !== "APPROVED") {
      return false;
    }

    this.authorizations.set(authorizationId, {
      ...authorization,
      status: "SETTLED",
      settlementAmount,
      settlementValueDate,
    });

    return true;
  }

  all(): readonly Authorization[] {
    return [...this.authorizations.values()];
  }
}
