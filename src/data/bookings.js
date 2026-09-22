import { caregivers } from './carePlan';

// Requests the user has sent out. Statuses drive the dashboard: a caregiver has
// either accepted, not answered yet, or declined — and a decline always carries
// a reason, so the user is never left guessing.
export const bookings = [
  {
    caregiverId: 'vesna',
    status: 'accepted',
    requested: 'pre 2 dana',
    detail: 'Počinje u ponedeljak 11. avgusta, 08:00–14:00. Dogovorena probna nedelja.',
  },
  {
    caregiverId: 'snezana',
    status: 'pending',
    requested: 'pre 1 dan',
    detail: 'Obično odgovori u roku od 48 sati.',
  },
  {
    caregiverId: 'gordana',
    status: 'pending',
    requested: 'pre 4 sata',
    detail: 'Poslali smo vaš upit i raspored koji ste izabrali.',
  },
  {
    caregiverId: 'dragana',
    status: 'declined',
    requested: 'pre 3 dana',
    detail: 'Ponedeljkom i četvrtkom je zauzeta kod druge porodice do oktobra.',
  },
];

export const STATUS_LABEL = {
  accepted: 'Prihvaćeno',
  pending: 'Čeka odgovor',
  declined: 'Odbijeno',
};

export function bookingsWithCaregiver() {
  return bookings.map((b) => ({
    ...b,
    caregiver: caregivers.find((c) => c.id === b.caregiverId),
  }));
}

export function statusCounts() {
  return bookings.reduce(
    (acc, b) => ({ ...acc, [b.status]: (acc[b.status] || 0) + 1 }),
    { accepted: 0, pending: 0, declined: 0 }
  );
}

