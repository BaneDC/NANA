import { SERVICE_FEE, money, serviceTitle, totalsFor } from './caregiverBoard';

// The same arrangement the caregiver's board holds, seen from the other end.
// One family, one caregiver, and everything that passes between them: the
// agreement they both work under, the visit that is coming, the visits that
// have been, and the money each one moved.
//
// Deliberately the mirror of `ilic` on the caregiver side — same names, same
// rate, same dates — so the two halves of the demo tell one story rather than
// two. In a real system this is one record read from two directions.

export { money, serviceTitle, totalsFor, SERVICE_FEE };

// What the family is charged is the whole of it. The 10% is between the
// platform and the caregiver and is none of the family's business — showing
// them a "you receive" line would be showing them someone else's payslip.
export const chargedFor = (hours, rate) => totalsFor(hours, rate).charged;

export const care = {
  caregiver: {
    name: 'Vesna Mitrović',
    initials: 'VM',
    phone: '+381 63 210 4471',
    area: 'Vračar',
    distance: '1.8 km away',
    years: 12,
    rating: 4.9,
    reviews: 64,
    bio: 'Certified geriatric nurse. Twelve years with families caring for a parent at home, most of them with early-stage dementia.',
  },
  elder: { name: 'Zorka Ilić', age: 86, area: 'Vračar' },
  contact: { name: 'Milena Ilić', relation: 'Daughter' },

  // Signed in June. `sent` is the other state this can be in, and the one the
  // caregiver's board sits blocked on.
  agreement: {
    status: 'active', // 'sent' | 'active'
    sentOn: '11 June',
    signedOn: '12 June',
    services: ['medication', 'meals', 'company', 'housekeeping'],
    rate: 850,
    hours: 12,
    schedule: 'Mon, Wed, Fri · 09:00–13:00',
  },

  // Connected once and then left alone, which is the whole point of it: after
  // this, a visit is paid for without anybody being asked anything.
  payment: {
    connected: true,
    brand: 'Visa',
    last4: '4242',
    connectedOn: '11 June',
  },

  // The visit order Vesna sent. Money is already held against the card for it.
  plan: {
    date: 'Tomorrow',
    time: '09:00–13:00',
    hours: 4,
    services: ['medication', 'meals', 'company'],
    notes: 'Pick up the prescription from the pharmacy on Njegoševa. Milena asked to be called after.',
    sentOn: '2 days ago',
  },

  visits: [
    {
      id: 'v-10aug',
      date: '10 August',
      time: '09:00–13:00',
      hours: 4,
      services: ['medication', 'meals', 'company'],
      note: 'Morning routine, cooked for two days, short walk to the park.',
      mood: 'good',
      eating: 'usual',
      moving: 'usual',
      // what the visit order said, so the family can read the report against
      // what was promised rather than against nothing
      plannedHours: 4,
      plannedServices: ['medication', 'meals', 'company'],
      planNotes: 'Pick up the prescription from the pharmacy on Njegoševa. Milena asked to be called after.',
      // sent, and inside the family's 24 hours
      status: 'charging',
      sentOn: '2 hours ago',
      chargesInHours: 22,
    },
    {
      id: 'v-08aug',
      date: '8 August',
      time: '09:00–13:00',
      hours: 4,
      services: ['medication', 'meals', 'company'],
      note: 'Pharmacy run, laundry, lunch.',
      mood: 'usual',
      eating: 'usual',
      moving: 'usual',
      status: 'paid',
      chargedOn: '9 August',
    },
    {
      id: 'v-06aug',
      date: '6 August',
      time: '09:00–13:00',
      hours: 4,
      services: ['medication', 'meals', 'housekeeping'],
      note: 'Tired all morning, did not want to go out. Ate very little.',
      mood: 'low',
      eating: 'less',
      moving: 'less',
      concern: 'Eating much less than usual for the third time this week.',
      status: 'paid',
      chargedOn: '7 August',
    },
    {
      id: 'v-04aug',
      date: '4 August',
      time: '09:00–13:00',
      hours: 4,
      services: ['medication', 'meals', 'company'],
      note: 'Cooking, shopping, a long conversation.',
      mood: 'good',
      eating: 'usual',
      moving: 'usual',
      status: 'paid',
      chargedOn: '5 August',
    },
  ],
};

export const heldForPlan = (c) => (c.plan ? chargedFor(c.plan.hours, c.agreement.rate) : 0);

export const chargingVisit = (c) => c.visits.find((v) => v.status === 'charging');

export const paidThisMonth = (c) =>
  c.visits.filter((v) => v.status === 'paid').reduce((sum, v) => sum + chargedFor(v.hours, c.agreement.rate), 0);

// Everything the family is being asked for, in the order it blocks things. An
// unsigned agreement stops every visit behind it; an unconnected card stops
// every payment; a charge inside its window is the only one with a clock.
export function needsYou(c) {
  const items = [];
  if (c.agreement.status === 'sent') {
    items.push({ id: 'sign', label: 'Sign the care agreement', note: `Sent ${c.agreement.sentOn}` });
  }
  if (!c.payment.connected) {
    items.push({ id: 'pay', label: 'Add a payment method', note: 'Visits cannot be booked without one' });
  }
  const charging = chargingVisit(c);
  if (charging) {
    items.push({
      id: 'charge',
      label: `${money(chargedFor(charging.hours, c.agreement.rate))} charges in ${charging.chargesInHours} h`,
      note: `For the visit on ${charging.date}`,
    });
  }
  return items;
}
