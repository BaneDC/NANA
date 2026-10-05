import { FileText, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { paneCloseClass } from '@/components/ui/dialog';

// Sits above the thread: what this chat is called, and the artifacts it
// produced. 12 by 16 (24 on the left, where the thread's text starts), over a
// hairline.
export default function ChatTopBar({ title, subtitle, artifactLabel, onArtifacts, onNewChat }) {
  return (
    <div className="flex shrink-0 items-center gap-2 border-b py-3 pr-4 pl-6">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{title}</p>
        {subtitle && <p className="text-[11px] leading-[14px] text-disabled">{subtitle}</p>}
      </div>

      {artifactLabel && (
        <Button variant="secondary" onClick={onArtifacts}>
          <FileText size={14} strokeWidth={1.75} />
          {artifactLabel}
        </Button>
      )}

      {onNewChat && (
        <button type="button" className={paneCloseClass} onClick={onNewChat} aria-label="Novi razgovor" title="Novi razgovor">
          <Plus size={16} strokeWidth={2} />
        </button>
      )}
    </div>
  );
}
