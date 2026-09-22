import { FileText, Plus } from 'lucide-react';
import Button from './Button';

// Sits above the thread: what this chat is called, and the artifacts it produced.
export default function ChatTopBar({ title, subtitle, artifactLabel, onArtifacts, onNewChat }) {
  return (
    <div className="chat-topbar">
      <div className="chat-topbar-text">
        <p className="chat-topbar-title">{title}</p>
        {subtitle && <p className="chat-topbar-sub">{subtitle}</p>}
      </div>

      {artifactLabel && (
        <Button variant="secondary" onClick={onArtifacts}>
          <FileText size={14} strokeWidth={1.75} />
          {artifactLabel}
        </Button>
      )}

      {onNewChat && (
        <button type="button" className="ci-btn" onClick={onNewChat} aria-label="Novi razgovor" title="Novi razgovor">
          <Plus size={16} strokeWidth={2} />
        </button>
      )}
    </div>
  );
}
