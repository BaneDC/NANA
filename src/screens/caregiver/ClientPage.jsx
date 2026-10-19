import { Fragment, useState } from 'react';
import { History, IdCard } from 'lucide-react';
import { Page, PageActions, PageDescription, PageHeader, PageHeaderText, PagePerson, PageSection, PageTitle } from '@/components/page';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Item, ItemContent, ItemGroup } from '@/components/ui/item';
import { DataList, DataRow, Fact, Facts } from '@/components/data-list';
import { PaneLabel, Stat, Stats } from '@/components/pane';
import { useKept } from '@/hooks/use-kept';
import { useShowMore } from '@/hooks/use-show-more';
import ShowMore from '../../components/ShowMore';
import BackButton from '../../components/BackButton';
import Attention from '../../components/Attention';
import Modal from '../../components/Modal';
import FrailtyScale from '../../components/FrailtyScale';
import Tags from '../../components/Tags';
import { ActivityDrawer, ServiceChips } from '../../components/family/FamilyDrawer';
import { activeVersion, firstName, money, monthOfDay, pendingVersion, rateText, unsettled } from '../../data/familyCare';
import { cannotPlan } from '../../data/caregiverCare';
import { netOf, owes, plannedNet } from '../../data/caregiverView';
import { RECORD_PARTS, alertsOf, partRows } from '../../data/record';
import { SERVICE_FEE } from '../../data/fees';
import { msg, t } from '@/i18n';

// One family from her side (docs/superpowers/specs/2026-10-19-negovateljica-finska-design.md):
// the mirror of the family's page about her. What she owes them first, in the
// orange part; the next visit, the terms, every visit; and two drawers in the
// head, everything about them and everything that happened.

const STATUS = {
  planned: ['secondary', msg('Rezervisano')],
  awaiting: ['destructive', msg('Čeka radni nalog')],
  charging: ['warning', msg('Kod porodice')],
  disputed: ['destructive', msg('Prijava')],
  paid: ['success', msg('Plaćeno')],
  cancelled: ['secondary', msg('Otkazano')],
};

const initials = (name) =>
  (name || '')
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
const net = (rate) => Math.round(rate * (1 - SERVICE_FEE) * 100) / 100;

function Overview({ open, client, onClose }) {
  const { person, care, arrangement: a } = client;
  const answers = person.answers || {};
  const act = a && activeVersion(a);
  const done = a ? a.visits.filter((v) => ['paid', 'charging', 'awaiting', 'disputed'].includes(v.status)).length : 0;
  const you = answers['about-you']?.values || {};
  return (
    <Modal eyebrow={care.elder.name} title={t('Pregled')} wide open={open} onClose={onClose}>
      <Stats>
        <Stat value={done} label={t('poseta do sada')} note={t('{n} zakazano', { n: a ? a.visits.filter((v) => v.status === 'planned').length : 0 })} />
        <Stat value={a?.since || '-'} label={t('zajedno od')} />
      </Stats>
      <PaneLabel>{t('Kontakt porodice')}</PaneLabel>
      <Facts>
        <Fact label={t('Ime')}>{[care.family.name, you.relation && t(you.relation)].filter(Boolean).join(' · ') || '-'}</Fact>
        <Fact label={t('Telefon')}>{you['your-phone'] || '-'}</Fact>
        <Fact label={t('Adresa')}>{answers['about-person']?.values?.city || care.elder.area || '-'}</Fact>
      </Facts>
      <PaneLabel>{t('Na šta paziti')}</PaneLabel>
      <Tags items={alertsOf(answers, person.record)} />
      <FrailtyScale answers={answers} />
      {[RECORD_PARTS.daily, RECORD_PARTS.support].map((part) => (
        <Fragment key={part.id}>
          <PaneLabel>{t(part.title)}</PaneLabel>
          <Facts>
            {partRows(part, answers).rows.map((r) => (
              <Fact key={r.key} label={t(r.label)}>
                {r.value}
              </Fact>
            ))}
          </Facts>
        </Fragment>
      ))}
      {act && (
        <>
          <PaneLabel>{t('Dogovorena nega')}</PaneLabel>
          <ServiceChips ids={act.services} grouped />
        </>
      )}
    </Modal>
  );
}

const OWED = {
  'work-order': { title: msg('Radni nalog čeka'), text: msg('Poseta {date} {time} je prošla. Porodica čeka radni nalog.'), button: msg('Pošalji radni nalog'), act: 'work-order' },
  terms: { title: msg('Pošaljite ugovor'), text: msg('{family} je prihvatila saradnju. Posete počinju kad prihvati uslove.'), button: msg('Pošalji ugovor'), act: 'terms' },
  'waiting-terms': { title: msg('Uslovi čekaju porodicu'), text: msg('Poslali ste verziju {version}. Javićemo vam čim odgovori.') },
  query: { title: msg('Prijava je kod koordinatorke'), text: msg('Porodica je prijavila: {reason}. Koordinatorka proverava i javlja vam se.') },
  extra: { title: msg('Dodatni sat čeka porodicu'), text: msg('Za posetu {date} porodica odlučuje da li odobrava dodatni sat.') },
};

export default function ClientPage({ client, caregiverId, backLabel, onBack, act }) {
  const { care, arrangement: a } = client;
  const [drawer, setDrawer] = useState(null);
  const kept = useKept(drawer);
  const act0 = a && activeVersion(a);
  const pen = a && pendingVersion(a);
  const next = a?.visits.find((v) => v.status === 'planned');
  const why = a && !a.endedOn && cannotPlan(care, caregiverId);
  const owed = owes(care, caregiverId);
  const o = owed && OWED[owed.kind];
  const visits = a ? [...a.visits].sort((x, y) => y.day - x.day || y.start - x.start) : [];
  const list = useShowMore(visits);
  const age = client.person.answers?.['about-person']?.values?.age;

  // the visits by month, as every long list is (docs/patterns.md §8a)
  const months = [];
  for (const v of list.visible) {
    const m = monthOfDay(v.day);
    const last = months[months.length - 1];
    if (last && last.m === m) last.visits.push(v);
    else months.push({ m, visits: [v] });
  }

  return (
    <Page>
      <BackButton label={backLabel} onClick={onBack} />
      <PageHeader>
        <PagePerson className="[--avatar:48px]">
          <Avatar>
            <AvatarFallback>{initials(care.elder.name)}</AvatarFallback>
          </Avatar>
          <PageHeaderText>
            <PageTitle>{care.elder.name}</PageTitle>
            <PageDescription>
              {[age && t('{n} godina', { n: age }), care.elder.area, a?.since && t('od {date}', { date: a.since })].filter(Boolean).join(' · ')}
            </PageDescription>
          </PageHeaderText>
        </PagePerson>
        <PageActions>
          <Button variant="secondary" size="icon" aria-label={t('Pregled')} title={t('Pregled')} onClick={() => setDrawer('overview')}>
            <IdCard size={16} strokeWidth={1.75} />
          </Button>
          <Button variant="secondary" size="icon" aria-label={t('Šta se desilo')} title={t('Šta se desilo')} onClick={() => setDrawer('activity')}>
            <History size={16} strokeWidth={1.75} />
          </Button>
        </PageActions>
      </PageHeader>

      {o && (
        <Attention title={t(o.title)}>
          <Card>
            <CardDescription>
              {t(o.text, {
                date: owed.visit?.date,
                time: owed.visit?.time,
                family: firstName(care.family.name || ''),
                version: owed.version?.version,
                reason: owed.visit?.queryReason ? t(owed.visit.queryReason) : '',
              })}
            </CardDescription>
            {o.button && (
              <CardFooter>
                <Button onClick={() => act(o.act, client, { visitId: owed.visit?.id })}>{t(o.button)}</Button>
              </CardFooter>
            )}
          </Card>
        </Attention>
      )}

      {a && !a.endedOn && act0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('Sledeća poseta')}</CardTitle>
          </CardHeader>
          {next ? (
            <DataList>
              <DataRow label={t('Kada')}>{`${next.date} · ${next.time}`}</DataRow>
              <DataRow label={t('Rezervisano porodici')}>{money(next.hours * next.rate)}</DataRow>
              <DataRow label={t('Vi dobijate')}>{money(plannedNet(next))}</DataRow>
            </DataList>
          ) : (
            <CardDescription>{why || t('Još ništa nije planirano.')}</CardDescription>
          )}
          {(next || !why) && (
            <CardFooter>
              {next ? (
                <Button variant="secondary" onClick={() => act('call-off', client, { visitId: next.id })}>
                  {t('Otkaži posetu')}
                </Button>
              ) : (
                <Button onClick={() => act('plan', client)}>{t('Pošalji plan posete')}</Button>
              )}
            </CardFooter>
          )}
        </Card>
      )}

      {a && (act0 || pen) && (
        <Card>
          <CardHeader>
            <CardTitle>{t('Ugovor o nezi')}</CardTitle>
            <Badge variant={a.endedOn ? 'secondary' : pen ? 'warning' : 'success'}>
              {a.endedOn ? t('Završeno') : pen ? t('Verzija {n} čeka porodicu', { n: pen.version }) : t('Verzija {n} važi', { n: act0.version })}
            </Badge>
          </CardHeader>
          {(act0 || pen) && (
            <DataList>
              <DataRow label={t('Vi dobijate')}>{t('{rate} / h', { rate: money(net((act0 || pen).rate)) })}</DataRow>
              <DataRow label={t('Porodica plaća')}>{rateText((act0 || pen).rate)}</DataRow>
            </DataList>
          )}
          <ServiceChips ids={(act0 || pen).services} grouped />
          {!a.endedOn && unsettled(a).length > 0 && (
            <p className="text-xs leading-body text-muted-foreground">{t('Saradnja se završava kad su sve posete izmirene.')}</p>
          )}
          {!a.endedOn && (
            <CardFooter>
              {pen ? (
                <Button variant="secondary" onClick={() => act('withdraw', client)}>
                  {t('Povuci predlog')}
                </Button>
              ) : (
                <Button variant="secondary" onClick={() => act('terms', client)}>
                  {t('Predloži izmene')}
                </Button>
              )}
              {/* only once nothing is owed either way; otherwise it says why (caregiverEnds) */}
              {!unsettled(a).length && (
                <Button variant="secondary" onClick={() => act('end', client)}>
                  {t('Završi saradnju')}
                </Button>
              )}
            </CardFooter>
          )}
        </Card>
      )}

      {visits.length > 0 && (
        <PageSection title={t('Posete')}>
          <Card>
            {months.map((mo) => (
              <Fragment key={mo.m}>
                <div className="flex items-center gap-2">
                  <PaneLabel>{mo.m}</PaneLabel>
                  <Badge variant="secondary" className="ml-auto">
                    {mo.visits.length}
                  </Badge>
                </div>
                <ItemGroup>
                  {mo.visits.map((v) => {
                    const [variant, label] = STATUS[v.status] || STATUS.paid;
                    const amount = v.status === 'planned' ? plannedNet(v) : v.status === 'cancelled' ? 0 : netOf(v);
                    return (
                      <Item key={v.id} className="items-start gap-3">
                        <ItemContent>
                          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-foreground">
                            {`${v.date} · ${v.time}`}
                            <Badge variant={variant}>{t(label)}</Badge>
                          </p>
                          <p className="text-xs leading-body text-muted-foreground">
                            {t('{hours} h · vi dobijate {amount}', { hours: v.report?.hours ?? v.hours, amount: money(amount) })}
                          </p>
                        </ItemContent>
                        {v.status === 'awaiting' && (
                          <Button variant="secondary" onClick={() => act('no-visit', client, { visitId: v.id })}>
                            {t('Poseta se nije desila')}
                          </Button>
                        )}
                      </Item>
                    );
                  })}
                </ItemGroup>
              </Fragment>
            ))}
            <ShowMore list={list} />
          </Card>
        </PageSection>
      )}

      {kept === 'overview' && <Overview open={drawer === 'overview'} client={client} onClose={() => setDrawer(null)} />}
      {kept === 'activity' && <ActivityDrawer open={drawer === 'activity'} care={care} caregiverId={caregiverId} side="caregiver" onClose={() => setDrawer(null)} />}
    </Page>
  );
}
