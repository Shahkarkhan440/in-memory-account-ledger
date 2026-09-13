import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { AuthorizationService } from "../src/authorization/authorization.js";
import { money } from "../src/domain/money.js";
import { EventReplayer } from "../src/event-replay/event-replayer.js";
import { Ledger } from "../src/ledger/ledger.js";
import { SettlementService } from "../src/settlement/settlement.js";
import { ReversalService } from "../src/reversal/reversal.js";
import { OverdraftFeeService } from "../src/fees/overdraft-fee.js";
import { InterestService } from "../src/interest/interest.js";
import { InterestCapitalizer } from "../src/interest/interest-capitalizer.js";

const account = {
  id: "ACC-001",
  currency: "AED" as const,
  openingBalance: money("AED", 0n),
};

describe("EventReplayer", () => {
  it("replays credit and debit events into the ledger", () => {
    const ledger = new Ledger();
    const authorizationService = new AuthorizationService();
    const settlementService = new SettlementService(
      authorizationService,
      ledger,
    );
    const reversalService = new ReversalService(ledger);
    const overdraftFeeService = new OverdraftFeeService(ledger);
    const interestService = new InterestService();
    const interestCapitalizer = new InterestCapitalizer(ledger);

    const replayer = new EventReplayer(
      ledger,
      [account],
      authorizationService,
      settlementService,
      reversalService,
      overdraftFeeService,
      interestService,
      interestCapitalizer,
    );

    replayer.replay(
      [
        {
          id: "E1",
          bookDay: 1,
          valueDate: 1,
          accountId: "ACC-001",
          type: "CREDIT",
          amount: money("AED", 120000n),
        },
        {
          id: "E2",
          bookDay: 1,
          valueDate: 1,
          accountId: "ACC-001",
          type: "DEBIT",
          amount: money("AED", 95000n),
        },
      ],
      [1],
    );

    const entries = ledger.entriesForAccount("ACC-001");

    assert.equal(entries.length, 2);

    assert.equal(entries[0]?.type, "CREDIT");
    assert.equal(entries[0]?.amount.minorUnits, 120000n);

    assert.equal(entries[1]?.type, "DEBIT");
    assert.equal(entries[1]?.amount.minorUnits, -95000n);

    assert.equal(ledger.balanceAt(account, 1).minorUnits, 25000n);
  });

  it("replays events in book day order", () => {
    const ledger = new Ledger();
    const authorizationService = new AuthorizationService();
    const settlementService = new SettlementService(
      authorizationService,
      ledger,
    );
    const reversalService = new ReversalService(ledger);
    const overdraftFeeService = new OverdraftFeeService(ledger);
    const interestService = new InterestService();
    const interestCapitalizer = new InterestCapitalizer(ledger);

    const replayer = new EventReplayer(
      ledger,
      [account],
      authorizationService,
      settlementService,
      reversalService,
      overdraftFeeService,
      interestService,
      interestCapitalizer,
    );

    replayer.replay(
      [
        {
          id: "E2",
          bookDay: 2,
          valueDate: 2,
          accountId: "ACC-001",
          type: "DEBIT",
          amount: money("AED", 10000n),
        },
        {
          id: "E1",
          bookDay: 1,
          valueDate: 1,
          accountId: "ACC-001",
          type: "CREDIT",
          amount: money("AED", 20000n),
        },
      ],
      [1, 2],
    );

    const entries = ledger.entriesForAccount("ACC-001");

    assert.equal(entries[0]?.id, "E1");
    assert.equal(entries[1]?.id, "E2");
  });

  it("replays an authorization without creating a ledger entry", () => {
    const ledger = new Ledger();
    const authorizationService = new AuthorizationService();
    const settlementService = new SettlementService(
      authorizationService,
      ledger,
    );
    const reversalService = new ReversalService(ledger);
    const overdraftFeeService = new OverdraftFeeService(ledger);
    const interestService = new InterestService();
    const interestCapitalizer = new InterestCapitalizer(ledger);

    const replayer = new EventReplayer(
      ledger,
      [account],
      authorizationService,
      settlementService,
      reversalService,
      overdraftFeeService,
      interestService,
      interestCapitalizer,
    );

    replayer.replay(
      [
        {
          id: "E1",
          bookDay: 1,
          valueDate: 1,
          accountId: "ACC-001",
          type: "CREDIT",
          amount: money("AED", 120000n),
        },
        {
          id: "E2",
          bookDay: 1,
          valueDate: 1,
          accountId: "ACC-001",
          type: "DEBIT",
          amount: money("AED", 95000n),
        },
        {
          id: "E3",
          bookDay: 2,
          valueDate: 2,
          accountId: "ACC-001",
          type: "AUTHORIZATION",
          authorizationId: "Auth-A",
          holdAmount: money("AED", 20000n),
        },
      ],
      [1, 2],
    );

    const authorization = authorizationService.get("Auth-A");

    assert.equal(authorization?.status, "APPROVED");
    assert.equal(authorization?.holdAmount.minorUnits, 20000n);

    const entries = ledger.entriesForAccount("ACC-001");

    assert.equal(entries.length, 2);
    assert.equal(entries[0]?.id, "E1");
    assert.equal(entries[1]?.id, "E2");
  });

  it("replays a settlement and creates the settlement debit", () => {
    const ledger = new Ledger();
    const authorizationService = new AuthorizationService();
    const settlementService = new SettlementService(
      authorizationService,
      ledger,
    );

    const reversalService = new ReversalService(ledger);
    const overdraftFeeService = new OverdraftFeeService(ledger);
    const interestService = new InterestService();
    const interestCapitalizer = new InterestCapitalizer(ledger);

    const replayer = new EventReplayer(
      ledger,
      [account],
      authorizationService,
      settlementService,
      reversalService,
      overdraftFeeService,
      interestService,
      interestCapitalizer,
    );

    replayer.replay(
      [
        {
          id: "E1",
          bookDay: 1,
          valueDate: 1,
          accountId: "ACC-001",
          type: "CREDIT",
          amount: money("AED", 120000n),
        },
        {
          id: "E2",
          bookDay: 1,
          valueDate: 1,
          accountId: "ACC-001",
          type: "DEBIT",
          amount: money("AED", 95000n),
        },
        {
          id: "E3",
          bookDay: 2,
          valueDate: 2,
          accountId: "ACC-001",
          type: "AUTHORIZATION",
          authorizationId: "Auth-A",
          holdAmount: money("AED", 20000n),
        },
        {
          id: "E4",
          bookDay: 4,
          valueDate: 4,
          accountId: "ACC-001",
          type: "SETTLEMENT",
          authorizationId: "Auth-A",
          settlementAmount: money("AED", 18500n),
        },
      ],
      [1, 2, 4],
    );

    const authorization = authorizationService.get("Auth-A");

    assert.equal(authorization?.status, "SETTLED");
    assert.equal(authorization?.settlementAmount?.minorUnits, 18500n);

    const entries = ledger.entriesForAccount("ACC-001");

    assert.equal(entries.length, 3);

    assert.equal(entries[2]?.id, "E4");
    assert.equal(entries[2]?.type, "DEBIT");
    assert.equal(entries[2]?.amount.minorUnits, -18500n);
    assert.equal(entries[2]?.valueDate, 4);

    assert.equal(ledger.balanceAt(account, 4).minorUnits, 6500n);
  });

  it("rejects settlement for an unknown authorization without creating a ledger entry", () => {
    const ledger = new Ledger();
    const authorizationService = new AuthorizationService();
    const settlementService = new SettlementService(
      authorizationService,
      ledger,
    );

    const reversalService = new ReversalService(ledger);
    const overdraftFeeService = new OverdraftFeeService(ledger);
    const interestService = new InterestService();
    const interestCapitalizer = new InterestCapitalizer(ledger);

    const replayer = new EventReplayer(
      ledger,
      [account],
      authorizationService,
      settlementService,
      reversalService,
      overdraftFeeService,
      interestService,
      interestCapitalizer,
    );

    replayer.replay(
      [
        {
          id: "E6",
          bookDay: 4,
          valueDate: 4,
          accountId: "ACC-001",
          type: "SETTLEMENT",
          authorizationId: "Auth-Z",
          settlementAmount: money("AED", 18000n),
        },
      ],
      [4],
    );

    const entries = ledger.entriesForAccount("ACC-001");

    assert.equal(entries.length, 0);

    assert.equal(authorizationService.get("Auth-Z"), undefined);

    assert.equal(ledger.balanceAt(account, 4).minorUnits, 0n);
  });

  it("replays a backdated reversal using the original value date", () => {
    const ledgerBeforeReversal = new Ledger();
    const authorizationServiceBefore = new AuthorizationService();
    const settlementServiceBefore = new SettlementService(
      authorizationServiceBefore,
      ledgerBeforeReversal,
    );
    const reversalServiceBefore = new ReversalService(ledgerBeforeReversal);
    const overdraftFeeServiceBefore = new OverdraftFeeService(
      ledgerBeforeReversal,
    );

    const interestServiceBefore = new InterestService();
    const interestCapitalizerBefore = new InterestCapitalizer(
      ledgerBeforeReversal,
    );

    const replayerBefore = new EventReplayer(
      ledgerBeforeReversal,
      [account],
      authorizationServiceBefore,
      settlementServiceBefore,
      reversalServiceBefore,
      overdraftFeeServiceBefore,
      interestServiceBefore,
      interestCapitalizerBefore,
    );

    replayerBefore.replay(
      [
        {
          id: "E1",
          bookDay: 1,
          valueDate: 1,
          accountId: "ACC-001",
          type: "CREDIT",
          amount: money("AED", 120000n),
        },
        {
          id: "E2",
          bookDay: 1,
          valueDate: 1,
          accountId: "ACC-001",
          type: "DEBIT",
          amount: money("AED", 95000n),
        },
        {
          id: "E7",
          bookDay: 5,
          valueDate: 2,
          accountId: "ACC-001",
          type: "DEBIT",
          amount: money("AED", 62000n),
        },
      ],
      [1, 2],
    );

    assert.equal(
      ledgerBeforeReversal.balanceAt(account, 2).minorUnits,
      -39500n,
    );

    const ledgerAfterReversal = new Ledger();
    const authorizationServiceAfter = new AuthorizationService();
    const settlementServiceAfter = new SettlementService(
      authorizationServiceAfter,
      ledgerAfterReversal,
    );
    const reversalServiceAfter = new ReversalService(ledgerAfterReversal);
    const overdraftFeeServiceAfter = new OverdraftFeeService(
      ledgerAfterReversal,
    );

    const interestServiceAfter = new InterestService();
    const interestCapitalizerAfter = new InterestCapitalizer(
      ledgerAfterReversal,
    );

    const replayerAfter = new EventReplayer(
      ledgerAfterReversal,
      [account],
      authorizationServiceAfter,
      settlementServiceAfter,
      reversalServiceAfter,
      overdraftFeeServiceAfter,
      interestServiceAfter,
      interestCapitalizerAfter,
    );

    replayerAfter.replay(
      [
        {
          id: "E1",
          bookDay: 1,
          valueDate: 1,
          accountId: "ACC-001",
          type: "CREDIT",
          amount: money("AED", 120000n),
        },
        {
          id: "E2",
          bookDay: 1,
          valueDate: 1,
          accountId: "ACC-001",
          type: "DEBIT",
          amount: money("AED", 95000n),
        },
        {
          id: "E7",
          bookDay: 5,
          valueDate: 2,
          accountId: "ACC-001",
          type: "DEBIT",
          amount: money("AED", 62000n),
        },
        {
          id: "E9",
          bookDay: 6,
          valueDate: 2,
          accountId: "ACC-001",
          type: "REVERSAL",
          reversesEventId: "E7",
        },
      ],
      [1, 2],
    );

    assert.equal(ledgerAfterReversal.balanceAt(account, 2).minorUnits, 25000n);

    const entries = ledgerAfterReversal.entriesForAccount("ACC-001");

    assert.equal(entries.length, 4);

    const originalEntry = entries.find((entry) => entry.id === "E7");

    const reversalEntry = entries.find((entry) => entry.id === "E9");

    assert.equal(originalEntry?.amount.minorUnits, -62000n);
    assert.equal(originalEntry?.valueDate, 2);

    assert.equal(reversalEntry?.type, "REVERSAL");
    assert.equal(reversalEntry?.amount.minorUnits, 62000n);
    assert.equal(reversalEntry?.valueDate, 2);
  });

  it("replays an installment credit as a ledger credit", () => {
    const ledger = new Ledger();
    const authorizationService = new AuthorizationService();

    const settlementService = new SettlementService(
      authorizationService,
      ledger,
    );

    const reversalService = new ReversalService(ledger);
    const overdraftFeeService = new OverdraftFeeService(ledger);
    const interestService = new InterestService();
    const interestCapitalizer = new InterestCapitalizer(ledger);

    const replayer = new EventReplayer(
      ledger,
      [account],
      authorizationService,
      settlementService,
      reversalService,
      overdraftFeeService,
      interestService,
      interestCapitalizer,
    );

    replayer.replay(
      [
        {
          id: "E10-1",
          bookDay: 5,
          valueDate: 5,
          accountId: "ACC-001",
          type: "INSTALLEMENT_CREDIT",
          amount: money("AED", 333n),
          installmentNumber: 1,
        },
      ],
      [5],
    );

    const entries = ledger.entriesForAccount("ACC-001");

    assert.equal(entries.length, 1);
    assert.equal(entries[0]?.type, "CREDIT");
    assert.equal(entries[0]?.amount.minorUnits, 333n);
    assert.equal(entries[0]?.valueDate, 5);
    assert.equal(entries[0]?.sourceEventId, "E10-1");
  });

  it("assesses an overdraft fee for the backdated value date", () => {
    const ledger = new Ledger();
    const authorizationService = new AuthorizationService();

    const settlementService = new SettlementService(
      authorizationService,
      ledger,
    );

    const reversalService = new ReversalService(ledger);
    const overdraftFeeService = new OverdraftFeeService(ledger);
    const interestService = new InterestService();
    const interestCapitalizer = new InterestCapitalizer(ledger);

    const replayer = new EventReplayer(
      ledger,
      [account],
      authorizationService,
      settlementService,
      reversalService,
      overdraftFeeService,
      interestService,
      interestCapitalizer,
    );

    replayer.replay(
      [
        {
          id: "E1",
          bookDay: 1,
          valueDate: 1,
          accountId: "ACC-001",
          type: "CREDIT",
          amount: money("AED", 120000n),
        },
        {
          id: "E2",
          bookDay: 1,
          valueDate: 1,
          accountId: "ACC-001",
          type: "DEBIT",
          amount: money("AED", 95000n),
        },
        {
          id: "E7",
          bookDay: 5,
          valueDate: 2,
          accountId: "ACC-001",
          type: "DEBIT",
          amount: money("AED", 62000n),
        },
      ],
      [1, 2],
    );

    const entries = ledger.entriesForAccount("ACC-001");

    const fee = entries.find((entry) => entry.type === "OVERDRAFT_FEE");

    assert.ok(fee);

    assert.equal(fee.valueDate, 2);
    assert.equal(fee.amount.minorUnits, -2500n);

    assert.equal(ledger.balanceAt(account, 2).minorUnits, -39500n);

    assert.equal(ledger.balanceAt(account, 5).minorUnits, -39500n);

    assert.equal(
      entries.filter((entry) => entry.type === "OVERDRAFT_FEE").length,
      1,
    );
  });

  it("assesses at most one overdraft fee per account per value date", () => {
    const ledger = new Ledger();
    const authorizationService = new AuthorizationService();
    const settlementService = new SettlementService(
      authorizationService,
      ledger,
    );
    const reversalService = new ReversalService(ledger);
    const overdraftFeeService = new OverdraftFeeService(ledger);
    const interestService = new InterestService();
    const interestCapitalizer = new InterestCapitalizer(ledger);

    const replayer = new EventReplayer(
      ledger,
      [account],
      authorizationService,
      settlementService,
      reversalService,
      overdraftFeeService,
      interestService,
      interestCapitalizer,
    );

    replayer.replay(
      [
        {
          id: "E1",
          bookDay: 1,
          valueDate: 1,
          accountId: "ACC-001",
          type: "CREDIT",
          amount: money("AED", 120000n),
        },
        {
          id: "E2",
          bookDay: 1,
          valueDate: 1,
          accountId: "ACC-001",
          type: "DEBIT",
          amount: money("AED", 95000n),
        },
        {
          id: "E7",
          bookDay: 5,
          valueDate: 2,
          accountId: "ACC-001",
          type: "DEBIT",
          amount: money("AED", 62000n),
        },
        {
          id: "E8",
          bookDay: 5,
          valueDate: 2,
          accountId: "ACC-001",
          type: "DEBIT",
          amount: money("AED", 10000n),
        },
      ],
      [1, 2],
    );

    const fees = ledger
      .entriesForAccount("ACC-001")
      .filter((entry) => entry.type === "OVERDRAFT_FEE");

    assert.equal(fees.length, 1);
    assert.equal(fees[0]?.valueDate, 2);
    assert.equal(fees[0]?.amount.minorUnits, -2500n);
  });

  it("capitalizes rounded daily interest as one Day 6 ledger credit", () => {
    const ledger = new Ledger();
    const authorizationService = new AuthorizationService();

    const settlementService = new SettlementService(
      authorizationService,
      ledger,
    );

    const reversalService = new ReversalService(ledger);
    const overdraftFeeService = new OverdraftFeeService(ledger);
    const interestService = new InterestService();
    const interestCapitalizer = new InterestCapitalizer(ledger);

    const replayer = new EventReplayer(
      ledger,
      [account],
      authorizationService,
      settlementService,
      reversalService,
      overdraftFeeService,
      interestService,
      interestCapitalizer,
    );

    replayer.replay(
      [
        {
          id: "E1",
          bookDay: 1,
          valueDate: 1,
          accountId: "ACC-001",
          type: "CREDIT",
          amount: money("AED", 25000n),
        },
      ],
      [1, 2, 3, 4, 5, 6],
    );

    const entries = ledger.entriesForAccount("ACC-001");

    const interestEntries = entries.filter(
      (entry) => entry.type === "INTEREST_CAPITALIZATION",
    );

    assert.equal(interestEntries.length, 1);

    assert.equal(interestEntries[0]?.valueDate, 6);

    assert.equal(interestEntries[0]?.amount.minorUnits, 60n);

    assert.equal(ledger.balanceAt(account, 6).minorUnits, 25060n);
  });



  it("capitalizes interest from the final replayed daily balances", () => {
  const ledger = new Ledger();
  const authorizationService = new AuthorizationService();

  const settlementService = new SettlementService(
    authorizationService,
    ledger,
  );

  const reversalService = new ReversalService(ledger);
  const overdraftFeeService = new OverdraftFeeService(ledger);
  const interestService = new InterestService();
  const interestCapitalizer = new InterestCapitalizer(ledger);

  const replayer = new EventReplayer(
    ledger,
    [account],
    authorizationService,
    settlementService,
    reversalService,
    overdraftFeeService,
    interestService,
    interestCapitalizer,
  );

  replayer.replay(
    [
      {
        id: "E1",
        bookDay: 1,
        valueDate: 1,
        accountId: "ACC-001",
        type: "CREDIT",
        amount: money("AED", 120000n),
      },
      {
        id: "E2",
        bookDay: 1,
        valueDate: 1,
        accountId: "ACC-001",
        type: "DEBIT",
        amount: money("AED", 95000n),
      },
      {
        id: "E3",
        bookDay: 2,
        valueDate: 2,
        accountId: "ACC-001",
        type: "AUTHORIZATION",
        authorizationId: "Auth-A",
        holdAmount: money("AED", 20000n),
      },
      {
        id: "E4",
        bookDay: 3,
        valueDate: 3,
        accountId: "ACC-001",
        type: "CREDIT",
        amount: money("AED", 40000n),
      },
      {
        id: "E5",
        bookDay: 4,
        valueDate: 4,
        accountId: "ACC-001",
        type: "SETTLEMENT",
        authorizationId: "Auth-A",
        settlementAmount: money("AED", 18500n),
      },
      {
        id: "E7",
        bookDay: 5,
        valueDate: 2,
        accountId: "ACC-001",
        type: "DEBIT",
        amount: money("AED", 62000n),
      },
      {
        id: "E9",
        bookDay: 6,
        valueDate: 2,
        accountId: "ACC-001",
        type: "REVERSAL",
        reversesEventId: "E7",
      },
    ],
    [1, 2, 3, 4, 5, 6],
  );

  const entries = ledger.entriesForAccount("ACC-001");

  const capitalizationEntries = entries.filter(
    (entry) => entry.type === "INTEREST_CAPITALIZATION",
  );

  assert.equal(capitalizationEntries.length, 1);
  assert.equal(capitalizationEntries[0]?.valueDate, 6);
  assert.equal(capitalizationEntries[0]?.amount.minorUnits, 103n);

  assert.equal(
  ledger.balanceAt(account, 6).minorUnits,
  46603n,
);
});



it("returns authorization, settlement, and error results", () => {
  const ledger = new Ledger();
  const authorizationService = new AuthorizationService();
  const settlementService = new SettlementService(
    authorizationService,
    ledger,
  );
  const reversalService = new ReversalService(ledger);
  const overdraftFeeService = new OverdraftFeeService(ledger);
  const interestService = new InterestService();
  const interestCapitalizer = new InterestCapitalizer(ledger);

  const replayer = new EventReplayer(
    ledger,
    [account],
    authorizationService,
    settlementService,
    reversalService,
    overdraftFeeService,
    interestService,
    interestCapitalizer,
  );

  const result = replayer.replay(
    [
      {
        id: "E1",
        bookDay: 1,
        valueDate: 1,
        accountId: "ACC-001",
        type: "CREDIT",
        amount: money("AED", 120000n),
      },
      {
        id: "E2",
        bookDay: 1,
        valueDate: 1,
        accountId: "ACC-001",
        type: "DEBIT",
        amount: money("AED", 95000n),
      },
      {
        id: "E3",
        bookDay: 2,
        valueDate: 2,
        accountId: "ACC-001",
        type: "AUTHORIZATION",
        authorizationId: "Auth-A",
        holdAmount: money("AED", 20000n),
      },
      {
        id: "E5",
        bookDay: 4,
        valueDate: 4,
        accountId: "ACC-001",
        type: "SETTLEMENT",
        authorizationId: "Auth-A",
        settlementAmount: money("AED", 18500n),
      },
      {
        id: "E6",
        bookDay: 4,
        valueDate: 4,
        accountId: "ACC-001",
        type: "SETTLEMENT",
        authorizationId: "Auth-Z",
        settlementAmount: money("AED", 18000n),
      },
    ],
    [1, 2, 4],
  );

  assert.equal(result.authorizations.length, 1);
  assert.equal(result.authorizations[0]?.id, "Auth-A");
  assert.equal(result.authorizations[0]?.status, "SETTLED");

  assert.equal(result.settlements.length, 2);
  assert.equal(result.settlements[0]?.status, "SETTLED");
  assert.equal(result.settlements[1]?.status, "FAILED");

  assert.equal(result.errors.length, 1);
  assert.equal(result.errors[0]?.eventId, "E6");
});

});
