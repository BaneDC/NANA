import { useState } from 'react';
import { CirclePlus, CornerDownLeft } from 'lucide-react';

// Mirrors the "User chat input" component from Figma: white card, text area on
// top, actions footer with a lead button and a send button.
export default function ChatInput({ disabled, placeholder, onSend }) {
  const [value, setValue] = useState('');
  const canSend = !disabled && value.trim().length > 0;

  const send = () => {
    if (!canSend) return;
    onSend(value.trim());
    setValue('');
  };

  return (
    <div className={`chat-input${disabled ? ' is-disabled' : ''}`}>
      <div className="ci-text">
        <input
          type="text"
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') send();
          }}
        />
      </div>
      <div className="ci-actions">
        <button type="button" className="ci-btn" disabled={disabled} aria-label="Add attachment">
          <CirclePlus size={16} strokeWidth={1.75} />
        </button>
        <button
          type="button"
          className="ci-btn"
          onClick={send}
          disabled={!canSend}
          aria-label="Pošalji poruku"
        >
          <CornerDownLeft size={16} strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}
