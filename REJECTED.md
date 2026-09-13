# Rejected Acceptance Criteria

## Criterion 2 — E7 causes exactly one overdraft fee on Day 2

Rejected because overdraft fees are assessed after the complete event
replay. E9 is a backdated reversal of E7 and restores the Day 2 closing
balance from AED -370.00 to AED 250.00 before fee assessment.

Therefore the final replay does not qualify Day 2 for an overdraft fee.

## Criterion 6 — After E9 all balances and fees return to pre-E7 values

Rejected because a reversal compensates the original transaction but
does not automatically reverse a previously assessed overdraft fee.

Fees remain separate append-only ledger entries and require an explicit
fee-reversal rule or event to be reversed.

## Criterion 7 — All three BHD installments are BHD 3.334

Rejected because three BHD 3.334 installments total BHD 10.002, which
does not equal the original BHD 10.000.

The implementation allocates minor units deterministically as:
BHD 3.333, BHD 3.333, and BHD 3.334.

## Criterion 8 — Discard the interest capitalization remainder

Rejected because daily interest accruals are rounded individually and
capitalization sums those already-rounded accruals exactly.

No rounding remainder is discarded.

## Approaches Abandoned

- Assessed overdraft fees immediately when a backdated debit created a
  negative historical balance. Replaced with final replay-based fee
  assessment so later backdated reversals are considered.

- Automatically reversed overdraft fees when a transaction was reversed.
  Replaced with append-only fee treatment because fee reversal was not
  explicitly defined.

- Split BHD 10.000 into three equal BHD 3.334 installments. Replaced with
  3.333, 3.333, and 3.334 so the installments sum exactly to BHD 10.000.

- Discarded rounding differences in interest capitalization. Replaced with
  summing the already-rounded daily accruals exactly.