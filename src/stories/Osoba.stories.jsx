import { caregivers } from '@/data/carePlan';
import { herVisits, standingWith } from '@/data/familyCare';
import { sampleCare } from '@/screens/CardGallery';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { ItemGroup } from '@/components/ui/item';
import CaregiverHead from '@/components/CaregiverHead';
import Rating from '@/components/Rating';
import Standing from '@/components/Standing';
import Tags, { Group, Groups } from '@/components/Tags';
import VisitRow from '@/components/family/VisitRow';
import VisitReport from '@/components/family/VisitReport';

// A caregiver and her visits, drawn from the gallery's sample (/?kartice), so
// every state the app knows is here: each visit status, each standing.

export default { title: 'Osoba i poseta' };

const care = sampleCare();
const noop = () => {};
const pick = (id) => caregivers.find((c) => c.id === id);

// a select of the sample's caregivers, by name
const caregiverControl = {
  control: { type: 'select', labels: Object.fromEntries(caregivers.map((c) => [c.id, c.name])) },
  options: caregivers.map((c) => c.id),
};

// every standing `standingWith` gives, to set by hand
const STANDINGS = {
  sample: undefined,
  none: null,
  comes: { text: 'Već dolazi', pill: 'is-accepted' },
  accepted: { text: 'Prihvatila', pill: 'is-accepted' },
  terms: { text: 'Ugovor čeka vas', pill: 'is-pending' },
  asked: { text: 'Upit poslat juče', pill: 'is-pending' },
  before: { text: 'Dolazila ranije', pill: 'is-muted' },
  'terms-declined': { text: 'Uslovi odbijeni', pill: 'is-declined' },
  declined: { text: 'Odbila', pill: 'is-declined' },
};
const STANDING_LABELS = Object.fromEntries(
  Object.entries(STANDINGS).map(([k, s]) => [k, k === 'sample' ? 'iz primera' : s ? s.text : 'nema'])
);

// the head of her details (profile drawer, her pane in the chat): as her card
export const GlavaNegovateljice = {
  name: 'Glava negovateljice',
  render: () => (
    <div className="flex flex-col gap-6">
      {['sanna', 'paivi', 'liisa', 'tuula', 'johanna'].map((id) => (
        <CaregiverHead key={id} caregiver={pick(id)} standing={standingWith(care, id)} />
      ))}
    </div>
  ),
};

export const GlavaIgraliste = {
  name: 'Glava negovateljice · igralište',
  args: { caregiver: 'sanna', name: '', standing: 'sample' },
  argTypes: {
    caregiver: { ...caregiverControl, description: 'Negovateljica iz primera.' },
    name: { control: 'text', description: 'Drugo ime, npr. dugačko, da se vidi kako se lomi; prazno = njeno.' },
    match: { control: { type: 'range', min: 0, max: 100, step: 1 }, description: 'Drugo poklapanje u %; bez vrednosti = njeno.' },
    standing: {
      control: { type: 'select', labels: STANDING_LABELS },
      options: Object.keys(STANDINGS),
      description: 'Stanje sa njom; „iz primera" je ono koje primer daje.',
    },
  },
  render: ({ caregiver, name, match, standing }) => {
    const c = pick(caregiver);
    const shown = { ...c, name: name || c.name, match: match ?? c.match };
    const st = standing === 'sample' ? standingWith(care, caregiver) : STANDINGS[standing];
    return <CaregiverHead caregiver={shown} standing={st} />;
  },
};

export const Ocena = {
  render: () => (
    <div className="flex flex-col gap-2 text-badge text-muted-foreground">
      {['sanna', 'tuula'].map((id) => (
        <p key={id}>
          <Rating caregiver={pick(id)} /> · {pick(id).rate}
        </p>
      ))}
      <p>
        <Rating caregiver={{ ...pick('sanna'), reviews: 0 }} /> · još bez ocena
      </p>
    </div>
  ),
};

export const OcenaIgraliste = {
  name: 'Ocena · igralište',
  args: { rating: 4.9, reviews: 64 },
  argTypes: {
    rating: { control: { type: 'range', min: 1, max: 5, step: 0.1 } },
    reviews: { control: { type: 'number', min: 0 }, description: 'Koliko ju je ocenilo; 0 = „Nova", bez zvezdice.' },
  },
  render: ({ rating, reviews }) => (
    <p className="text-badge text-muted-foreground">
      <Rating caregiver={{ rating, reviews }} /> · 18 €/h
    </p>
  ),
};

// one pill wherever she is: she comes, she came, her terms wait, the request
export const StanjeSaNjom = {
  name: 'Stanje sa njom',
  render: () => (
    <div className="flex flex-wrap gap-2">
      {['sanna', 'paivi', 'tuula', 'liisa', 'riitta', 'johanna'].map((id) => (
        <Standing key={id} standing={standingWith(care, id)} />
      ))}
    </div>
  ),
};

// every status a visit has, as her page and the visits page show it
export const Posete = {
  render: () => {
    const a = care.arrangements.find((x) => x.caregiver.id === 'sanna');
    const visits = herVisits(a).slice(0, 12);
    return (
      <Card>
        <CardHeader>
          <CardTitle>Posete</CardTitle>
        </CardHeader>
        <ItemGroup>
          {visits.map((v) => (
            <VisitRow key={v.id} visit={v} onDrawer={noop} />
          ))}
        </ItemGroup>
      </Card>
    );
  },
};

// each visit in the sample, by what is special about it
const VISITS = {
  'g-planned': 'Plan posete (sutra)',
  'g-awaiting': 'Čeka radni nalog',
  'g-charging': 'Radni nalog stigao',
  'g-disputed': 'Prijavljeno',
  'g-paid-you': 'Plaćeno, vi ste potvrdili',
  'g-paid-auto': 'Plaćeno automatski, uz brigu u izveštaju',
  'g-extra': 'Plaćeno, traži dodatni sat',
  'g-less': 'Plaćeno, radila kraće',
  'g-resolved': 'Plaćeno posle prijave',
  'g-cancelled': 'Otkazala porodica',
  'g-cg-cancelled': 'Otkazala negovateljica',
};

export const PosetaIgraliste = {
  name: 'Poseta · igralište',
  args: { visit: 'g-charging', showWho: false },
  argTypes: {
    visit: { control: { type: 'select', labels: VISITS }, options: Object.keys(VISITS), description: 'Poseta iz primera.' },
    showWho: { control: 'boolean', description: 'Ime negovateljice u redu, kao na listi svih poseta porodice.' },
  },
  render: ({ visit, showWho }) => {
    const v = herVisits(care.arrangements.find((x) => x.caregiver.id === 'sanna')).find((x) => x.id === visit);
    return (
      <Card>
        <ItemGroup>
          <VisitRow visit={v} showWho={showWho} onDrawer={noop} />
        </ItemGroup>
      </Card>
    );
  },
};

// a visit's report: what was done, how she was, what the caregiver wrote
export const IzvestajPosete = {
  name: 'Izveštaj posete',
  render: () => {
    const v = care.arrangements[0].visits.find((x) => x.report);
    return (
      <Card>
        <VisitReport report={v.report} first="Sanna" done />
      </Card>
    );
  },
};

// read-only tags in named groups (§10); chips are only for what is chosen
export const Oznake = {
  render: () => (
    <Card>
      <Groups>
        <Tags label="Poklapa se" items={['Sve vrste nege', 'Isti grad', 'Raspored se poklapa']} />
        <Tags label="Klasifikacije" items={['Sairaanhoitaja', 'Lähihoitaja']} />
        <Tags label="Urađeno" items={['Lična higijena', 'Priprema hrane']} off={['Šetnje - ovog puta ne']} />
        <Group label="Vaša poruka" text="Treba nam pomoć ujutru, tri puta nedeljno." />
      </Groups>
    </Card>
  ),
};
