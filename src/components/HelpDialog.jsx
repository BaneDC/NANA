import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Part, PaneHint } from '@/components/pane';
import Dialog from './Dialog';
import { CoordinatorRows } from './PlanFooterBlocks';
import { Field, TextArea, requiredError, useCheck } from './TextField';
import { t } from '@/i18n';
import { Item, ItemContent, ItemDescription, ItemGroup, ItemLink, ItemTitle } from '@/components/ui/item';
import { CODE, CODE_INTRO } from '../data/codeOfConduct';

// her side: the code she works by, one row under the coordinator's contact
function CodeDialog({ open, onClose }) {
  return (
    <Dialog title={t('Kodeks ponašanja za negovateljice')} description={t(CODE_INTRO)} wide open={open} onClose={onClose}>
      <ul className="flex list-disc flex-col gap-2 pl-5 text-xs leading-body text-foreground">
        {CODE.map((line) => (
          <li key={line}>{t(line)}</li>
        ))}
      </ul>
    </Dialog>
  );
}

// "Pomoć" in the menu (docs/patterns.md §4): not a page, a dialog with how to
// reach the coordinator, from wherever the family is. First the same three
// rows as her card on the home, each a link; then, for whoever would rather
// not call, a message to her in their own words: a question, a worry, praise
// or a complaint. "Pošalji poruku" with nothing written says so under the
// field; sent, the dialog closes and says who reads it.
export default function HelpDialog({ open = true, coordinator, caregiver = false, onSend, onClose }) {
  const [code, setCode] = useState(false);
  const [text, setText] = useState('');
  const first = coordinator.name.split(' ')[0];
  const check = useCheck();
  const error = !text.trim() && requiredError();
  const close = () => {
    setText('');
    check.reset();
    onClose();
  };
  const send = () => {
    if (!check.check([error])) return;
    onSend(text.trim());
    close();
  };
  return (
    <Dialog
      title={t('Pomoć')}
      description={t('{name}, vaša koordinatorka nege, tu je za sve što vam treba. Javite joj se kako vam je najlakše.', { name: coordinator.name })}
      open={open}
      onClose={close}
    >
      {/* parts 24 apart (Part, src/components/pane.jsx) */}
      <div className="flex flex-col gap-6">
        <Part label={t('Pozovite ili pišite')}>
          <CoordinatorRows coordinator={coordinator} />
        </Part>
        {caregiver && (
          <Part label={t('Pravila rada')}>
            <ItemGroup>
              <Item>
                <ItemContent>
                  <ItemTitle>
                    <ItemLink onClick={() => setCode(true)}>{t('Kodeks ponašanja')}</ItemLink>
                  </ItemTitle>
                  <ItemDescription>{t('Šta se od vas očekuje kod korisnika.')}</ItemDescription>
                </ItemContent>
              </Item>
            </ItemGroup>
          </Part>
        )}
        {/* the one field: its part's name and the placeholder say what goes in,
            so no label of its own (docs/patterns.md §10) */}
        <Part label={t('Ili joj ostavite poruku')}>
          <Field error={check.show(error)}>
            <TextArea
              rows={3}
              value={text}
              placeholder={t('Pitanje, briga, pohvala ili zamerka, svojim rečima.')}
              aria-label={t('Poruka koordinatorki')}
              onChange={setText}
            />
          </Field>
          <PaneHint>{t('{name} čita svaku poruku i javlja vam se istog dana.', { name: first })}</PaneHint>
        </Part>
      </div>
      <DialogFooter>
        <Button onClick={send}>
          {t('Pošalji poruku')}
        </Button>
      </DialogFooter>
      {caregiver && <CodeDialog open={code} onClose={() => setCode(false)} />}
    </Dialog>
  );
}
