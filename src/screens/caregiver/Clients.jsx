import { useState } from 'react';
import { Page, PageDescription, PageHeader, PageHeaderText, PageTitle } from '@/components/page';
import { Card, CardLink } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useShowMore } from '@/hooks/use-show-more';
import ShowMore from '../../components/ShowMore';
import { activeVersion, lastVersion, money } from '../../data/familyCare';
import { msg, t } from '@/i18n';

// Everyone she has said yes to, and every request she declined: the board
// carries what still needs her, this is the whole history
// (docs/superpowers/specs/2026-10-19-negovateljica-finska-design.md).
const TABS = [
  { id: 'now', label: msg('Sada'), of: (c) => ['agreement', 'active', 'work-order'].includes(c.stage) },
  { id: 'ended', label: msg('Završeno'), of: (c) => c.stage === 'ended' },
  { id: 'declined', label: msg('Odbijeni'), of: (c) => c.stage === 'declined' },
];

const initials = (name) =>
  (name || '')
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

export default function Clients({ clients, onOpen }) {
  const [tab, setTab] = useState('now');
  const picked = clients.filter(TABS.find((x) => x.id === tab).of);
  const list = useShowMore(picked, { reset: tab });
  return (
    <Page>
      <PageHeader>
        <PageHeaderText>
          <PageTitle>{t('Klijenti')}</PageTitle>
          <PageDescription>{t('Svi koje ste prihvatili i svi upiti koje ste odbili. Tabla nosi ono što čeka, ovde je cela istorija.')}</PageDescription>
        </PageHeaderText>
      </PageHeader>
      {/* a filter, 16 in as on every page; on a phone one row that scrolls (§4, §12) */}
      <ToggleGroup type="single" size="sm" scroll className="pl-4 phone:pl-8" value={tab} onValueChange={(v) => v && setTab(v)} aria-label={t('Klijenti po stanju')}>
        {TABS.map((x) => (
          <ToggleGroupItem key={x.id} value={x.id}>
            {t(x.label)}
            <span className="text-small text-disabled in-data-[state=on]:text-inherit in-data-[state=on]:opacity-80">{clients.filter(x.of).length}</span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <div className="flex flex-col gap-3">
        {list.visible.map((c) => {
          const a = c.arrangement;
          const v = a && (activeVersion(a) || lastVersion(a));
          const visits = a ? a.visits.filter((x) => ['paid', 'charging', 'awaiting', 'disputed'].includes(x.status)).length : 0;
          return (
            <Card key={c.id}>
              <div className="flex items-start gap-3 [--avatar:calc(var(--text-xs-leading)+2px+var(--text-body-leading))]">
                <Avatar>
                  <AvatarFallback>{initials(c.care.elder.name)}</AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <p className="-mb-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-foreground">
                    {/* a declined request opens nothing */}
                    {c.stage === 'declined' ? c.care.elder.name : <CardLink onClick={() => onOpen(c.id)}>{c.care.elder.name}</CardLink>}
                    <Badge variant={c.stage === 'declined' ? 'destructive' : c.stage === 'ended' ? 'secondary' : 'success'} className="my-[calc((var(--text-xs-leading)-20px)/2)]">
                      {c.stage === 'declined' ? t('Odbijeno') : c.stage === 'ended' ? t('Završeno') : t('Aktivno')}
                    </Badge>
                  </p>
                  <p className="text-xs leading-body text-muted-foreground">
                    {c.stage === 'declined'
                      ? t('Odbili ste: {reason}', { reason: t(c.request.detail) })
                      : [c.care.elder.area, a?.since && t('od {date}', { date: a.since }), v && t('{rate} / h', { rate: money(v.rate) }), t('{n} poseta', { n: visits })].filter(Boolean).join(' · ')}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
        {!picked.length && <p className="px-4 text-xs leading-body text-muted-foreground">{t('Ovde još nema nikoga.')}</p>}
        <ShowMore list={list} />
      </div>
    </Page>
  );
}
