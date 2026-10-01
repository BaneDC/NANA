import { AnimatePresence } from 'framer-motion';
import { Send } from 'lucide-react';
import PlanContents from '../components/PlanContents';
import PlanChangeBanner from '../components/PlanChangeBanner';
import AskAssistant from '../components/AskAssistant';
import Button from '../components/Button';
import BackButton from '../components/BackButton';

// A care plan as its own page, reached from the Care plans list or the nav.
//
// It opens on Minna's letter. The summary of the person that used to sit above
// it told the family what they had just told us; the letter is the first thing
// the plan has to say back.
export default function PlanDetail({
  entry,
  unlocked,
  change,
  onBack,
  onSelectCaregiver,
  onOpenCaregiver,
  onUnlock,
  onAskAssistant,
  onShare,
  onUndoChange,
  onDismissChange,
  onFindCaregivers,
}) {
  const { plan, title, date, status, archived } = entry;
  const shownChange = archived ? null : change;

  return (
    <div className="view">
      <BackButton label="Planovi nege" onClick={onBack} />
      <div className="view-head">
        <div className="view-head-text">
          <h1 className="view-title">{title}</h1>
          <p className="view-sub">
            {date} · <span className={`status-pill is-${archived ? 'muted' : 'accepted'}`}>{status}</span>
          </p>
        </div>
        {/* Two ways to change the plan, side by side: by hand, or by telling the
            assistant what is different. Only the live plan can change. Icons
            alone here: three labelled buttons took the width the title needs,
            and on a phone they wrapped under it. */}
        <div className="view-head-actions">
          <AskAssistant iconOnly onClick={onAskAssistant} />
          {onShare && (
            <Button variant="secondary" iconOnly onClick={onShare} aria-label="Pošalji plan" title="Pošalji plan">
              <Send size={14} strokeWidth={1.75} />
            </Button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {shownChange && (
          <PlanChangeBanner key={shownChange.at} change={shownChange} onUndo={onUndoChange} onDismiss={onDismissChange} />
        )}
      </AnimatePresence>

      {archived && (
        <div className="panel-card">
          <p className="doc-p">{entry.summary}</p>
        </div>
      )}

      <PlanContents
        plan={{ ...plan, caregiverCount: entry.caregiverCount }}
        unlocked={unlocked}
        archived={archived}
        change={shownChange}
        onSelectCaregiver={onSelectCaregiver}
        onOpenCaregiver={onOpenCaregiver}
        onUnlock={onUnlock}
        onFindCaregivers={onFindCaregivers}
      />

      {archived && (
        <div className="panel-card-actions">
          <Button variant="secondary" onClick={onBack}>
            Nazad na sve planove
          </Button>
        </div>
      )}
    </div>
  );
}
