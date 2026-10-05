import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import Dialog from './Dialog';
import { COOKIE_GROUPS } from '../data/cookies';

// What each group of cookies actually sets, not just its name.
//
// A dialog that says "Analitika" and nothing else asks somebody to agree to a
// word. This is the list the site itself publishes — the cookie, who sets it,
// what it is for and how long it stays — folded away under each group so the
// dialog still reads as four choices rather than a document.
//
// The whole of a group's top — its name, its state, what it is for — opens it
// (docs/patterns.md §7): the name is the button and its ::after stretches over
// that part. The switch sits above the stretch and only switches. The list
// that opens is not part of the target, so reading it does not fold it away.
function Group({ group, on, onChange }) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className={cn('flex flex-col gap-2 rounded-2xl p-3', on ? 'bg-primary-50' : 'bg-muted')}
    >
      <div className="group/summary relative flex cursor-pointer flex-col gap-2 rounded-lg has-[[data-slot=group-open]:focus-visible]:outline-2 has-[[data-slot=group-open]:focus-visible]:outline-offset-4 has-[[data-slot=group-open]:focus-visible]:outline-primary">
        <div className="flex items-center gap-2">
          <button
            type="button"
            data-slot="group-open"
            className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left outline-none after:absolute after:inset-0"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <ChevronDown
              size={14}
              strokeWidth={2}
              className={cn('shrink-0 text-muted-foreground transition-transform duration-200', open && 'rotate-180')}
            />
            <span className="text-xs font-medium text-foreground group-hover/summary:text-primary-700">{group.label}</span>
            <span className="text-[11px] leading-4 text-disabled">
              {group.cookies.length ? `${group.cookies.length} kolačića` : 'spisak još nije unet'}
            </span>
          </button>
          {/* The state says itself, in a word, beside the switch: a switch alone
              is read wrong often enough that the word is worth the room. */}
          <span className={cn('shrink-0 text-[11px] leading-4', on ? 'text-primary-600' : 'text-muted-foreground')}>
            {on ? 'Uključeno' : 'Isključeno'}
          </span>
          {/* what cannot be turned off still has its switch, so the list reads
              as one; it just does not move */}
          <Switch
            className="relative z-1"
            checked={on}
            aria-label={group.label}
            aria-disabled={group.fixed || undefined}
            onCheckedChange={(v) => !group.fixed && onChange(v)}
          />
        </div>

        <p className="text-xs leading-body text-muted-foreground">{group.note}</p>
      </div>

      <CollapsibleContent>
        {group.cookies.length ? (
          <ul className="flex list-none flex-col">
            {group.cookies.map((c) => (
              <li key={c.name} className="flex flex-col gap-1 border-t border-(--card-line) py-2">
                <span className="font-mono text-[11px] leading-4 text-foreground">{c.name}</span>
                <span className="text-xs leading-body text-foreground">{c.why}</span>
                <span className="text-[11px] leading-4 text-disabled">
                  Postavlja {c.by} · traje {c.keeps}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-small text-muted-foreground">Spisak ovih kolačića još nije prepisan sa sajta.</p>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

export default function CookieSettings({ cookies, onSave, onClose }) {
  const [draft, setDraft] = useState(() => ({
    analytics: Boolean(cookies?.analytics),
    recording: Boolean(cookies?.recording),
    marketing: Boolean(cookies?.marketing),
  }));

  const all = (value) => onSave({ analytics: value, recording: value, marketing: value });

  return (
    <Dialog eyebrow="Privatnost" title="Podešavanja kolačića" wide onClose={onClose}>
      <p className="text-xs leading-body text-muted-foreground">
        Izbor važi i za nanaprime.com. Možete ga promeniti kad god želite, odavde.
      </p>

      <div className="flex flex-col gap-2">
        {COOKIE_GROUPS.map((g) => (
          <Group
            key={g.id}
            group={g}
            on={g.fixed ? true : draft[g.id]}
            onChange={(v) => setDraft((d) => ({ ...d, [g.id]: v }))}
          />
        ))}
      </div>

      <DialogFooter>
        <Button variant="ghost" onClick={() => all(false)}>
          Odbij sve
        </Button>
        <Button variant="secondary" onClick={() => all(true)}>
          Prihvati sve
        </Button>
        <Button onClick={() => onSave(draft)}>Sačuvaj izbor</Button>
      </DialogFooter>
    </Dialog>
  );
}
