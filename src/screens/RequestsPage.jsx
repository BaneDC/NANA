import { useEffect, useState } from 'react';
import { CheckCircle2, Clock, Search, XCircle } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardFooter, CardLink } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Page, PageDescription, PageHeader, PageHeaderText, PageTitle } from '@/components/page';
import Attention from '../components/Attention';
import { Group, Groups } from '../components/Tags';
import { caregivers } from '../data/carePlan';
import { arrangementOf, canAsk, firstName, latestRequest, seeAnswers } from '../data/familyCare';

// Everyone the family has asked about care, and where each one stands. A "yes"
// that became an arrangement links to her page; a "no" always says why, so
// nobody is left guessing. A place of its own in the side menu, so no way back;
// and since finding someone to ask is in the menu too, the page only offers it
// while nobody has been asked yet.
//
// The menu counts the answers the family has not seen (a yes or a no, never a
// request they sent themselves). Being on this page is seeing them, including
// one that arrives while it is open.

const LABEL = { pending: 'Čeka odgovor', accepted: 'Prihvaćeno', declined: 'Odbijeno' };
const BADGE = { pending: 'warning', accepted: 'success', declined: 'destructive' };
const ICON = { pending: Clock, accepted: CheckCircle2, declined: XCircle };
const TABS = ['all', 'pending', 'accepted', 'declined'];

export default function RequestsPage({ care, onCare, onCaregiver, onProfile, onFind, onContact }) {
  const [tab, setTab] = useState('all');
  const mine = care.requests;
  useEffect(() => {
    onCare?.(seeAnswers);
  }, [mine, onCare]);
  const picked = tab === 'all' ? mine : mine.filter((r) => r.status === tab);

  return (
    <Page>
      <PageHeader>
        <PageHeaderText>
          <PageTitle>Moji upiti</PageTitle>
          <PageDescription>Sve negovateljice kojima ste poslali upit, i gde je svaki od njih.</PageDescription>
        </PageHeaderText>
      </PageHeader>

      {/* empty, it says what to do as Moja nega does (docs/patterns.md §5):
          the tint, and the next step in a white card */}
      {!mine.length && (
        <Attention title="Još niste poslali nijedan upit">
          <Card>
            <CardDescription>
              Upit šalje plan nege negovateljici i ništa ne košta. Možete da pitate više njih, a ništa nije dogovoreno
              dok zajedno ne postavite uslove.
            </CardDescription>
            <CardFooter>
              <Button onClick={onFind}>
                <Search size={14} strokeWidth={1.75} />
                Pronađi negovateljicu
              </Button>
            </CardFooter>
          </Card>
        </Attention>
      )}

      {mine.length > 0 && (
        <>
          {/* one is always chosen: pressing the chosen one again does nothing */}
          <ToggleGroup type="single" size="sm" value={tab} onValueChange={(t) => t && setTab(t)} aria-label="Upiti po odgovoru">
            {TABS.map((t) => (
              <ToggleGroupItem key={t} value={t}>
                {t === 'all' ? 'Svi' : LABEL[t]}
                <span className="text-small text-disabled in-data-[state=on]:text-inherit in-data-[state=on]:opacity-80">
                  {t === 'all' ? mine.length : mine.filter((r) => r.status === t).length}
                </span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>

          <div className="flex flex-col gap-2">
            {picked.map((r) => {
              const cg = caregivers.find((c) => c.id === r.caregiverId);
              if (!cg) return null;
              const Icon = ICON[r.status];
              const linked = r.status === 'accepted' && arrangementOf(care, r.caregiverId);
              // only the latest request to her can be followed by another
              const askAgain = r.status === 'declined' && latestRequest(care, r.caregiverId) === r && canAsk(care, r.caregiverId);
              return (
                <Card key={r.id || r.caregiverId}>
                  {/* Who she is, and under her name everything about the
                      request, in the same column: the avatar stands apart on
                      the left, as in every row on Moja nega (docs/patterns.md
                      §6). The state is a pill beside her name.
                      The whole card opens her: her page once they work
                      together, her profile otherwise (§7). The one button is
                      "Pitaj ponovo", which sends something rather than opens
                      it, so it stays on a phone too. */}
                  <div className="flex items-start gap-3 [--avatar:calc(var(--text-sm-leading)+var(--spacing-2)+var(--text-body-leading))] phone:flex-wrap">
                    <Avatar>
                      <AvatarFallback>{cg.initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex min-w-0 flex-1 flex-col gap-1 phone:basis-[calc(100%-var(--avatar)-var(--spacing-3))]">
                      <p className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium text-foreground">
                        <CardLink onClick={() => (linked ? onCaregiver(r.caregiverId) : onProfile?.(cg))}>{cg.name}</CardLink>
                        <Badge variant={BADGE[r.status]} className="my-[calc((var(--text-xs-leading)-20px)/2)]">
                          <Icon size={12} strokeWidth={2} />
                          {LABEL[r.status]}
                        </Badge>
                      </p>
                      <p className="text-xs leading-body text-muted-foreground">
                        {cg.area} · {cg.rate} · {r.again ? 'ponovni upit' : 'upit'} poslat {r.requested}
                      </p>
                      <Groups className="mt-2">
                        <Group label="Vaša poruka" text={r.message} />
                        <p className="text-xs leading-body text-muted-foreground">
                          {r.status === 'declined' ? (
                            <>
                              <strong>Razlog: </strong>
                              {r.detail}
                            </>
                          ) : r.status === 'pending' ? (
                            `${firstName(cg.name)} još nije odgovorila. Javićemo vam u svakom slučaju.`
                          ) : linked ? (
                            `${firstName(cg.name)} je prihvatila. Ugovor i posete su na njenoj stranici.`
                          ) : (
                            `${firstName(cg.name)} je prihvatila. ${r.detail}`
                          )}
                        </p>
                      </Groups>
                    </div>
                    {/* its one action top right, level with her name; on a
                        phone under what the card says, in its column */}
                    {askAgain && (
                      <div className="flex shrink-0 gap-2 phone:mt-1 phone:ml-[calc(var(--avatar)+var(--spacing-3))] phone:w-[calc(100%-var(--avatar)-var(--spacing-3))] phone:*:flex-auto">
                        <Button onClick={() => onContact?.(cg)}>Pitaj ponovo</Button>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
            {!picked.length && (
              <Card>
                <p className="text-xs leading-body text-muted-foreground">Ovde nema ničega.</p>
              </Card>
            )}
          </div>
        </>
      )}
    </Page>
  );
}
