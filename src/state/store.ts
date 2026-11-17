import { create } from 'zustand';
import { DEFAULT_ASSUMPTIONS } from '@/engine/assumptions';
import type { AdviceAction } from '@/engine/advice';
import { applyAdviceAction, DEFAULT_CHOICES, type Choices } from '@/engine/choices';
import { EXAMPLE_PROFILE } from '@/engine/example';
import type { Assumptions, PersonInput, Profile } from '@/engine/profile';
import { readStorage, writeStorage } from '@/lib/storage';
import { decodeState, encodeState, type SharedState } from './urlCodec';

/**
 * Global app state. The simulation part (profile, assumptions, choices, mode) is mirrored in the
 * URL hash (shareable, never sent to the server) and in localStorage (resume later).
 */

export type Tab = 'report' | 'scenarios' | 'world' | 'advice';

export const DEFAULT_PERSON: PersonInput = {
  birthYear: 1970,
  sex: 'm',
  grossIncome: 100_000,
  activityRate: 1,
  avsMissingYears: 0,
  lpp: { balance: 250_000, buyInPotential: 0 },
  pillar3a: { balance: 40_000, accounts: 1 },
  retirementAge: 65,
};

/** Neutral starting point of the onboarding: every field pre-filled, the user adjusts. */
export const DEFAULT_PROFILE: Profile = {
  status: 'single',
  canton: 'VD',
  nationality: 'CH',
  children: 0,
  main: DEFAULT_PERSON,
  monthlyExpenses: 6_000,
  savings: 50_000,
  investments: 50_000,
};

interface AppState {
  profile: Profile;
  assumptions: Assumptions;
  choices: Choices;
  mode: 'simple' | 'expert';
  onboarded: boolean;
  tab: Tab;
  showReal: boolean;
  setProfile: (update: (p: Profile) => Profile) => void;
  setMain: (patch: Partial<PersonInput>) => void;
  setPartner: (patch: Partial<PersonInput>) => void;
  setAssumptions: (patch: Partial<Assumptions>) => void;
  setChoices: (patch: Partial<Choices>) => void;
  applyAdvice: (action: AdviceAction) => void;
  setMode: (mode: 'simple' | 'expert') => void;
  setTab: (tab: Tab) => void;
  setShowReal: (v: boolean) => void;
  completeOnboarding: () => void;
  loadExample: () => void;
  restart: () => void;
}

const STORAGE_KEY = 'mrfs:v1';

function initialState(): Pick<
  AppState,
  'profile' | 'assumptions' | 'choices' | 'mode' | 'onboarded'
> {
  if (typeof window !== 'undefined' && window.location.hash === '#exemple') {
    return {
      profile: EXAMPLE_PROFILE,
      assumptions: DEFAULT_ASSUMPTIONS,
      choices: DEFAULT_CHOICES,
      mode: 'simple',
      onboarded: true,
    };
  }
  const fromHash = typeof window !== 'undefined' ? decodeState(window.location.hash) : null;
  if (fromHash)
    return {
      ...fromHash,
      assumptions: { ...DEFAULT_ASSUMPTIONS, ...fromHash.assumptions },
      choices: { ...DEFAULT_CHOICES, ...fromHash.choices },
      onboarded: true,
    };
  const stored = readStorage(STORAGE_KEY);
  if (stored) {
    const s = decodeState(stored);
    if (s)
      return {
        ...s,
        assumptions: { ...DEFAULT_ASSUMPTIONS, ...s.assumptions },
        choices: { ...DEFAULT_CHOICES, ...s.choices },
        onboarded: true,
      };
  }
  return {
    profile: DEFAULT_PROFILE,
    assumptions: DEFAULT_ASSUMPTIONS,
    choices: DEFAULT_CHOICES,
    mode: 'simple',
    onboarded: false,
  };
}

export const useApp = create<AppState>()((set, get) => ({
  ...initialState(),
  tab: 'report',
  showReal: true,
  setProfile: (update) => set({ profile: update(get().profile) }),
  setMain: (patch) =>
    set({ profile: { ...get().profile, main: { ...get().profile.main, ...patch } } }),
  setPartner: (patch) => {
    const p = get().profile;
    set({
      profile: {
        ...p,
        partner: {
          ...(p.partner ?? { ...DEFAULT_PERSON, sex: p.main.sex === 'm' ? 'f' : 'm' }),
          ...patch,
        },
      },
    });
  },
  setAssumptions: (patch) => set({ assumptions: { ...get().assumptions, ...patch } }),
  setChoices: (patch) => set({ choices: { ...get().choices, ...patch } }),
  applyAdvice: (action) => {
    const r = applyAdviceAction(get().profile, get().choices, action);
    set({
      profile: r.profile,
      choices: r.choices,
      ...(action.type === 'openMap' ? { tab: 'world' as Tab } : {}),
    });
  },
  setMode: (mode) => set({ mode }),
  setTab: (tab) => set({ tab }),
  setShowReal: (showReal) => set({ showReal }),
  completeOnboarding: () => set({ onboarded: true, choices: DEFAULT_CHOICES }),
  loadExample: () =>
    set({
      profile: EXAMPLE_PROFILE,
      assumptions: DEFAULT_ASSUMPTIONS,
      choices: DEFAULT_CHOICES,
      onboarded: true,
    }),
  restart: () => {
    set({
      profile: DEFAULT_PROFILE,
      assumptions: DEFAULT_ASSUMPTIONS,
      choices: DEFAULT_CHOICES,
      onboarded: false,
      tab: 'report',
    });
    history.replaceState(null, '', window.location.pathname);
  },
}));

export function sharedSnapshot(
  s: Pick<AppState, 'profile' | 'assumptions' | 'choices' | 'mode'>,
): SharedState {
  return { v: 1, profile: s.profile, assumptions: s.assumptions, choices: s.choices, mode: s.mode };
}

/** Mirrors the simulation state into the hash (replaceState: no history spam) and localStorage. */
export function startPersistence(): () => void {
  let timer: number | undefined;
  const write = (s: AppState) => {
    const hash = encodeState(sharedSnapshot(s));
    if (window.location.hash !== hash)
      history.replaceState(null, '', window.location.pathname + hash);
    writeStorage(STORAGE_KEY, hash);
  };
  // Write once at start (e.g. replaces « #exemple » by the real state), then on every change.
  if (useApp.getState().onboarded) write(useApp.getState());
  return useApp.subscribe((s) => {
    if (!s.onboarded) return;
    window.clearTimeout(timer);
    timer = window.setTimeout(() => write(s), 250);
  });
}
