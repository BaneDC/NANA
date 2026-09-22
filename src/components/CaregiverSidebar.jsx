import SidePanel from './SidePanel';
import PlanContents from './PlanContents';

// The care plan as a side panel, opened from the chat where it is an artifact of
// the conversation. Opening it from the Care plans page uses the full page instead.
export default function CaregiverSidebar({ plan, unlocked, onSelectCaregiver, onUnlock, onClose }) {
  return (
    <SidePanel eyebrow="Plan nege" title={plan.name} onClose={onClose}>
      <PlanContents
        plan={plan}
        unlocked={unlocked}
        onSelectCaregiver={onSelectCaregiver}
        onUnlock={onUnlock}
      />
    </SidePanel>
  );
}
