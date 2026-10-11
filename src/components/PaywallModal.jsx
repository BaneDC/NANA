import { useState } from 'react';
import { Check } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { DialogDescription, DialogEyebrow, DialogFooter } from '@/components/ui/dialog';
import { CheckList } from '@/components/data-list';
import { cn } from '@/lib/utils';
import { perMonth, planPrice, planSaving, plansFor } from '../data/plans';
import Dialog from './Dialog';
import { Field, TextArea } from './TextField';

// One plan, as the live platform's plan picker shows it: what it is called, what
// it costs, what it saves, who it is for, everything it includes, and its own
// button. Every card has the lot, so two plans are compared line by line rather
// than by a price and a name. The one we would rather sell is ringed and says
// so; its button is the primary one, and on a phone it comes first. The buttons
// sit at the foot of each card, full width, so they line up however long the
// lists are (docs/patterns.md §5).
function PlanCard({ plan, plans, onChoose }) {
  const saving = planSaving(plan, plans);
  return (
    <Card className={cn('gap-3', plan.recommended && 'shadow-[0_0_0_1px_var(--primary),var(--shadow-card)] phone:-order-1')}>
      <CardHeader>
        <CardTitle>{plan.name}</CardTitle>
        {plan.recommended && (
          <CardAction>
            <Badge>Najpopularniji</Badge>
          </CardAction>
        )}
      </CardHeader>

      <div className="flex flex-col gap-1">
        <p className="flex items-center gap-2 text-[24px] leading-8 font-medium text-foreground">
          {planPrice(plan)}
          {saving && <Badge variant="success">{saving}% uštede</Badge>}
        </p>
        <p className="text-small text-muted-foreground">
          {plan.months === 1
            ? 'mesečno, otkazujete kad god želite'
            : `za ${plan.months} meseca · ${perMonth(plan)} mesečno, naplaćuje se odjednom`}
        </p>
      </div>

      <CardDescription>{plan.description}</CardDescription>

      <div className="flex flex-col gap-2">
        {plan.lead && <p className="text-xs font-medium text-foreground">{plan.lead}</p>}
        <CheckList className="gap-2 [&>li]:items-start [&>li]:leading-body [&_svg]:h-[18px]">
          {plan.benefits.map((b) => (
            <li key={b}>
              <Check size={12} strokeWidth={2.5} />
              <span>{b}</span>
            </li>
          ))}
        </CheckList>
      </div>

      <CardFooter className="mt-auto pt-2">
        <Button
          variant={plan.recommended || plans.length === 1 ? 'default' : 'secondary'}
          className="w-full"
          onClick={() => onChoose(plan)}
        >
          Izaberite {plan.name}
        </Button>
      </CardFooter>
    </Card>
  );
}

// One dialog, two ways in: unlocking the plan, or writing to a caregiver.
//
// Writing comes first and the plan second — writing costs nothing, and someone
// who has already put their mother's needs into words is not asked to do it
// again after paying. So a message to a caregiver opens on the message; "Dalje"
// goes to the plans; paying brings it back to the message, now with "Pošalji".
// The family's number is not asked for here: registration already has it.
//
// The field starts empty. It used to open with a request written from the plan,
// which read as ours rather than theirs; the placeholder says what belongs there.
//
// The message is a dialog like any other (docs/patterns.md §7): its action row
// held on the floor while a long message scrolls, so the field can never push
// the buttons off the screen. The plans are the same dialog, wider (880, 480
// with one plan), 16 between its parts. On a phone both are a bottom sheet.
export default function PaywallModal({ open = true, caregiver, unlocked, alreadyAsked, country, onPay, onSend, onClose }) {
  const [message, setMessage] = useState('');
  const [step, setStep] = useState('message');
  const plans = plansFor(country);
  const first = caregiver?.name.split(' ')[0];
  const choosing = !unlocked && !alreadyAsked && (!caregiver || step === 'plans');

  if (choosing) {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        className={cn('gap-4', plans.length === 1 ? 'max-w-[480px]' : 'max-w-[880px]')}
        closeClassName="top-4"
        header={(Title) => (
          <div className="flex flex-col gap-1 pr-8 phone:pt-2 phone:pr-12">
            <Title className="text-base">Izaberite pretplatu</Title>
            <p className="text-xs leading-body text-muted-foreground">
              {/* no name in these: Serbian would have to decline it ("za Vesnu"),
                  and a template cannot */}
              {caregiver
                ? 'Vaša poruka ide čim se pretplatite, zajedno sa planom nege.'
                : 'Pretplata otključava ceo plan nege i kontakte negovateljica.'}
            </p>
          </div>
        )}
      >
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
          {plans.map((p) => (
            <PlanCard key={p.id} plan={p} plans={plans} onChoose={onPay} />
          ))}
        </div>

        <div className="flex flex-col gap-1 text-center text-small text-muted-foreground">
          <p>Pretplata se obnavlja automatski, a možete da je otkažete u svakom trenutku.</p>
          <p>Cene su izražene u evrima.</p>
        </div>

        {caregiver && (
          <DialogFooter>
            <Button variant="secondary" onClick={() => setStep('message')}>
              Nazad na poruku
            </Button>
          </DialogFooter>
        )}
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      wide
      header={(Title) => (
        <div className="mb-2 flex items-start gap-3 [--avatar:calc(var(--text-sm-leading)+16px)] phone:pt-2 phone:pr-12">
          <Avatar>
            <AvatarFallback>{caregiver?.initials}</AvatarFallback>
          </Avatar>
          <div>
            <DialogEyebrow>Poruka sa planom nege</DialogEyebrow>
            <Title>{caregiver?.name}</Title>
          </div>
        </div>
      )}
    >
      {alreadyAsked ? (
        <DialogDescription>
          Već ste poslali upit. {first} odgovara sa svoje table, a mi vam javljamo čim odgovori.
        </DialogDescription>
      ) : (
        <>
          <DialogDescription>
            Uz poruku ide i plan nege, pa ne morate da objašnjavate sve iznova. Upit nikoga ne obavezuje.
            {!unlocked && ' Poruka se šalje čim se pretplatite.'}
          </DialogDescription>
          {/* no label: the sentence above says what goes in it, and the
              placeholder says it again inside. It takes the focus as the
              dialog opens, so the message can be typed at once. */}
          <Field>
            <TextArea
              autoFocus
              value={message}
              rows={5}
              onChange={setMessage}
              aria-label="Poruka za negovateljicu"
              placeholder="Recite joj ukratko šta vam treba i kada."
            />
          </Field>
        </>
      )}

      <DialogFooter>
        <Button variant="secondary" onClick={onClose}>
          {alreadyAsked ? 'Zatvori' : 'Možda kasnije'}
        </Button>
        {!alreadyAsked &&
          (unlocked ? (
            <Button disabled={!message.trim()} onClick={() => onSend(message.trim())}>
              Pošalji poruku
            </Button>
          ) : (
            <Button onClick={() => setStep('plans')}>Dalje: izaberite pretplatu</Button>
          ))}
      </DialogFooter>
    </Dialog>
  );
}
