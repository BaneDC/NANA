// The account, kept in this browser: there is no backend yet, and signing in
// again has to bring back everything the family gave at registration. The
// password is kept only as a hash, never as typed.

const KEY = 'nana.account';

async function hash(text) {
  const bytes = new TextEncoder().encode(`nana:${text}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function saveAccount(user, password) {
  const record = { user, passwordHash: await hash(password) };
  try {
    localStorage.setItem(KEY, JSON.stringify(record));
  } catch {
    // private window or blocked storage: the session still works, it just is not remembered
  }
  return user;
}

// The account's own fields, changed from the profile. The password is not
// touched: it is only ever here as a hash.
export function updateAccount(user) {
  try {
    const record = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (record) localStorage.setItem(KEY, JSON.stringify({ ...record, user }));
  } catch {
    // not remembered, as above
  }
}

export async function signIn(email, password) {
  let record = null;
  try {
    record = JSON.parse(localStorage.getItem(KEY) || 'null');
  } catch {
    record = null;
  }
  if (!record || record.user.email.toLowerCase() !== email.trim().toLowerCase()) return null;
  return record.passwordHash === (await hash(password)) ? record.user : null;
}

// How far the family got, kept with the account: the answers and notes the plan
// is built from, and whether the onboarding finished. Signing back in picks up
// from there, so a finished onboarding is never run again.
const progressKey = (email) => `nana.progress.${email.trim().toLowerCase()}`;

export function saveProgress(email, progress) {
  if (!email) return;
  try {
    localStorage.setItem(progressKey(email), JSON.stringify(progress));
  } catch {
    // not remembered, as above
  }
}

export function loadProgress(email) {
  try {
    return JSON.parse(localStorage.getItem(progressKey(email)) || 'null');
  } catch {
    return null;
  }
}
