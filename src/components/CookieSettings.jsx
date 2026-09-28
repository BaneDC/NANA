import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import { COOKIE_GROUPS } from '../data/cookies';

// What each group of cookies actually sets, not just its name.
//
// A dialog that says "Analitika" and nothing else asks somebody to agree to a
// word. This is the list the site itself publishes — the cookie, who sets it,
// what it is for and how long it stays — folded away under each group so the
// dialog still reads as four choices rather than a document.
function Group({ group, on, onChange }) {
  const [open, setOpen] = useState(false);

  return (
    <section className={`ck-group${on ? ' is-on' : ''}`}>
      <div className="ck-head">
        <button
          type="button"
          className="ck-open"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <ChevronDown size={14} strokeWidth={2} className={open ? 'is-open' : ''} />
          <span className="ck-name">{group.label}</span>
          <span className="ck-count">
            {group.cookies.length ? `${group.cookies.length} kolačića` : 'spisak još nije unet'}
          </span>
        </button>
        {/* The state says itself, in a word, beside the switch: a switch alone
            is read wrong often enough that the word is worth the room. */}
        <span className="ck-state">{on ? 'Uključeno' : 'Isključeno'}</span>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label={group.label}
          aria-disabled={group.fixed || undefined}
          className={`switch${on ? ' is-on' : ''}${group.fixed ? ' is-fixed' : ''}`}
          onClick={() => !group.fixed && onChange(!on)}
        >
          <span className="switch-knob" />
        </button>
      </div>

      <p className="ck-note">{group.note}</p>

      {open &&
        (group.cookies.length ? (
          <ul className="ck-list">
            {group.cookies.map((c) => (
              <li key={c.name} className="ck-cookie">
                <span className="ck-cookie-name">{c.name}</span>
                <span className="ck-cookie-why">{c.why}</span>
                <span className="ck-cookie-meta">
                  Postavlja {c.by} · traje {c.keeps}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="ag-hint">Spisak ovih kolačića još nije prepisan sa sajta.</p>
        ))}
    </section>
  );
}

export default function CookieSettings({ cookies, onSave, onClose }) {
  const [draft, setDraft] = useState(() => ({
    analytics: Boolean(cookies?.analytics),
    recording: Boolean(cookies?.recording),
    marketing: Boolean(cookies?.marketing),
  }));

  const all = (value) =>
    onSave({ analytics: value, recording: value, marketing: value });

  return (
    <Modal eyebrow="Privatnost" title="Podešavanja kolačića" wide onClose={onClose}>
      <p className="ag-lead">
        Izbor važi i za nanaprime.com. Možete ga promeniti kad god želite, odavde.
      </p>

      <div className="ck-groups">
        {COOKIE_GROUPS.map((g) => (
          <Group
            key={g.id}
            group={g}
            on={g.fixed ? true : draft[g.id]}
            onChange={(v) => setDraft((d) => ({ ...d, [g.id]: v }))}
          />
        ))}
      </div>

      <div className="panel-card-actions is-end">
        <Button variant="ghost" onClick={() => all(false)}>
          Odbij sve
        </Button>
        <Button variant="secondary" onClick={() => all(true)}>
          Prihvati sve
        </Button>
        <Button variant="primary" onClick={() => onSave(draft)}>
          Sačuvaj izbor
        </Button>
      </div>
    </Modal>
  );
}
