export const BALANCE_EPSILON = 0.01;
export const WEEKS_PER_MONTH = 4;

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
