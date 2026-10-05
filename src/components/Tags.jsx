import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Things that are so and cannot be chosen here: the services in an agreement,
// what was done on a visit, why a caregiver fits, her classifications. Flat grey
// tags (`Badge variant="tag"`) with no icon, so they do not read as the
// outlined chips (`ToggleGroupItem`) that are pressed to choose (docs/patterns.md §10).
//
// A group always says what it is: its name above, what it holds under it, 4
// apart. In a drawer the section's own label above says it, and `label` is
// left out. `off` is what was left out, said in so many words.
//
// (`cg-tags`, `cg-tag`, `tag-row`, `tag-rows` stay on until the screens that
// still place these by those classes are moved.)
export default function Tags({ label, items, off = [], className }) {
  const tags = (
    <div className={cn('cg-tags flex flex-wrap gap-1', !label && className)}>
      {items.map((t) => (
        <Badge key={t} variant="tag" className="cg-tag">
          {t}
        </Badge>
      ))}
      {off.map((t) => (
        <Badge key={t} variant="tag" className="cg-tag is-off text-disabled">
          {t}
        </Badge>
      ))}
    </div>
  );
  if (!label) return tags;
  return (
    <Group label={label} className={className}>
      {tags}
    </Group>
  );
}

// A named part of a card or a row: its name, 12px grey, and under it what it
// holds — tags, or a sentence someone wrote (`text`). Parts follow one another
// 12 apart inside `Groups`. What someone wrote is plain text under its name,
// never an indented italic quote (docs/patterns.md §10).
export function Group({ label, text, className, children }) {
  return (
    <div className={cn('tag-row flex flex-col gap-1', className)}>
      <p className="text-small text-muted-foreground">{label}</p>
      {text ? <p className="text-xs leading-body text-foreground">{text}</p> : children}
    </div>
  );
}

export function Groups({ className, ...props }) {
  return <div className={cn('tag-rows flex flex-col gap-3', className)} {...props} />;
}
