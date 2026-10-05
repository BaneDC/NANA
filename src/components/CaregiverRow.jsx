import { Send } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Item, ItemAction, ItemContent, ItemLink, ItemTitle } from '@/components/ui/item';
import Rating from './Rating';
import Standing from './Standing';

// One caregiver in the care plan: who she is, and the one thing the family can
// do about her.
//
// The row opens her profile — the name is the link, and it covers the row — and
// the action sits at the row's right, the app's own primary button. On a phone
// the button goes: the profile a tap brings up has the same "Pošalji poruku",
// so every row does not need its own.
//
// Once the family has written to her, or she already comes, the row says so in
// the button's place (`standing`), as her card on Pronađi does; on a phone
// under the text, in line with it.
//
// The avatar is as tall as the name and the meta under it (36, 40 under a
// finger: docs/patterns.md §6).
export default function CaregiverRow({ caregiver, standing, onSelect, onOpen }) {
  return (
    <Item className="items-start gap-3 [--avatar:calc(var(--text-xs-leading)+var(--spacing-1)+16px)] phone:flex-wrap">
      <Avatar>
        <AvatarFallback>{caregiver.initials}</AvatarFallback>
      </Avatar>
      <ItemContent className="phone:basis-[calc(100%-var(--avatar)-var(--spacing-3))]">
        <ItemTitle>
          {onOpen ? <ItemLink onClick={() => onOpen(caregiver)}>{caregiver.name}</ItemLink> : <span>{caregiver.name}</span>}
          <Badge className="my-[calc((var(--text-xs-leading)-20px)/2)] ml-2">Poklapanje · {caregiver.match}%</Badge>
        </ItemTitle>
        <div className="text-[11px] leading-4 text-muted-foreground pointer-coarse:text-small">
          <Rating caregiver={caregiver} /> · {caregiver.rate} · {caregiver.area}, do {caregiver.radius} km
        </div>
      </ItemContent>
      {standing ? (
        <Standing standing={standing} className="phone:ml-[calc(var(--avatar)+var(--spacing-3))]" />
      ) : (
        onSelect &&
        (onOpen ? (
          <ItemAction>
            <Button onClick={() => onSelect(caregiver)}>
              <Send size={14} strokeWidth={1.75} />
              Pošalji poruku
            </Button>
          </ItemAction>
        ) : (
          <Button className="phone:w-full" onClick={() => onSelect(caregiver)}>
            <Send size={14} strokeWidth={1.75} />
            Pošalji poruku
          </Button>
        ))
      )}
    </Item>
  );
}
