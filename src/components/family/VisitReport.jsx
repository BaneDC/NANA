import Tags, { Group, Groups } from '../Tags';
import { AMOUNT_LABEL, MOOD_LABEL, serviceTitle } from '../../data/familyCare';
import { t } from '@/i18n';

// How she was, as the caregiver wrote it down: a tag for each thing asked,
// all of them said the same way and none with an icon.
export function careSignals(report) {
  return [
    report.mood && t('Raspoloženje: {value}', { value: t(MOOD_LABEL[report.mood]).toLowerCase() }),
    report.eating && t('Ishrana: {value}', { value: t(AMOUNT_LABEL[report.eating]).toLowerCase() }),
    report.moving && t('Kretanje: {value}', { value: t(AMOUNT_LABEL[report.moving]).toLowerCase() }),
  ].filter(Boolean);
}

// A visit's report in a card or a row: a named part each - what was done (when
// `done`), how she was, what the caregiver wrote - 12 apart. Wherever a report
// is shown on a page it is these parts, in this order (docs/patterns.md §7).
export default function VisitReport({ report, first, done, className }) {
  return (
    <Groups className={className}>
      {done && <Tags label={t('Urađeno')} items={report.done.map(serviceTitle)} />}
      <Tags label={t('Kako je bila')} items={careSignals(report)} />
      {report.note && <Group label={t('{name} je zapisala', { name: first })} text={t(report.note)} />}
    </Groups>
  );
}
