import { Check, Send } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SheetDescription } from '@/components/ui/sheet';
import { Item, ItemContent, ItemGroup } from '@/components/ui/item';
import { DataList, DataRow } from '@/components/data-list';
import { PaneLabel } from '@/components/pane';
import { caregivers, daysText, slotsText } from '../data/carePlan';
import { allVisits, firstName, money, pendingVersion, services, standingWith, waitingOnYou } from '../data/familyCare';
import { priceLine } from '../data/plans';
import PlanContents from './PlanContents';
import VisitRow from './family/VisitRow';
import CaregiverHead from './CaregiverHead';
import Rating from './Rating';
import Tags from './Tags';
import { msg, t } from '../i18n';

// What opens beside the conversation when the family presses a card in the
// chat. The kit draws the pane and decides where it goes; these are what is in
// it — the same things the app's pages show, cut to the pane's width, so a
// question asked in the chat is answered without leaving it.
//
// Each has an id (`page:<kind>`) the assistant's answer carries as an artifact
// part; `paneFor` turns an open id into the pane's title and contents, and
// `previewFor` into the few lines the card in the answer shows.

const STATUS = { pending: msg('Čeka odgovor'), accepted: msg('Prihvatila'), declined: msg('Ne može') };
const BADGE = { pending: 'warning', accepted: 'success', declined: 'destructive' };

function Empty({ children }) {
  return <p className="text-xs leading-body text-muted-foreground">{children}</p>;
}

// a pane's contents, 12 apart (16 for the plan)
function Pane({ plan, children }) {
  return <div className={plan ? 'flex flex-col gap-4' : 'flex flex-col gap-3'}>{children}</div>;
}

// A row in a pane: the avatar as tall as the title and the line under it, the
// text, and on the right a state or a button (on a phone the button goes
// under the text, the full width).
function Row({ initials, title, children, end }) {
  return (
    <Item className="items-start gap-3 [--avatar:calc(var(--text-xs-leading)+2px+var(--text-body-leading))] phone:flex-wrap">
      <Avatar>
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <ItemContent>
        <p className="-mb-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-foreground">{title}</p>
        {children}
      </ItemContent>
      {end}
    </Item>
  );
}

const body = 'text-xs leading-body text-muted-foreground';
const groupTitle = 'text-small font-medium text-muted-foreground';

function RequestsPane({ care }) {
  if (!care.requests.length) return <Empty>{t('Još niste pisali nijednoj negovateljici.')}</Empty>;
  return (
    <ItemGroup>
      {care.requests.map((r) => {
        const c = caregivers.find((x) => x.id === r.caregiverId);
        return (
          <Row key={r.caregiverId} initials={c?.initials} title={c?.name} end={<Badge variant={BADGE[r.status]}>{t(STATUS[r.status])}</Badge>}>
            <p className={body}>{t(r.detail)}</p>
          </Row>
        );
      })}
    </ItemGroup>
  );
}

function CarePane({ care, onDrawer }) {
  const waiting = waitingOnYou(care);
  const coming = allVisits(care).filter((v) => v.status === 'planned');
  if (!waiting.length && !coming.length && !care.arrangements.length) {
    return <Empty>{t('Još ništa nije dogovoreno. Kad negovateljica odgovori na poruku, ovde se vidi šta je sledeće.')}</Empty>;
  }
  return (
    <>
      {waiting.length > 0 && <p className={groupTitle}>{t('Čeka na vas')}</p>}
      <ItemGroup>
        {waiting.map((w) =>
          w.kind === 'terms' ? (
            <Row
              key={`t-${w.arrangement.caregiver.id}`}
              initials={w.arrangement.caregiver.initials}
              title={t('{name} je poslala uslove', { name: firstName(w.arrangement.caregiver.name) })}
              end={
                <Button className="phone:w-full" onClick={() => onDrawer({ kind: 'terms', caregiverId: w.arrangement.caregiver.id })}>
                  {t('Pogledaj')}
                </Button>
              }
            >
              <p className={body}>
                {t('{services} po {rate} na sat', { services: services(w.version.services.length), rate: money(w.version.rate) })}
              </p>
            </Row>
          ) : (
            <Row
              key={`w-${w.visit.id}`}
              initials={w.visit.caregiver.initials}
              title={t('Radni nalog za {date}', { date: w.visit.date })}
              end={
                <Button variant="secondary" className="phone:w-full" onClick={() => onDrawer({ kind: 'work-order', visitId: w.visit.id })}>
                  {t('Pogledaj')}
                </Button>
              }
            />
          )
        )}
      </ItemGroup>
      {coming.length > 0 && <p className={groupTitle}>{t('Predstoji')}</p>}
      <ItemGroup>
        {coming.map((v) => (
          <VisitRow key={v.id} visit={v} showWho onDrawer={onDrawer} />
        ))}
      </ItemGroup>
    </>
  );
}

function VisitsPane({ care, onDrawer }) {
  const visits = allVisits(care);
  if (!visits.length) return <Empty>{t('Još nema nijedne posete.')}</Empty>;
  return (
    <ItemGroup>
      {visits.map((v) => (
        <VisitRow key={v.id} visit={v} showWho onDrawer={onDrawer} />
      ))}
    </ItemGroup>
  );
}

function CaregiversPane({ care, onContact }) {
  const list = [...caregivers].sort((a, b) => b.match - a.match);
  return (
    <ItemGroup>
      {list.map((c) => {
        const asked = care.requests.some((r) => r.caregiverId === c.id);
        return (
          <Row
            key={c.id}
            initials={c.initials}
            title={c.name}
            end={
              asked ? (
                <Badge variant="success">
                  <Check size={12} strokeWidth={2} />
                  {t('Poslato')}
                </Badge>
              ) : (
                <Button className="phone:w-full" onClick={() => onContact(c)}>
                  <Send size={14} strokeWidth={1.75} />
                  {t('Poruka')}
                </Button>
              )
            }
          >
            <p className={body}>
              <Rating caregiver={c} /> · {c.rate} · {t('{area}, do {km} km', { area: c.area, km: c.radius })}
            </p>
          </Row>
        );
      })}
    </ItemGroup>
  );
}

function SettingsPane({ care, unlocked, country, onUnlock }) {
  return (
    <DataList className="mt-2">
      <DataRow label={t('Pretplata')}>{unlocked ? `${t('Aktivna')} · ${priceLine(country)}` : t('Nije aktivna')}</DataRow>
      <DataRow label={t('Kartica')}>
        {care.payment.connected ? `${care.payment.brand} ···· ${care.payment.last4}` : t('Još nije dodata')}
      </DataRow>
      {!unlocked && (
        <div className="mt-1 flex gap-2 phone:flex-wrap phone:*:flex-auto">
          <Button onClick={onUnlock}>{t('Pretplati se')}</Button>
        </div>
      )}
    </DataList>
  );
}

// The pane for an open id, or null for one this build does not know.
export function paneFor(openId, ctx) {
  const [, kind, id] = String(openId).split(':');
  const { plan, care, unlocked, planChange, onContact, onUnlock, onDrawer, onOpenPage } = ctx;
  switch (kind) {
    case 'plan':
      return plan
        ? {
            title: `${t('Plan nege')} · ${plan.name}`,
            meta: t('Aktivan'),
            children: (
              <Pane plan>
                <PlanContents
                  plan={plan}
                  unlocked={unlocked}
                  onSelectCaregiver={onContact}
                  onUnlock={onUnlock}
                  onFindCaregivers={() => onOpenPage('find-caregiver')}
                  change={planChange}
                />
              </Pane>
            ),
          }
        : null;
    case 'my-care':
      return { title: t('Moja nega'), children: <Pane><CarePane care={care} onDrawer={onDrawer} /></Pane> };
    case 'requests':
      return { title: t('Moji upiti'), meta: `${care.requests.length}`, children: <Pane><RequestsPane care={care} /></Pane> };
    case 'visits':
      return { title: t('Posete'), children: <Pane><VisitsPane care={care} onDrawer={onDrawer} /></Pane> };
    case 'find-caregiver':
      return { title: t('Negovateljice za vas'), meta: `${caregivers.length}`, children: <Pane><CaregiversPane care={care} onContact={onContact} /></Pane> };
    case 'settings':
      return { title: t('Pretplata i plaćanje'), children: <Pane><SettingsPane care={care} unlocked={unlocked} country={ctx.user?.country} onUnlock={onUnlock} /></Pane> };
    case 'caregiver': {
      const c = caregivers.find((x) => x.id === id);
      if (!c) return null;
      const asked = care.requests.find((r) => r.caregiverId === c.id);
      return {
        title: t('Informacije o negovateljici'),
        children: (
          <Pane>
            <CaregiverHead caregiver={c} standing={standingWith(care, c.id)} />
            <PaneLabel>{t('O sebi')}</PaneLabel>
            <SheetDescription>{t(c.bio)}</SheetDescription>
            <PaneLabel>{t('Klasifikacije')}</PaneLabel>
            <Tags items={c.classifications} />
            <DataList className="mt-2">
              <DataRow label={t('Dolazi')}>
                {daysText(c.days)} · {slotsText(c.slots)}
              </DataRow>
              <DataRow label={t('Jezici')}>{c.languages.map((l) => t(l)).join(', ')}</DataRow>
            </DataList>
            {asked ? (
              <p className={body}>{t(asked.detail)}</p>
            ) : (
              <div className="mt-1 flex gap-2 phone:flex-wrap phone:*:flex-auto">
                <Button onClick={() => onContact(c)}>
                  <Send size={14} strokeWidth={1.75} />
                  {t('Pošalji poruku')}
                </Button>
              </div>
            )}
          </Pane>
        ),
      };
    }
    default:
      return null;
  }
}

// What the card in the answer shows before it is opened: a few plain lines.
export function previewFor(kind, { plan, care }) {
  switch (kind) {
    case 'plan':
      return { title: `${t('Plan nege')} · ${plan?.name || ''}`, meta: t('Aktivan'), content: (plan?.recommendations || []).map((r) => r.title).join('\n') };
    case 'my-care': {
      const waiting = waitingOnYou(care);
      const coming = allVisits(care).filter((v) => v.status === 'planned');
      return {
        title: t('Moja nega'),
        content: [
          waiting.length ? t('Čeka na vas: {count}', { count: waiting.length }) : t('Ništa ne čeka na vas'),
          ...coming.map((v) => `${v.date} · ${v.time} · ${v.caregiver.name}`),
          ...care.arrangements.filter((a) => pendingVersion(a)).map((a) => t('{name} je poslala uslove', { name: a.caregiver.name })),
        ].join('\n'),
      };
    }
    case 'requests':
      return {
        title: t('Moji upiti'),
        meta: `${care.requests.length}`,
        content: care.requests.length
          ? care.requests.map((r) => `${caregivers.find((c) => c.id === r.caregiverId)?.name} · ${t(STATUS[r.status])}`).join('\n')
          : t('Još nijedan upit'),
      };
    case 'visits': {
      const visits = allVisits(care);
      return { title: t('Posete'), content: visits.length ? visits.map((v) => `${v.date} · ${v.caregiver.name}`).join('\n') : t('Još nema poseta') };
    }
    case 'find-caregiver':
      return {
        title: t('Negovateljice za vas'),
        meta: `${caregivers.length}`,
        content: [...caregivers].sort((a, b) => b.match - a.match).map((c) => `${c.name} · ${c.match}% · ${c.rate}`).join('\n'),
      };
    case 'settings':
      return { title: t('Pretplata i plaćanje'), content: care.payment.connected ? t('Kartica je sačuvana') : t('Kartica još nije dodata') };
    default:
      return null;
  }
}
