### `NUMBERS.md`

```md
# Numbers and Constants

This document records every business constant used by the ledger.

## Currency precision

### AED

- Precision: 2 decimal places
- Internal scale: 100 minor units per AED
- Example: AED 25.00 = 2500 minor units

AED uses two decimal places because the exercise explicitly specifies
AED amounts to 2 decimal places.

### BHD

- Precision: 3 decimal places
- Internal scale: 1000 minor units per BHD
- Example: BHD 10.000 = 10000 minor units

BHD uses three decimal places because the exercise explicitly specifies
BHD amounts to 3 decimal places.

## Why not use half the precision?

Reducing AED to 1 decimal place or BHD to 2 decimal places would lose
monetary precision explicitly required by the exercise. The ledger must
represent amounts at each currency's specified precision.

