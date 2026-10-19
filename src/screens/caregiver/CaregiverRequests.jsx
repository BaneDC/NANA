import { useState } from 'react';
import { Page, PageDescription, PageHeader, PageHeaderText, PageTitle } from '@/components/page';
import { Card, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { DialogFooter } from '@/components/ui/dialog';
import { PaneLabel } from '@/components/pane';
import { useKept } from '@/hooks/use-kept';
import Dialog from '../../components/Dialog';
import Attention from '../../components/Attention';
import Tags, { Group, Groups } from '../../components/Tags';
import { DECLINE_REASONS, answerRequest } from '../../data/caregiverCare';
import { firstName } from '../../data/familyCare';
import { scheduleText } from '../../data/familyStart';
import { serviceTitle } from '../../data/serviceCatalog';
import { market } from '../../data/market';
import { msg, t } from '@/i18n';

// Her first page, for now: every request the demo's family sent her, newest
// first. One that waits has "Prihvati" and "Odbij"; one that has its answer
// says it. A card here opens nothing yet, so its actions are in its footer
// (docs/patterns.md §7). The board (Finland) and the full requests page
// (Serbia) replace it in parts 3 and 4.
const BADGE = { pending: 'warning', accepted: 'success', declined: 'destructive' };
const LABEL = { pending: msg('Čeka vaš odgovor'), accepted: msg('Prihvatili ste'), declined: msg('Odbili ste') };

const initials = (name) =>
  name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

export default function CaregiverRequests({ user, care, onCare, onFlash }) {
  const mine = care.requests.filter((r) => r.caregiverId === user.caregiverId);
  const [declining, setDeclining] = useState(null);
  const shown = useKept(declining);
  const [reason, setReason] = useState(DECLINE_REASONS[0]);
  const elder = care.elder.name || t('Bez imena');
  const family = firstName(care.family.name || '');

  // the other tab may have taken the request back meanwhile: then nothing is said
  const waiting = () => care.requests.some((r) => r.caregiverId === user.caregiverId && r.status === 'pending');
  const accept = () => {
    if (!waiting()) return;
    onCare(answerRequest(user.caregiverId, true));
    onFlash(
      market() === 'RS'
        ? t('Prihvatili ste. {name} vidi vaš telefon i e-mail.', { name: family })
        : t('Prihvatili ste. Sledeće su uslovi saradnje.')
    );
  };
  const decline = () => {
    setDeclining(null);
    if (!waiting()) return;
    onCare(answerRequest(user.caregiverId, false, reason));
    onFlash(t('Upit je odbijen. {name} je obaveštena.', { name: family }));
  };

  return (
    <Page>
      <PageHeader>
        <PageHeaderText>
          <PageTitle>{t('Upiti')}</PageTitle>
          <PageDescription>{t('Porodice koje su vam pisale, i gde je svaki upit.')}</PageDescription>
        </PageHeaderText>
      </PageHeader>

      {mine.length === 0 ? (
        <Attention title={t('Još nema upita')}>
          <Card>
            <CardDescription>{t('Kad vam porodica pošalje upit, stiže ovde zajedno sa planom nege.')}</CardDescription>
          </Card>
        </Attention>
      ) : (
        <div className="flex flex-col gap-3">
          {mine.map((r) => (
            <Card key={r.id}>
              {/* who asks, the avatar apart on the left and everything about
                  the request in the column beside it (docs/patterns.md §6) */}
              <div className="flex items-start gap-3 [--avatar:calc(var(--text-xs-leading)+2px+var(--text-body-leading))]">
                <Avatar>
                  <AvatarFallback>{initials(elder)}</AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <p className="-mb-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-foreground">
                    {elder}
                    <Badge variant={BADGE[r.status]} className="my-[calc((var(--text-xs-leading)-20px)/2)]">
                      {t(LABEL[r.status])}
                    </Badge>
                  </p>
                  <p className="text-xs leading-body text-muted-foreground">
                    {[care.family.name, care.elder.area, t('upit {when}', { when: r.requested })].filter(Boolean).join(' · ')}
                  </p>
                  <Groups className="mt-2">
                    {care.need?.services?.length > 0 && (
                      <Group label={t('Šta je potrebno')}>
                        <Tags items={care.need.services.map(serviceTitle)} />
                      </Group>
                    )}
                    {care.need?.schedule && <Group label={t('Kada')} text={scheduleText(care.need.schedule)} />}
                    {r.message && <Group label={t('Poruka porodice')} text={t(r.message)} />}
                  </Groups>
                </div>
              </div>
              {r.status === 'pending' && (
                <CardFooter>
                  <Button onClick={accept}>{t('Prihvati')}</Button>
                  <Button variant="secondary" onClick={() => setDeclining(r)}>
                    {t('Odbij')}
                  </Button>
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      )}

      {shown && (
        <Dialog open={Boolean(declining)} eyebrow={elder} title={t('Odbiti upit?')} onClose={() => setDeclining(null)}>
          <PaneLabel>{t('Zašto')}</PaneLabel>
          <ToggleGroup type="single" size="sm" value={reason} onValueChange={(id) => id && setReason(id)} aria-label={t('Zašto')}>
            {DECLINE_REASONS.map((x) => (
              <ToggleGroupItem key={x} value={x}>
                {t(x)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDeclining(null)}>
              {t('Nazad')}
            </Button>
            {/* "default", not "destructive": nothing is deleted (docs/patterns.md §9) */}
            <Button onClick={decline}>{t('Odbij upit')}</Button>
          </DialogFooter>
        </Dialog>
      )}
    </Page>
  );
}
