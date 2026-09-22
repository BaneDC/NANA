import { RefreshCw } from 'lucide-react';

// Shown after an edit actually moved the frailty level: says plainly what was
// dropped and what is being asked instead, so the reopened questions further down
// the thread are never a surprise.
export default function FlowChangeNotice({ change, name }) {
  const { dropped, added, level, previousLevel } = change;

  return (
    <div className="flow-change">
      <RefreshCw size={14} strokeWidth={2} className="flow-change-icon" />
      <div className="flow-change-text">
        <p className="flow-change-title">
          Ovo menja sliku — {name} je sada oko nivoa {level}, a ne {previousLevel}
        </p>
        {dropped.length > 0 && (
          <p className="flow-change-note">
            {dropped.length === 1 ? 'Ovaj odgovor više ne važi' : 'Ovi odgovori više ne važe'}, pa sam{' '}
            {dropped.length === 1 ? 'ga' : 'ih'} sklonila:{' '}
            <strong>{dropped.map((q) => q.shortTitle).join(', ')}</strong>.
          </p>
        )}
        {added.length > 0 && (
          <p className="flow-change-note">
            Umesto toga treba da vas pitam još ({added.length}):{' '}
            <strong>{added.map((q) => q.shortTitle).join(', ')}</strong>.
          </p>
        )}
      </div>
    </div>
  );
}
