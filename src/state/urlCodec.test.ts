import { describe, expect, it } from 'vitest';
import { DEFAULT_ASSUMPTIONS } from '@/engine/assumptions';
import { DEFAULT_CHOICES } from '@/engine/choices';
import { EXAMPLE_PROFILE } from '@/engine/example';
import { decodeState, encodeState, type SharedState } from './urlCodec';

const state: SharedState = {
  v: 1,
  profile: EXAMPLE_PROFILE,
  assumptions: DEFAULT_ASSUMPTIONS,
  choices: DEFAULT_CHOICES,
  mode: 'simple',
};

describe('URL codec', () => {
  it('round-trips the state (including accents)', () => {
    const hash = encodeState({ ...state, mode: 'expert' });
    expect(hash.startsWith('#s=')).toBe(true);
    expect(hash.slice(3)).not.toMatch(/[+/=]/);
    expect(decodeState(hash)).toEqual({ ...state, mode: 'expert' });
  });
  it('rejects foreign or malformed hashes', () => {
    expect(decodeState('')).toBeNull();
    expect(decodeState('#foo')).toBeNull();
    expect(decodeState('#s=%%%')).toBeNull();
    expect(decodeState('#s=' + btoa(JSON.stringify({ v: 2 })))).toBeNull();
    expect(
      decodeState(
        '#s=' + btoa(JSON.stringify({ v: 1, profile: {}, assumptions: {}, choices: {} })),
      ),
    ).toBeNull();
  });
  it('defaults the mode to simple', () => {
    const raw = btoa(JSON.stringify({ ...state, mode: 'weird' })).replace(/=+$/, '');
    expect(decodeState('#s=' + raw)?.mode).toBe('simple');
  });
  it('stays reasonably short for sharing', () => {
    expect(encodeState(state).length).toBeLessThan(4000);
  });
});
