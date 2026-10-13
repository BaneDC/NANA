import { msg } from '../i18n';

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

// Every text is marked with msg() and translated where it is shown (t).
export const COOKIE_GROUPS = [
  {
    id: 'needed',
    label: msg('Neophodni kolačići'),
    fixed: true,
    note: msg('Potrebni da sajt radi. Pamte vaš izbor kolačića i to da ste zatvorili predlog za jezik. Ne mogu da se isključe.'),
    cookies: [
      {
        name: 'cc_cookie',
        by: 'nanaprime.com',
        why: msg('Čuva vaš izbor kolačića da vas ne pitamo ponovo.'),
        keeps: msg('6 meseci'),
      },
      {
        name: 'NEXT_LOCALE',
        by: 'nanaprime.com',
        why: msg('Pamti jezik na kom čitate sajt.'),
        keeps: msg('Sesija'),
      },
      {
        name: 'lang-banner-v1',
        by: 'nanaprime.com (localStorage)',
        why: msg('Pamti da ste zatvorili traku sa predlogom jezika.'),
        keeps: msg('Dok ne obrišete'),
      },
    ],
  },
  {
    id: 'analytics',
    label: msg('Analitika'),
    note: msg('Pomažu nam da razumemo koliko ljudi poseti sajt, odakle dolaze i koje stranice gledaju (Google Analytics 4).'),
    cookies: [
      {
        name: '_ga_BR6P8VJCJH',
        by: '.nanaprime.com',
        why: msg('Google Analytics - čuva stanje trenutne sesije.'),
        keeps: msg('2 godine'),
      },
    ],
  },
  {
    id: 'recording',
    label: msg('Snimanje sesije'),
    note: msg('Microsoft Clarity snima kako koristite stranicu - pomeranje miša, klikove i skrolovanje - i reprodukuje to da bismo našli gde se ljudi muče.'),
    cookies: [
      {
        name: '_clck',
        by: '.nanaprime.com',
        why: msg('Microsoft Clarity - povezuje vaše snimke sa jednim posetiocem.'),
        keeps: msg('1 godina'),
      },
      {
        name: '_clsk',
        by: '.nanaprime.com',
        why: msg('Microsoft Clarity - spaja više pregleda stranica u jedan snimak.'),
        keeps: msg('1 dan'),
      },
      {
        name: 'CLID',
        by: 'www.clarity.ms',
        why: msg('Microsoft Clarity - prepoznaje pregledač na Microsoft-ovoj strani.'),
        keeps: msg('1 godina'),
      },
      {
        name: 'MUID',
        by: '.clarity.ms',
        why: msg('Microsoft - prepoznaje pregledač kroz Microsoft servise.'),
        keeps: msg('1 godina'),
      },
    ],
  },
  {
    id: 'marketing',
    label: msg('Marketing'),
    note: msg('Mere koliko oglasa i preporuka dovodi ljude na sajt.'),
    cookies: [],
  },
];

// What is on by default before anybody chooses: the necessary ones, and
// nothing else. A dialog that arrives with analytics already ticked is not
// asking.
export const COOKIE_DEFAULT = { analytics: false, recording: false, marketing: false };

