// A finished onboarding, for opening the app past it: /?demo lands on the plan
// with these answers, so the chat and everything after the plan can be tried
// without talking the whole conversation through each time. The answers are a
// real case, the same one the end-to-end checks walk.

// A family in Helsinki: the demo is being prepared for the Finnish market.
export const demoUser = {
  role: 'family',
  firstName: 'Anna',
  lastName: 'Korhonen',
  name: 'Anna Korhonen',
  email: 'anna@mail.com',
  phone: '+358 40 123 4567',
  country: 'FI',
  source: 'Preko prijatelja ili porodice',
  consents: { processing: true, accuracy: true, newsletter: false },
};

export const demoAnswers = {
  'about-person': { values: { name: 'Aino Korhonen', age: '84', city: 'Töölö, Helsinki' } },
  'about-you': { values: { 'your-name': 'Anna Korhonen', relation: 'Ćerka', 'your-phone': '+358 40 123 4567' } },
  household: { optionId: 'alone' },
  'home-condition': { optionId: 'mostly-fine' },
  mobility: { optionId: 'stick' },
  'going-out': { optionId: 'little-help' },
  'daily-help': { optionId: 'occasional' },
  'self-care': { optionIds: ['dressing', 'toilet', 'medication'] },
  falls: { optionId: 'more-than-once' },
  outdoors: { optionId: 'weekly' },
  slowing: { optionId: 'little' },
  overall: { optionId: 'house-help' },
  lifestyle: { optionIds: ['company', 'prevention'] },
  'household-tasks': { optionIds: ['cooking', 'cleaning'] },
  'who-helps-now': { optionId: 'family' },
  'personal-care': { optionIds: ['bathing'] },
  'fall-risk': { optionId: 'high' },
  'bed-mobility': { optionId: 'yes' },
  eating: { optionId: 'alone' },
  'pressure-sores': { optionId: 'none' },
  respiratory: { optionIds: ['none'] },
  'palliative-needs': { optionIds: ['nursing'] },
  'reason-for-contact': { optionId: 'fall' },
  onset: { optionId: 'gradual' },
  hospitalisation: { optionId: 'none' },
  'family-goal': { values: { goal: 'Da ostane kod kuće i bude bezbedna.', worry: 'Novi pad kad je sama.' } },
};

export const demoNotes = ['Voli da ujutru popije kafu na terasi.'];

export const wantsDemo = () => {
  try {
    return new URLSearchParams(window.location.search).has('demo');
  } catch {
    return false;
  }
};

// `?demo=rs` opens the same finished case as a family in Serbia, the way to see
// the one-plan subscription without registering with a Serbian number. Anything
// else is Finland, as `demoUser` says.
export const demoCountry = () => {
  try {
    const v = new URLSearchParams(window.location.search).get('demo');
    return v ? v.toUpperCase() : demoUser.country;
  } catch {
    return demoUser.country;
  }
};
