import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import Attention from './Attention';

// The letter from the coordinator, straight out of the client's document: signed
// by a named person, addressed to the caller, and ending on "step by step,
// together" rather than a call to action.
//
// It folds. It is the longest thing on the page and it is read once; after that
// it is in the way of the plan it introduces. The greeting stays out, so what is
// folded is still addressed to someone.
//
// Who writes is the head of the tinted tray, and the whole head opens and
// folds it; the letter itself is a white card in it, like everything the tray
// holds (docs/patterns.md §5). The avatar is as tall as the name and the role
// under it (32, 36 under a finger).
export default function CoordinatorMessage({ letter, changed, changeKey }) {
  const { greeting, paragraphs, from } = letter;
  const [open, setOpen] = useState(true);

  return (
    <Collapsible open={open} onOpenChange={setOpen} asChild>
      <Attention
        head={
          <CollapsibleTrigger className="flex w-full cursor-pointer items-start gap-3 px-4 pt-2 pb-1 text-left [font:inherit] [--avatar:calc(var(--text-xs-leading)+16px)] pointer-coarse:min-h-11">
            <Avatar>
              <AvatarFallback>{from.initials}</AvatarFallback>
            </Avatar>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-xs font-medium text-primary-700">{from.name}</span>
              <span className="text-[11px] leading-4 text-primary-700">{from.role}</span>
            </span>
            {changed && <Badge className="ml-auto">Izmenjeno</Badge>}
            <span className="flex shrink-0 items-center gap-1 text-[11px] leading-4 text-primary-600">
              {open ? 'Sakrij poruku' : 'Pročitaj poruku'}
              <ChevronDown size={14} strokeWidth={2} className={cn('transition-transform duration-200', open && 'rotate-180')} />
            </span>
          </CollapsibleTrigger>
        }
      >
        <Card
          className={cn(changed && 'animate-plan-changed shadow-[0_0_0_1px_var(--color-primary-300),var(--shadow-card)]')}
          key={changed ? changeKey : 'letter'}
        >
          <p className="text-sm font-medium text-foreground">{greeting}</p>
          {/* The 8 under the greeting is the letter's own top, so it folds away
              with it rather than going in one step once the letter has; and it
              stays folded to the end (`forwards`), with no frame at full height
              before it is taken out. */}
          <CollapsibleContent className="-mt-2 overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
            <div className="flex flex-col gap-2 pt-2">
              {paragraphs.map((p, i) => (
                <p className="text-xs leading-body text-muted-foreground" key={i}>
                  {p}
                </p>
              ))}
              <p className="mt-1 text-small text-muted-foreground">- {from.name.split(' ')[0]}</p>
            </div>
          </CollapsibleContent>
        </Card>
      </Attention>
    </Collapsible>
  );
}
