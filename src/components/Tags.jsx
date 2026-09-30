// Things that are so and cannot be chosen here: the services in an agreement,
// what was done on a visit, why a caregiver fits, her classifications. Flat grey
// tags with no icon, so they do not read as the outlined chips (`.svc`) that are
// pressed to choose (docs/patterns.md §10).
//
// A group always says what it is. In a card or a row that is `label`, in a
// column of its own to the left, like the label of a data line; stacked groups
// line their labels up. In a drawer the section's own `.ag-label` above says it,
// and `label` is left out. `off` is what was left out, said in so many words.
export default function Tags({ label, items, off = [] }) {
  const tags = (
    <div className="cg-tags">
      {items.map((t) => (
        <span key={t} className="cg-tag">
          {t}
        </span>
      ))}
      {off.map((t) => (
        <span key={t} className="cg-tag is-off">
          {t}
        </span>
      ))}
    </div>
  );
  if (!label) return tags;
  return (
    <div className="tag-row">
      <p className="tag-row-label">{label}</p>
      {tags}
    </div>
  );
}
