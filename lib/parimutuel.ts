export function calculateOdds(
  yesPool: number,
  noPool: number
): { yesOdds: number; noOdds: number } {
  const total = yesPool + noPool;
  if (total === 0) return { yesOdds: 0.5, noOdds: 0.5 };
  return { yesOdds: yesPool / total, noOdds: noPool / total };
}

export function calculatePotentialPayout(
  betAmount: number,
  outcomePool: number,
  totalPool: number
): number {
  return betAmount * (totalPool + betAmount) / (outcomePool + betAmount);
}
