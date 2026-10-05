import { useState } from 'react';
import { Check, Search, Send, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Empty, EmptyDescription, EmptyTitle } from '@/components/ui/empty';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import Toast from '@/components/family/Toast';
import Attention from '@/components/Attention';
import { Page, PageActions, PageDescription, PageHeader, PageHeaderText, PageSection, PageTitle } from '@/components/page';
import { CheckList, Fact, Facts } from '@/components/data-list';

export default { title: 'Ostalo' };

// The page's one tinted place: the tint around white cards (docs/patterns.md §5)
export const NarandzastiDeo = {
  name: 'Narandžasti deo',
  render: () => (
    <>
      <Attention title="Sledeći korak">
        <Card>
          <CardDescription>
            Plan nege je spreman. Pošaljite upit negovateljicama koje mu odgovaraju: upit šalje plan i ništa ne
            košta, a možete da pitate više njih.
          </CardDescription>
          <CardFooter>
            <Button>
              <Search size={14} strokeWidth={1.75} />
              Pronađi negovateljicu
            </Button>
          </CardFooter>
        </Card>
      </Attention>
      <Attention title="Čeka se odgovor">
        <Card>
          <CardDescription>
            Sanna Virtanen još nije odgovorila na vaš upit. Javićemo vam čim odgovori, a upit i odgovor su na
            stranici „Vaši upiti".
          </CardDescription>
          <CardFooter>
            <Button>
              <Send size={14} strokeWidth={1.75} />
              Pogledaj upite
            </Button>
          </CardFooter>
        </Card>
      </Attention>
      <Attention title="Ništa ne čeka">
        <Card>
          <p className="text-sm text-foreground">
            Nijedna poseta nije zakazana i ništa ne čeka vaš odgovor. Sanna šalje sledeći plan kad dođe vreme.
          </p>
        </Card>
      </Attention>
    </>
  ),
};

const ATTENTION_ICONS = { none: null, Search, Send };

export const NarandzastiIgraliste = {
  name: 'Narandžasti deo · igralište',
  args: {
    title: 'Sledeći korak',
    sub: '',
    text: 'Plan nege je spreman. Pošaljite upit negovateljicama koje mu odgovaraju.',
    button: 'Pronađi negovateljicu',
    icon: 'Search',
    cards: 1,
  },
  argTypes: {
    title: { control: 'text' },
    sub: { control: 'text', description: 'Rečenica ispod naslova, u tintu; prazno = bez nje.' },
    text: { control: 'text', description: 'Tekst u beloj kartici.' },
    button: { control: 'text', description: 'Dugme u kartici; prazno = bez njega.' },
    icon: { control: { type: 'select', labels: { none: 'bez ikonice' } }, options: Object.keys(ATTENTION_ICONS) },
    cards: { control: { type: 'range', min: 1, max: 3, step: 1 }, description: 'Koliko belih kartica drži (8 između njih).' },
  },
  render: ({ title, sub, text, button, icon, cards }) => {
    const Icon = ATTENTION_ICONS[icon];
    return (
      <Attention title={title} sub={sub || undefined}>
        {Array.from({ length: cards }, (_, i) => (
          <Card key={i}>
            <CardDescription>{text}</CardDescription>
            {button && (
              <CardFooter>
                <Button>
                  {Icon && <Icon size={14} strokeWidth={1.75} />}
                  {button}
                </Button>
              </CardFooter>
            )}
          </Card>
        ))}
      </Attention>
    );
  },
};

// the head of a page: 24 from the top, 32 between its words and its button
export const GlavaStranice = {
  name: 'Glava stranice',
  render: () => (
    <Page className="p-0 phone:p-0">
      <PageHeader>
        <PageHeaderText>
          <PageTitle>Pronađi negovateljicu</PageTitle>
          <PageDescription>
            Na osnovu onoga što ste nam rekli, ovo su negovateljice koje najbolje odgovaraju. Upit im šalje plan nege i
            ništa ne košta - možete da pitate više njih.
          </PageDescription>
        </PageHeaderText>
        <PageActions>
          <Button variant="secondary">
            <Sparkles size={14} strokeWidth={1.75} />
            Pitaj asistenta
          </Button>
        </PageActions>
      </PageHeader>
      <PageSection title="Plaćanje">
        <Card>
          <CardHeader>
            <CardTitle>Pretplata</CardTitle>
          </CardHeader>
          <CardDescription>Premium · obnavlja se 1. novembra.</CardDescription>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Način plaćanja</CardTitle>
          </CardHeader>
          <CardDescription>Visa ···· 4242</CardDescription>
        </Card>
      </PageSection>
    </Page>
  ),
};

export const PraznaStranica = {
  name: 'Prazna stranica',
  render: () => (
    <Empty>
      <EmptyTitle>Ovde još nema ničega</EmptyTitle>
      <EmptyDescription>Odgovorite na pitanja u razgovoru i profil će se sam popuniti.</EmptyDescription>
      <Button>Idi na razgovor</Button>
    </Empty>
  ),
};

export const Strane = {
  name: 'Strane (paginacija)',
  render: function Story() {
    const [page, setPage] = useState(1);
    const pages = 3;
    return (
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
    );
  },
};

// free text: the label over the value, lines between them (§8)
export const Podaci = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>O kome brinemo</CardTitle>
      </CardHeader>
      <Facts>
        <Fact label="Ime">Aino Korhonen</Fact>
        <Fact label="Adresa">Mannerheimintie 12, Töölö</Fact>
        <Fact label="Šta je najvažnije">Da ostane kod kuće što duže, sigurno i sa svojim navikama.</Fact>
      </Facts>
      <CheckList>
        <li>
          <Check size={12} strokeWidth={2.5} /> Kontakti negovateljica
        </li>
        <li>
          <Check size={12} strokeWidth={2.5} /> Ceo plan nege
        </li>
      </CheckList>
    </Card>
  ),
};

// One line after a decision, saying what it did (Toast.jsx): at the bottom on
// a wide screen, at the top and the width of the screen on a phone.
export const Obavestenje = {
  name: 'Toast',
  args: { text: 'Plaćeno. 54 € ide ka negovateljici.' },
  argTypes: { text: { control: 'text', description: 'Jedan red o tome šta je urađeno; dugačak tekst se lomi do 520px.' } },
  render: function Story({ text }) {
    const [flash, setFlash] = useState(null);
    return (
      <>
        <Toast flash={flash} onDone={() => setFlash(null)} />
        <div>
          <Button variant="secondary" onClick={() => setFlash({ text, at: Date.now() })}>
            Prikaži toast
          </Button>
        </div>
      </>
    );
  },
};
