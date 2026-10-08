// Time-based one-time passwords, the way every authenticator app expects them:
// RFC 6238 over RFC 4226, on a RFC 4648 base32 secret, SHA-1, six digits, a
// thirty second step. Those are not our choices — Google Authenticator, Authy
// and 1Password all assume them, and a secret that deviates silently fails to
// verify on the phone with nothing on screen to say why.
//
// PROTOTYPE: the secret lives in this browser and the check runs here, because
// there is no server yet. In a real build the secret never reaches the client
// after setup and the check happens where the session is issued.

const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function toBase32(bytes) {
  let bits = 0;
  let value = 0;
  let out = '';
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += B32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}

function fromBase32(secret) {
  const clean = secret.replace(/[\s=]/g, '').toUpperCase();
  let bits = 0;
  let value = 0;
  const out = [];
  for (const ch of clean) {
    const i = B32.indexOf(ch);
    if (i < 0) continue;
    value = (value << 5) | i;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return new Uint8Array(out);
}

// 160 bits, which is what RFC 4226 recommends and what every app handles.
export const newSecret = () => toBase32(crypto.getRandomValues(new Uint8Array(20)));

// What the QR encodes. The label carries the issuer twice — once in the path,
// once as a parameter — because older apps read only one of the two.
export const otpauthUrl = ({ secret, account, issuer = 'NANA Prime' }) =>
  `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account || 'nalog')}` +
  `?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;

async function codeAt(secret, counter) {
  const key = await crypto.subtle.importKey(
    'raw',
    fromBase32(secret),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  const message = new ArrayBuffer(8);
  // the counter is 64 bit; the high half stays zero for the next few millennia
  new DataView(message).setUint32(4, counter);
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, message));
  const offset = mac[mac.length - 1] & 0x0f;
  const binary =
    ((mac[offset] & 0x7f) << 24) |
    (mac[offset + 1] << 16) |
    (mac[offset + 2] << 8) |
    mac[offset + 3];
  return String(binary % 1000000).padStart(6, '0');
}

// The code the app shows right now, for the test account's hint on the sign-in
// screen (data/demoCase): nobody types a real secret into an authenticator to try it.
export const currentCode = (secret, at = Date.now()) => codeAt(secret, Math.floor(at / 30000));

// One step either side of now, as every server allows: phone clocks drift, and
// a code typed as the window turns over would otherwise be rejected.
export async function verifyCode(secret, entered, at = Date.now()) {
  const typed = String(entered).replace(/\D/g, '');
  if (typed.length !== 6) return false;
  const counter = Math.floor(at / 30000);
  for (const c of [counter - 1, counter, counter + 1]) {
    // eslint-disable-next-line no-await-in-loop
    if ((await codeAt(secret, c)) === typed) return true;
  }
  return false;
}

// Ten single-use codes, for the day the phone is lost. Eight hex characters
// each, the way the platform already prints them.
export const newBackupCodes = (count = 10) =>
  Array.from({ length: count }, () =>
    [...crypto.getRandomValues(new Uint8Array(4))].map((b) => b.toString(16).padStart(2, '0')).join('')
  );
