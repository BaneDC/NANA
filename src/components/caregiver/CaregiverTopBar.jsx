import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Logo from '../Logo';

// The caregiver has no sidebar. A board wants every pixel of width it can get,
// and a nav with one working item in it looks like a nav that is broken rather
// than one that is small — the rest of her app (clients, earnings, profile) is
// not built yet, so nothing pretends otherwise.
export default function CaregiverTopBar({ user }) {
  const initials =
    user.name
      .split(' ')
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'NP';

  return (
    <div className="flex shrink-0 items-center gap-3 border-b px-4 py-3">
      <Logo width={92} />
      <span className="flex-1 text-small text-muted-foreground">Negovateljica</span>

      {/* who is signed in: the avatar as tall as the name and the e-mail */}
      <div className="flex items-start gap-3 [--avatar:calc(var(--text-xs-leading)+14px)]">
        <Avatar>
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-xs font-medium text-foreground">{user.name || 'Gost'}</span>
          <span className="truncate text-[11px] leading-[14px] text-muted-foreground">{user.email}</span>
        </span>
      </div>
    </div>
  );
}
