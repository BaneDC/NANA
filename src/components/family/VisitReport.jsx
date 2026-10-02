import Tags, { Group } from '../Tags';
import { AMOUNT_LABEL, MOOD_LABEL, serviceTitle } from '../../data/familyCare';

// How she was, as the caregiver wrote it down: a tag for each thing asked,
// all of them said the same way and none with an icon.
export function careSignals(report) {
  return [
    report.mood && `Raspoloženje: ${MOOD_LABEL[report.mood].toLowerCase()}`,
    report.eating && `Ishrana: ${AMOUNT_LABEL[report.eating].toLowerCase()}`,
    report.moving && `Kretanje: ${AMOUNT_LABEL[report.moving].toLowerCase()}`,
  ].filter(Boolean);
}

// A visit's report in a card or a row: a named part each - what was done (when
// `done`), how she was, what the caregiver wrote - 12 apart. Wherever a report
// is shown on a page it is these parts, in this order (docs/patterns.md §7).
export default function VisitReport({ report, first, done }) {
  return (
    <div className="tag-rows">
      {done && <Tags label="Urađeno" items={report.done.map(serviceTitle)} />}
      <Tags label="Kako je bila" items={careSignals(report)} />
      {report.note && <Group label={`${first} je zapisala`} text={report.note} />}
    </div>
  );
}
