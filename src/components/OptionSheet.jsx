import { useEffect, useRef, useState } from 'react';
import { Check } from 'lucide-react';
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { t } from '@/i18n';

// One of a list, chosen on a phone in a bottom sheet rather than by the field
// (docs/patterns.md §10, "Šta polje otvara na telefonu"; decided 10. 11.: every
// dropdown, the short ones too). The sheet is headed by the field's label; a
// row each (44), the chosen one with a tick and in view as it opens. A list
// longer than twelve (the years) has a search on top and keeps the sheet's full height while
// the search narrows it, as the searchable lists (TextField.jsx). Picking a row
// closes it. `options`: [{ value, label, icon?, meta?, disabled? }], as Select's.
export const LONG_LIST = 12;

export function OptionSheet({ open, onOpenChange, title, options, value, onPick }) {
  const long = options.length > LONG_LIST;
  const chosen = options.find((o) => o.value === value);
  // the row lit as it opens is the chosen one, not the first
  const [lit, setLit] = useState(chosen?.label ?? '');
  const list = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    setLit(chosen?.label ?? '');
    const id = setTimeout(() => list.current?.querySelector('[data-chosen]')?.scrollIntoView({ block: 'center' }), 50);
    return () => clearTimeout(id);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent
        kind="dialog"
        head={<DrawerTitle>{title}</DrawerTitle>}
        className={long ? 'h-[calc(100%-48px-env(safe-area-inset-top,0px))]' : undefined}
        bodyClassName={long ? 'min-h-0 flex-1 overflow-hidden' : undefined}
      >
        <Command value={lit} onValueChange={setLit} className={long ? 'min-h-0 flex-1 [&_[data-slot=command-list]]:max-h-none [&_[data-slot=command-list]]:flex-1' : '[&_[data-slot=command-list]]:max-h-none'}>
          {long && <CommandInput placeholder={t('Pretraga')} />}
          <CommandList ref={list}>
            {long && <CommandEmpty>{t('Nema rezultata.')}</CommandEmpty>}
            <CommandGroup className="p-0">
              {options.map((o) => (
                <CommandItem
                  key={o.value}
                  value={o.label}
                  disabled={o.disabled}
                  data-chosen={o.value === value ? '' : undefined}
                  onSelect={() => {
                    onPick(o.value);
                    onOpenChange(false);
                  }}
                >
                  {o.icon && <span className="inline-flex">{o.icon}</span>}
                  <span className="flex-1">{o.label}</span>
                  {o.meta && <span className="text-muted-foreground">{o.meta}</span>}
                  {o.value === value && <Check className="size-3.5 text-primary" strokeWidth={2} />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DrawerContent>
    </Drawer>
  );
}
