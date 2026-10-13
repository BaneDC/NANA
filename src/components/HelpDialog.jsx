import Dialog from './Dialog';
import { CoordinatorRows } from './PlanFooterBlocks';
import { t } from '@/i18n';

// "Pomoć" in the menu (docs/patterns.md §4): not a page, a dialog with how to
// reach the coordinator, from wherever the family is. The same three rows as
// her card on the home and at the foot of the plan, each a link. There is
// nothing to confirm, so it has no footer: the close is the way out.
export default function HelpDialog({ open = true, coordinator, onClose }) {
  return (
    <Dialog
      title={t('Pomoć')}
      description={t('{name}, vaša koordinatorka nege, tu je za sve što vam treba. Javite joj se kako vam je najlakše.', { name: coordinator.name })}
      open={open}
      onClose={onClose}
    >
      <CoordinatorRows coordinator={coordinator} />
    </Dialog>
  );
}
