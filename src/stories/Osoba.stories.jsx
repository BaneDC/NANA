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

// every status a visit has, as her page and "Sve posete" show it
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
