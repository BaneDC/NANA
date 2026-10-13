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
import { useKept } from '@/hooks/use-kept';
import AccountCard from '../components/AccountCard';
import CookieSettings from '../components/CookieSettings';
import TwoFactorSetup, { TwoFactorDisable } from '../components/TwoFactorSetup';
import { Field, Password } from '../components/TextField';
import { chargingVisit, heldNow, linkCard, money, visitCharge } from '../data/familyCare';
import { COOKIE_DEFAULT, COOKIE_GROUPS } from '../data/cookies';
import { changePassword, hashBackupCodes } from '../lib/account';
import { priceLine, renewsOn } from '../data/plans';
import { LANGUAGES, setLang, t, tn, useLang } from '../i18n';


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
function PasswordModal({ open = true, email, onDone, onClose }) {
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
        ? t('Trenutna lozinka nije tačna.')
        : fault === 'no-account'
          ? t('Nalog nije pronađen na ovom uređaju.')
          : t('Nije sačuvano - proverite da li je čuvanje podataka dozvoljeno u pregledaču.')
    );
  };

  if (done) {
    return (
      <Dialog eyebrow={t('Nalog')} title={t('Lozinka je promenjena')} open={open} onClose={onDone}>
        <DialogDescription>
          {t('Od sledeće prijave koristite novu lozinku. Ako ste je negde sačuvali, promenite je i tamo.')}
        </DialogDescription>
        <DialogFooter>
          <Button onClick={onDone}>{t('U redu')}</Button>
        </DialogFooter>
      </Dialog>
    );
  }

  return (
    <Dialog eyebrow={t('Nalog')} title={t('Promenite lozinku')} open={open} onClose={onClose}>
      <DialogDescription>{t('Nova lozinka mora imati najmanje 8 karaktera.')}</DialogDescription>
      {/* a real form, so the browser's password manager can offer and update it */}
      <form className="contents" onSubmit={(e) => (e.preventDefault(), ready && submit())}>
        <div className="flex flex-col gap-3">
          <Field label={t('Trenutna lozinka')}>
            <Password
              value={current}
              onChange={(v) => {
                setCurrent(v);
                setError(null);
              }}
            />
          </Field>
          <Field label={t('Nova lozinka')} hint={short ? t('Kratka je - treba najmanje 8 karaktera.') : null}>
            <Password value={next} onChange={setNext} autoComplete="new-password" />
          </Field>
          <Field label={t('Nova lozinka još jednom')} hint={mismatch ? t('Dva unosa se ne poklapaju.') : null}>
            <Password value={again} onChange={setAgain} autoComplete="new-password" />
          </Field>
        </div>

        {error && <p className="text-center text-xs leading-body text-destructive">{error}</p>}

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            {t('Otkaži')}
          </Button>
          <Button type="submit" disabled={!ready}>
            {t('Sačuvaj lozinku')}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}

export default function Settings({ unlocked, subscription, care, user, onCare, onSaveUser, onSubscribe }) {
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
  // the dialogs that hold a form stay mounted while they close, then start
  // over the next time (useKept)
  const keptCookies = useKept(cookiesOpen);
  const keptPassword = useKept(passwordOpen);
  const keptTwoFactor = useKept(twoFactorOpen);
  const keptTwoFactorOff = useKept(twoFactorOff);

  const cookies = user?.cookies || COOKIE_DEFAULT;
  const twoFactor = Boolean(user?.twoFactor);
  const language = useLang();

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

  // Five groups, each under its own title, in the order people come looking:
  // who they are, what they pay, how the account is kept safe, how the app talks to them, and
  // what is kept about them.
  return (
    <Page>
      <PageHeader>
        <PageHeaderText>
          <PageTitle>{t('Podešavanja')}</PageTitle>
          <PageDescription>{t('Nalog, plaćanje, bezbednost, jezik i obaveštenja, privatnost.')}</PageDescription>
        </PageHeaderText>
      </PageHeader>

      <PageSection title={t('Nalog')}>
        <AccountCard user={user} onSave={onSaveUser} />
      </PageSection>

      <PageSection title={t('Plaćanje')}>
        {/* Started and stopped from here. It used to be startable only from the
            dialog on the care plan, which is where somebody runs into the
            paywall — not where they go looking for what they pay for. */}
        <Card>
          <CardHeader>
            <CardTitle>{t('Pretplata')}</CardTitle>
            <CardAction>
              <Badge variant={unlocked && !cancelled ? 'success' : 'secondary'}>
                {unlocked ? (cancelled ? t('Otkazana') : t('Aktivna')) : t('Niste pretplaćeni')}
              </Badge>
            </CardAction>
          </CardHeader>
          {unlocked ? (
            <>
              <CheckList>
                <li>
                  <Check size={12} strokeWidth={2.5} /> {t('Kontakti negovateljica')}
                </li>
                <li>
                  <Check size={12} strokeWidth={2.5} /> {t('Pregledi i pomagala kod partnera, do 10% jeftinije')}
                </li>
              </CheckList>
              <CardDescription>
                {cancelled
                  ? t('Otkazali ste pretplatu. Važi do {date}, a posle toga se ne obnavlja.', { date: until })
                  : priceLine(user?.country, subscription?.planId) + ' · ' + t('obnavlja se {date}', { date: until })}
              </CardDescription>
              {/* What adds or changes something is primary; what switches
                  something off or cancels it is not — orange is what we
                  recommend, and we do not recommend this. It asks first. */}
              <CardFooter>
                {cancelled ? (
                  <Button onClick={() => onSubscribe?.('resume')}>{t('Obnovi pretplatu')}</Button>
                ) : (
                  <Button variant="secondary" onClick={() => setCancelling(true)}>
                    {t('Otkaži pretplatu')}
                  </Button>
                )}
              </CardFooter>
            </>
          ) : (
            <>
              <CardDescription>
                {t('Otključava kontakte negovateljica i preglede i pomagala kod partnera, do 10% jeftinije.')}
                {' '}
                {priceLine(user?.country)}.
              </CardDescription>
              <CardFooter>
                <Button onClick={onSubscribe}>{t('Pretplatite se')}</Button>
              </CardFooter>
            </>
          )}
        </Card>
        {/* Set up once and then never thought about again, which is exactly why
            it belongs here and not on the dashboard. */}
        <Card>
          <CardHeader>
            <CardTitle>{t('Način plaćanja')}</CardTitle>
            <CardAction>
              {payment.connected ? (
                <Badge variant="success">
                  <ShieldCheck size={12} strokeWidth={2} />
                  {payment.brand} ···· {payment.last4}
                </Badge>
              ) : (
                <Badge variant="destructive">{t('Nije podešeno')}</Badge>
              )}
            </CardAction>
          </CardHeader>

          {payment.connected ? (
            <>
              <CardDescription>
                {t(
                  'Dodato {date}. Svaka poseta se naplaćuje 24 sata pošto negovateljica pošalje izveštaj - od vas se ništa ne traži, a u tom roku naplatu možete da zaustavite sa stranice Moja nega.',
                  { date: payment.connectedOn }
                )}
              </CardDescription>
              <DataList className="mt-2">
                <DataRow label={t('Rezervisano za zakazane posete')}>{money(heldNow(care))}</DataRow>
                <DataRow label={t('Naplaćuje se sada')}>
                  {charging
                    ? t('{amount} · za {hours} h', { amount: money(visitCharge(charging)), hours: charging.chargesInHours })
                    : t('Ništa')}
                </DataRow>
              </DataList>
              <CardFooter>
                <Button variant="secondary" onClick={() => setCardOpen(true)}>
                  {t('Promeni karticu')}
                </Button>
              </CardFooter>
            </>
          ) : (
            <>
              <CardDescription>
                {t(
                  'Posete se plaćaju automatski, pa kartica mora biti sačuvana pre nego što se ijedna zakaže. Dodaje se preko Stripe-a - mi nikad ne vidimo broj.'
                )}
              </CardDescription>
              <CardFooter>
                <Button onClick={() => setCardOpen(true)}>{t('Dodaj karticu')}</Button>
              </CardFooter>
            </>
          )}
        </Card>
      </PageSection>

      <PageSection title={t('Bezbednost')}>
        <Card>
          <CardHeader>
            <CardTitle>{t('Lozinka')}</CardTitle>
          </CardHeader>
          <CardDescription>{t('Promenite lozinku kojom se prijavljujete.')}</CardDescription>
          <CardFooter>
            <Button variant="secondary" onClick={() => setPasswordOpen(true)}>
              {t('Promenite lozinku')}
            </Button>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t('Dvofaktorska prijava')}</CardTitle>
            <CardAction>
              <Badge variant={twoFactor ? 'success' : 'secondary'}>{twoFactor ? t('Uključena') : t('Isključena')}</Badge>
            </CardAction>
          </CardHeader>
          <CardDescription>
            {t('Uz lozinku traži se i šestocifreni kod iz aplikacije na vašem telefonu.')}
            {twoFactor && user?.backupCodesLeft
              ? ' ' + t('Ostalo vam je {codes}.', {
                  codes: tn(user.backupCodesLeft, 'rezervni kod', 'rezervna koda', 'rezervnih kodova'),
                })
              : ''}
          </CardDescription>
          <CardFooter>
            {twoFactor ? (
              <Button variant="secondary" onClick={() => setTwoFactorOff(true)}>
                {t('Isključi')}
              </Button>
            ) : (
              <Button onClick={() => setTwoFactorOpen(true)}>{t('Uključi')}</Button>
            )}
          </CardFooter>
        </Card>
      </PageSection>

      <PageSection title={t('Opšte')}>
        {/* Language, cookies and the second factor: the account's own settings,
            the three the old platform kept together. */}
        <Card>
          <CardHeader>
            <CardTitle>{t('Jezik')}</CardTitle>
          </CardHeader>
          <CardDescription>{t('Jezik aplikacije i poruka koje vam šaljemo.')}</CardDescription>
          {/* one is always chosen: pressing the chosen one again does nothing */}
          <ToggleGroup type="single" value={language} onValueChange={(id) => {
              if (!id) return;
              setLang(id);
              onSaveUser({ language: id });
            }}>
            {LANGUAGES.map((l) => (
              <ToggleGroupItem key={l.id} value={l.id}>
                {l.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Card>
        <Card>
          <CardTitle>{t('Obaveštenja')}</CardTitle>
          <div className="flex flex-col">
            <Toggle
              label={t('Mesečni pregled')}
              hint={t('Jednom mesečno, kratak pregled poseta tog meseca')}
              on={prefs.digest}
              onChange={set('digest')}
            />
            <Toggle
              label={t('Novosti')}
              hint={t('Povremene vesti o NANA Prime')}
              on={prefs.marketing}
              onChange={set('marketing')}
            />
          </div>
        </Card>
      </PageSection>

      <PageSection title={t('Privatnost')}>
        <Card>
          <CardHeader>
            <CardTitle>{t('Kolačići')}</CardTitle>
          </CardHeader>
          <CardDescription>{t('Izaberite koje kolačiće dozvoljavate. Izbor važi i za nanaprime.com.')}</CardDescription>
          {/* Every group and where it stands, in words. Rows rather than chips:
              a chip here is the same shape as the ones that are pressed
              elsewhere, and this is a reading of the state, not a control. */}
          <DataList className="mt-2">
            {COOKIE_GROUPS.map((g) => {
              const on = g.fixed || cookies[g.id];
              return (
                <DataRow key={g.id} label={t(g.label)} off={!on}>
                  {on ? t('Uključeno') : t('Isključeno')}
                  {g.fixed ? ' · ' + t('uvek') : ''}
                </DataRow>
              );
            })}
          </DataList>
          <CardFooter>
            <Button onClick={() => setCookiesOpen(true)}>{t('Podešavanja kolačića')}</Button>
          </CardFooter>
        </Card>
      </PageSection>

      {keptCookies && (
        <CookieSettings
          open={cookiesOpen}
          cookies={cookies}
          onSave={(next) => {
            onSaveUser({ cookies: next });
            setCookiesOpen(false);
          }}
          onClose={() => setCookiesOpen(false)}
        />
      )}

      <Dialog eyebrow={t('Pretplata')} title={t('Otkazati pretplatu?')} open={cancelling} onClose={() => setCancelling(false)}>
        <DialogDescription>
          {t(
            'Plan nege vam ostaje, ali brojevi negovateljica i pune preporuke se zatvaraju na kraju plaćenog perioda. Možete da se pretplatite ponovo kad god želite.'
          )}
        </DialogDescription>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setCancelling(false)}>
            {t('Zadrži pretplatu')}
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              setCancelling(false);
              onSubscribe?.(false);
            }}
          >
            {t('Otkaži pretplatu')}
          </Button>
        </DialogFooter>
      </Dialog>

      {keptPassword && (
        <PasswordModal
          open={passwordOpen}
          email={user?.email}
          onDone={() => setPasswordOpen(false)}
          onClose={() => setPasswordOpen(false)}
        />
      )}

      {keptTwoFactor && (
        <TwoFactorSetup
          open={twoFactorOpen}
          email={user?.email}
          onDone={(codes, secret) => {
            // The codes are kept only hashed, as the password is, so signing in
            // can take one instead of the app's code (lib/account). The secret
            // is kept so signing in and turning it off can ask for a code —
            // prototype only; a real build never lets it back to the client.
            // one save, once they are hashed (a few milliseconds)
            hashBackupCodes(codes).then((backupCodeHashes) =>
              onSaveUser({ twoFactor: true, twoFactorSecret: secret, backupCodesLeft: codes.length, backupCodeHashes })
            );
            setTwoFactorOpen(false);
          }}
          onClose={() => setTwoFactorOpen(false)}
        />
      )}

      {keptTwoFactorOff && (
        <TwoFactorDisable
          open={twoFactorOff}
          secret={user?.twoFactorSecret}
          onDone={() => {
            onSaveUser({ twoFactor: false, twoFactorSecret: null, backupCodesLeft: 0, backupCodeHashes: [] });
            setTwoFactorOff(false);
          }}
          onClose={() => setTwoFactorOff(false)}
        />
      )}

      <Dialog eyebrow={t('Plaćanje')} title={t('Dodajte karticu')} open={cardOpen} onClose={() => setCardOpen(false)}>
        <DialogDescription>
          {t(
            'Kartice čuva Stripe, ne mi - broj unosite na njihovoj stranici i mi ga nikad ne vidimo. Kad je sačuvana, posete se naplaćuju automatski i više vas ništa ne pitamo.'
          )}
        </DialogDescription>
        <CheckList>
          <li>
            <Check size={12} strokeWidth={2.5} /> {t('Naplata 24 sata posle svakog izveštaja o poseti')}
          </li>
          <li>
            <Check size={12} strokeWidth={2.5} /> {t('Ništa se ne uzima pre nego što se poseta obavi')}
          </li>
          <li>
            <Check size={12} strokeWidth={2.5} /> {t('U tom roku možete da zaustavite svaku naplatu')}
          </li>
        </CheckList>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setCardOpen(false)}>
            {t('Otkaži')}
          </Button>
          <Button onClick={connect}>{t('Nastavi na Stripe')}</Button>
        </DialogFooter>
      </Dialog>
    </Page>
  );
}
