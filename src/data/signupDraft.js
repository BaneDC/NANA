// A caregiver's application, kept in this browser until it is sent, so she
// carries on where she stopped: after a reload, or a closed browser (decided
// 12. 11.; on production a link by mail does it for a week, so a week here).
// { screen, reached, chosen, f, account, open, done, sent }; `chosen` is the
// market she picked herself on the account, null when it came from a link or
// her language

const KEY = 'nana.signup.caregiver';
export const DRAFT_DAYS = 7;
const LIFE = DRAFT_DAYS * 24 * 3600 * 1000;

export function saveDraft(draft, now = Date.now()) {
  // sent: nothing left to carry on with, and the next one starts afresh
  if (draft.sent) return clearDraft();
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...draft, savedAt: now }));
  } catch {
    // not kept: a reload starts her over, as before
  }
}

export function loadDraft(now = Date.now()) {
  try {
    const d = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (!d) return null;
    if (!(now - d.savedAt <= LIFE)) {
      localStorage.removeItem(KEY);
      return null;
    }
    return d;
  } catch {
    return null;
  }
}

export function clearDraft() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // nothing kept to clear
  }
}
