import type { Choices } from '@/engine/choices';
import type { Assumptions, Profile } from '@/engine/profile';

/**
 * Serialises the simulation state into the URL hash (never sent to the server) as base64url JSON.
 * Versioned so that old links can be migrated or rejected safely.
 */
export interface SharedState {
  v: 1;
  profile: Profile;
  assumptions: Assumptions;
  choices: Choices;
  mode: 'simple' | 'expert';
}

const PREFIX = '#s=';

function toBase64Url(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(s: string): string {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4);
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodeState(state: SharedState): string {
  return PREFIX + toBase64Url(JSON.stringify(state));
}

/** Parses a hash; returns null for anything malformed, foreign or from an unknown version. */
export function decodeState(hash: string): SharedState | null {
  if (!hash.startsWith(PREFIX)) return null;
  try {
    const parsed = JSON.parse(fromBase64Url(hash.slice(PREFIX.length))) as Partial<SharedState>;
    if (parsed.v !== 1 || !parsed.profile || !parsed.assumptions || !parsed.choices) return null;
    if (typeof parsed.profile.main?.birthYear !== 'number') return null;
    return {
      v: 1,
      profile: parsed.profile,
      assumptions: parsed.assumptions,
      choices: parsed.choices,
      mode: parsed.mode === 'expert' ? 'expert' : 'simple',
    };
  } catch {
    return null;
  }
}
