import { motion } from 'framer-motion';
import { AlertTriangle, RotateCcw, Sparkles, PenLine } from 'lucide-react';
import Button from './Button';
import ChangeRows from './ChangeRows';

// What just changed in the plan, said at the top of it. A plan that silently
// redraws itself asks the family to spot the difference; this names it — which
// answers moved, what that did to the frailty level, and which parts of the plan
// were rewritten because of it — and offers the way back.
//
// `change` is App's record of the last edit: the answer rows from
// describeChanges, the recommendations that came out different, and where the
// edit came from.
export default function PlanChangeBanner({ change, onUndo, onDismiss }) {
  const Icon = change.source === 'manual' ? PenLine : Sparkles;
  return (
    <motion.section
      className="panel-card pc-banner"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 30 }}
    >
      <div className="pc-banner-head">
        <span className="pc-banner-icon">
          <Icon size={14} strokeWidth={1.75} />
        </span>
        <div className="pc-banner-text">
          <p className="pc-banner-title">Plan je izmenjen</p>
          <p className="pc-banner-sub">
            {{ assistant: 'Preko asistenta', manual: 'Ručno', both: 'Ručno i preko asistenta' }[change.source]} · izmenjeni delovi plana su označeni
          </p>
        </div>
      </div>

      <ChangeRows rows={change.rows} notes={change.saved} />

      {change.frailty && (
        <p className="pc-frailty">
          <AlertTriangle size={12} strokeWidth={2} />
          Nivo krhkosti: {change.frailty.before} → {change.frailty.after}
        </p>
      )}

      {change.touched.length > 0 && (
        <p className="pc-touched">Zbog toga se promenilo: {change.touched.join(', ')}.</p>
      )}

      <div className="pc-actions">
        <Button variant="ghost" onClick={onUndo}>
          <RotateCcw size={14} strokeWidth={1.75} />
          Poništi izmene
        </Button>
        <Button variant="secondary" onClick={onDismiss}>
          U redu
        </Button>
      </div>
    </motion.section>
  );
}
