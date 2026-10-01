// Things that are so and cannot be chosen here: the services in an agreement,
// what was done on a visit, why a caregiver fits, her classifications. Flat grey
// tags with no icon, so they do not read as the outlined chips (`.svc`) that are
// pressed to choose (docs/patterns.md §10).
//
// A group always says what it is: its name above, what it holds under it. In a
// drawer the section's own `.ag-label` above says it, and `label` is left out.
// `off` is what was left out, said in so many words.
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
  return <Group label={label}>{tags}</Group>;
}

// A named part of a card or a row: its name, 12px grey, and under it what it
// holds — tags, or a sentence someone wrote (`text`). Parts follow one another
// 12 apart inside `.tag-rows`. What someone wrote is plain text under its name,
// never an indented italic quote (docs/patterns.md §10).
export function Group({ label, text, children }) {
  return (
    <div className="tag-row">
      <p className="tag-row-label">{label}</p>
      {text ? <p className="tag-row-text">{text}</p> : children}
    </div>
  );
}
