import { ArrowRight, ChevronRight, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardLink, CardTitle } from '@/components/ui/card';
import { Item, ItemAction, ItemContent, ItemGroup, ItemLink } from '@/components/ui/item';
import { DataList, DataRow } from '@/components/data-list';
import Tags, { Group, Groups } from '@/components/Tags';
import Rating from '@/components/Rating';
import { caregivers, matchReasons } from '@/data/carePlan';

// One card: r24, 16 padding, 8 between its parts, the card shadow (docs/patterns.md §5).
// Inside it, rows (`Item`), never boxes (§6). A card or a row with details of
// its own opens from anywhere on it (`CardLink`, `ItemLink`, §7).

export default { title: 'Kartica' };

const noop = () => {};
const sanna = caregivers.find((c) => c.id === 'sanna');

export const Osnovna = {
  render: () => (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Način plaćanja</CardTitle>
        </CardHeader>
        <CardDescription>Kartica se tereti tek kad se poseta obavi i radni nalog prođe.</CardDescription>
        <CardFooter>
          <Button>Dodaj karticu</Button>
        </CardFooter>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Ugovor o nezi</CardTitle>
          <CardAction>
            <Badge variant="success">Verzija 1 · važi</Badge>
          </CardAction>
        </CardHeader>
        <DataList>
          <DataRow label="Prihvaćeno">21. jula</DataRow>
          <DataRow label="Cena po satu">18 € / h</DataRow>
          <DataRow label="Dogovoreni sati">9 h nedeljno</DataRow>
          <DataRow label="Raspored">pon, sre, pet · 09:00–12:00</DataRow>
        </DataList>
      </Card>
    </>
  ),
};

// one card, set from the Controls panel
export const KarticaIgraliste = {
  name: 'Kartica · igralište',
  args: {
    title: 'Ugovor o nezi',
    description: 'Kartica se tereti tek kad se poseta obavi i radni nalog prođe.',
    head: 'badge',
    headText: 'Verzija 1 · važi',
    button: 'Dodaj karticu',
    clickable: false,
  },
  argTypes: {
    title: { control: 'text' },
    description: { control: 'text', description: 'Prazno = bez opisa.' },
    head: {
      control: { type: 'inline-radio', labels: { none: 'ništa', badge: 'značka', button: 'dugme' } },
      options: ['none', 'badge', 'button'],
      description: 'Šta stoji desno od naslova.',
    },
    headText: { control: 'text', description: 'Tekst značke ili dugmeta u glavi.' },
    button: { control: 'text', description: 'Dugme u dnu kartice; prazno = bez njega.' },
    clickable: {
      control: 'boolean',
      description: 'Cela kartica otvara detalje: naslov je `CardLink`, a pod mišem se pojavi okvir (§7).',
    },
  },
  render: ({ title, description, head, headText, button, clickable }) => (
    <Card>
      <CardHeader>
        <CardTitle>{clickable ? <CardLink onClick={noop}>{title}</CardLink> : title}</CardTitle>
        {head === 'badge' && (
          <CardAction>
            <Badge variant="success">{headText}</Badge>
          </CardAction>
        )}
        {head === 'button' && (
          <CardAction>
            <Button variant="secondary">{headText}</Button>
          </CardAction>
        )}
      </CardHeader>
      {description && <CardDescription>{description}</CardDescription>}
      {button && (
        <CardFooter>
          <Button>{button}</Button>
        </CardFooter>
      )}
    </Card>
  ),
};

// a head with a button over rows: the rows start 8 lower (24 from the button)
export const SaDugmetomUGlavi = {
  name: 'Sa dugmetom u glavi',
  render: () => (
    <Card className="[&>[data-slot=item-group]]:mt-2">
      <CardHeader>
        <CardTitle>Kako je prošla poslednja poseta</CardTitle>
        <CardAction>
          <Button variant="secondary">
            Sve posete
            <ArrowRight size={14} strokeWidth={1.75} />
          </Button>
        </CardAction>
      </CardHeader>
      <ItemGroup>
        <Row initials="SV">
          <ItemContent>
            <p className="text-xs font-medium text-foreground">
              <ItemLink onClick={noop}>5. avgusta · 09:00–12:00</ItemLink>
            </p>
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs leading-body text-muted-foreground">
              Sanna Virtanen · 3 h po 18 €/h
              <Badge variant="tag">54 € naplaćeno</Badge>
            </p>
            <Groups className="mt-2">
              <Tags label="Urađeno" items={['Lična higijena', 'Priprema hrane', 'Šetnje i boravak napolju']} />
              <Tags label="Kako je bila" items={['Raspoloženje: dobro', 'Ishrana: kao i obično', 'Kretanje: kao i obično']} />
              <Group label="Sanna je zapisala" text="Prošetale smo do parka, ručala je sve. Raspoložena, pričala o unucima." />
            </Groups>
          </ItemContent>
          <ChevronRight size={16} strokeWidth={1.75} className="shrink-0 text-disabled phone:hidden" aria-hidden="true" />
        </Row>
      </ItemGroup>
    </Card>
  ),
};

// her card on Pronađi: opens her profile from anywhere; its own button sends
export const KojaSeOtvara = {
  name: 'Kartica koja se otvara',
  render: () => (
    <Card className="flex-row items-start gap-3 [--avatar:calc(var(--text-sm-leading)+var(--spacing-1)+16px)]">
      <Avatar>
        <AvatarFallback>SV</AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <CardLink onClick={noop} className="text-sm font-medium">
            Sanna Virtanen
          </CardLink>
          <Badge>Poklapanje · 97%</Badge>
        </div>
        <p className="text-badge text-muted-foreground">
          <Rating caregiver={sanna} /> · {sanna.rate} · {sanna.area}, do {sanna.radius} km
        </p>
        <Groups className="mt-2">
          <Tags label="Poklapa se" items={matchReasons(sanna)} />
          <Tags label="Klasifikacije" items={sanna.classifications} />
        </Groups>
      </div>
      <Button>Pošalji poruku</Button>
    </Card>
  ),
};

export const SaIkonicom = {
  name: 'Kartica sa ikonicom (Pozovite me)',
  render: () => (
    <Card className="flex-row items-center gap-3 text-muted-foreground">
      <Phone size={16} strokeWidth={1.75} />
      <p className="flex-1 text-xs leading-body">
        Niste sigurni koju da izaberete? Koordinatorka poznaje svaku od njih i može da vas pozove danas.
      </p>
      <Button variant="secondary">Pozovite me</Button>
    </Card>
  ),
};

// a row in a card: the avatar as tall as the title and the sentence (§6)
function Row({ initials, children }) {
  return (
    <Item className="items-start gap-3 [--avatar:calc(var(--text-xs-leading)+var(--spacing-1)+var(--text-body-leading))] phone:flex-wrap">
      <Avatar>
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      {children}
    </Item>
  );
}

const rowTitle = 'flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-foreground';
const rowBody = 'text-xs leading-body text-muted-foreground';

export const Redovi = {
  name: 'Redovi u kartici',
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>Predstoji</CardTitle>
      </CardHeader>
      <CardDescription>Zakazane posete. Novac se unapred rezerviše, a naplaćuje tek posle posete.</CardDescription>
      <ItemGroup>
        <Row initials="SV">
          <ItemContent>
            <p className={rowTitle}>
              <ItemLink onClick={noop}>Sutra · 09:00–12:00</ItemLink>
            </p>
            <p className={`${rowBody} flex flex-wrap items-center gap-x-2 gap-y-1`}>
              Sanna Virtanen · 3 h po 18 €/h
              <Badge variant="tag">54 € rezervisano</Badge>
            </p>
          </ItemContent>
          <ItemAction>
            <Button variant="secondary" onClick={noop}>
              Pogledaj plan posete
            </Button>
          </ItemAction>
        </Row>
        <Row initials="PK">
          <ItemContent>
            <p className={rowTitle}>
              <ItemLink onClick={noop}>Päivi Korhonen</ItemLink>
              <Badge variant="warning" className="my-[calc((var(--text-xs-leading)-20px)/2)]">
                Novi uslovi
              </Badge>
            </p>
            <p className={rowBody}>Helsinki · od 22. jula · 16 €/h</p>
            <Tags label="Usluge" items={['Pomoć u svakodnevici', 'Lična nega i kuća']} className="mt-2" />
          </ItemContent>
          <ChevronRight size={16} strokeWidth={1.75} className="shrink-0 text-disabled phone:hidden" aria-hidden="true" />
        </Row>
        <Row initials="TN">
          <ItemContent>
            <p className={rowTitle}>Tuula Nieminen</p>
            <p className={rowBody}>Završeno 20. jula · ovaj red ne otvara ništa, pa nema hover</p>
          </ItemContent>
        </Row>
      </ItemGroup>
    </Card>
  ),
};
