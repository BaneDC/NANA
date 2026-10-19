import { msg } from '../i18n';

// What her profile asks, the same in "Moj profil" and in the sign-up (part 5).
// Days are 0 (Monday) to 6, as on every caregiver record.
export const DAYS = [msg('pon'), msg('uto'), msg('sre'), msg('čet'), msg('pet'), msg('sub'), msg('ned')];
export const EDUCATION = [msg('Osnovna škola'), msg('Srednja škola'), msg('Srednja medicinska škola'), msg('Visoka strukovna škola'), msg('Fakultet'), msg('Master'), msg('Doktorat')];
export const LANGUAGES_OFFERED = [msg('finski'), msg('švedski'), msg('engleski'), msg('srpski'), msg('ruski'), msg('nemački')];

// What the demo knows of her that the family's list does not show: kept on
// her profile only (part 3).
export const PERSONAL = {
  sanna: { address: 'Mannerheimintie 40 B 12', birth: '12. 3. 1979.' }, // i18n-ignore
  milica: { address: 'Njegoševa 14', birth: '4. 7. 1988.' }, // i18n-ignore
};

// Documents her classifications need, and whether they are checked.
export const DOCUMENTS = {
  Lähihoitaja: 'Lähihoitaja todistus',
  Sairaanhoitaja: 'Sairaanhoitaja todistus',
};
