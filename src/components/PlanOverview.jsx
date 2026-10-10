import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Fact, Facts } from '@/components/data-list';
import { PageSection } from '@/components/page';
import FrailtyScale from './FrailtyScale';
import { Group, Groups } from './Tags';
import { planOverview } from '../data/carePlan.sr';
import { srShort } from '../data/flow.sr';
import { STEP_TITLE, answerText, planQuestions } from '../data/planEdits';

// The overview the onboarding ended on, kept with the plan: who she is, where
// she is on the frailty scale, what is going on, what matters most, and every
// answer the family gave, so they can come back and read what they said. The
// plan page shows it behind its "Pregled" switch; the plan itself is the other
// side. Read only: an answer is changed through the assistant or the profile,
// and the plan follows.
export default function PlanOverview({ answers = {}, notes = [] }) {
  const o = planOverview(answers, notes);

  return (
    <div className="flex flex-col gap-8">
      <PageSection title="Ukratko">
        <Card>
          <p className="text-sm text-foreground">{o.lead}</p>
          {o.story.map((p) => (
            <CardDescription key={p}>{p}</CardDescription>
          ))}
        </Card>

        <FrailtyScale answers={answers} />

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
