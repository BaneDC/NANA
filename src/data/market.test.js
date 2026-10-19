import { afterEach, describe, expect, it } from 'vitest';
import { marketHas, setMarket } from './market';
import { packageOver, plansFor, renewalAt } from './plans';

describe('market', () => {
  afterEach(() => setMarket('FI'));

  it('Finland has agreements, visits, a card and a subscription', () => {
    setMarket('FI');
    expect(['agreements', 'visits', 'card', 'subscription'].every(marketHas)).toBe(true);
    expect(marketHas('package')).toBe(false);
  });

  it('Serbia has only the package', () => {
    setMarket('RS');
    expect(marketHas('package')).toBe(true);
    expect(['agreements', 'visits', 'card', 'subscription'].some(marketHas)).toBe(false);
  });
});

describe('Serbian packages', () => {
  it('are two, paid once, as on the site', () => {
    const [m, q] = plansFor('RS');
    expect([m.price, m.months, m.once]).toEqual([43, 1, true]);
    expect([q.price, q.months, q.was, q.once, q.recommended]).toEqual([98, 3, 129, true, true]);
  });

  it('Finland still subscribes', () => {
    expect(plansFor('FI').some((p) => p.once)).toBe(false);
  });
});

describe('a package runs out', () => {
  const at = new Date(2026, 9, 19).getTime();
  it('is valid until its months have passed, then over', () => {
    const sub = { planId: 'monthly', at };
    expect(packageOver('RS', sub, at + 1000)).toBe(false);
    expect(packageOver('RS', sub, renewalAt('RS', 'monthly', at))).toBe(true);
  });
  it('a Finnish subscription is never over this way', () => {
    expect(packageOver('FI', { planId: 'monthly', at }, at + 400 * 864e5)).toBe(false);
  });
  it('nothing bought is not over', () => expect(packageOver('RS', null)).toBe(false));
});
