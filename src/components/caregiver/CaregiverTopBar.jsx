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
    <div className="chat-topbar cg-topbar">
      <Logo width={92} />
      <span className="cg-topbar-role">Negovateljica</span>

      <div className="cg-topbar-user">
        <span className="cg-avatar">{initials}</span>
        <span className="nav-user-text">
          <span className="nav-user-name">{user.name || 'Gost'}</span>
          <span className="nav-user-mail">{user.email}</span>
        </span>
      </div>

    </div>
  );
}
