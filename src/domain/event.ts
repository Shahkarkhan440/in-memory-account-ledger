import type {Money} from "./money.ts";


interface BaseEvent {
    readonly id: string;
    readonly bookDay: number;
    readonly valueDate: number;
    readonly accountId: string;
}

export interface CreditEvent extends BaseEvent {
    readonly type: "CREDIT";
    readonly amount: Money;
}

export interface DebitEvent extends BaseEvent {
    readonly type: "DEBIT";
    readonly amount: Money;
}

export interface AuthorizationEvent extends BaseEvent {
    readonly type: "AUTHORIZATION";
    readonly authorizationId: string;
    readonly holdAmount: Money;
}

export interface SettlementEvent extends BaseEvent {
    readonly type: "SETTLEMENT";
    readonly authorizationId: string;
    readonly settlementAmount: Money;
}

export interface ReversalEvent extends BaseEvent {
    readonly type: "REVERSAL";
    readonly reversesEventId: string;
}

export interface InstallmentCreditEvent extends BaseEvent {
    readonly type: "INSTALLEMENT_CREDIT";
    readonly amount: Money;
    readonly installmentNumber: number;
}

export type LedgerEvent =
    | CreditEvent
    | DebitEvent
    | AuthorizationEvent
    | SettlementEvent
    | ReversalEvent
    | InstallmentCreditEvent;