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