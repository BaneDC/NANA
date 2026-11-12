import { Select } from './TextField';
import { LANGUAGES, setLang, t, useLang } from '@/i18n';

// The language, on every page before there is an account (docs/patterns.md
// §12b, decided 12. 11.): a small dropdown, last in the page's column, each
// language in its own name and without a flag, since a flag is a country and
// the language and the market are chosen apart.
export default function LanguagePicker() {
  const lang = useLang();
  return (
    <Select
      value={lang}
      onChange={setLang}
      ariaLabel={t('Jezik')}
      options={LANGUAGES.map((l) => ({ value: l.id, label: l.label }))}
      className="w-auto gap-2"
    />
  );
}
