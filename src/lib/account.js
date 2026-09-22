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
