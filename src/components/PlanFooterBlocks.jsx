import { Mail, MessageCircle, Phone } from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/card';
import { Item, ItemGroup } from '@/components/ui/item';
import { t } from '../i18n';

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
// goes grey, and its text stays as it is.
//
// A phone number and an address open the phone's own app (`tel:`, `mailto:`)
// and leave the page where it is. WhatsApp is a web address: without the app
// it would load in this tab and take the family out of NANA, so it opens in a
// tab of its own.
function ContactRow({ href, icon: Icon, label, value }) {
  const web = href.startsWith('http');
  return (
    <Item
      asChild
      className="items-center gap-2 no-underline hover:bg-muted hover:before:opacity-0 pointer-coarse:min-h-11 [[data-slot=item]:hover+&]:before:opacity-0"
    >
      <a href={href} {...(web ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
        <Icon size={14} strokeWidth={1.75} className="shrink-0 text-primary-600" />
        <span className="flex-1 text-xs text-muted-foreground">{label}</span>
        <span className="text-xs font-medium text-foreground">{value}</span>
      </a>
    </Item>
  );
}

// The three ways to reach her, as rows: in her card at the foot of the plan and
// of the home, and in the menu's "Pomoć" (HelpDialog).
export function CoordinatorRows({ coordinator }) {
  return (
    <ItemGroup>
      <ContactRow
        href={`https://wa.me/${coordinator.whatsapp.replace(/\D/g, '')}`}
        icon={MessageCircle}
        label="WhatsApp"
        value={coordinator.whatsapp}
      />
      <ContactRow href={`tel:${coordinator.phone.replace(/\s/g, '')}`} icon={Phone} label={t('Telefon')} value={coordinator.phone} />
      <ContactRow href={`mailto:${coordinator.email}`} icon={Mail} label={t('Email')} value={coordinator.email} />
    </ItemGroup>
  );
}

export function CoordinatorContact({ coordinator }) {
  return (
    <Card>
      <CardTitle>{t('Ako želite da se direktno javite koordinatorki')}</CardTitle>
      <CoordinatorRows coordinator={coordinator} />
      <p className="mt-1 text-xs leading-body text-muted-foreground">
        {t('Od sada ne morate sve sami da organizujete. Kad god vam zatreba pomoć, pozovite me.')}
      </p>
    </Card>
  );
}
