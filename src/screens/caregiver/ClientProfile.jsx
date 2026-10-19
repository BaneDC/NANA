import { Page, PageDescription, PageHeader, PageHeaderText, PagePerson, PageTitle } from '@/components/page';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Fact, Facts } from '@/components/data-list';
import BackButton from '../../components/BackButton';
import Attention from '../../components/Attention';
import FrailtyScale from '../../components/FrailtyScale';
import Tags from '../../components/Tags';
import { PersonRows } from '../../components/PlanFooterBlocks';
import { ServiceChips } from '../../components/family/FamilyDrawer';
import { firstName } from '../../data/familyCare';
import { scheduleText } from '../../data/familyStart';
import { RECORD_PARTS, alertsOf, partRows } from '../../data/record';
import { t } from '@/i18n';

// A family from her side in Serbia (docs/superpowers/specs/2026-10-19-negovateljica-srbija-design.md):
// who the person is and what she needs, read from the family's answers and
// their medical record, nothing written twice. Their contact shows once she
// has said yes; until then the request waits at the top.
const initials = (name) =>
  (name || '')
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

function Part({ title, children }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      {children}
    </Card>
  );
}

export default function ClientProfile({ client, onBack, act }) {
  const { person, care, request: r } = client;
  const answers = person.answers || {};
  const yes = r?.status === 'accepted';
  const age = answers['about-person']?.values?.age;
  const rows = (part) =>
    partRows(part, answers).rows.map((x) => (
      <Fact key={x.key} label={t(x.label)}>
        {x.value}
      </Fact>
    ));
  const contact = partRows(RECORD_PARTS.contact, answers).rows;

  return (
    <Page>
      <BackButton label={t('Upiti')} onClick={onBack} />
      <PageHeader>
        <PagePerson className="[--avatar:48px]">
          <Avatar>
            <AvatarFallback>{initials(care.elder.name)}</AvatarFallback>
          </Avatar>
          <PageHeaderText>
            <PageTitle>{care.elder.name}</PageTitle>
            <PageDescription>{[age && t('{n} godina', { n: age }), care.elder.area].filter(Boolean).join(' · ')}</PageDescription>
          </PageHeaderText>
        </PagePerson>
      </PageHeader>

      {r?.status === 'pending' && (
        <Attention title={t('Čeka vaš odgovor')}>
          <Card>
            <CardDescription>{t('{name} vas pita da li možete da preuzmete negu.', { name: firstName(care.family.name || '') })}</CardDescription>
            <CardFooter>
              <Button onClick={() => act('accept', client)}>{t('Prihvati')}</Button>
              <Button variant="secondary" onClick={() => act('decline', client)}>
                {t('Odbij')}
              </Button>
            </CardFooter>
          </Card>
        </Attention>
      )}

      <div className="@container">
        <div className="grid grid-cols-2 items-start gap-3 @max-[672px]:grid-cols-1">
          <Part title={t('Osnovno')}>
            <Facts>{rows(RECORD_PARTS.person)}</Facts>
          </Part>
          <Part title={t('Kada je potrebna pomoć')}>
            <Facts>
              <Fact label={t('Raspored')}>{care.need?.schedule ? scheduleText(care.need.schedule) : '-'}</Fact>
              <Fact label={t('Sati')}>{care.need?.hours ? t('{hours} h nedeljno', { hours: care.need.hours }) : '-'}</Fact>
            </Facts>
          </Part>
          <Part title={t('Potrebne usluge')}>
            <ServiceChips ids={care.need?.services || []} grouped />
          </Part>
          <Part title={t('Zdravstveno stanje')}>
            <Tags items={alertsOf(answers, person.record)} />
            <FrailtyScale answers={answers} />
            <Facts>{rows(RECORD_PARTS.daily)}</Facts>
          </Part>
          <Part title={t('Kontakt porodice')}>
            {yes ? (
              <>
                <Facts>
                  <Fact label={t('Ime')}>{care.family.name}</Fact>
                  <Fact label={t('Adresa')}>{answers['about-person']?.values?.city || care.elder.area}</Fact>
                </Facts>
                {care.family.phone && <PersonRows phone={care.family.phone} email={care.family.email || ''} />}
              </>
            ) : (
              <CardDescription>{t('Kontakt vidite kad prihvatite upit.')}</CardDescription>
            )}
          </Part>
          {yes && (
            <Part title={t('Kontakt za hitne slučajeve')}>
              <Facts>
                {contact.map((x) => (
                  <Fact key={x.key} label={t(x.label)}>
                    {x.value}
                  </Fact>
                ))}
              </Facts>
            </Part>
          )}
        </div>
      </div>
    </Page>
  );
}
