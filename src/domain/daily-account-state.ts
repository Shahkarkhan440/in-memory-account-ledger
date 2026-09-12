import type {Money} from "./money.ts";

export interface DailyAccountState {
    readonly accountId: string;
    readonly day: number;
    readonly closingLedgerBalance: Money;
    readonly activeHolds: Money;
    readonly availableBalance: Money;
    readonly overdraftFee: Money;
    readonly interestAccrual: Money;
}

