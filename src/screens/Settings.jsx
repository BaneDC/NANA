import { useState } from 'react';
import { Check, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Page, PageHeader, PageHeaderText, PageTitle, PageDescription, PageSection } from '@/components/page';
import { CheckList, DataList, DataRow } from '@/components/data-list';
import Dialog from '../components/Dialog';
import AskAssistant from '../components/AskAssistant';
import CookieSettings from '../components/CookieSettings';
import TwoFactorSetup, { TwoFactorDisable } from '../components/TwoFactorSetup';
import { Field, Password } from '../components/TextField';
import { chargingVisit, heldNow, linkCard, money, visitCharge } from '../data/familyCare';
import { COOKIE_DEFAULT, COOKIE_GROUPS } from '../data/cookies';
import { changePassword } from '../lib/account';
import { priceLine, renewsOn } from '../data/plans';

// What the account remembers besides the person: kept on the user record, so
// signing back in finds it as it was left.
const LANGUAGES = [
  { id: 'sr', label: 'Srpski' },
  { id: 'en', label: 'English' },
  { id: 'fi', label: 'Suomi' },
];

// A setting that is on or off: the whole row is its label, so a click anywhere
// on it switches; the name, what it does under it, the switch right.
function Toggle({ label, hint, on, onChange }) {
  return (
    <label className="flex w-full cursor-pointer items-center gap-4 border-b py-3 last:border-b-0">
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-xs font-medium text-foreground">{label}</span>
        <span className="text-xs leading-body text-muted-foreground">{hint}</span>
      </span>
      <Switch checked={on} onCheckedChange={onChange} />
    </label>
  );
}

// Changing the password. The current one has to check out, the new one is
// typed twice, and neither leaves this dialog: `changePassword` compares and
// stores hashes (see lib/account).
function PasswordModal({ email, onDone, onClose }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [again, setAgain] = useState('');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const short = next.length > 0 && next.length < 8;
  const mismatch = again.length > 0 && next !== again;
  const ready = current && next.length >= 8 && next === again && !saving;

  const submit = async () => {
    setSaving(true);
    const fault = await changePassword(email, current, next);
    setSaving(false);
    if (!fault) return setDone(true);
    setError(
      fault === 'wrong-current'
        ? 'Trenutna lozinka nije tačna.'
        : fault === 'no-account'
          ? 'Nalog nije pronađen na ovom uređaju.'
          : 'Nije sačuvano - proverite da li je čuvanje podataka dozvoljeno u pregledaču.'
    );
  };

  if (done) {
    return (
      <Dialog eyebrow="Nalog" title="Lozinka je promenjena" onClose={onDone}>
        <DialogDescription>
          Od sledeće prijave koristite novu lozinku. Ako ste je negde sačuvali, promenite je i tamo.
        </DialogDescription>
        <DialogFooter>
          <Button onClick={onDone}>U redu</Button>
        </DialogFooter>
      </Dialog>
    );
  }

  return (
    <Dialog eyebrow="Nalog" title="Promenite lozinku" onClose={onClose}>
      <DialogDescription>Nova lozinka mora imati najmanje 8 karaktera.</DialogDescription>
      <div className="flex flex-col gap-3">
        <Field label="Trenutna lozinka">
          <Password
            value={current}
            onChange={(v) => {
              setCurrent(v);
              setError(null);
            }}
          />
        </Field>
        <Field label="Nova lozinka" hint={short ? 'Kratka je - treba najmanje 8 karaktera.' : null}>
          <Password value={next} onChange={setNext} autoComplete="new-password" />
        </Field>
        <Field label="Nova lozinka još jednom" hint={mismatch ? 'Dva unosa se ne poklapaju.' : null}>
          <Password value={again} onChange={setAgain} autoComplete="new-password" />
        </Field>
      </div>

      {error && <p className="text-center text-xs leading-body text-destructive">{error}</p>}

      <DialogFooter>
        <Button variant="secondary" onClick={onClose}>
          Otkaži
        </Button>
        <Button disabled={!ready} onClick={submit}>
          Sačuvaj lozinku
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

export default function Settings({ unlocked, subscription, care, user, onCare, onSaveUser, onAskAssistant, onSubscribe }) {
  const [prefs, setPrefs] = useState({
    digest: false,
    marketing: false,
  });
  const set = (key) => (v) => setPrefs((p) => ({ ...p, [key]: v }));
  const [cardOpen, setCardOpen] = useState(false);
  const [cookiesOpen, setCookiesOpen] = useState(false);
  const [twoFactorOpen, setTwoFactorOpen] = useState(false);
  const [twoFactorOff, setTwoFactorOff] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const cookies = user?.cookies || COOKIE_DEFAULT;
  const twoFactor = Boolean(user?.twoFactor);
  const language = user?.language || 'sr';

  const { payment } = care;
  const charging = chargingVisit(care);

  // No card details are collected here, and none should be: this is where a
  // real build hands off to Stripe and gets a token back.
  const connect = () => {
    onCare(linkCard);
    setCardOpen(false);
  };
  // cancelled, it still runs to the end of the period already paid
  const cancelled = Boolean(subscription?.cancelled);
  const until = subscription ? renewsOn(user?.country, subscription.planId, subscription.at ?? Date.now()) : '';

  // Four groups, each under its own title, in the order people come looking:
  // what they pay, how the account is kept safe, how the app talks to them, and
  // what is kept about them.
  return (
    <Page>
      <PageHeader>
        <PageHeaderText>
          <PageTitle>Podešavanja</PageTitle>
          <PageDescription>Plaćanje, bezbednost, jezik i obaveštenja, privatnost.</PageDescription>
        </PageHeaderText>
        <AskAssistant onClick={onAskAssistant} />
      </PageHeader>

      <PageSection title="Plaćanje">
        {/* Started and stopped from here. It used to be startable only from the
            dialog on the care plan, which is where somebody runs into the
            paywall — not where they go looking for what they pay for. */}
        <Card>
          <CardHeader>
            <CardTitle>Pretplata</CardTitle>
            <CardAction>
              <Badge variant={unlocked && !cancelled ? 'success' : 'secondary'}>
                {unlocked ? (cancelled ? 'Otkazana' : 'Aktivna') : 'Niste pretplaćeni'}
              </Badge>
            </CardAction>
          </CardHeader>
          {unlocked ? (
            <>
              <CheckList>
                <li>
                  <Check size={12} strokeWidth={2.5} /> Kontakti negovateljica
                </li>
                <li>
                  <Check size={12} strokeWidth={2.5} /> Pregledi i pomagala kod partnera, do 10% jeftinije
                </li>
              </CheckList>
              <CardDescription>
                {cancelled
                  ? `Otkazali ste pretplatu. Važi do ${until}, a posle toga se ne obnavlja.`
                  : `${priceLine(user?.country, subscription?.planId)} · obnavlja se ${until}`}
              </CardDescription>
              {/* What adds or changes something is primary; what switches
                  something off or cancels it is not — orange is what we
                  recommend, and we do not recommend this. It asks first. */}
              <CardFooter>
                {cancelled ? (
                  <Button onClick={() => onSubscribe?.('resume')}>Obnovi pretplatu</Button>
                ) : (
                  <Button variant="secondary" onClick={() => setCancelling(true)}>
                    Otkaži pretplatu
                  </Button>
                )}
              </CardFooter>
            </>
          ) : (
            <>
              <CardDescription>
                Otključava kontakte negovateljica i preglede i pomagala kod partnera, do 10% jeftinije.
                {' '}
                {priceLine(user?.country)}.
              </CardDescription>
              <CardFooter>
                <Button onClick={onSubscribe}>Pretplatite se</Button>
              </CardFooter>
            </>
          )}
        </Card>
        {/* Set up once and then never thought about again, which is exactly why
            it belongs here and not on the dashboard. */}
        <Card>
          <CardHeader>
            <CardTitle>Način plaćanja</CardTitle>
            <CardAction>
              {payment.connected ? (
                <Badge variant="success">
                  <ShieldCheck size={12} strokeWidth={2} />
                  {payment.brand} ···· {payment.last4}
                </Badge>
              ) : (
                <Badge variant="destructive">Nije podešeno</Badge>
              )}
            </CardAction>
          </CardHeader>

          {payment.connected ? (
            <>
              <CardDescription>
                Dodato {payment.connectedOn}. Svaka poseta se naplaćuje 24 sata pošto negovateljica
                pošalje izveštaj - od vas se ništa ne traži, a u tom roku naplatu možete da zaustavite
                sa stranice Moja nega.
              </CardDescription>
              <DataList className="mt-2">
                <DataRow label="Rezervisano za zakazane posete">{money(heldNow(care))}</DataRow>
                <DataRow label="Naplaćuje se sada">
                  {charging ? `${money(visitCharge(charging))} · za ${charging.chargesInHours} h` : 'Ništa'}
                </DataRow>
              </DataList>
              <CardFooter>
                <Button variant="secondary" onClick={() => setCardOpen(true)}>
                  Promeni karticu
                </Button>
              </CardFooter>
            </>
          ) : (
            <>
              <CardDescription>
                Posete se plaćaju automatski, pa kartica mora biti sačuvana pre nego što se ijedna zakaže.
                Dodaje se preko Stripe-a - mi nikad ne vidimo broj.
              </CardDescription>
              <CardFooter>
                <Button onClick={() => setCardOpen(true)}>Dodaj karticu</Button>
              </CardFooter>
            </>
          )}
        </Card>
      </PageSection>

      <PageSection title="Bezbednost">
        <Card>
          <CardHeader>
            <CardTitle>Lozinka</CardTitle>
          </CardHeader>
          <CardDescription>Promenite lozinku kojom se prijavljujete.</CardDescription>
          <CardFooter>
            <Button variant="secondary" onClick={() => setPasswordOpen(true)}>
              Promenite lozinku
            </Button>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Dvofaktorska prijava</CardTitle>
            <CardAction>
              <Badge variant={twoFactor ? 'success' : 'secondary'}>{twoFactor ? 'Uključena' : 'Isključena'}</Badge>
            </CardAction>
          </CardHeader>
          <CardDescription>
            Uz lozinku traži se i šestocifreni kod iz aplikacije na vašem telefonu.
            {twoFactor && user?.backupCodesLeft
              ? ` Ostalo vam je ${user.backupCodesLeft} rezervnih kodova.`
              : ''}
          </CardDescription>
          <CardFooter>
            {twoFactor ? (
              <Button variant="secondary" onClick={() => setTwoFactorOff(true)}>
                Isključi
              </Button>
            ) : (
              <Button onClick={() => setTwoFactorOpen(true)}>Uključi</Button>
            )}
          </CardFooter>
        </Card>
      </PageSection>

      <PageSection title="Opšte">
        {/* Language, cookies and the second factor: the account's own settings,
            the three the old platform kept together. */}
        <Card>
          <CardHeader>
            <CardTitle>Jezik</CardTitle>
          </CardHeader>
          <CardDescription>Jezik aplikacije i poruka koje vam šaljemo.</CardDescription>
          {/* one is always chosen: pressing the chosen one again does nothing */}
          <ToggleGroup type="single" value={language} onValueChange={(id) => id && onSaveUser({ language: id })}>
            {LANGUAGES.map((l) => (
              <ToggleGroupItem key={l.id} value={l.id}>
                {l.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          {language !== 'sr' && (
            <p className="text-small text-muted-foreground">Prevod još nije napravljen - za sada je izbor samo zapamćen.</p>
          )}
        </Card>
        <Card>
          <CardTitle>Obaveštenja</CardTitle>
          <div className="flex flex-col">
            <Toggle
              label="Mesečni pregled"
              hint="Jednom mesečno, kratak pregled poseta tog meseca"
              on={prefs.digest}
              onChange={set('digest')}
            />
            <Toggle
              label="Novosti"
              hint="Povremene vesti o NANA Prime"
              on={prefs.marketing}
              onChange={set('marketing')}
            />
          </div>
        </Card>
      </PageSection>

      <PageSection title="Privatnost i nalog">
        <Card>
          <CardHeader>
            <CardTitle>Kolačići</CardTitle>
          </CardHeader>
          <CardDescription>Izaberite koje kolačiće dozvoljavate. Izbor važi i za nanaprime.com.</CardDescription>
          {/* Every group and where it stands, in words. Rows rather than chips:
              a chip here is the same shape as the ones that are pressed
              elsewhere, and this is a reading of the state, not a control. */}
          <DataList className="mt-2">
            {COOKIE_GROUPS.map((g) => {
              const on = g.fixed || cookies[g.id];
              return (
                <DataRow key={g.id} label={g.label} off={!on}>
                  {on ? 'Uključeno' : 'Isključeno'}
                  {g.fixed ? ' · uvek' : ''}
                </DataRow>
              );
            })}
          </DataList>
          <CardFooter>
            <Button onClick={() => setCookiesOpen(true)}>Podešavanja kolačića</Button>
          </CardFooter>
        </Card>
        <Card>
          <CardTitle>Nalog</CardTitle>
          <CardDescription>Preuzmite sve što čuvamo o vama, ili zatvorite nalog i obrišite ga.</CardDescription>
          {/* Deleting is the one thing here that cannot be undone, so it is the
              one button that is red. */}
          <CardFooter>
            <Button variant="secondary">Preuzmi moje podatke</Button>
            <Button variant="destructive">Obriši nalog</Button>
          </CardFooter>
        </Card>
      </PageSection>

      {cookiesOpen && (
        <CookieSettings
          cookies={cookies}
          onSave={(next) => {
            onSaveUser({ cookies: next });
            setCookiesOpen(false);
          }}
          onClose={() => setCookiesOpen(false)}
        />
      )}

      {cancelling && (
        <Dialog eyebrow="Pretplata" title="Otkazati pretplatu?" onClose={() => setCancelling(false)}>
          <DialogDescription>
            Plan nege vam ostaje, ali brojevi negovateljica i pune preporuke se zatvaraju na kraju
            plaćenog perioda. Možete da se pretplatite ponovo kad god želite.
          </DialogDescription>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setCancelling(false)}>
              Zadrži pretplatu
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setCancelling(false);
                onSubscribe?.(false);
              }}
            >
              Otkaži pretplatu
            </Button>
          </DialogFooter>
        </Dialog>
      )}

      {passwordOpen && (
        <PasswordModal
          email={user?.email}
          onDone={() => setPasswordOpen(false)}
          onClose={() => setPasswordOpen(false)}
        />
      )}

      {twoFactorOpen && (
        <TwoFactorSetup
          email={user?.email}
          onDone={(codes, secret) => {
            // Of the codes, how many are left is the only thing worth keeping:
            // they belong on the server, hashed, not in the account here. The
            // secret is kept so turning it off can ask for a code — prototype
            // only; a real build never lets it back to the client.
            onSaveUser({ twoFactor: true, twoFactorSecret: secret, backupCodesLeft: codes.length });
            setTwoFactorOpen(false);
          }}
          onClose={() => setTwoFactorOpen(false)}
        />
      )}

      {twoFactorOff && (
        <TwoFactorDisable
          secret={user?.twoFactorSecret}
          onDone={() => {
            onSaveUser({ twoFactor: false, twoFactorSecret: null, backupCodesLeft: 0 });
            setTwoFactorOff(false);
          }}
          onClose={() => setTwoFactorOff(false)}
        />
      )}

      {cardOpen && (
        <Dialog eyebrow="Plaćanje" title="Dodajte karticu" onClose={() => setCardOpen(false)}>
          <DialogDescription>
            Kartice čuva Stripe, ne mi - broj unosite na njihovoj stranici i mi ga nikad ne vidimo.
            Kad je sačuvana, posete se naplaćuju automatski i više vas ništa ne pitamo.
          </DialogDescription>
          <CheckList>
            <li>
              <Check size={12} strokeWidth={2.5} /> Naplata 24 sata posle svakog izveštaja o poseti
            </li>
            <li>
              <Check size={12} strokeWidth={2.5} /> Ništa se ne uzima pre nego što se poseta obavi
            </li>
            <li>
              <Check size={12} strokeWidth={2.5} /> U tom roku možete da zaustavite svaku naplatu
            </li>
          </CheckList>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setCardOpen(false)}>
              Otkaži
            </Button>
            <Button onClick={connect}>Nastavi na Stripe</Button>
          </DialogFooter>
        </Dialog>
      )}
    </Page>
  );
}
