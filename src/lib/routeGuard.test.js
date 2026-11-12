import { describe, expect, it } from 'vitest';
import { homeOf, resolve } from './routeGuard';

const base = { signedIn: true, role: 'family', market: 'fi', hasPlan: true, summaryShowing: false, hasClient: (id) => id === 'c1', hasCaregiver: (id) => id === 'sanna' };
const ctxs = [false, true].flatMap((signedIn) => ['family', 'caregiver'].flatMap((role) => ['fi', 'sr'].flatMap((market) => [false, true].map((hasPlan) => ({ ...base, signedIn, role, market, hasPlan })))));

describe('guard', () => {
  it.each(ctxs)('home never redirects (%o)', (ctx) => expect(resolve(homeOf(ctx), ctx)).toBeNull());
  it('signed out: app page goes to sign-in, / to sign-up', () => {
    const out = { ...base, signedIn: false };
    expect(resolve({ page: 'board' }, out)).toEqual({ page: 'signin' });
    expect(resolve({ page: 'unknown' }, out)).toEqual({ page: 'signup' });
    expect(resolve({ page: null }, out)).toEqual({ page: 'signup' });
    expect(resolve({ page: 'signup', who: 'caregiver', step: 'form' }, out)).toBeNull();
    expect(resolve({ page: 'signin', step: 'reset' }, out)).toBeNull();
  });
  it('signed in never sees sign-up', () => {
    expect(resolve({ page: 'signup', who: 'family' }, base)).toEqual({ page: 'dashboard' });
    expect(resolve({ page: 'signin' }, base)).toEqual({ page: 'dashboard' });
    expect(resolve({ page: 'unknown' }, base)).toEqual({ page: 'dashboard' });
  });
  it('family without plan sees only the onboarding', () => {
    const np = { ...base, hasPlan: false };
    expect(resolve({ page: 'chat' }, np)).toEqual({ page: 'onboarding' });
    expect(resolve({ page: 'settings' }, np)).toEqual({ page: 'onboarding' });
    expect(resolve({ page: 'onboarding' }, np)).toBeNull();
  });
  it('the summary stays while it shows', () => {
    expect(resolve({ page: 'onboarding' }, base)).toEqual({ page: 'dashboard' });
    expect(resolve({ page: 'onboarding' }, { ...base, summaryShowing: true })).toBeNull();
  });
  it('the other role or market goes home', () => {
    expect(resolve({ page: 'board' }, base)).toEqual({ page: 'dashboard' });
    const sr = { ...base, role: 'caregiver', market: 'sr' };
    expect(resolve({ page: 'board' }, sr)).toEqual({ page: 'requests' });
    expect(resolve({ page: 'earnings' }, sr)).toEqual({ page: 'requests' });
    expect(resolve({ page: 'profile' }, sr)).toBeNull();
    expect(resolve({ page: 'dashboard' }, { ...sr, market: 'fi' })).toEqual({ page: 'board' });
    expect(resolve({ page: 'requests' }, { ...sr, market: 'fi' })).toEqual({ page: 'board' });
    expect(resolve({ page: 'onboarding' }, { ...sr, market: 'fi' })).toEqual({ page: 'board' });
  });
  it('an unknown id goes home', () => {
    expect(resolve({ page: 'client', id: 'zz' }, { ...base, role: 'caregiver' })).toEqual({ page: 'board' });
    expect(resolve({ page: 'client', id: 'c1' }, { ...base, role: 'caregiver' })).toBeNull();
    expect(resolve({ page: 'caregiver', id: 'zz' }, base)).toEqual({ page: 'dashboard' });
    expect(resolve({ page: 'caregiver', id: 'sanna' }, base)).toBeNull();
  });
});
