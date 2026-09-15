import { useState } from 'react';
import { KeyRound } from 'lucide-react';
import Button from './Button';

// Bring-your-own-key, so whoever pulls the repo can try this with their own
// account and nothing secret is ever committed. It is also the reason this
// variant is a local demo and not something to deploy: a key held in the browser
// is readable by anything running on the page.
export default function ApiKeyPanel({ initial = '', rejected = false, onSave, onCancel }) {
  const [value, setValue] = useState(initial);
  const valid = /^sk-ant-/.test(value.trim());

  return (
    <div className="view">
      <div className="view-head">
        <div className="view-head-text">
          <h1 className="view-title">AI razgovor</h1>
          <p className="view-sub">Ova varijanta priča sa Claude-om uživo, pa joj treba tvoj ključ.</p>
        </div>
      </div>

      <div className="panel-card">
        <div className="panel-card-head">
          <p className="doc-section-title">Anthropic API ključ</p>
        </div>

        {rejected && (
          <p className="key-warning" role="alert">
            Anthropic nije prihvatio ključ koji je bio sačuvan (401) — obrisan je, istekao ili je
            pogrešno kopiran. Upiši ključ koji radi; ako je stari u <code>.env.local</code>, zameni
            ga i tamo.
          </p>
        )}

        <label className="key-field">
          <KeyRound size={14} strokeWidth={1.75} />
          <input
            type="password"
            value={value}
            placeholder="sk-ant-..."
            autoComplete="off"
            spellCheck={false}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && valid && onSave(value.trim())}
          />
        </label>

        <p className="doc-p">
          Ostaje u <code>localStorage</code> ovog browsera i ne odlazi nigde osim ka Anthropic-u.
          Nije u repozitorijumu — svako ko povuče kod upisuje svoj.
        </p>
        <p className="doc-p">
          Browser ga pamti samo za ovu adresu, pa ga posle promene porta traži ponovo. Da ga ne
          upisuješ svaki put, stavi ga u <code>.env.local</code> u korenu projekta kao{' '}
          <code>ANTHROPIC_API_KEY=…</code> i restartuj server.
        </p>
        <p className="key-warning">
          Ovako se radi samo lokalni demo. Ključ u browseru može da pročita bilo koja skripta na
          stranici, pa ovo ne sme da ide u produkciju — tamo poziv ide preko servera.
        </p>

        <div className="panel-card-actions">
          <Button variant="primary" disabled={!valid} onClick={() => onSave(value.trim())}>
            Sačuvaj i počni
          </Button>
          {onCancel && (
            <Button variant="secondary" onClick={onCancel}>
              Nazad
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
