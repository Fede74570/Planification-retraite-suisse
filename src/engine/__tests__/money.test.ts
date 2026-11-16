import { describe, expect, it } from 'vitest';
import {
  annuityPayment,
  clamp,
  indexFactor,
  interpolate,
  interpolateTax,
  roundCHF,
  toReal,
} from '../money';

describe('money helpers', () => {
  it('indexes and deflates', () => {
    expect(indexFactor(0.01, 2027, 2029)).toBeCloseTo(1.0201);
    expect(toReal(1020.1, 0.01, 2029, 2027)).toBeCloseTo(1000);
    expect(toReal(500, 0, 2050, 2027)).toBe(500); // inflation 0 → real = nominal
    expect(clamp(5, 0, 3)).toBe(3);
    expect(roundCHF(10.6)).toBe(11);
  });
  it('computes annuity payments (beginning of year)', () => {
    expect(annuityPayment(1000, 0, 4)).toBe(250);
    expect(annuityPayment(1000, 0.05, 0)).toBe(1000);
    const pmt = annuityPayment(100_000, 0.03, 20);
    let b = 100_000;
    for (let i = 0; i < 20; i++) b = (b - pmt) * 1.03;
    expect(b).toBeCloseTo(0, 4);
  });
  it('interpolates linearly with extrapolation', () => {
    expect(interpolate([0, 10], [0, 100], 5)).toBe(50);
    expect(interpolate([0, 10, 20], [0, 100, 300], 25)).toBe(400);
    expect(interpolate([0, 10], [0, 100], -5)).toBe(-50);
    expect(interpolate([], [], 3)).toBe(0);
    expect(interpolate([1], [7], 3)).toBe(7);
  });
  it('interpolates taxes log-linearly and stays exact on grid points', () => {
    const xs = [10_000, 20_000, 50_000, 100_000];
    const ys = [0, 500, 3_000, 10_000];
    expect(interpolateTax(xs, ys, 50_000)).toBe(3_000);
    expect(interpolateTax(xs, ys, 15_000)).toBe(250); // zero point → linear
    const mid = interpolateTax(xs, ys, 70_000);
    expect(mid).toBeGreaterThan(3_000);
    expect(mid).toBeLessThan(10_000);
    expect(interpolateTax(xs, ys, 5_000)).toBe(0);
    expect(interpolateTax(xs, ys, 150_000)).toBeCloseTo(10_000 + (7_000 / 50_000) * 50_000);
    expect(interpolateTax(xs, ys, -1)).toBe(0);
    expect(interpolateTax([1000], [10], 500)).toBe(5);
  });
});
