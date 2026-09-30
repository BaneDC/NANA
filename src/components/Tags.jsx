// Things that are so and cannot be chosen here: the services in an agreement,
// what was done on a visit, a caregiver's classifications. Flat grey tags, so
// they do not read as the outlined chips (`.svc`) that are pressed to choose
// (docs/patterns.md §10). `off` is what was left out, said in so many words.
export default function Tags({ items, off = [] }) {
  return (
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
}
