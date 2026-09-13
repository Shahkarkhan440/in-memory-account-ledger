# In-Memory Account Ledger

An in-memory account ledger core implemented in Node.js and TypeScript.

## Scope

- No web layer
- No database
- No persistence
- No UI
- Append-only ledger
- Six-day event replay

## The project includes:

- In-memory account ledger
- Append-only ledger entries
- Value-dated accounting
- Multi-currency money handling
- AED and BHD currency precision
- Credits and debits
- Authorization holds
- Available balance calculation
- Settlement processing
- Transaction reversals
- Backdated transactions
- Overdraft fee assessment
- Daily interest accrual
- Interest capitalization
- Installment allocation
- Six-day event replay
- Daily account state calculation
- Assessment result reporting
- Replay error reporting

## Install, Build, Test & Run

Clone the repository and install dependencies:

```bash
npm install
npm test
npm run build
npm start