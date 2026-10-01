import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Eye, EyeOff } from 'lucide-react';

// The one text field. It started on the sign-in screen, and every form in the app
// now uses it — settings, the profile, the plan editor, the caregiver's forms —
// so a field looks and behaves the same wherever someone meets it. The forms had
// grown a second field of their own whose hairline disappeared on a white modal.
//
// `onChange` hands back the value, not the event.

// A field whose control is a Select is a div, not a label: a label hands every
// click inside it to its first button, so picking an option would press the
// trigger again and open the list it had just closed. `labelId` names it instead.
export function Field({ label, required, hint, className, as: Tag = 'label', labelId, children }) {
  return (
    <Tag className={`text-field${className ? ` ${className}` : ''}`}>
      {label && (
        <span className="tf-label" id={labelId}>
          {label}
          {required && <span className="tf-required"> *</span>}
        </span>
      )}
      {children}
      {hint && <span className="tf-hint">{hint}</span>}
    </Tag>
  );
}

// an icon in front (a search), or a unit behind (€ / h)
export function Input({ value, onChange, onEnter, icon: Icon, suffix, className, ...rest }) {
  return (
    <span className={`tf-input${className ? ` ${className}` : ''}`}>
      {Icon && <Icon className="tf-icon" size={14} strokeWidth={1.75} />}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onEnter?.()}
        {...rest}
      />
      {suffix && <span className="tf-suffix">{suffix}</span>}
    </span>
  );
}

export function Password({ value, onChange, onEnter, placeholder, autoComplete = 'current-password', ...rest }) {
  const [shown, setShown] = useState(false);
  return (
    <span className="tf-input">
      <input
        type={shown ? 'text' : 'password'}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onEnter?.()}
        {...rest}
      />
      <button
        type="button"
        className="tf-trailing"
        onClick={() => setShown((s) => !s)}
        aria-label={shown ? 'Sakrij lozinku' : 'Prikaži lozinku'}
      >
        {shown ? <EyeOff size={14} strokeWidth={1.75} /> : <Eye size={14} strokeWidth={1.75} />}
      </button>
    </span>
  );
}

export function TextArea({ value, onChange, rows = 3, ...rest }) {
  return (
    <span className="tf-input is-area">
      {/* the rows it opens with are also the least it can be dragged down to */}
      <textarea
        value={value}
        rows={rows}
        style={{ '--rows': rows }}
        onChange={(e) => onChange(e.target.value)}
        {...rest}
      />
    </span>
  );
}

// Our own dropdown, in place of the browser's. The list is a listbox: arrows move
// through it, Enter or Space picks, Escape and Tab close it, typing a letter jumps
// to the first option that starts with it, and a press anywhere else closes it.
// It opens upward when there is not room for it below.
//
// `options` are { value, label, icon?, meta?, display? } — `display` is what the
// closed field shows when it should be shorter than the row (a country's code).
// `bare` draws only the trigger, for a Select inside another field's box.
export function Select({ value, onChange, options, placeholder = 'Izaberite', labelledBy, ariaLabel, bare, className }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [up, setUp] = useState(false);
  const wrap = useRef(null);
  const trigger = useRef(null);
  const list = useRef(null);
  const id = useId();
  const chosen = options.find((o) => o.value === value);

  const show = () => {
    const at = options.findIndex((o) => o.value === value);
    setActive(at < 0 ? 0 : at);
    const r = trigger.current.getBoundingClientRect();
    setUp(window.innerHeight - r.bottom < 336 && r.top > window.innerHeight - r.bottom);
    setOpen(true);
  };
  const close = (refocus) => {
    setOpen(false);
    if (refocus) trigger.current?.focus();
  };
  const pick = (i) => {
    onChange(options[i].value);
    close(true);
  };

  useEffect(() => {
    if (!open) return;
    list.current?.focus({ preventScroll: true });
    const away = (e) => !wrap.current?.contains(e.target) && close(false);
    document.addEventListener('pointerdown', away, true);
    return () => document.removeEventListener('pointerdown', away, true);
  }, [open]);

  // keep the highlighted row in view as the arrows move it — inside the list
  // only; scrollIntoView would drag the page along with it
  useLayoutEffect(() => {
    const ul = list.current;
    const li = ul?.children[active];
    if (!li) return;
    if (li.offsetTop < ul.scrollTop) ul.scrollTop = li.offsetTop;
    else if (li.offsetTop + li.offsetHeight > ul.scrollTop + ul.clientHeight)
      ul.scrollTop = li.offsetTop + li.offsetHeight - ul.clientHeight;
  }, [open, active]);

  const onListKey = (e) => {
    const last = options.length - 1;
    const move = { ArrowDown: Math.min(active + 1, last), ArrowUp: Math.max(active - 1, 0), Home: 0, End: last }[e.key];
    if (move !== undefined) {
      e.preventDefault();
      setActive(move);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      pick(active);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close(true);
    } else if (e.key === 'Tab') {
      close(false);
    } else if (e.key.length === 1) {
      const at = options.findIndex((o) => o.label.toLowerCase().startsWith(e.key.toLowerCase()));
      if (at >= 0) setActive(at);
    }
  };

  const button = (
    <button
      ref={trigger}
      type="button"
      className={`tf-select${chosen ? '' : ' is-empty'}`}
      aria-haspopup="listbox"
      aria-expanded={open}
      aria-controls={open ? id : undefined}
      aria-labelledby={labelledBy}
      aria-label={ariaLabel}
      onClick={() => (open ? close(false) : show())}
      onKeyDown={(e) => {
        if (!open && ['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
          e.preventDefault();
          show();
        }
      }}
    >
      <span className="tf-select-value">{chosen ? chosen.display ?? chosen.label : placeholder}</span>
      <ChevronDown className="tf-select-chevron" size={14} strokeWidth={1.75} aria-hidden="true" />
    </button>
  );

  return (
    <span ref={wrap} className={`${bare ? 'tf-select-wrap' : 'tf-input tf-select-wrap'}${className ? ` ${className}` : ''}`}>
      {button}
      {open && (
        <ul
          ref={list}
          id={id}
          role="listbox"
          tabIndex={-1}
          aria-labelledby={labelledBy}
          aria-label={ariaLabel}
          aria-activedescendant={`${id}-${active}`}
          className={`tf-menu${up ? ' is-up' : ''}`}
          onKeyDown={onListKey}
        >
          {options.map((o, i) => (
            <li
              key={o.value}
              id={`${id}-${i}`}
              role="option"
              aria-selected={o.value === value}
              className={`tf-option${i === active ? ' is-active' : ''}`}
              onPointerMove={() => setActive(i)}
              onClick={() => pick(i)}
            >
              {o.icon && <span className="tf-option-icon">{o.icon}</span>}
              <span className="tf-option-label">{o.label}</span>
              {o.meta && <span className="tf-option-meta">{o.meta}</span>}
              <Check className="tf-option-check" size={14} strokeWidth={2} aria-hidden="true" />
            </li>
          ))}
        </ul>
      )}
    </span>
  );
}
