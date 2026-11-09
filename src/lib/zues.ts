import { round2 } from "./format";

/**
 * Fee rules for the entrance (mock), per ЗУЕС.
 * чл. 51 – разходи за управление и поддържане: по брой обитатели + домашни любимци.
 * чл. 50 – Фонд „Ремонт и обновяване": според идеалните части.
 */
export const FEE_PER_OCCUPANT = 7.2;
export const FEE_PER_PET = 3.6;
/** Monthly Фонд Ремонт contribution of the whole entrance, split by ideal parts. */
export const REPAIR_FUND_MONTHLY = 20.5 / 0.081;

export function maintenanceFee(occupants: number, pets: number): number {
  return round2(occupants * FEE_PER_OCCUPANT + pets * FEE_PER_PET);
}

export function repairFee(idealPartsPercent: number): number {
  return round2((idealPartsPercent / 100) * REPAIR_FUND_MONTHLY);
}

export function monthlyFee(occupants: number, pets: number, idealPartsPercent: number) {
  const maintenance = maintenanceFee(occupants, pets);
  const repair = repairFee(idealPartsPercent);
  return { maintenance, repair, total: round2(maintenance + repair) };
}
