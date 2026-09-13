# Worklog

## 2026-09-12 22:47:33 +0400

- Initialized the repository.
- Selected Node.js + TypeScript.
- Confirmed the implementation is fully in-memory with no database.
- Established the initial domain contracts for accounts, money, ledger entries, authorizations, events, and daily account state.


## 2026-09-12 23:16:13 +0400

- Implemented currency-aware Money value object.
- Represented monetary values using bigint minor units.
- Added AED 2-decimal and BHD 3-decimal precision definitions.
- Added exact addition, subtraction, comparison, and sign operations.
- Added currency mismatch protection.
- Added Money unit tests.

## 2026-09-12 23:41:18 +0400

  - Implemented append-only ledger storage.
  - Added account-specific ledger entry retrieval.
  - Added value-date-based balance calculation.
  - Confirmed future-dated entries do not affect earlier balances.
  - Added tests verifying ledger entries remain append-only.

## 2026-09-12 23:55:00 +0400

- Implemented the value-dated BalanceCalculator.
- Separated balance calculation from ledger storage.
- Added closing balance calculation for a specific account and day.
- Added explicit coverage for backdated ledger entries.
- Confirmed that an entry booked later but carrying an earlier value date affects that value date and all subsequent balances.
- Added protection against entries belonging to other accounts.
- All existing and new tests passed.

## 2026-09-13 00:14:05 +0400

- Implemented authorization and hold handling.
- Added approval and decline rules based on available balance.
- Kept authorization holds separate from ledger entries.
- Added support for multiple active approved holds.
- Added tests covering sufficient funds, insufficient funds, multiple holds, and ledger separation.
- All existing and new tests passed.


## 2026-09-13 00:46:22 +0400

- Implemented settlement domain model and settlement service.
- Added settlement lifecycle from APPROVED authorization to SETTLED.
- Added support for partial settlement where the settlement amount is lower than the authorization hold.
- Released the active hold after successful settlement.
- Posted only the actual settlement amount to the append-only ledger.
- Added failure handling for unknown authorizations.
- Added failure handling when settlement exceeds the authorization hold.
- Added account ownership validation.
- Added tests covering successful and failed settlement scenarios.
- All tests passed.

## 2026-09-13 01:02:23 +0400

- Implemented reversal processing.
- Added compensating ledger entries without modifying original entries.
- Preserved the original ledger entry value date on reversal.
- Added failure handling for unknown ledger entries.
- Added reversal service tests.
- Confirmed all tests pass.


## 2026-09-13 01:31:37 +0400

- Added an integration test for the backdated E7/E9 reversal scenario.
- Verified that E7 has a Day 2 value date and the E9 compensating entry also uses Day 2.
- Verified that the Day 2 balance changes from AED -370.00 before reversal to AED 250.00 after reversal.
- Verified that the original E7 ledger entry remains unchanged.
- Confirmed the reversal is implemented as a new append-only ledger entry.


## 2026-09-13 12:29:28 +0400

- Implemented the overdraft fee domain model and service.
- Added AED 25.00 overdraft fee assessment for negative closing ledger balances.
- Enforced a maximum of one overdraft fee per account per day.
- Verified that fees are recorded as append-only ledger entries.
- Added tests for negative, zero, and positive balances.
- Added tests for duplicate fee prevention.
- Added an integration test for the backdated E7 overdraft scenario.
- Verified that the Day 2 balance changes from AED -370.00 before the fee to AED -395.00 after the fee.


## 2026-09-13 12:57:05 +0400

- Implemented daily interest calculation at 0.04% on positive closing ledger balances only.
- Added currency-aware interest calculation for AED and BHD.
- Added half-up rounding to the currency's smallest unit.
- Implemented daily interest accruals as separate derived values.
- Implemented Day 6 interest capitalization as a single ledger credit.
- Confirmed capitalization sums the rounded daily accruals without discarding a remainder.
- Added tests covering positive, zero, negative, AED, BHD, rounding, daily independence, and interest capitalization behavior.


## 2026-09-13 13:39:49 +0400

- Implemented event replay for credit, debit, authorization, settlement, and reversal events.
- Added installment credit replay and minor-unit installment allocation.
- Chose final-installment residual allocation: BHD 10.000 → 3.333, 3.333, 3.334.
- Added replay and installment tests; all tests pass.


## 2026-09-13 13:59:20 +0400

- Changed overdraft fee assessment to occur after the complete event replay.
- Final closing balances are now used when determining whether a value date incurred an overdraft fee.
- Backdated events can therefore change whether an earlier day qualifies for a fee.
- Updated the backdated reversal test to confirm that a reversal can remove the overdraft condition.
- All EventReplayer tests pass.