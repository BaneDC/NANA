import { Mail, MessageCircle, Phone } from 'lucide-react';

// How the plan ends: the plan is not a finished document handed down, it is a
// conversation — and the coordinator is who you have that conversation with.
//
// The block that took an addition in a text field is gone. It collected what was
// typed and did nothing with it; the assistant is where a change to the plan
// actually reaches the plan.

// "Od sada ne morate sve sami da organizujete." Reaching the coordinator is never
// behind the paywall — the paywall is on caregiver numbers.
export function CoordinatorContact({ coordinator }) {
  return (
    <div className="coordinator-contact">
      <p className="rec-title">Ako želite da se direktno javite koordinatorki</p>
      <div className="contact-rows">
        <a className="contact-row" href={`https://wa.me/${coordinator.whatsapp.replace(/\D/g, '')}`}>
          <MessageCircle size={14} strokeWidth={1.75} />
          <span className="contact-label">WhatsApp</span>
          <span className="contact-value">{coordinator.whatsapp}</span>
        </a>
        <a className="contact-row" href={`tel:${coordinator.phone.replace(/\s/g, '')}`}>
          <Phone size={14} strokeWidth={1.75} />
          <span className="contact-label">Telefon</span>
          <span className="contact-value">{coordinator.phone}</span>
        </a>
        <a className="contact-row" href={`mailto:${coordinator.email}`}>
          <Mail size={14} strokeWidth={1.75} />
          <span className="contact-label">Email</span>
          <span className="contact-value">{coordinator.email}</span>
        </a>
      </div>
      <p className="contact-note">
        Od sada ne morate sve sami da organizujete. Kad god vam zatreba pomoć, pozovite me.
      </p>
    </div>
  );
}
