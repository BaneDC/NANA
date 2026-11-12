// Which address this person may see, and where the rest go (decided 12. 11.;
// docs/superpowers/specs/2026-11-12-rutiranje-design.md, rules 4–6 and 14).
//
// ctx: { signedIn, role, market, hasPlan, summaryShowing, hasClient(id), hasCaregiver(id) }

const FAMILY = ['chat', 'dashboard', 'caregiver', 'requests', 'find-caregiver', 'record', 'settings'];
const CAREGIVER = {
  fi: ['board', 'clients', 'client', 'earnings', 'profile', 'settings'],
  sr: ['requests', 'client', 'profile', 'settings'],
};
const OUTSIDE = ['signup', 'signin'];

export function homeOf(ctx) {
  if (!ctx.signedIn) return { page: 'signup' };
  if (ctx.role === 'caregiver') return { page: ctx.market === 'sr' ? 'requests' : 'board' };
  return { page: ctx.hasPlan ? 'dashboard' : 'onboarding' };
}

// The route to put in place of this one, or null when it may stay.
export function resolve(route, ctx) {
  const { page, id } = route;
  if (!ctx.signedIn) {
    if (OUTSIDE.includes(page)) return null;
    return !page || page === 'unknown' ? { page: 'signup' } : { page: 'signin' };
  }
  const home = homeOf(ctx);
  if (ctx.role === 'caregiver') {
    if (!CAREGIVER[ctx.market === 'sr' ? 'sr' : 'fi'].includes(page)) return home;
    if (page === 'client' && !ctx.hasClient(id)) return home;
    return null;
  }
  // a family sees nothing but the onboarding until it has made the plan; the
  // summary at its end stays until she goes on from it
  if (page === 'onboarding') return ctx.hasPlan && !ctx.summaryShowing ? home : null;
  if (!ctx.hasPlan) return home;
  if (!FAMILY.includes(page)) return home;
  if (page === 'caregiver' && !ctx.hasCaregiver(id)) return home;
  return null;
}
