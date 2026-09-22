import { firstName, waitingOnYou } from './familyCare';

// The assistant panel is contextual: what it opens with, what it suggests and how
// it answers all depend on the page it was opened from.
export function copilotContext(view, { plan, unlocked, care } = {}) {

  switch (view) {
    case 'dashboard':
    case 'caregiver':
    case 'visits':
    case 'requests': {
      // Said from the family's own state, so it never talks about a request or a
      // start date the page no longer shows.
      const waiting = care ? waitingOnYou(care) : [];
      const terms = waiting.find((w) => w.kind === 'terms');
      const order = waiting.find((w) => w.kind === 'work-order');
      const pending = care ? care.requests.filter((r) => r.status === 'pending').length : 0;
      const parts = [
        terms && `${firstName(terms.arrangement.caregiver.name)} je poslala nove uslove`,
        order && `radni nalog za ${order.visit.date} prolazi za ${order.visit.chargesInHours} h, osim ako nešto kažete`,
        pending && `upita koji čekaju odgovor: ${pending}`,
      ].filter(Boolean);
      return {
        label: 'Moja nega',
        opening: parts.length
          ? `${parts.join('; ')}. Mogu da vam objasnim bilo šta od toga, ili da podsetim negovateljice na upite.`.replace(/^./, (c) => c.toUpperCase())
          : 'Sve je sređeno. Mogu da objasnim kako se posete plaćaju, ili da vam pomognem da nađete još nekog.',
        suggestions: ['Šta se menja u novim uslovima?', 'Kako se plaća poseta?', 'Podseti ih na upite'],
        replies: [
          'Novi uslovi dodaju pomoć oko kupanja, što je posao medicinske sestre, pa cena ide sa 850 na 900 RSD po satu. Sve ostalo ostaje isto, a stari uslovi važe dok ne prihvatite nove.',
          'Dan pre posete negovateljica šalje plan i novac se rezerviše na vašoj kartici. Posle posete zapiše šta je uradila, a dan kasnije se naplaćuje — osim ako kažete da nešto nije bilo u redu.',
          'Podsetila sam sve koji još nisu odgovorili. Negovateljice obično odgovore u roku od 48 sati; javiću vam ovde čim neka odgovori.',
        ],
      };
    }
    case 'plans':
      return {
        label: 'Planovi nege',
        opening: plan
          ? 'Ovo je vaš aktivan plan. Otvorite ga, i tamo mogu i da ga menjam za vas.'
          : 'Još nema aktivnog plana. Završite razgovor i napraviću ga.',
        suggestions: ['Kako se menja plan?', 'Zašto baš ove negovateljice?'],
        replies: [
          'Otvorite plan i recite mi šta je sada drugačije — pokazaću vam šta se menja pre nego što išta sačuvam. Može i ručno, preko dugmeta „Izmeni plan“.',
          'Poređane su po tome koliko se poklapaju sa rasporedom, zadacima i udaljenošću. Vesna je prva jer je baš ovu kombinaciju već radila.',
        ],
      };
    case 'profile':
      return {
        label: 'Profil',
        opening: 'Mogu da ažuriram podatke, promenim kontakt za hitne slučajeve ili dodam lekara.',
        suggestions: ['Promeni adresu', 'Promeni kontakt za hitne slučajeve', 'Dodaj još jedan kontakt'],
        replies: [
          'Recite mi novu adresu i ažuriraću profil — proveriću i koje su negovateljice i dalje u blizini.',
          'Koga prvo da zovemo umesto toga? Zameniću kontakt i obavestiti negovateljice.',
          'Drugi kontakt je dobra ideja za dane kad niste tu. Dajte mi ime i broj.',
        ],
      };
    case 'settings':
      return {
        label: 'Podešavanja',
        opening: unlocked
          ? 'Pretplata je aktivna. Mogu da objasnim šta obuhvata ili da vam pomognem da je pauzirate.'
          : 'Niste još pretplaćeni, pa su brojevi negovateljica i preporuke zaključani.',
        suggestions: ['Šta obuhvata pretplata?', 'Kako da je pauziram?', 'Koja obaveštenja su važna?'],
        replies: [
          'Obuhvata direktne brojeve svih negovateljica koje odgovaraju, preporuke lekara i predložena pomagala — jedna mesečna uplata, otkazivanje bilo kad.',
          'Pauzirati možete preko „Upravljaj plaćanjem“. Plan i negovateljice ostaju sačuvani, samo gubite kontakte dok ne nastavite.',
          'Ostavite uključene odgovore negovateljica i promene rasporeda. Nedeljni pregled nije obavezan — većina porodica ga isključi kad se negovateljica uhoda.',
        ],
      };
    default:
      return {
        label: 'Razgovor',
        opening: 'Pitajte me bilo šta o planu, negovateljicama ili kako NANA Prime radi.',
        suggestions: ['Kako se proveravaju negovateljice?', 'Koliko košta?'],
        replies: [
          'Svaku negovateljicu naš tim intervjuiše i proveri pre nego što se pojavi u planu.',
          'Negovateljice se plaćaju po satu, po ceni sa njihove kartice, preko NANA Prime a ne u gotovini.',
        ],
      };
  }
}
