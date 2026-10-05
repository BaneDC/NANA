import { useState } from 'react';
import { KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Page, PageDescription, PageHeader, PageHeaderText, PageTitle } from '@/components/page';
import { Field, Input } from './TextField';

// a warning on the waiting tint
const warning = 'rounded-lg bg-warning-muted p-3 text-xs leading-body text-warning';

// Bring-your-own-key, so whoever pulls the repo can try this with their own
// account and nothing secret is ever committed. It is also the reason this
// variant is a local demo and not something to deploy: a key held in the browser
// is readable by anything running on the page.
export default function ApiKeyPanel({ initial = '', rejected = false, onSave, onCancel }) {
  const [value, setValue] = useState(initial);
  const valid = /^sk-ant-/.test(value.trim());

  return (
    <Page>
      <PageHeader>
        <PageHeaderText>
          <PageTitle>AI razgovor</PageTitle>
          <PageDescription>Ova varijanta priča sa Claude-om uživo, pa joj treba tvoj ključ.</PageDescription>
        </PageHeaderText>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>Anthropic API ključ</CardTitle>
        </CardHeader>

        {rejected && (
          <p className={warning} role="alert">
            Anthropic nije prihvatio ključ koji je bio sačuvan (401) - obrisan je, istekao ili je
            pogrešno kopiran. Upiši ključ koji radi; ako je stari u <code>.env.local</code>, zameni
            ga i tamo.
          </p>
        )}

        {/* the one field, as every field (docs/patterns.md §10) */}
        <Field>
          <Input
            icon={KeyRound}
            type="password"
            value={value}
            placeholder="sk-ant-..."
            autoComplete="off"
            spellCheck={false}
            aria-label="Anthropic API ključ"
            onChange={setValue}
            onEnter={() => valid && onSave(value.trim())}
          />
        </Field>

        <CardDescription>
          Ostaje u <code>localStorage</code> ovog browsera i ne odlazi nigde osim ka Anthropic-u.
          Nije u repozitorijumu - svako ko povuče kod upisuje svoj.
        </CardDescription>
        <CardDescription>
          Browser ga pamti samo za ovu adresu, pa ga posle promene porta traži ponovo. Da ga ne
          upisuješ svaki put, stavi ga u <code>.env.local</code> u korenu projekta kao{' '}
          <code>ANTHROPIC_API_KEY=…</code> i restartuj server.
        </CardDescription>
        <p className={warning}>
          Ovako se radi samo lokalni demo. Ključ u browseru može da pročita bilo koja skripta na
          stranici, pa ovo ne sme da ide u produkciju - tamo poziv ide preko servera.
        </p>

        <CardFooter>
          <Button disabled={!valid} onClick={() => onSave(value.trim())}>
            Sačuvaj i počni
          </Button>
          {onCancel && (
            <Button variant="secondary" onClick={onCancel}>
              Nazad
            </Button>
          )}
        </CardFooter>
      </Card>
    </Page>
  );
}
