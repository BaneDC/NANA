import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Rating from './Rating';
import Standing from './Standing';

// Who she is, at the top of her details (the profile drawer, her pane in the
// chat), laid out as her card on Pronađi: the avatar, then her name with the
// match beside it, and under them her rating and what she charges, where she
// is and how far she comes. Where the family stands with her is under that.
//
// The avatar is as tall as the name and the line under it, 8 apart (44, 48
// under a finger). On a phone the match, the name and the rating each take a
// line, in that order: the match 4 over the name, the rating 8 under it
// (docs/patterns.md §8).
export default function CaregiverHead({ caregiver: c, standing }) {
  return (
    <div className="flex items-start gap-3 [--avatar:calc(var(--text-sm-leading)+var(--spacing-2)+16px)]">
      <Avatar>
        <AvatarFallback>{c.initials}</AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <CaregiverName name={c.name} match={c.match} />
        <p className="text-[11px] leading-4 text-muted-foreground pointer-coarse:text-small">
          <Rating caregiver={c} /> · {c.rate} · {c.area}, do {c.radius} km
        </p>
        <Standing standing={standing} className="self-start" />
      </div>
    </div>
  );
}

// Her name (14) with the match beside it; on a phone the match goes above it.
// 8 over the line under it (4 of the column's gap, 4 of its own), so the
// match does not sit on the rating.
// `children` is the name when it is a link (her card on Pronađi).
export function CaregiverName({ name, match, children }) {
  return (
    <div className="mb-1 flex items-center gap-2 phone:flex-col-reverse phone:items-start phone:gap-1">
      {children || <span className="text-sm font-medium text-foreground">{name}</span>}
      <Badge className="ml-2 phone:ml-0">Poklapanje · {match}%</Badge>
    </div>
  );
}
