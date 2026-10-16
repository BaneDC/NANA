import { useState } from 'react';
import { KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Page, PageDescription, PageHeader, PageHeaderText, PageTitle } from '@/components/page';
import { Field, Input, requiredError, useCheck } from './TextField';
import { t } from '../i18n';

// The names of files and settings stay code in any language: a translated
// sentence keeps them as they are, and they are set as code where they appear.
const withCode = (text) =>
  text.split(/(\.env\.local|localStorage|ANTHROPIC_API_KEY=…)/).map((part, i) => (i % 2 ? <code key={i}>{part}</code> : part));

// a warning on the waiting tint
const warning = 'rounded-lg bg-warning-muted p-3 text-xs leading-body text-warning';

// Bring-your-own-key, so whoever pulls the repo can try this with their own
// account and nothing secret is ever committed. It is also the reason this
// variant is a local demo and not something to deploy: a key held in the browser
// is readable by anything running on the page.
export default function ApiKeyPanel({ initial = '', rejected = false, onSave, onCancel }) {
  const [value, setValue] = useState(initial);
  const check = useCheck();
  const error = !value.trim() ? requiredError() : !/^sk-ant-/.test(value.trim()) && t('Ključ počinje sa sk-ant-.');
  const save = () => check.check([error]) && onSave(value.trim());

  return (
    <Page>
      <PageHeader>
        <PageHeaderText>
          <PageTitle>{t('AI razgovor')}</PageTitle>
          <PageDescription>{t('Ova varijanta priča sa Claude-om uživo, pa joj treba tvoj ključ.')}</PageDescription>
        </PageHeaderText>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>{t('Anthropic API ključ')}</CardTitle>
        </CardHeader>

        {rejected && (
          <p className={warning} role="alert">
            {withCode(t('Anthropic nije prihvatio ključ koji je bio sačuvan (401) - obrisan je, istekao ili je pogrešno kopiran. Upiši ključ koji radi; ako je stari u .env.local, zameni ga i tamo.'))}
          </p>
        )}

        {/* the one field, as every field (docs/patterns.md §10) */}
        <Field error={check.show(error)}>
          <Input
            icon={KeyRound}
            type="password"
            value={value}
            placeholder="sk-ant-..."
            autoComplete="off"
            spellCheck={false}
            aria-label={t('Anthropic API ključ')}
            onChange={setValue}
            onEnter={save}
          />
        </Field>

        <CardDescription>
          {withCode(t('Ostaje u localStorage ovog browsera i ne odlazi nigde osim ka Anthropic-u. Nije u repozitorijumu - svako ko povuče kod upisuje svoj.'))}
        </CardDescription>
        <CardDescription>
          {withCode(
            t('Browser ga pamti samo za ovu adresu, pa ga posle promene porta traži ponovo. Da ga ne upisuješ svaki put, stavi ga u .env.local u korenu projekta kao ANTHROPIC_API_KEY=… i restartuj server.')
          )}
        </CardDescription>
        <p className={warning}>
          {t('Ovako se radi samo lokalni demo. Ključ u browseru može da pročita bilo koja skripta na stranici, pa ovo ne sme da ide u produkciju - tamo poziv ide preko servera.')}
        </p>

        <CardFooter>
          <Button onClick={save}>
            {t('Sačuvaj i počni')}
          </Button>
          {onCancel && (
            <Button variant="secondary" onClick={onCancel}>
              {t('Nazad')}
            </Button>
          )}
        </CardFooter>
      </Card>
    </Page>
  );
}
