import { describe, expect, it } from 'vitest';
import { countWhere, mean, percentile, stdDev, sum, zScore } from '../src';

describe('stats/basic', () => {
  it('sum and mean ignore non-finite values', () => {
    expect(sum([1, 2, Number.NaN, 3])).toBe(6);
    expect(mean([1, 2, Number.NaN, 3])).toBe(2);
  });

  it('mean of empty is NaN', () => {
    expect(mean([])).toBeNaN();
  });

  it('stdDev uses the sample formula', () => {
    expect(stdDev([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(2.138, 3);
    expect(stdDev([5])).toBeNaN();
  });

  it('percentile interpolates linearly', () => {
    const xs = [10, 20, 30, 40];
    expect(percentile(xs, 0)).toBe(10);
    expect(percentile(xs, 50)).toBe(25);
    expect(percentile(xs, 100)).toBe(40);
    expect(percentile([], 50)).toBeNaN();
  });

  it('zScore is NaN when reference has no spread', () => {
    expect(zScore(5, [3, 3, 3])).toBeNaN();
    expect(zScore(6, [2, 4, 6])).toBeCloseTo(1, 6);
  });

  it('countWhere counts matches, e.g. hot days above 40 C', () => {
    expect(countWhere([38, 41, 45, Number.NaN, 39.9], (t) => t > 40)).toBe(2);
  });
});
