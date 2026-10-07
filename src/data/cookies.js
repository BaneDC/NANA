// The cookie categories, exactly as the live platform's own dialog lists them.
//
// This is a compliance text, not copy we are free to improve: the names, who
// sets them and how long they last have to match what the site actually does.
// Read off nanaprime.com's dialog and translated; nothing here is invented.
//
// GAPS, to be filled from the live dialog:
//   - the analytics table is cut off above `_ga_BR6P8VJCJH` in the screenshot
//     we worked from, so a row or two is missing;
//   - the marketing category's description and its cookies were not visible at
//     all. Its table is empty until somebody reads them off the site.

export const COOKIE_GROUPS = [
  {
    id: 'needed',
    label: 'Neophodni kolačići',
    fixed: true,
    note: 'Potrebni da sajt radi. Pamte vaš izbor kolačića i to da ste zatvorili predlog za jezik. Ne mogu da se isključe.',
    cookies: [
      {
        name: 'cc_cookie',
        by: 'nanaprime.com',
        why: 'Čuva vaš izbor kolačića da vas ne pitamo ponovo.',
        keeps: '6 meseci',
      },
      {
        name: 'NEXT_LOCALE',
        by: 'nanaprime.com',
        why: 'Pamti jezik na kom čitate sajt.',
        keeps: 'Sesija',
      },
      {
        name: 'lang-banner-v1',
        by: 'nanaprime.com (localStorage)',
        why: 'Pamti da ste zatvorili traku sa predlogom jezika.',
        keeps: 'Dok ne obrišete',
      },
    ],
  },
  {
    id: 'analytics',
    label: 'Analitika',
    note: 'Pomažu nam da razumemo koliko ljudi poseti sajt, odakle dolaze i koje stranice gledaju (Google Analytics 4).',
    cookies: [
      {
        name: '_ga_BR6P8VJCJH',
        by: '.nanaprime.com',
        why: 'Google Analytics - čuva stanje trenutne sesije.',
        keeps: '2 godine',
      },
    ],
  },
  {
    id: 'recording',
    label: 'Snimanje sesije',
    note: 'Microsoft Clarity snima kako koristite stranicu - pomeranje miša, klikove i skrolovanje - i reprodukuje to da bismo našli gde se ljudi muče.',
    cookies: [
      {
        name: '_clck',
        by: '.nanaprime.com',
        why: 'Microsoft Clarity - povezuje vaše snimke sa jednim posetiocem.',
        keeps: '1 godina',
      },
      {
        name: '_clsk',
        by: '.nanaprime.com',
        why: 'Microsoft Clarity - spaja više pregleda stranica u jedan snimak.',
        keeps: '1 dan',
      },
      {
        name: 'CLID',
        by: 'www.clarity.ms',
        why: 'Microsoft Clarity - prepoznaje pregledač na Microsoft-ovoj strani.',
        keeps: '1 godina',
      },
      {
        name: 'MUID',
        by: '.clarity.ms',
        why: 'Microsoft - prepoznaje pregledač kroz Microsoft servise.',
        keeps: '1 godina',
      },
    ],
  },
  {
    id: 'marketing',
    label: 'Marketing',
    note: 'Mere koliko oglasa i preporuka dovodi ljude na sajt.',
    cookies: [],
  },
];

// What is on by default before anybody chooses: the necessary ones, and
// nothing else. A dialog that arrives with analytics already ticked is not
// asking.
export const COOKIE_DEFAULT = { analytics: false, recording: false, marketing: false };

