import { Card, CardLink } from '@/components/ui/card';

// One number in a card of its own (24 / 32 medium), what it counts under it and
// a note: the family's home and the caregiver's board (docs/patterns.md §4a).
// With `onOpen` the label is the card's link, and the whole card opens it.
export default function StatCard({ value, label, note, onOpen, className }) {
  return (
    <Card className={className}>
      <div>
        <p className="text-[24px] leading-8 font-medium text-foreground">{value}</p>
        <p className="text-small text-muted-foreground">{onOpen ? <CardLink onClick={onOpen}>{label}</CardLink> : label}</p>
        <p className="text-small text-muted-foreground">{note}</p>
      </div>
    </Card>
  );
}
