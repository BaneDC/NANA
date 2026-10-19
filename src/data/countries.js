import { msg, t } from '../i18n';

// The countries a phone number can be from, with their flag and dialling code:
// the family's sign-up and the caregiver's (TextField's Phone).
export const COUNTRIES = [
  { id: 'FI', name: msg('Finska'), flag: '🇫🇮', code: '+358' },
  { id: 'RS', name: msg('Srbija'), flag: '🇷🇸', code: '+381' },
  { id: 'HR', name: msg('Hrvatska'), flag: '🇭🇷', code: '+385' },
  { id: 'BA', name: msg('Bosna i Hercegovina'), flag: '🇧🇦', code: '+387' },
  { id: 'ME', name: msg('Crna Gora'), flag: '🇲🇪', code: '+382' },
  { id: 'MK', name: msg('Severna Makedonija'), flag: '🇲🇰', code: '+389' },
  { id: 'SI', name: msg('Slovenija'), flag: '🇸🇮', code: '+386' },
  { id: 'DE', name: msg('Nemačka'), flag: '🇩🇪', code: '+49' },
  { id: 'AT', name: msg('Austrija'), flag: '🇦🇹', code: '+43' },
  { id: 'CH', name: msg('Švajcarska'), flag: '🇨🇭', code: '+41' },
];

export const countryOptions = () =>
  COUNTRIES.map((c) => ({
    value: c.id,
    label: t(c.name),
    icon: c.flag,
    meta: c.code,
    display: c.flag + ' ' + c.code,
  }));
export const dialOf = (id) => COUNTRIES.find((c) => c.id === id)?.code || '';
