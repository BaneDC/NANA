import { useState } from 'react';
import { Page, PageDescription, PageHeader, PageHeaderText, PageTitle } from '@/components/page';
import { Card, CardDescription, CardFooter, CardLink } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useShowMore } from '@/hooks/use-show-more';
import ShowMore from '../../components/ShowMore';
import Attention from '../../components/Attention';
import Tags, { Group, Groups } from '../../components/Tags';
import { PersonRows } from '../../components/PlanFooterBlocks';
import { firstName } from '../../data/familyCare';
import { scheduleText } from '../../data/familyStart';
import { serviceTitle } from '../../data/serviceCatalog';
import { msg, t } from '@/i18n';

// Her home in Serbia (docs/superpowers/specs/2026-10-19-negovateljica-srbija-design.md):
// the requests families sent her, by where each stands. Only the request goes
// through the platform: once she says yes, the two have each other's contact
// and agree the rest by phone. No tiles of counts above the filter: the chips
// carry the numbers, as on "Moji upiti".
const TABS = [
  { id: 'pending', label: msg('Čeka') },
  { id: 'accepted', label: msg('Prihvaćeni') },
  { id: 'declined', label: msg('Odbijeni') },
];
const BADGE = { pending: ['warning', msg('Čeka vaš odgovor')], accepted: ['success', msg('Prihvatili ste')], declined: ['destructive', msg('Odbili ste')] };

const initials = (name) =>
  (name || '')
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

export default function RequestsRs({ user, clients, onOpen, act }) {
  const of = (id) => clients.filter((c) => c.request?.status === id);
  // until she picks one, the filter follows what there is: what waits first
  const [chosen, setTab] = useState(null);
  const tab = chosen || (of('pending').length ? 'pending' : 'accepted');
  const list = useShowMore(of(tab), { reset: tab });
  return (
    <Page>
      <PageHeader>
        <PageHeaderText>
          <PageTitle>{t('Dobro došli, {name}', { name: firstName(user.name) })}</PageTitle>
          <PageDescription>{t('Porodice koje su vam pisale, i gde je svaki upit.')}</PageDescription>
        </PageHeaderText>
      </PageHeader>

      {clients.length === 0 ? (
        <Attention title={t('Još nema upita')}>
          <Card>
            <CardDescription>{t('Kad vam porodica pošalje upit, stiže ovde zajedno sa planom nege.')}</CardDescription>
          </Card>
        </Attention>
      ) : (
        <>
          <ToggleGroup type="single" size="sm" scroll className="pl-4 phone:pl-8" value={tab} onValueChange={(v) => v && setTab(v)} aria-label={t('Upiti po odgovoru')}>
            {TABS.map((x) => (
              <ToggleGroupItem key={x.id} value={x.id}>
                {t(x.label)}
                <span className="text-small text-disabled in-data-[state=on]:text-inherit in-data-[state=on]:opacity-80">{of(x.id).length}</span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <div className="flex flex-col gap-3">
            {list.visible.map((c) => {
              const { care, request: r } = c;
              const [variant, label] = BADGE[r.status];
              const age = c.person.answers?.['about-person']?.values?.age;
              return (
                <Card key={c.id}>
                  <div className="flex items-start gap-3 [--avatar:calc(var(--text-xs-leading)+2px+var(--text-body-leading))]">
                    <Avatar>
                      <AvatarFallback>{initials(care.elder.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <p className="-mb-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-foreground">
                        {/* a declined request opens nothing */}
                        {r.status === 'declined' ? care.elder.name : <CardLink onClick={() => onOpen(c.id)}>{care.elder.name}</CardLink>}
                        <Badge variant={variant} className="my-[calc((var(--text-xs-leading)-20px)/2)]">
                          {t(label)}
                        </Badge>
                      </p>
                      <p className="text-xs leading-body text-muted-foreground">
                        {r.status === 'declined'
                          ? t('Odbili ste: {reason}', { reason: t(r.detail) })
                          : [age && t('{n} godina', { n: age }), care.elder.area, t('upit {when}', { when: r.requested })].filter(Boolean).join(' · ')}
                      </p>
                      {r.status !== 'declined' && (
                        <Groups className="mt-2">
                          {care.need?.services?.length > 0 && (
                            <Group label={t('Potrebne usluge')}>
                              <Tags items={care.need.services.map(serviceTitle)} />
                            </Group>
                          )}
                          {care.need?.schedule && <Group label={t('Kada')} text={scheduleText(care.need.schedule)} />}
                          {r.message && <Group label={t('Poruka porodice')} text={t(r.message)} />}
                        </Groups>
                      )}
                    </div>
                  </div>
                  {/* after a yes, the family's contact: they agree the rest by phone */}
                  {r.status === 'accepted' && care.family.phone && (
                    <>
                      <p className="mt-2 text-small font-medium text-muted-foreground">{t('Kontakt porodice · {name}', { name: care.family.name })}</p>
                      <PersonRows phone={care.family.phone} email={care.family.email || ''} />
                    </>
                  )}
                  {r.status === 'pending' && (
                    <CardFooter>
                      <Button onClick={() => act('accept', c)}>{t('Prihvati')}</Button>
                      <Button variant="secondary" onClick={() => act('decline', c)}>
                        {t('Odbij')}
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              );
            })}
            {!of(tab).length && <p className="px-4 text-xs leading-body text-muted-foreground">{t('Ovde još nema ničega.')}</p>}
            <ShowMore list={list} />
          </div>
        </>
      )}
    </Page>
  );
}
