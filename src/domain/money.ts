export type Currency = "AED" | "BHD";

export interface Money {
  readonly currency: Currency;
  readonly minorUnits: bigint;
}