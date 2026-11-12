import { describe, expect, it } from 'vitest';
import { readSiteLink } from './siteLink';

describe('readSiteLink', () => {
  it('reads the language and the market, and takes them off the address', () => {
    expect(readSiteLink('?lng=fi&market=sr')).toEqual({ found: true, lang: 'fi', market: 'sr', search: '' });
  });
  it('keeps the rest of the address, the demo too', () => {
    expect(readSiteLink('?demo&lng=en&trziste=sr')).toEqual({ found: true, lang: 'en', market: null, search: '?demo&trziste=sr' });
  });
  it('knows no market but Serbia and Finland', () => {
    expect(readSiteLink('?market=at').market).toBeNull();
  });
  it('finds nothing in an address without them', () => {
    expect(readSiteLink('?demo')).toEqual({ found: false, lang: null, market: null, search: '?demo' });
  });
});
