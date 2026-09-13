import type { Account } from "./domain/account.js";
import type { LedgerEvent } from "./domain/event.js";
import { money } from "./domain/money.js";

import { AuthorizationService } from "./authorization/authorization.js";
import { OverdraftFeeService } from "./fees/overdraft-fee.js";
import { InterestCapitalizer } from "./interest/interest-capitalizer.js";
import { InterestService } from "./interest/interest.js";
import { EventReplayer } from "./event-replay/event-replayer.js";
import { Ledger } from "./ledger/ledger.js";
import { ReversalService } from "./reversal/reversal.js";
import { SettlementService } from "./settlement/settlement.js";
import { Reporter } from "./reporting/reporter.js";
import { DailyAccountStateCalculator } from "./account-daily-state/daily-account-state-calculator.js";


const accounts: readonly Account[] = [
  {
    id: "ACC-001",
    currency: "AED",
    openingBalance: money("AED", 0n),
  },
  {
    id: "ACC-002",
    currency: "BHD",
    openingBalance: money("BHD", 0n),
  },
];

const events: readonly LedgerEvent[] = [
  {
    id: "E1",
    type: "CREDIT",
    accountId: "ACC-001",
    amount: money("AED", 120000n),
    bookDay: 1,
    valueDate: 1,
  },
  {
    id: "E2",
    type: "DEBIT",
    accountId: "ACC-001",
    amount: money("AED", 95000n),
    bookDay: 1,
    valueDate: 1,
  },
  {
    id: "E3",
    type: "AUTHORIZATION",
    accountId: "ACC-001",
    authorizationId: "Auth-A",
    holdAmount: money("AED", 20000n),
    bookDay: 2,
    valueDate: 2,
  },
  {
    id: "E4",
    type: "CREDIT",
    accountId: "ACC-001",
    amount: money("AED", 40000n),
    bookDay: 3,
    valueDate: 3,
  },
  {
    id: "E5",
    type: "SETTLEMENT",
    accountId: "ACC-001",
    authorizationId: "Auth-A",
    settlementAmount: money("AED", 18500n),
    bookDay: 4,
    valueDate: 4,
  },
  {
    id: "E6",
    type: "SETTLEMENT",
    accountId: "ACC-001",
    authorizationId: "Auth-Z",
    settlementAmount: money("AED", 18000n),
    bookDay: 4,
    valueDate: 4,
  },
  {
    id: "E7",
    type: "DEBIT",
    accountId: "ACC-001",
    amount: money("AED", 62000n),
    bookDay: 5,
    valueDate: 2,
  },
  {
    id: "E8",
    type: "AUTHORIZATION",
    accountId: "ACC-001",
    authorizationId: "Auth-B",
    holdAmount: money("AED", 9000n),
    bookDay: 5,
    valueDate: 5,
  },
  {
    id: "E9",
    type: "REVERSAL",
    accountId: "ACC-001",
    reversesEventId: "E7",
    bookDay: 6,
    valueDate: 2,
  },
  {
    id: "E10-1",
    type: "INSTALLEMENT_CREDIT",
    accountId: "ACC-002",
    amount: money("BHD", 3333n),
    installmentNumber: 1,
    bookDay: 5,
    valueDate: 5,
  },
  {
    id: "E10-2",
    type: "INSTALLEMENT_CREDIT",
    accountId: "ACC-002",
    amount: money("BHD", 3333n),
    installmentNumber: 2,
    bookDay: 5,
    valueDate: 5,
  },
  {
    id: "E10-3",
    type: "INSTALLEMENT_CREDIT",
    accountId: "ACC-002",
    amount: money("BHD", 3334n),
    installmentNumber: 3,
    bookDay: 5,
    valueDate: 5,
  },
];

const days = [1, 2, 3, 4, 5, 6];


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

const eventReplayer = new EventReplayer(
  ledger,
  accounts,
  authorizationService,
  settlementService,
  reversalService,
  overdraftFeeService,
  interestService,
  interestCapitalizer,
);

 
const replayResult = eventReplayer.replay(events, days);

const dailyStateCalculator = new DailyAccountStateCalculator(
  ledger,
  authorizationService,
  interestService,
);

const reporter = new Reporter();

for (const account of accounts) {
  const states = dailyStateCalculator.calculate(account, days);

  console.log(`\nAccount: ${account.id}`);
  console.log(reporter.reportDailyStates(states));
}

console.log("\n" + reporter.reportReplayResults(replayResult));


console.log("Event replay completed.");


console.log(`Accounts: ${accounts.length}`);
console.log(`Events: ${events.length}`);
console.log(`Days: ${days.join(", ")}`);