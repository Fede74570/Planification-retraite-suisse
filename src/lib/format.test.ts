import { describe, expect, it } from 'vitest';
import { formatCHF, formatCHFCompact, formatNumber, formatPercent, parseAmount } from './format';

describe('format', () => {
  it('uses the ASCII apostrophe as thousands separator', () => {
    expect(formatNumber(1250)).toBe("1'250");
    expect(formatNumber(1_250_000)).toBe("1'250'000");
    expect(formatCHF(6420)).toBe("CHF 6'420");
  });
  it('rounds to the franc and never prints -0', () => {
    expect(formatNumber(1249.6)).toBe("1'250");
    expect(formatNumber(-0.2)).toBe('0');
    expect(formatNumber(-1500)).toBe("−1'500");
    expect(formatNumber(Number.NaN)).toBe('–');
  });
  it('compacts large amounts', () => {
    expect(formatCHFCompact(1_300_000)).toBe('CHF 1,3 mio');
    expect(formatCHFCompact(420_000)).toBe('CHF 420k');
    expect(formatCHFCompact(9_500)).toBe("CHF 9'500");
  });
  it('formats percentages the Swiss French way', () => {
    expect(formatPercent(0.068)).toBe('6,8 %');
    expect(formatPercent(0.8)).toBe('80 %');
    expect(formatPercent(Number.POSITIVE_INFINITY)).toBe('–');
  });
  it('parses user input', () => {
    expect(parseAmount("1'250")).toBe(1250);
    expect(parseAmount('1 250,50')).toBe(1250.5);
    expect(parseAmount('CHF 9500')).toBe(9500);
    expect(parseAmount('abc')).toBeNull();
    expect(parseAmount('')).toBeNull();
  });
});
