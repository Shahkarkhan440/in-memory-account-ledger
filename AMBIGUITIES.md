# Ambiguities

This document records requirements where the specification does not
completely define the behavior.

## Initial observations

1. The specification distinguishes booked day and value date but does
   not define whether every event type requires both dates.
2. The exact lifecycle of an authorization after settlement is not
   explicitly defined.
3. The behavior of settlement amounts relative to the original hold
   amount is not explicitly defined.
4. The residual installment allocation rule is not specified.
5. The exact rounding method for daily interest is not explicitly stated.
6. The treatment of downstream fees after a reversal is not explicitly
   defined.
7. The output format is not prescribed beyond requiring per-day output.

## Settlement amount versus authorization hold

The specification does not explicitly define what happens when the
settlement amount differs from the original authorization hold.

Decision:

- Partial settlement is allowed.
- Settlement amount must not exceed the active authorization hold.
- If settlement amount is greater than the active hold, settlement fails.
- A failed settlement creates no ledger entry.
- A failed settlement does not release the hold.

Example:

Authorization hold: AED 200.00
Settlement: AED 185.00

Result:

- Settlement status: SETTLED
- Ledger debit: AED 185.00
- Hold released: AED 200.00
- AED 15.00 is released without a ledger entry.



## Downstream fees after reversal

The specification does not explicitly define whether reversing a
transaction also reverses fees that were previously assessed because
of that transaction.

Decision:

- A reversal creates a compensating ledger entry for the original
  transaction.
- A reversal does not automatically reverse an overdraft fee that was
  previously assessed.
- Fees remain separate append-only ledger entries.
- Any fee reversal would require a separate explicit business rule or
  event.

## Daily interest rounding

The specification does not explicitly define how daily interest
calculations should be rounded to the currency's smallest unit.

Decision:

- Daily interest is calculated using the exact minor-unit balance.
- The result is rounded to the nearest minor unit.
- Half-way values are rounded up (half-up rounding).
- The rounded daily accrual is stored as the daily interest amount.
- Capitalization sums the already-rounded daily accruals.
- No rounding remainder is discarded during capitalization.

Example:
AED 12.50 × 0.04% = AED 0.005
AED uses 2 decimal places, so AED 0.005 rounds half-up to AED 0.01.