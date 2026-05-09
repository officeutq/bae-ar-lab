export type TemporalFilter = {
  reset: () => void;
  smooth: (key: string, value: number, alpha: number) => number;
};

export function createTemporalFilter(): TemporalFilter {
  const previousValues = new Map<string, number>();

  return {
    reset: () => {
      previousValues.clear();
    },
    smooth: (key, value, alpha) => {
      const previous = previousValues.get(key);
      if (typeof previous !== 'number') {
        previousValues.set(key, value);
        return value;
      }
      const next = previous + (value - previous) * alpha;
      previousValues.set(key, next);
      return next;
    },
  };
}
