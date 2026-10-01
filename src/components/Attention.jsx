// The page's one tinted place: what waits on the family, the next step, a
// change to the plan, Minna's letter. The tint is the ground around it and the
// ink of its title; what it holds are ordinary white cards, so the tint tells
// it apart from the rest of the page and the cards in it read like every other
// card (docs/patterns.md §5).
//
// `head` replaces the title and sentence when the tray's head is more than
// that (Minna's letter folds from its head).
export default function Attention({ title, sub, head, className = '', children }) {
  return (
    <section className={`attention${className ? ` ${className}` : ''}`}>
      {head || (
        <div className="attention-head">
          <p className="doc-section-title">{title}</p>
          {sub && <p className="fam-sub">{sub}</p>}
        </div>
      )}
      {children}
    </section>
  );
}
