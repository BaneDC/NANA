import { Select } from './TextField';
import { LANGUAGES, setLang, t, useLang } from '@/i18n';

// The language, on every page before there is an account (docs/patterns.md
// §12b, decided 12. 11., dizajner): in the page's head, right, across from the
// way back. The flag and a chevron, as a ghost button, so it reads as a choice
// to change; the list says each language in its own name, its flag before it.
// Our Select, so on a phone it is the bottom sheet every dropdown is.
const FLAGS = { sr: '🇷🇸', en: '🇬🇧', fi: '🇫🇮' };

const flag = (id) => (
  <span aria-hidden="true" className="text-[18px] leading-5">
    {FLAGS[id]}
  </span>
);

// a ghost button: no border or ground until hovered, as tall as the way back
const ghost =
  'h-(--button-size) w-auto shrink-0 gap-1.5 border-transparent bg-transparent px-3 transition-colors hover:bg-accent focus-visible:border-transparent focus-visible:ring-[3px] focus-visible:ring-ring/50 data-[state=open]:border-transparent data-[state=open]:bg-accent [&>span]:flex-none';

export default function LanguagePicker() {
  const lang = useLang();
  return (
    <Select
      value={lang}
      onChange={setLang}
      ariaLabel={t('Jezik')}
      options={LANGUAGES.map((l) => ({ value: l.id, label: l.label, icon: flag(l.id), display: flag(l.id) }))}
      className={ghost}
    />
  );
}
