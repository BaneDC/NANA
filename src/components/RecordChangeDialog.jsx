import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Part, PartText } from '@/components/pane';
import AutoHeight from './AutoHeight';
import ChangeRows from './ChangeRows';
import Dialog from './Dialog';
import { Field, Input, Select } from './TextField';
import { firstName } from '../data/familyCare';
import { srField, srOption, srShort } from '../data/flow.sr';
import { draftChanges, fieldLocked, partQuestions, recordImpact } from '../data/record';

// A correction to a part of the medical record that the care plan is built
// from (docs/patterns.md §10a). Only for what was written wrong: when
// something has changed about her, that is told to the assistant, which asks
// what it needs and proposes the change ("Prijavi promenu" on the page).
//
// A corrected answer still builds the plan again, so it is made in two steps,
// in one dialog:
//
// 1. what was wrong: the part's lines as fields, one under another, to put
//    right only the ones that are;
// 2. what that does, before anything is written: each line as it was and as it
//    would be, and what it does to the frailty level, the plan, the week of
//    care, the questions asked of her and the caregivers who come.
//
// Confirming writes the correction into the record's history and builds the
// plan again; the plan then says what changed and offers the way back. The
// second step swaps in place, the dialog growing or shrinking to it
// (AutoHeight).

// the badge in a line's name stands over the line, not in it
const overLine = 'my-[calc((var(--text-xs-leading)-20px)/2)]';

function Effect({ title, badge, variant = 'secondary', children }) {
  return (
    <div>
      <p className="flex flex-wrap items-center gap-2 text-xs font-medium text-foreground">
        {title}
        {badge && (
          <Badge variant={variant} className={overLine}>
            {badge}
          </Badge>
        )}
      </p>
      {children && <PartText className="mt-2">{children}</PartText>}
    </div>
  );
}

// "5 · Blago krhka" as its number and its name
const levelParts = (text) => {
  const [n, ...name] = String(text).split(' · ');
  return { n, name: name.join(' · ') };
};

export default function RecordChangeDialog({ open = true, part, answers, notes, plan, care, onConfirm, onClose }) {
  const questions = partQuestions(part, answers);
  // only what someone touched; the rest reads from the answers
  const [draft, setDraft] = useState({});
  const [step, setStep] = useState('edit'); // edit | review

  const valueOf = (q) => draft[q.id] ?? answers[q.id];
  const set = (q, answer) => setDraft((d) => ({ ...d, [q.id]: answer }));
  const changes = draftChanges(answers, draft);
  const complete = questions.every(
    (q) => q.type !== 'inputs' || q.fields.every((f) => f.optional || String(valueOf(q)?.values?.[f.id] || '').trim())
  );
  const impact = step === 'review' ? recordImpact({ answers, notes, plan, changes }) : null;
  const working = (care?.arrangements || []).filter((a) => !a.endedOn).map((a) => firstName(a.caregiver.name));

  return (
    <Dialog
      eyebrow={`Medicinski karton · ${part.title}`}
      title={step === 'edit' ? 'Ispravka zapisa' : 'Šta ova ispravka menja'}
      description={
        step === 'edit'
          ? 'Ovde se ispravlja ono što je pogrešno upisano. Ako se nešto promenilo, to se javlja asistentu: „Prijavi promenu" na vrhu kartona.'
          : 'Ništa nije upisano dok ne potvrdite.'
      }
      wide
      open={open}
      onClose={onClose}
    >
      <AutoHeight className="pt-3">
        {step === 'edit' ? (
          // one under another, in the order the card reads them
          <div key="edit" className="flex animate-in flex-col gap-3 fade-in-0 duration-200">
            {questions.map((q) => {
              if (q.type === 'inputs') {
                return q.fields
                  .filter((f) => !fieldLocked(q.id, f.id))
                  .map((f) => (
                    <Field key={`${q.id}.${f.id}`} label={srField(q, f.id)}>
                      <Input
                        value={valueOf(q)?.values?.[f.id] || ''}
                        placeholder={f.placeholder}
                        onChange={(value) => set(q, { values: { ...(valueOf(q)?.values || {}), [f.id]: value } })}
                      />
                    </Field>
                  ));
              }
              if (q.type === 'single') {
                return (
                  <Field key={q.id} label={srShort(q)}>
                    <Select
                      value={valueOf(q)?.optionId || null}
                      onChange={(optionId) => set(q, { optionId })}
                      options={q.options.map((o) => ({ value: o.id, label: srOption(q, o.id) }))}
                    />
                  </Field>
                );
              }
              // several can hold at once: chips, the first one's edge on the
              // field's edge, as an input's is, so its text starts under the label
              return (
                <Field key={q.id} label={srShort(q)}>
                  <ToggleGroup
                    type="multiple"
                    size="sm"
                    aria-label={srShort(q)}
                    value={valueOf(q)?.optionIds || []}
                    onValueChange={(ids) =>
                      set(q, { ...(valueOf(q) || {}), optionIds: q.options.map((o) => o.id).filter((id) => ids.includes(id)) })
                    }
                  >
                    {q.options.map((o) => (
                      <ToggleGroupItem key={o.id} value={o.id}>
                        {srOption(q, o.id)}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </Field>
              );
            })}
          </div>
        ) : (
          <div key="review" className="flex animate-in flex-col gap-6 fade-in-0 duration-200">
            <Part label="Šta upisujete">
              <ChangeRows rows={impact.rows} />
            </Part>

            <Part label="Šta ovo menja">
              <div className="flex flex-col gap-4">
                {impact.frailty ? (
                  <Effect
                    title="Nivo krhkosti"
                    badge={`${levelParts(impact.frailty.before).n} → ${levelParts(impact.frailty.after).n}`}
                    variant="warning"
                  >
                    Sa „{levelParts(impact.frailty.before).name}" na „{levelParts(impact.frailty.after).name}". Od nivoa zavisi koja
                    se podrška preporučuje.
                  </Effect>
                ) : (
                  part.id === 'daily' && <Effect title="Nivo krhkosti" badge="Ostaje isti" />
                )}

                {plan &&
                  (impact.touched.length > 0 ? (
                    <Effect title="Plan nege" badge="Nova verzija" variant="default">
                      Ponovo se piše: {impact.touched.join(', ')}. Na planu ćete videti šta je drugačije i moći ćete da poništite
                      izmenu.
                    </Effect>
                  ) : (
                    <Effect title="Plan nege" badge="Ostaje isti" />
                  ))}

                {impact.week && (
                  <Effect title="Koliko nege">
                    Plan sada traži „{impact.week.after}" (bilo je „{impact.week.before}"). Ugovor sa negovateljicom se ne menja
                    sam: nove uslove dogovarate sa njom.
                  </Effect>
                )}

                {impact.risks.length > 0 && <Effect title="Na šta paziti">Novo: {impact.risks.join(', ').toLowerCase()}.</Effect>}

                {(impact.opened.length > 0 || impact.closed.length > 0) && (
                  <Effect title="Pitanja u kartonu">
                    {[
                      impact.opened.length > 0 && `Otvaraju se nova: ${impact.opened.join(', ')}. Čekaće vas u kartonu.`,
                      impact.closed.length > 0 && `Više ne važe: ${impact.closed.join(', ')}.`,
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  </Effect>
                )}

                {working.length > 0 && (
                  <Effect title="Negovateljice">
                    {working.join(', ')} {working.length === 1 ? 'dobija' : 'dobijaju'} obaveštenje o ispravci pre sledeće posete.
                  </Effect>
                )}
              </div>
            </Part>
          </div>
        )}
      </AutoHeight>

      <DialogFooter className="mt-0">
        {step === 'edit' ? (
          <>
            <Button variant="secondary" onClick={onClose}>
              Otkaži
            </Button>
            <Button disabled={!changes.length || !complete} onClick={() => setStep('review')}>
              Dalje
            </Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={() => setStep('edit')}>
              Nazad
            </Button>
            <Button onClick={() => onConfirm({ changes, part, impact })}>Sačuvaj ispravku</Button>
          </>
        )}
      </DialogFooter>
    </Dialog>
  );
}
