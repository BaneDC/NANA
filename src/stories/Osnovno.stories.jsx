import { ArrowRight, Check, Plus, Search, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

// The smallest parts, in every variant the app uses (docs/patterns.md §1, §2, §9).

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
