import { AppPane } from '@/components/page';
import CaregiverRequests from './CaregiverRequests';
import Settings from '../Settings';

// The caregiver's side, inside the same shell as the family's (the menu, the
// pane, help, the simulation): her pages only. Part 1 has two, her requests
// and her settings; parts 3 and 4 add the rest per market
// (docs/superpowers/specs/2026-10-19-negovateljice-pregled.md).
export default function CaregiverApp({ view, user, care, onCare, onSaveUser, onFlash }) {
  return (
    <AppPane>
      {view === 'settings' ? (
        <Settings payments={false} user={user} care={care} onCare={onCare} onSaveUser={onSaveUser} onFlash={onFlash} />
      ) : (
        <CaregiverRequests user={user} care={care} onCare={onCare} onFlash={onFlash} />
      )}
    </AppPane>
  );
}
