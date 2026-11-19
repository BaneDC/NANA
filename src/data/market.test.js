import { afterEach, describe, expect, it } from 'vitest';
import { marketHas, setMarket, setPlace } from './market';
import { packageOver, plansFor, renewalAt } from './plans';
import { caregiversIn, matchReasons, setRegistered } from './carePlan';
import { requestNote } from './firstSteps';
import { seedState } from './demo';

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
  it('are three, a month each, paid once, as on the site', () => {
    const plans = plansFor('RS');
    expect(plans.map((p) => [p.id, p.price, p.months, p.once])).toEqual([
      ['starter', 9, 1, true],
      ['guided', 25, 1, true],
      ['premium', 49, 1, true],
    ]);
    expect(plans.filter((p) => p.recommended).map((p) => p.id)).toEqual(['premium']);
  });

  it('Finland still subscribes', () => {
    expect(plansFor('FI').some((p) => p.once)).toBe(false);
  });
});

describe('a package runs out', () => {
  const at = new Date(2026, 9, 19).getTime();
  it('is valid until its months have passed, then over', () => {
    const sub = { planId: 'starter', at };
    expect(packageOver('RS', sub, at + 1000)).toBe(false);
    expect(packageOver('RS', sub, renewalAt('RS', 'starter', at))).toBe(true);
  });
  it('a Finnish subscription is never over this way', () => {
    expect(packageOver('FI', { planId: 'monthly', at }, at + 400 * 864e5)).toBe(false);
  });
  it('nothing bought is not over', () => expect(packageOver('RS', null)).toBe(false));
});

describe('Serbia on the family side', () => {
  afterEach(() => setMarket('FI'));

  it('lists Serbian caregivers, with no price and no classifications', () => {
    const list = caregiversIn('RS');
    expect(list.length).toBe(12);
    expect(list.every((c) => c.market === 'RS' && !c.rateMin && c.classifications.length === 0)).toBe(true);
    expect(caregiversIn('FI').some((c) => c.market === 'RS')).toBe(false);
  });

  it('says why one fits from her own fields', () => {
    expect(matchReasons(caregiversIn('RS')[0])).toContain('Isti grad');
  });

  it('a request is part of the package, said in euros paid once', () => {
    expect(requestNote(false, 'RS')).toMatch(/paketa/);
    expect(requestNote(false, 'FI')).toMatch(/pretplate/);
  });

  it('a filled Serbian demo is not filled with Finnish care', () => {
    expect(seedState('sr', { filled: true }).person.care.arrangements).toEqual([]);
  });
});

describe('a caregiver who signed up', () => {
  afterEach(() => setRegistered([]));
  const her = { id: 'reg-1', market: 'FI', status: 'interview', name: 'Ana Lind', classifications: [], days: [0], slots: ['morning'], languages: [], radius: 10, area: 'Kallio' };

  it('is on the families\' list only once the coordinator activates her', () => {
    setRegistered([her]);
    expect(caregiversIn('FI').some((c) => c.id === 'reg-1')).toBe(false);
    setRegistered([{ ...her, status: 'active' }]);
    expect(caregiversIn('FI').some((c) => c.id === 'reg-1')).toBe(true);
  });
});

describe('where the family is', () => {
  afterEach(() => (setMarket('FI'), setPlace()));

  it('a family abroad sees only Serbian caregivers who work abroad', () => {
    setMarket('RS');
    const all = caregiversIn().length;
    setPlace({ abroad: true });
    const list = caregiversIn();
    expect(list.length).toBeGreaterThan(0);
    expect(list.length).toBeLessThan(all);
    expect(list.every((c) => c.abroad)).toBe(true);
    expect(list.some((c) => c.id === 'milica')).toBe(true);
  });
  it('a municipality with nobody in it has an empty list, and any other the whole one', () => {
    setMarket('RS');
    setPlace({ municipality: 'Čačak' });
    expect(caregiversIn()).toEqual([]);
    setPlace({ municipality: 'Niš' });
    expect(caregiversIn().length).toBeGreaterThan(0);
    setPlace();
    expect(caregiversIn().length).toBeGreaterThan(0);
  });
});
