import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Fact, Facts } from '@/components/data-list';
import { PageSection } from '@/components/page';
import { cn } from '@/lib/utils';
import { Group, Groups } from './Tags';
import { planOverview } from '../data/carePlan.sr';
import { frailtyOf } from '../data/frailty';
import { CFS_SR, srShort } from '../data/flow.sr';
import { STEP_TITLE, answerText, planQuestions } from '../data/planEdits';

// The overview the onboarding ended on, kept with the plan: who she is, where
// she is on the frailty scale, what is going on, what matters most, and every
// answer the family gave, so they can come back and read what they said. The
// plan page shows it behind its "Pregled" switch; the plan itself is the other
// side. Read only: an answer is changed through the assistant or the profile,
// and the plan follows.
export default function PlanOverview({ answers = {}, notes = [] }) {
  const o = planOverview(answers, notes);
  const frailty = frailtyOf(answers);
  const level = frailty?.level;
  const cfs = level ? CFS_SR[level] : null;

  return (
    <div className="flex flex-col gap-8">
      <PageSection title="Ukratko">
        <Card>
          <p className="text-sm text-foreground">{o.lead}</p>
          {o.story.map((p) => (
            <CardDescription key={p}>{p}</CardDescription>
          ))}
        </Card>

        {cfs && (
          <Card>
            <CardHeader>
              <CardTitle>
                Klinička skala krhkosti: {level} od 9, {cfs.label.toLowerCase()}
              </CardTitle>
            </CardHeader>
            {/* the nine steps, hers lit and those she has passed tinted */}
            <div className="mt-1 grid grid-cols-9 gap-1" role="img" aria-label={`Nivo ${level} od 9`}>
              {Array.from({ length: 9 }, (_, i) => i + 1).map((l) => (
                <span
                  key={l}
                  className={cn(
                    'flex h-8 items-center justify-center rounded-sm text-small',
                    l === level
                      ? 'bg-primary font-medium text-primary-foreground'
                      : l < level
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-muted text-muted-foreground'
                  )}
                >
                  {l}
                </span>
              ))}
            </div>
            <p className="flex justify-between gap-3 text-small text-muted-foreground">
              <span>1 - potpuno samostalna</span>
              <span className="text-right">9 - na kraju života</span>
            </p>
            <CardDescription>{cfs.blurb}</CardDescription>
            <p className="text-small text-disabled">
              Procena je iz vaših odgovora i služi da uskladimo podršku. Nije dijagnoza i ne zamenjuje lekara.
            </p>
          </Card>
        )}

        {(o.risks.length > 0 || o.goal || o.notes.length > 0) && (
          <Card>
            <Groups>
              {o.risks.length > 0 && (
                <Group label="Na šta najviše treba paziti">
                  <ul className="flex list-disc flex-col gap-1 pl-4 text-xs leading-body text-foreground">
                    {o.risks.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </Group>
              )}
              {o.goal && <Group label="Najvažnije vam je" text={o.goal} />}
              {o.worry && <Group label="Najviše vas brine" text={o.worry} />}
              {o.notes.length > 0 && <Group label="Usput ste rekli" text={o.notes.join(' ')} />}
            </Groups>
          </Card>
        )}
      </PageSection>

      {/* every answer, in the order the conversation asked them */}
      <PageSection title="Vaši odgovori">
        {planQuestions(answers).map((s) => (
          <Card key={s.id}>
            <CardHeader>
              <CardTitle>{STEP_TITLE[s.id] || s.title}</CardTitle>
            </CardHeader>
            <Facts>
              {s.questions.map(({ q, answer }) => (
                <Fact key={q.id} label={srShort(q)}>
                  {answerText(q, answer)}
                </Fact>
              ))}
            </Facts>
          </Card>
        ))}
      </PageSection>
    </div>
  );
}
