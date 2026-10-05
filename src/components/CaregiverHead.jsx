import Rating from './Rating';
import Standing from './Standing';

// Who she is, at the top of her details (the profile drawer, her pane in the
// chat), laid out as her card on Pronađi: the avatar, then her name with the
// match beside it, and under them her rating and what she charges, where she
// is and how far she comes. Where the family stands with her is under that.
export default function CaregiverHead({ caregiver: c, standing }) {
  return (
    <div className="fam-profile-head">
      <span className="cg-avatar">{c.initials}</span>
      <div className="cg-main">
        <div className="cg-top">
          <span className="cg-name">{c.name}</span>
          <span className="status-pill is-attention">Poklapanje · {c.match}%</span>
        </div>
        <p className="cg-meta">
          <Rating caregiver={c} /> · {c.rate} · {c.area}, do {c.radius} km
        </p>
        <Standing standing={standing} className="fam-asked" />
      </div>
    </div>
  );
}
