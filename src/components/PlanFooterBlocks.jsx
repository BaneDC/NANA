import { Mail, MessageCircle, Phone } from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/card';
import { Item, ItemGroup } from '@/components/ui/item';

// How the plan ends: the plan is not a finished document handed down, it is a
// conversation — and the coordinator is who you have that conversation with.
//
// The block that took an addition in a text field is gone. It collected what was
// typed and did nothing with it; the assistant is where a change to the plan
// actually reaches the plan.

// "Od sada ne morate sve sami da organizujete." Reaching the coordinator is never
// behind the paywall — the paywall is on caregiver numbers.
//
// Each way to reach her is a row that is a link (docs/patterns.md §6): the
// icon, what it is, and the number or address on the right; on hover the row
// goes grey and what it is takes the primary's dark ink.
function ContactRow({ href, icon: Icon, label, value }) {
  return (
    <Item
      asChild
      className="group/contact items-center gap-2 no-underline hover:bg-muted hover:before:opacity-0 pointer-coarse:min-h-11 [[data-slot=item]:hover+&]:before:opacity-0"
    >
      <a href={href}>
        <Icon size={14} strokeWidth={1.75} className="shrink-0 text-primary-600" />
        <span className="flex-1 text-xs text-muted-foreground group-hover/contact:text-primary-700">{label}</span>
        <span className="text-xs font-medium text-foreground">{value}</span>
      </a>
    </Item>
  );
}

export function CoordinatorContact({ coordinator }) {
  return (
    <Card>
      <CardTitle>Ako želite da se direktno javite koordinatorki</CardTitle>
      <ItemGroup>
        <ContactRow
          href={`https://wa.me/${coordinator.whatsapp.replace(/\D/g, '')}`}
          icon={MessageCircle}
          label="WhatsApp"
          value={coordinator.whatsapp}
        />
        <ContactRow href={`tel:${coordinator.phone.replace(/\s/g, '')}`} icon={Phone} label="Telefon" value={coordinator.phone} />
        <ContactRow href={`mailto:${coordinator.email}`} icon={Mail} label="Email" value={coordinator.email} />
      </ItemGroup>
      <p className="mt-1 text-xs leading-body text-muted-foreground">
        Od sada ne morate sve sami da organizujete. Kad god vam zatreba pomoć, pozovite me.
      </p>
    </Card>
  );
}
