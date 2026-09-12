import type { Account } from "../domain/account.js";
import type { LedgerEntry } from "../domain/ledger-entry.js";
import { add, money } from "../domain/money.js";

export class Ledger {
    private readonly entries: LedgerEntry[] = [];

    append(entry: LedgerEntry): void {
        this.entries.push(entry);
    }

    entriesForAccount(accountId: string): LedgerEntry[] {
        return this.entries.filter(entry => entry.accountId === accountId);
    }

    balanceAt(account:Account, day:number){
        return this.entries.filter(entry => entry.accountId === account.id && entry.valueDate <= day)
        .reduce((balance,entry)=> add(balance, entry.amount), money(account.currency, account.openingBalance.minorUnits));
    }

    

}