import type { Currency, Money } from "./money.ts";

export interface Account {
  readonly id: string;
  readonly currency: Currency;
  readonly openingBalance: Money;
}