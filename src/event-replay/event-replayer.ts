import type { AuthorizationService } from "../authorization/authorization.js";
import type { Account } from "../domain/account.js";
import type { LedgerEvent } from "../domain/event.js";
import type { OverdraftFeeService } from "../fees/overdraft-fee.js";
import type { Ledger } from "../ledger/ledger.js";
import type { ReversalService } from "../reversal/reversal.js";
import type { SettlementService } from "../settlement/settlement.js";

export class EventReplayer {
  constructor(
    private readonly ledgerService: Ledger,
    private readonly accounts: readonly Account[],
    private readonly authorizationService: AuthorizationService,
    private readonly settlementService: SettlementService,
    private readonly reversalService: ReversalService,
    private readonly overdraftFeeService: OverdraftFeeService,
  ) {}

  private assessOverdraftFees(events: readonly LedgerEvent[]): void {
    const affectedDays = new Set(events.map((event) => event.valueDate));

    for (const account of this.accounts) {
      for (const day of affectedDays) {
        const closingBalance = this.ledgerService.balanceAt(account, day);

        this.overdraftFeeService.assess(
          `FEE-${account.id}-${day}`,
          account,
          day,
          closingBalance,
        );
      }
    }
  }

  replay(events: readonly LedgerEvent[]): void {
    const orderedEvents = [...events].sort((a, b) => a.bookDay - b.bookDay);

    for (const event of orderedEvents) {
      this.process(event);
    }

    this.assessOverdraftFees(orderedEvents);
  }

  private accountFor(accountId: string): Account | undefined {
    return this.accounts.find((account) => account.id === accountId);
  }

  private process(event: LedgerEvent): void {
    switch (event.type) {
      case "CREDIT":
        this.ledgerService.append({
          id: event.id,
          accountId: event.accountId,
          type: "CREDIT",
          amount: event.amount,
          valueDate: event.valueDate,
          sourceEventId: event.id,
        });
        break;

      case "DEBIT":
        this.ledgerService.append({
          id: event.id,
          accountId: event.accountId,
          type: "DEBIT",
          amount: {
            currency: event.amount.currency,
            minorUnits: -event.amount.minorUnits,
          },
          valueDate: event.valueDate,
          sourceEventId: event.id,
        });
        break;

      case "AUTHORIZATION":
        const account = this.accountFor(event.accountId);
        if (!account) {
          break;
        }

        const ledgerBalance = this.ledgerService.balanceAt(
          account,
          event.valueDate,
        );

        this.authorizationService.authorize(
          event.authorizationId,
          event.accountId,
          ledgerBalance,
          event.holdAmount,
        );

        break;

      case "SETTLEMENT":
        this.settlementService.settle(
          event.id,
          event.authorizationId,
          event.accountId,
          event.settlementAmount,
          event.valueDate,
        );
        break;

      case "REVERSAL":
        this.reversalService.reverse(
          event.id,
          event.accountId,
          event.reversesEventId,
          event.id,
        );
        break;
      case "INSTALLEMENT_CREDIT":
        this.ledgerService.append({
          id: event.id,
          accountId: event.accountId,
          type: "CREDIT",
          amount: event.amount,
          valueDate: event.valueDate,
          sourceEventId: event.id,
        });
        break;
    }
  }
}
