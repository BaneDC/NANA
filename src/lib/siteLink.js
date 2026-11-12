import { setLang } from '../i18n';

// What the website hands over in its link (decided 12. 11.; rules 16 and 18 in
// docs/superpowers/specs/2026-11-12-rutiranje-design.md): the language its page
// was in, as production does (app…/caregivers/application/?lng=sr), and, when
// the link knows it, the market a caregiver wants to work on (?market=fi).
// Both are read once, on load, and leave the address.

const MARKETS = ['sr', 'fi'];

export function readSiteLink(search) {
  const q = new URLSearchParams(search);
  const lang = q.get('lng') || null;
  const market = MARKETS.includes(q.get('market')) ? q.get('market') : null;
  const found = q.has('lng') || q.has('market');
  q.delete('lng');
  q.delete('market');
  const rest = q.toString().replace(/=(?=&|$)/g, '');
  return { found, lang, market, search: rest ? `?${rest}` : '' };
}

let market = null;
// the market the link named, for the caregiver's sign-up; null when it named none
export const siteMarket = () => market;
// in the prototype "Ko ste?" plays the website, and its demo market row the link's
export const setSiteMarket = (m) => {
  market = MARKETS.includes(m) ? m : null;
};

export function takeSiteLink() {
  const link = readSiteLink(window.location.search);
  if (!link.found) return;
  if (link.lang) setLang(link.lang);
  market = link.market;
  window.history.replaceState(window.history.state, '', window.location.pathname + link.search + window.location.hash);
}
