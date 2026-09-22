// The letter from the coordinator, straight out of the client's document: signed
// by a named person, addressed to the caller, and ending on "step by step,
// together" rather than a call to action.
export default function CoordinatorMessage({ letter, changed, changeKey }) {
  const { greeting, paragraphs, from } = letter;

  return (
    <div className={`coordinator-note${changed ? ' is-changed' : ''}`} key={changed ? changeKey : 'letter'}>
      <div className="coordinator-head">
        <span className="cg-avatar">{from.initials}</span>
        <div className="coordinator-head-text">
          <p className="coordinator-name">{from.name}</p>
          <p className="coordinator-role">{from.role}</p>
        </div>
        {changed && <span className="status-pill is-attention">Izmenjeno</span>}
      </div>

      <p className="coordinator-greeting">{greeting}</p>
      {paragraphs.map((p, i) => (
        <p className="doc-p" key={i}>
          {p}
        </p>
      ))}
      <p className="coordinator-sign">— {from.name.split(' ')[0]}</p>
    </div>
  );
}
