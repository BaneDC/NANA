import { Fragment } from 'react';
import { Page, PageDescription, PageHeader, PageHeaderText, PageSection, PageTitle } from '@/components/page';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Item, ItemContent, ItemGroup } from '@/components/ui/item';
import { PaneLabel } from '@/components/pane';
import StatCard from '../../components/StatCard';
import { useShowMore } from '@/hooks/use-show-more';
import ShowMore from '../../components/ShowMore';
import Attention from '../../components/Attention';
import { money, monthTitle } from '../../data/familyCare';
import { earnings, netOf } from '../../data/caregiverView';
import { t } from '@/i18n';

// What she has earned: her share of every paid visit, from the charge on the
// family's card to Stripe, which pays it into her bank. The family is never
// shown a sum of what it paid (docs/patterns.md §8); she is shown what she
// earned, since that is what this page is for.
export default function Earnings({ clients, caregiverId, payouts, onPayouts }) {
  const e = earnings(clients, caregiverId);
  const list = useShowMore(e.paid);
  const months = [];
  for (const v of list.visible) {
    const last = months[months.length - 1];
    if (last && last.m === v.month) last.visits.push(v);
    else months.push({ m: v.month, visits: [v] });
  }
  return (
    <Page>
      <PageHeader>
        <PageHeaderText>
          <PageTitle>{t('Zarada')}</PageTitle>
          <PageDescription>{t('Svaka plaćena poseta, od naplate porodici do isplate vama. Iznosi su vaš deo, posle provizije.')}</PageDescription>
        </PageHeaderText>
      </PageHeader>

      {!payouts && (
        <Attention title={t('Isplate još nisu pokrenute')}>
          <Card>
            <CardDescription>{t('Da biste primali isplate, završite podešavanje Stripe naloga.')}</CardDescription>
            <CardFooter>
              <Button onClick={onPayouts}>{t('Završite podešavanje')}</Button>
            </CardFooter>
          </Card>
        </Attention>
      )}

      {/* three numbers, each a card, as on the family's home (docs/patterns.md
          §4a): three to a line, on a narrow page two and the third the whole
          line; the grid follows the page's room, not the window */}
      <div className="@container">
        <div className="grid grid-cols-2 gap-3 @lg:grid-cols-3">
          <StatCard value={money(e.paidTotal)} label={t('Isplaćeno do sada')} note={t('ukupno, od prve posete')} />
          <StatCard value={money(e.processing)} label={t('U obradi')} note={t('naplata za 24 sata')} />
          <StatCard className="col-span-2 @lg:col-span-1" value={money(e.reserved)} label={t('Rezervisano')} note={t('za zakazane posete')} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('Isplate i banka')}</CardTitle>
        </CardHeader>
        <CardDescription>{t('Stripe vam šalje isplatu svake nedelje, na račun koji ste uneli kod njih.')}</CardDescription>
        <CardFooter>
          <Button variant="secondary" onClick={() => window.open('about:blank', '_blank', 'noopener')}>
            {t('Isplate u Stripe-u')}
          </Button>
        </CardFooter>
      </Card>

      <PageSection title={t('Plaćene posete')}>
        <Card>
          {e.paid.length === 0 ? (
            <CardDescription>{t('Još nema plaćenih poseta. Poseta je ovde kad se porodici naplati, posle radnog naloga.')}</CardDescription>
          ) : (
            months.map((mo) => (
              <Fragment key={mo.m}>
                <div className="flex items-center gap-2 phone:flex-wrap phone:gap-y-2">
                  <PaneLabel>{monthTitle(mo.m)}</PaneLabel>
                  <Badge variant="secondary" className="ml-auto phone:ml-0">
                    {mo.visits.length}
                  </Badge>
                </div>
                <ItemGroup>
                  {mo.visits.map((v) => (
                    // a visit's id is unique within its family only, and this list is every family's
                    <Item key={`${v.clientId}-${v.id}`} className="items-start gap-3">
                      <ItemContent>
                        <p className="text-xs font-medium text-foreground">{v.elder}</p>
                        <p className="text-xs leading-body text-muted-foreground">{`${v.date} · ${v.time}`}</p>
                      </ItemContent>
                      <div className="flex flex-col items-end">
                        <p className="text-xs font-medium text-foreground">{money(netOf(v))}</p>
                        {v.chargedOn && <p className="text-small text-muted-foreground">{t('naplaćeno {date}', { date: v.chargedOn })}</p>}
                      </div>
                    </Item>
                  ))}
                </ItemGroup>
              </Fragment>
            ))
          )}
          <ShowMore list={list} />
        </Card>
      </PageSection>
    </Page>
  );
}
