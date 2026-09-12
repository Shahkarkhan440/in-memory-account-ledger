import type { Account } from "../domain/account.js";
import type { LedgerEntry } from "../domain/ledger-entry.js";
import { add, money } from "../domain/money.js";

export class BalanceCalculator {
    calculate(
        account: Account,
        entries: readonly LedgerEntry[],
        day: number
    ){
        return entries.filter(entry => entry.accountId === account.id && entry.valueDate <= day)
        .reduce((balance,entry)=> add(balance, entry.amount), money(account.currency, account.openingBalance.minorUnits));  
    }
}