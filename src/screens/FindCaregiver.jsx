import { useMemo, useState } from 'react';
import { Phone } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardLink } from '@/components/ui/card';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Page, PageDescription, PageHeader, PageHeaderText, PageTitle } from '@/components/page';
import { caregivers, matchReasons } from '../data/carePlan';
import { standingWith } from '../data/familyCare';
import Rating from '../components/Rating';
import Tags, { Groups } from '../components/Tags';
import Standing from '../components/Standing';
import AskAssistant from '../components/AskAssistant';
import { CaregiverName } from '../components/CaregiverHead';

// Browsing for someone, as its own page rather than a button on one screen.
// The header shortcut on the dashboard opens this; wanting a second pair of
// hands, or a different one, is a thing a family can do at any time, and a
// capability that exists on only one screen is not a capability.


// How many fit on a page. The list is ordered by how well each one matches the
// plan, so a page is "the next few best", not an arbitrary slice.
const PER_PAGE = 10;

// what stands under her text on a phone starts where her name does
const underText = 'phone:ml-[calc(var(--avatar)+var(--spacing-3))]';

export default function FindCaregiver({ care, onContact, onDrawer, onFlash, onAskAssistant }) {
  const [page, setPage] = useState(1);

  // best match first, as the recommendation it is
  const results = useMemo(() => [...caregivers].sort((a, b) => b.match - a.match), []);

  const pages = Math.max(1, Math.ceil(results.length / PER_PAGE));
  const shown = results.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // the message is written in the modal and sent once the subscription is paid
  const ask = (c) => onContact(c);

  return (
    <Page>
      <PageHeader>
        <PageHeaderText>
          <PageTitle>Pronađi negovateljicu</PageTitle>
          <PageDescription>
            Na osnovu onoga što ste nam rekli, ovo su negovateljice koje najbolje odgovaraju. Upit im
            šalje plan nege i ništa ne košta - možete da pitate više njih, a ništa nije dogovoreno dok
            zajedno ne postavite uslove.
          </PageDescription>
        </PageHeaderText>
        <AskAssistant onClick={onAskAssistant} />
      </PageHeader>

      <div className="flex items-baseline gap-3 text-small leading-body text-muted-foreground">
        {/* what this page shows, out of everyone */}
        <span>
          {shown.length} od {results.length} negovateljica
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {shown.map((c) => {
          const standing = standingWith(care, c.id);
          return (
            // The whole card opens her profile — the name is the link, and it
            // covers the card (docs/patterns.md §7). The avatar is as tall as
            // her name and the line under it (40, 44 under a finger).
            <Card
              key={c.id}
              className="flex-row items-start gap-3 [--avatar:calc(var(--text-sm-leading)+var(--spacing-1)+16px)] phone:flex-wrap"
            >
              <Avatar>
                <AvatarFallback>{c.initials}</AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-1 flex-col gap-1 phone:basis-[calc(100%-var(--avatar)-var(--spacing-3))]">
                <CaregiverName name={c.name} match={c.match}>
                  <span className="text-sm font-medium text-foreground">
                    <CardLink onClick={() => onDrawer({ kind: 'profile', caregiverId: c.id })}>{c.name}</CardLink>
                  </span>
                </CaregiverName>
                <div className="text-[11px] leading-4 text-muted-foreground pointer-coarse:text-small">
                  <Rating caregiver={c} /> · {c.rate} · {c.area}, do {c.radius} km
                </div>
                {/* Why she comes up (the platform's reasons) and what she is,
                    each a labelled group of tags, the labels in one column. */}
                <Groups className="mt-2">
                  <Tags label="Poklapa se" items={matchReasons(c)} />
                  <Tags label="Klasifikacije" items={c.classifications} />
                </Groups>
              </div>
              {/* Asking is not hiring. It sends the plan and waits — the terms
                  are set afterwards, by both of them. Top right, level with
                  her name; on a phone under the text, as wide as it: it is
                  not the same thing as opening her profile, so it stays. */}
              {standing ? (
                <Standing standing={standing} className={underText} />
              ) : (
                <Button className={`phone:w-[calc(100%-var(--avatar)-var(--spacing-3))] ${underText}`} onClick={() => ask(c)}>
                  Pošalji poruku
                </Button>
              )}
            </Card>
          );
        })}
      </div>

      {pages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))} />
            </PaginationItem>
            {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
              <PaginationItem key={n}>
                <PaginationLink isActive={n === page} onClick={() => setPage(n)}>
                  {n}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext disabled={page === pages} onClick={() => setPage((p) => Math.min(pages, p + 1))} />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* The way out for someone who does not want to choose from a list. */}
      <Card className="flex-row items-center gap-3 text-muted-foreground">
        <Phone size={16} strokeWidth={1.75} />
        <p className="flex-1 text-xs leading-body">
          Niste sigurni koju da izaberete? Koordinatorka poznaje svaku od njih i može da vas pozove danas.
        </p>
        <Button variant="secondary" onClick={() => onFlash('Koordinatorka će vas pozvati danas.')}>
          Pozovite me
        </Button>
      </Card>
    </Page>
  );
}
