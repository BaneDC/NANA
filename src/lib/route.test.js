import { describe, expect, it } from 'vitest';
import { href, keptSearch, parse } from './route';

const table = [
  ['/', { page: null }],
  ['/signup', { page: 'signup' }],
  ['/signup/family', { page: 'signup', who: 'family' }],
  ['/signup/caregiver', { page: 'signup', who: 'caregiver' }],
  ['/signup/caregiver/documents', { page: 'signup', who: 'caregiver', step: 'documents' }],
  ['/signin', { page: 'signin' }],
  ['/signin/verify', { page: 'signin', step: 'verify' }],
  ['/signin/reset', { page: 'signin', step: 'reset' }],
  ['/onboarding', { page: 'onboarding' }],
  ['/chat', { page: 'chat' }],
  ['/dashboard', { page: 'dashboard' }],
  ['/caregivers/sanna', { page: 'caregiver', id: 'sanna' }],
  ['/requests', { page: 'requests' }],
  ['/find-caregiver', { page: 'find-caregiver' }],
  ['/record', { page: 'record' }],
  ['/settings', { page: 'settings' }],
  ['/board', { page: 'board' }],
  ['/clients', { page: 'clients' }],
  ['/clients/c-12', { page: 'client', id: 'c-12' }],
  ['/earnings', { page: 'earnings' }],
  ['/profile', { page: 'profile' }],
];

describe('route', () => {
  it.each(table)('parses %s', (path, route) => expect(parse(path)).toEqual(route));
  it.each(table)('writes %s back', (path, route) => expect(href(route)).toBe(path));
  it('anything else is unknown', () => {
    expect(parse('/nope')).toEqual({ page: 'unknown' });
    expect(parse('/signup/caregiver/nope')).toEqual({ page: 'unknown' });
    expect(parse('/signup/nobody')).toEqual({ page: 'unknown' });
    expect(parse('/clients/a/b')).toEqual({ page: 'unknown' });
  });
  it('a trailing slash is the same page', () => expect(parse('/board/')).toEqual({ page: 'board' }));
  it('an id is decoded and encoded', () => {
    expect(parse('/clients/a%20b')).toEqual({ page: 'client', id: 'a b' });
    expect(href({ page: 'client', id: 'a b' })).toBe('/clients/a%20b');
  });
  it('keeps the demo, drops puno', () => {
    expect(keptSearch('?demo=negovateljica&trziste=fi&puno')).toBe('?demo=negovateljica&trziste=fi');
    expect(keptSearch('?demo&puno')).toBe('?demo');
    expect(keptSearch('?puno')).toBe('');
    expect(keptSearch('')).toBe('');
  });
});
