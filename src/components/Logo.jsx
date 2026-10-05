import mark from '../assets/logo-mark.svg';
import text from '../assets/logo-text.svg';

// Positions replicate the navbar-logo.svg layout from Figma.
export default function Logo({ width = 120 }) {
  const height = width * (16.089 / 120);
  return (
    <div className="relative block *:absolute *:block" style={{ width, height }}>
      <img
        src={mark}
        alt=""
        style={{ left: '0.22%', top: '-3.86%', width: '15.65%', height: '104.38%' }}
      />
      <img
        src={text}
        alt="NANA Prime"
        style={{ left: '21.23%', top: '11.74%', width: '78.21%', height: '79.33%' }}
      />
    </div>
  );
}
