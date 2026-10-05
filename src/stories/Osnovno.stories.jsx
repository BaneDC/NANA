import { ArrowRight, Check, Plus, Search, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

// The smallest parts, in every variant the app uses (docs/patterns.md §1, §2, §9).
// Each has a gallery (every variant side by side) and a playground (one, set
// from the Controls panel under the story).

const Row = ({ label, children }) => (
  <div className="flex flex-col gap-2">
    <p className="text-small text-muted-foreground">{label}</p>
    <div className="flex flex-wrap items-center gap-2">{children}</div>
  </div>
);

export default { title: 'Osnovno' };

// primary (default) for what is set up, secondary for what changes or stops,
// destructive only for deleting, ghost for the back button and quiet actions
export const Dugme = {
  render: () => (
    <div className="flex flex-col gap-6">
      <Row label="Varijante">
        <Button>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="destructive">Obriši nalog</Button>
        <Button variant="link">Link</Button>
      </Row>
      <Row label="Sa ikonicom">
        <Button>
          <Search size={14} strokeWidth={1.75} />
          Pronađi negovateljicu
        </Button>
        <Button>
          <Send size={14} strokeWidth={1.75} />
          Pogledaj upite
        </Button>
        <Button variant="secondary">
          Sve posete
          <ArrowRight size={14} strokeWidth={1.75} />
        </Button>
        <Button variant="secondary">
          <Plus size={14} strokeWidth={1.75} />
          Novi razgovor
        </Button>
        <Button>
          <Check size={14} strokeWidth={2} />
          Prihvati uslove
        </Button>
      </Row>
      <Row label="Veličine">
        <Button size="sm" variant="secondary">sm</Button>
        <Button>default</Button>
        <Button size="lg">lg</Button>
        <Button size="icon" variant="secondary" aria-label="Zatvori">
          <X size={16} strokeWidth={1.75} />
        </Button>
      </Row>
      <Row label="Isključeno">
        <Button disabled>Prihvati uslove</Button>
        <Button variant="secondary" disabled>
          Odbij
        </Button>
      </Row>
    </div>
  ),
};

const ICONS = { none: null, Search, Send, Plus, Check, ArrowRight, X };

export const DugmeIgraliste = {
  name: 'Dugme · igralište',
  args: { children: 'Pronađi negovateljicu', variant: 'default', size: 'default', icon: 'none', iconAfter: false, disabled: false },
  argTypes: {
    children: { name: 'text', control: 'text', description: 'Šta piše na dugmetu (kod `icon` veličine je to aria-label).' },
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'ghost', 'outline', 'destructive', 'link'],
      description: 'default za ono što se tek podešava, secondary za ono što menja ili gasi, destructive samo za brisanje (§9).',
    },
    size: { control: 'select', options: ['default', 'sm', 'lg', 'icon'] },
    icon: { control: { type: 'select', labels: { none: 'bez ikonice' } }, options: Object.keys(ICONS), description: 'Ikonica 14px, ispred teksta.' },
    iconAfter: { control: 'boolean', description: 'Ikonica posle teksta (strelica ka sledećem).' },
    disabled: { control: 'boolean' },
  },
  render: ({ children, icon, iconAfter, ...props }) => {
    const Icon = ICONS[icon];
    const only = props.size === 'icon';
    const glyph = Icon && <Icon size={only ? 16 : 14} strokeWidth={1.75} />;
    return (
      <div>
        <Button {...props} aria-label={only ? children : undefined}>
          {!iconAfter && glyph}
          {!only && children}
          {iconAfter && glyph}
        </Button>
      </div>
    );
  },
};

// a status is 20px, 11 medium, r4, a tint per state; a tag is grey small text
export const Znacka = {
  name: 'Značka',
  render: () => (
    <div className="flex flex-col gap-6">
      <Row label="Stanje">
        <Badge>Poklapanje · 97%</Badge>
        <Badge variant="success">
          <Check size={12} strokeWidth={2} />
          Već dolazi
        </Badge>
        <Badge variant="warning">
          <Check size={12} strokeWidth={2} />
          Upit poslat juče
        </Badge>
        <Badge variant="destructive">Odbila</Badge>
        <Badge variant="secondary">Dolazila ranije</Badge>
      </Row>
      <Row label="Oznaka (tag)">
        <Badge variant="tag">54 € rezervisano</Badge>
        <Badge variant="tag">Lična higijena</Badge>
        <Badge variant="tag">Raspoloženje: dobro</Badge>
      </Row>
    </div>
  ),
};

export const ZnackaIgraliste = {
  name: 'Značka · igralište',
  args: { children: 'Već dolazi', variant: 'success', tick: true },
  argTypes: {
    children: { name: 'text', control: 'text' },
    variant: {
      control: 'select',
      options: ['default', 'success', 'warning', 'destructive', 'secondary', 'tag'],
      description: 'success: prihvaćeno, aktivno · warning: čeka nekog drugog · destructive: odbijeno · secondary: neutralno · default: pažnja · tag: oznaka uz ime ili iznos.',
    },
    tick: { control: 'boolean', description: 'Kvačica ispred, za ono što je krenulo napred.' },
  },
  render: ({ children, tick, ...props }) => (
    <div>
      <Badge {...props}>
        {tick && <Check size={12} strokeWidth={2} />}
        {children}
      </Badge>
    </div>
  ),
};

// as tall as the two lines beside it, set by --avatar where it stands (§6)
export const Avatar_ = {
  name: 'Avatar',
  render: () => (
    <Row label={'32 (bez --avatar), 38 red, 40 kartica na „Pronađi", 42 kartica sa naslovom'}>
      {[undefined, '38px', '40px', '42px'].map((size) => (
        <div key={size || 'default'} style={size ? { '--avatar': size } : undefined}>
          <Avatar>
            <AvatarFallback>SV</AvatarFallback>
          </Avatar>
        </div>
      ))}
    </Row>
  ),
};

export const AvatarIgraliste = {
  name: 'Avatar · igralište',
  args: { initials: 'SV', avatar: 40 },
  argTypes: {
    initials: { control: 'text' },
    avatar: {
      control: { type: 'range', min: 24, max: 64, step: 2 },
      description: '`--avatar` u px. Do 36 je izuzet od koncentričnih uglova, veći mora da se uklopi u ugao oko sebe (§1).',
    },
  },
  render: ({ initials, avatar }) => (
    <div style={{ '--avatar': `${avatar}px` }}>
      <Avatar>
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
    </div>
  ),
};
