const MAX_DELAY_MS = 900;
const MIN_DELAY_MS = 120;

export const speedToDelay = (speed: number): number => {
  const clamped = Math.min(Math.max(speed, 0), 100);
  const range = MAX_DELAY_MS - MIN_DELAY_MS;
  return Math.max(
    MIN_DELAY_MS,
    Math.round(MAX_DELAY_MS - (clamped / 100) * range)
  );
};

export const speedLabel = (speed: number): string => {
  if (speed <= 25) return "Slow";
  if (speed >= 75) return "Fast";
  return "Medium";
};



