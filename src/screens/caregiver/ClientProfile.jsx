import { Page, PageDescription, PageHeader, PageHeaderText, PagePerson, PageSection, PageTitle } from '@/components/page';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Fact, Facts } from '@/components/data-list';
import { PaneLabel, Part as PanePart } from '@/components/pane';
import BackButton from '../../components/BackButton';
import Attention from '../../components/Attention';
import FrailtyScale from '../../components/FrailtyScale';
import { Group, Groups } from '../../components/Tags';
import { PersonRows } from '../../components/PlanFooterBlocks';
import { ServiceChips } from '../../components/family/FamilyDrawer';
import { dayLabel, firstName, lowerDate, todayOf } from '../../data/familyCare';
import { scheduleText } from '../../data/familyStart';
import { planOverview } from '../../data/carePlan.sr';
import { srShort } from '../../data/flow.sr';
import { STEP_TITLE, answerText, planQuestions } from '../../data/planEdits';
import { HEALTH } from '../../data/record';
import { t } from '@/i18n';

// A family from her side in Serbia (docs/superpowers/specs/2026-10-19-negovateljica-srbija-design.md):
// the overview the family got at the end of their conversation, told to her,
// then what is needed and when, the health their record holds, and every
// answer they gave, nothing written twice. One column, as the family's own
// overview: two columns of cards of unequal height left holes. Their contact
// shows once she has said yes; until then the request waits at the top.
const initials = (name) =>
  (name || '')
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

function Part({ label, children }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{label}</CardTitle>
      </CardHeader>
      {children}
    </Card>
  );
}

export default function ClientProfile({ client, backLabel, onBack, act }) {
  const { person, care, request: r } = client;
  const answers = person.answers || {};
  // A declined request opens the same page, contact hidden (decided 6. 11.,
  // as production does). TODO(pravnik): ask the lawyer whether she may still
  // see the family's health and answers once she has said no: they were
  // shared for her to decide, and that purpose is over (GDPR, purpose
  // limitation; Finland in particular). If not, a declined request shows
  // only "Ukratko" and "Šta je potrebno" without "Zdravstveno stanje", or
  // opens nothing again. Also in docs/patterns.md §12c.
  const no = r?.status === 'declined';
  const age = answers['about-person']?.values?.age;
  return (
    <Page>
      <BackButton label={backLabel || t('Upiti')} onClick={onBack} />
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

      {no && (
        <Card>
          <CardHeader>
            <CardTitle>{t('Odbili ste ovaj upit')}</CardTitle>
          </CardHeader>
          <Facts>
            <Fact label={t('Razlog')}>{t(r.detail)}</Fact>
            {r.answeredDay != null && <Fact label={t('Kada')}>{dayLabel(r.answeredDay, todayOf(care))}</Fact>}
          </Facts>
        </Card>
      )}

      <AboutFamily client={client} />
    </Page>
  );
}

// What she knows of a family, the same in Serbia and Finland, since both fill
// in the same AI conversation: the overview from its end, told to her; what is
// needed and when, and the health their record holds; every answer they gave,
// whatever the conversation asked; and their contact once she has said yes.
// Serbia's request page is this; Finland's family page has it under the visits
// and the terms (docs/patterns.md §12c).
// `pane`: in a drawer (Finland's "Pregled" on the family's page), where there
// are no cards: a part's name, dark, then what it holds under grey names
export function AboutFamily({ client, pane = false }) {
  const Section = pane ? PaneSection : PageSection;
  const Box = pane ? PanePart : Part;
  const Plain = pane ? PaneBlock : Card;
  const Sub = pane ? 'p' : CardDescription;
  const { person, care, request: r } = client;
  const answers = person.answers || {};
  // said yes: to the request, or (in Finland) working together already
  const yes = r?.status === 'accepted' || Boolean(client.arrangement);
  const no = r?.status === 'declined';
  const o = planOverview(answers, person.notes || [], { to: 'caregiver' });
  const health = HEALTH.filter((h) => person.record?.health?.[h.id]?.length);
  // the family's contact shows with "Kontakt porodice", after a yes; their
  // goal and worry are already in "Ukratko", told to her
  const own = ['about-you', 'family-goal'];
  const steps = planQuestions(answers)
    .map((s) => ({ ...s, questions: s.questions.filter(({ q }) => !own.includes(q.id)) }))
    .filter((s) => s.questions.length);

  return (
    <>
        <Section title={t('Ukratko')}>
          <Plain>
            <p className="text-sm text-foreground">{o.lead}</p>
            {o.story.map((p) => (
              <Sub key={p} className="text-xs leading-body text-muted-foreground">{p}</Sub>
            ))}
          </Plain>
          <FrailtyScale answers={answers} note={t('Procena je iz odgovora porodice. Nije dijagnoza i ne zamenjuje lekara.')} />
          {(o.risks.length > 0 || o.goal || o.notes.length > 0 || r?.message) && (
            <Plain>
              <Groups>
                {o.risks.length > 0 && (
                  <Group label={t('Na šta najviše treba paziti')}>
                    <ul className="flex list-disc flex-col gap-1 pl-4 text-xs leading-body text-foreground">
                      {o.risks.map((x) => (
                        <li key={x}>{x}</li>
                      ))}
                    </ul>
                  </Group>
                )}
                {o.goal && <Group label={t('Porodici je najvažnije')} text={o.goal} />}
                {o.worry && <Group label={t('Porodicu najviše brine')} text={o.worry} />}
                {o.notes.length > 0 && <Group label={t('Porodica je usput rekla')} text={o.notes.join(' ')} />}
                {r?.message && <Group label={t('Poruka porodice')} text={t(r.message)} />}
              </Groups>
            </Plain>
          )}
        </Section>

        <Section title={t('Šta je potrebno')}>
          <Box label={t('Kada je potrebna pomoć')}>
            <Facts>
              <Fact label={t('Raspored')}>{care.need?.schedule ? scheduleText(care.need.schedule) : '-'}</Fact>
              <Fact label={t('Sati')}>{care.need?.hours ? t('{hours} h nedeljno', { hours: care.need.hours }) : '-'}</Fact>
            </Facts>
          </Box>
          <Box label={t('Potrebne usluge')}>
            <ServiceChips ids={care.need?.services || []} grouped />
          </Box>
          {health.length > 0 && (
            <Box label={t('Zdravstveno stanje')}>
              <Facts>
                {health.map((h) => (
                  <Fact key={h.id} label={t(h.title)}>
                    {person.record.health[h.id].map((e) => t(e.name)).join(', ')}
                  </Fact>
                ))}
              </Facts>
            </Box>
          )}
        </Section>

        {/* every answer, in the order the conversation asked them, as the family reads them */}
        <Section title={t('Odgovori porodice')}>
          {steps.map((s) => (
            <Box key={s.id} label={STEP_TITLE[s.id] ? t(STEP_TITLE[s.id]) : s.title}>
              <Facts>
                {s.questions.map(({ q, answer }) => (
                  <Fact key={q.id} label={srShort(q)}>
                    {answerText(q, answer)}
                  </Fact>
                ))}
              </Facts>
            </Box>
          ))}
        </Section>

        <Section title={t('Kontakt porodice')}>
          <Plain>
            {yes ? (
              <>
                <Facts>
                  <Fact label={t('Ime')}>{care.family.name}</Fact>
                  {care.family.relation && <Fact label={t('Srodstvo')}>{t(care.family.relation)}</Fact>}
                </Facts>
                {care.family.phone && <PersonRows phone={care.family.phone} email={care.family.email || ''} />}
              </>
            ) : (
              <Sub className="text-xs leading-body text-muted-foreground">{no ? t('Upit je odbijen, pa se kontakt ne prikazuje.') : t('Kontakt vidite kad prihvatite upit.')}</Sub>
            )}
          </Plain>
        </Section>
    </>
  );
}

// in a drawer: a part's name, dark, its boxes under it as grey-named parts
function PaneSection({ title, children }) {
  return (
    <section className="flex flex-col gap-3">
      <PaneLabel className="mt-0">{title}</PaneLabel>
      {children}
    </section>
  );
}
const PaneBlock = ({ children }) => <div className="flex flex-col gap-2">{children}</div>;
