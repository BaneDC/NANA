import { useState } from 'react';
import { ArrowRight, CalendarCheck, Check, Package } from 'lucide-react';
import { caregiversFor } from '../data/carePlan';
import { PARTNERS, discounted, price } from '../data/partners';
import CaregiverRow from './CaregiverRow';
import Button from './Button';

// One recommendation, in the shape the client's document sketched: what we suggest,
// *why we suggest it for this person*, and who would do it. Where a partner does
// it, the card shows their price and the lower one the family pays when Minna
// books it — that difference is the reason to go through us — and a single action
// that hands it to her.
export default function RecommendationCard({
  rec,
  standingOf,
  unlocked,
  bookable = true,
  changed,
  changeKey,
  onSelectCaregiver,
  onOpenCaregiver,
  onFindCaregivers,
}) {
  return (
    // keyed by the change, so the highlight plays again for a second change
    <div className={`panel-card rec-card${changed ? ' is-changed' : ''}`} key={changed ? changeKey : 'rec'}>
      <div className="panel-card-head">
        <p className="doc-section-title">{rec.title}</p>
        {changed && <span className="status-pill is-attention">Izmenjeno</span>}
      </div>

      <p className="card-label">Zašto ovo preporučujemo</p>
      <p className="rec-why">{rec.why}</p>

      {rec.kind === 'caregivers' && (
        <div className="rec-providers">
          {caregiversFor(unlocked)
            .slice(0, 5)
            .map((c) => (
              <CaregiverRow key={c.id} caregiver={c} standing={standingOf?.(c.id)} onSelect={onSelectCaregiver} onOpen={onOpenCaregiver} />
            ))}
          {onFindCaregivers && (
            <div className="panel-card-actions">
              <Button variant="secondary" onClick={onFindCaregivers}>
                Pogledajte još negovateljica
                <ArrowRight size={14} strokeWidth={1.75} />
              </Button>
            </div>
          )}
        </div>
      )}

      {rec.kind === 'offer' && <Offer rec={rec} bookable={unlocked && bookable} />}

      {rec.kind === 'list' && (
        <ul className="rec-list">
          {rec.items.map((item) => (
            <li key={item}>
              <Check size={13} strokeWidth={2} />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// A partner's price list. Every row shows what the partner charges and what the
// family pays through Minna, so the saving is read row by row, not worked out.
function Offer({ rec, bookable }) {
  const partner = PARTNERS[rec.partner];
  const [sent, setSent] = useState(false);
  const ordering = rec.id === 'aids';
  const Icon = ordering ? Package : CalendarCheck;

  return (
    <div className="rec-offer">
      <div className="rec-partner">
        {partner.logo ? (
          <img className="rec-partner-logo" src={partner.logo} alt={partner.name} />
        ) : (
          <span className="rec-partner-name">{partner.name}</span>
        )}
        {partner.what && <span className="rec-partner-what">{partner.what}</span>}
        <span className="status-pill is-accepted">−{partner.discount}% preko Minne</span>
      </div>

      <ul className="rec-prices">
        {rec.items.map((item) => (
          <li key={item.title} className="rec-price">
            <span className="rec-price-what">
              <span className="rec-price-title">{item.title}</span>
              {item.who && <span className="rec-price-who">{item.who}</span>}
            </span>
            <span className="rec-price-amount">
              <s aria-label={`Redovna cena ${price(item.price)}`}>{price(item.price)}</s>
              <span>{price(discounted(item.price, partner.discount))}</span>
            </span>
          </li>
        ))}
      </ul>

      {bookable &&
        (sent ? (
          <p className="rec-sent" role="status">
            <Check size={14} strokeWidth={2} />
            Minna je dobila zahtev i javiće vam se danas {ordering ? 'sa danom isporuke' : 'sa terminom'}.
          </p>
        ) : (
          <div className="panel-card-actions">
            <Button variant="primary" onClick={() => setSent(true)}>
              <Icon size={14} strokeWidth={1.75} />
              Neka Minna {ordering ? 'naruči' : 'zakaže'}
            </Button>
          </div>
        ))}
    </div>
  );
}
