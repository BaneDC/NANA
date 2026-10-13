// Every word inline-chat-kit draws, in Serbian. The kit keeps its English
// defaults in `defaultLabels`; this is that list, translated in full, so no
// English is left in the chat — text, tooltips or what a screen reader says.
// {done}, {total}, {index} and {count} are where the kit puts a number.
import { msg, t } from '../i18n';

export const chatLabelsSr = {
  approval: {
    once: msg('Primeni na plan'),
    always: msg('Uvek primeni'),
    deny: msg('Ne sada'),
    allowedOnce: msg('Primenjeno na plan'),
    allowedAlways: msg('Primenjuje se ubuduće'),
    wasDenied: msg('Nije primenjeno'),
    pending: msg('Čeka na vas'),
  },
  tool: { input: msg('Ulaz'), output: msg('Izlaz'), error: msg('Greška'), pending: msg('Na čekanju'), running: msg('Radi'), done: msg('Gotovo') },
  reasoning: { thinking: msg('Razmišljam'), thought: msg('Razmislila'), thoughtFor: msg('Razmišljala') },
  chain: { through: msg('Razmislila kroz'), step: msg('korak'), steps: msg('koraka'), thinking: msg('Razmišljam') },
  tasks: { pending: msg('Na čekanju'), running: msg('U toku'), done: msg('Gotovo'), error: msg('Nije uspelo'), progress: msg('{done} od {total}') },
  sources: { title: msg('Izvori'), one: msg('izvor'), many: msg('izvora') },
  citation: { cite: msg('Izvor') },
  answerActions: { copy: msg('Kopiraj odgovor'), copied: msg('Kopirano'), regenerate: msg('Odgovori ponovo'), up: msg('Dobar odgovor'), down: msg('Loš odgovor') },
  branch: { previous: msg('Prethodni odgovor'), next: msg('Sledeći odgovor'), position: msg('Odgovor {index} od {total}') },
  context: { name: msg('Iskorišćen kontekst'), of: msg('od'), tokens: msg('tokena'), nearlyFull: msg('Skoro pun: najstarije poruke počinju da ispadaju') },
  attachments: { remove: msg('Ukloni') },
  question: { next: msg('Dalje'), none: msg('Ništa od ovoga'), edit: msg('Izmeni odgovor'), other: msg('Nešto drugo'), letters: 'abcdefghijklmnopqrstuvwxyz' },
  questionGroup: { answers: msg('odgovora') },
  input: {
    placeholder: msg('Pitajte ili recite šta se promenilo…'),
    send: msg('Pošalji poruku'),
    save: msg('Sačuvaj izmene'),
    stop: msg('Zaustavi odgovor'),
    cancelEdit: msg('Otkaži izmenu'),
    add: msg('Dodaj'),
    closeMenu: msg('Zatvori'),
    attach: msg('Dodaj'),
    design: msg('Dizajn'),
    connectors: msg('Povezivanja'),
    copy: msg('Kopiraj'),
    edit: msg('Izmeni'),
    readMore: msg('Prikaži više'),
    readLess: msg('Prikaži manje'),
    dictate: msg('Izdiktiraj poruku'),
    stopListening: msg('Prestani da slušaš'),
    waitingForMicrophone: msg('Čeka se pristup mikrofonu'),
    cancelTranscription: msg('Otkaži prepis'),
    microphoneBlocked: msg('Mikrofon je blokiran'),
    microphoneBlockedHelp: msg('Pristup mikrofonu je blokiran. Dozvolite ga za ovaj sajt u podešavanjima pregledača, pa osvežite stranicu.'),
  },
  voice: {
    listening: msg('Slušam.'),
    stoppedListening: msg('Prestala sam da slušam.'),
    transcribing: msg('Pravim prepis.'),
    nothingHeard: msg('Ništa se nije čulo.'),
    transcriptAdded: msg('Prepis je dodat.'),
    transcriptFailed: msg('Prepis nije mogao da se napravi.'),
    refused: msg('Pristup mikrofonu je odbijen.'),
    notFound: msg('Mikrofon nije pronađen.'),
    couldNotOpen: msg('Mikrofon nije mogao da se otvori.'),
  },
  header: { back: msg('Nazad'), more: msg('Još radnji') },
  highlighter: {
    menu: msg('Radnje za označeno'),
    reply: msg('Odgovori u niti'),
    remove: msg('Ukloni oznaku'),
    highlight: msg('Označeno:'),
    countOne: msg('{count} oznaka'),
    countMany: msg('{count} oznake'),
    keyboardHint: msg('Strelice levo i desno pomeraju za po reč. Držite Shift da označite. Enter označava izabrano, Escape briše.'),
  },
  thread: { title: msg('Odgovor u niti'), save: msg('Sačuvaj'), close: msg('Zatvori nit'), on: msg('Nit o'), placeholder: msg('Pitajte me o ovom tekstu…') },
  codeBlock: { copy: msg('Kopiraj'), copyCode: msg('Kopiraj kod'), copied: msg('Kopirano'), copiedAnnouncement: msg('Kopirano u privremenu memoriju') },
  pane: { close: msg('Zatvori'), expand: msg('Proširi'), collapse: msg('Suzi') },
  conversation: { jump: msg('Na najnovije') },
  emptyState: { suggestions: msg('Predlozi') },
  experience: {
    title: msg('Asistent'),
    savedHighlights: msg('Sačuvane oznake'),
    themeToLight: msg('Svetla tema'),
    themeToDark: msg('Tamna tema'),
    share: msg('Podeli'),
    selectionMode: msg('Način označavanja'),
    marker: msg('Slobodno označavanje'),
    precise: msg('Precizno označavanje teksta'),
    windowFull: msg('Najstarije poruke ispadaju iz razgovora.'),
    highlights: msg('Oznake'),
    close: msg('Zatvori'),
    paragraph: msg('Pasus {index}'),
    responding: msg('Stiže odgovor'),
  },
};

// The same list in the language the app is in now, read when the chat draws.
const translate = (node, key) =>
  typeof node === 'string'
    ? key === 'letters'
      ? node
      : t(node)
    : Object.fromEntries(Object.entries(node).map(([k, v]) => [k, translate(v, k)]));
export const chatLabels = () => translate(chatLabelsSr);
