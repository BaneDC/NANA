import { useState } from 'react';
import { Page, PageDescription, PageHeader, PageHeaderText, PagePerson, PageSection, PageTitle } from '@/components/page';
import { Card, CardAction, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Fact, Facts } from '@/components/data-list';
import { useKept } from '@/hooks/use-kept';
import Tags from '../../components/Tags';
import { AvailabilityForm, EmergencyForm, HealthForm, PersonalForm, ProfessionForm, QualificationsForm } from '../../components/caregiver/ProfileForms';
import { SLOTS, daysText, engagementText } from '../../data/carePlan';
import { DOCUMENTS, HABITS, HEALTH_QUESTIONS, PERSONAL, READINESS } from '../../data/caregiverProfile';
import { t } from '@/i18n';

// "Moj profil", laid out as Settings is: groups of cards, each saying what it
// holds as facts, with "Izmenite" opening its dialog (docs/superpowers/specs/2026-10-19-negovateljica-finska-design.md).
// What she saves is laid over her record (setProfiles), so the families' tab
// shows it at once. The picture, password, 2FA, language and cookies are in
// Settings, as for a family.
function Group({ title, onEdit, children }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {onEdit && (
          <CardAction>
            <Button variant="secondary" onClick={onEdit}>
              {t('Izmenite')}
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <Facts>{children}</Facts>
    </Card>
  );
}

export default function Profile({ caregiver, user, market, onSaveProfile }) {
  const c = { ...PERSONAL[caregiver.id], ...caregiver };
  const [form, setForm] = useState(null);
  const kept = useKept(form);
  const close = () => setForm(null);
  const save = (patch) => {
    onSaveProfile(patch);
    close();
  };
  const fi = market !== 'sr';
  return (
    <Page>
      <PageHeader>
        <PagePerson className="[--avatar:48px]">
          <Avatar>
            <AvatarFallback>{c.initials}</AvatarFallback>
          </Avatar>
          <PageHeaderText>
            <PageTitle>{c.name}</PageTitle>
            <PageDescription>{[c.area, c.rate].filter(Boolean).join(' · ')}</PageDescription>
          </PageHeaderText>
        </PagePerson>
      </PageHeader>

      {/* on or off, saved as it moves: the whole row is its label (§10) */}
      <Card>
        <label className="flex w-full cursor-pointer items-center gap-4">
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-xs font-medium text-foreground">{t('Primam nove upite')}</span>
            <span className="text-xs leading-body text-muted-foreground">
              {c.available === false ? t('Porodice vas sada ne vide na „Pronađi".') : t('Porodice vas vide na „Pronađi" i mogu da vam pišu.')}
            </span>
          </span>
          <Switch checked={c.available !== false} onCheckedChange={(on) => onSaveProfile({ available: on })} />
        </label>
      </Card>

      <PageSection title={t('O vama')}>
        <Group title={t('Lični podaci')} onEdit={() => setForm('personal')}>
          <Fact label={t('Ime')}>{c.name}</Fact>
          <Fact label={t('Datum rođenja')}>{c.birth || '-'}</Fact>
          <Fact label={t('Adresa')}>{c.address || '-'}</Fact>
          <Fact label={t('Opština')}>{c.area}</Fact>
          <Fact label={t('Telefon')}>{c.phone}</Fact>
          <Fact label={t('E-mail')} note={t('Menja se preko koordinatorke, jer je to vaše ime za prijavu.')}>
            {user.email}
          </Fact>
        </Group>
      </PageSection>

      <PageSection title={t('Posao')}>
        {!fi && (
          <Group title={t('Kvalifikacije')} onEdit={() => setForm('qualifications')}>
            <Fact label={t('Obrazovanje')}>{t(c.education)}</Fact>
            <Fact label={t('Sertifikat negovateljice')}>{c.certificate ? t('Da') : t('Ne')}</Fact>
            <Fact label={t('Kursevi')}>{c.courses ? t(c.courses) : '-'}</Fact>
            <Fact label={t('Iskustvo i veštine')}>{t(c.bio)}</Fact>
          </Group>
        )}
        {fi && (
        <Group title={t('Profesija')} onEdit={() => setForm('profession')}>
          {c.classifications.length > 0 && (
            <Fact label={t('Klasifikacije')}>
              <Tags items={c.classifications} />
            </Fact>
          )}
          <Fact label={t('Obrazovanje')}>{t(c.education)}</Fact>
          <Fact label={t('Jezici')}>{c.languages.map((l) => t(l)).join(', ')}</Fact>
          <Fact label={t('O sebi')}>{t(c.bio)}</Fact>
        </Group>
        )}
        <Group title={t('Dostupnost')} onEdit={() => setForm('availability')}>
          {c.engagement && <Fact label={t('Angažman')}>{engagementText(c).join(', ')}</Fact>}
          <Fact label={t('Dani')}>{daysText(c.days)}</Fact>
          <Fact label={t('Doba dana')}>{c.slots.map((s) => `${t(SLOTS[s].label).toLowerCase()} ${SLOTS[s].hours}`).join(', ')}</Fact>
          <Fact label={t('Radijus')}>{t('do {km} km', { km: c.radius })}</Fact>
          {fi && c.rate && <Fact label={t('Cena')}>{c.rate}</Fact>}
          {!fi && <Fact label={t('Rad u inostranstvu')}>{c.abroad ? t('Da') : t('Ne')}</Fact>}
        </Group>
        {!fi && (
          <Group title={t('Zdravlje i navike')} onEdit={() => setForm('health')}>
            {HABITS.map(([id, label]) => (
              <Fact key={id} label={t(label)}>
                {c.habits?.[id] ? t('Da') : t('Ne')}
              </Fact>
            ))}
            <Fact label={t('Jezici')}>{c.languages.map((l) => t(l)).join(', ')}</Fact>
            {HEALTH_QUESTIONS.map(([id, label]) => (
              <Fact key={id} label={t(label)}>
                {c.health?.[id] ? t('Da') : t('Ne')}
              </Fact>
            ))}
            <Fact label={t('Spremnost za rad')}>
              <Tags items={READINESS.filter(([id]) => c.readiness?.includes(id)).map(([, label]) => t(label))} />
            </Fact>
            <Fact label={t('Šta ne želite da radite')}>{c.unwilling || '-'}</Fact>
          </Group>
        )}
        {!fi && (
          <Group title={t('Kontakt za hitne slučajeve')} onEdit={() => setForm('emergency')}>
            <Fact label={t('Ime i prezime')}>{c.emergency?.name || '-'}</Fact>
            <Fact label={t('Srodstvo')}>{c.emergency?.relation ? t(c.emergency.relation) : '-'}</Fact>
            <Fact label={t('Telefon')}>{c.emergency?.phone || '-'}</Fact>
            <Fact label={t('Adresa')}>{c.emergency?.address || '-'}</Fact>
          </Group>
        )}
        {fi && c.classifications.some((k) => DOCUMENTS[k]) && (
          <Group title={t('Dokumenti')}>
            {c.classifications
              .filter((k) => DOCUMENTS[k])
              .map((k) => (
                <Fact key={k} label={k}>
                  <span className="flex flex-wrap items-center gap-2">
                    {DOCUMENTS[k]}
                    <Badge variant="success">{t('Provereno')}</Badge>
                  </span>
                </Fact>
              ))}
          </Group>
        )}
      </PageSection>

      {kept === 'personal' && <PersonalForm open={form === 'personal'} profile={c} onClose={close} onSave={save} />}
      {kept === 'profession' && <ProfessionForm open={form === 'profession'} profile={c} onClose={close} onSave={save} />}
      {kept === 'qualifications' && <QualificationsForm open={form === 'qualifications'} profile={c} onClose={close} onSave={save} />}
      {kept === 'health' && <HealthForm open={form === 'health'} profile={c} onClose={close} onSave={save} />}
      {kept === 'emergency' && <EmergencyForm open={form === 'emergency'} profile={c} onClose={close} onSave={save} />}
      {kept === 'availability' && <AvailabilityForm open={form === 'availability'} profile={c} market={market} onClose={close} onSave={save} />}
    </Page>
  );
}
