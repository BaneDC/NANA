import { useState } from 'react';
import { Mail, Search } from 'lucide-react';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { Field, Input, Password, Select, TextArea } from '@/components/TextField';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardDescription } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@/components/ui/input-otp';

// Every field is from TextField.jsx (docs/patterns.md §10): 16px under a finger
// so iOS does not zoom. Chips (ToggleGroup) are only for what is chosen.

export default { title: 'Polja' };

const useText = (initial = '') => useState(initial);

export const Tekst = {
  render: function Story() {
    const [name, setName] = useText('Anna Korhonen');
    const [mail, setMail] = useText('');
    const [query, setQuery] = useText('');
    const [pass, setPass] = useText('tajna1234');
    const [short, setShort] = useText('abc');
    return (
      <div className="flex flex-col gap-4">
        <Field label="Ime i prezime" required>
          <Input value={name} onChange={setName} />
        </Field>
        <Field label="E-mail" hint="Na njega šaljemo potvrdu.">
          <Input value={mail} onChange={setMail} icon={Mail} placeholder="ime@primer.fi" />
        </Field>
        <Field label="Pretraga">
          <Input value={query} onChange={setQuery} icon={Search} placeholder="Ime, grad ili jezik" />
        </Field>
        <Field label="Lozinka">
          <Password value={pass} onChange={setPass} />
        </Field>
        <Field label="Nova lozinka" hint="Kratka je - treba najmanje 8 karaktera.">
          <Password value={short} onChange={setShort} autoComplete="new-password" />
        </Field>
        <Field label="Isključeno">
          <Input value="Ne može da se menja" onChange={() => {}} disabled />
        </Field>
      </div>
    );
  },
};

const FIELD_ICONS = { none: undefined, Search, Mail };

// one field, set from the Controls panel: its kind, label, hint and state
export const PoljeIgraliste = {
  name: 'Polje · igralište',
  args: {
    kind: 'text',
    label: 'E-mail',
    hint: 'Na njega šaljemo potvrdu.',
    placeholder: 'ime@primer.fi',
    required: false,
    invalid: false,
    disabled: false,
    icon: 'none',
    suffix: '',
    rows: 3,
  },
  argTypes: {
    kind: {
      control: { type: 'inline-radio', labels: { text: 'tekst', password: 'lozinka', multiline: 'više redova' } },
      options: ['text', 'password', 'multiline'],
    },
    label: { control: 'text', description: 'Prazno = polje bez oznake.' },
    hint: { control: 'text', description: 'Napomena ispod polja; prazno = bez nje.' },
    placeholder: { control: 'text' },
    required: { control: 'boolean', description: 'Zvezdica uz oznaku.' },
    invalid: { control: 'boolean', description: '`aria-invalid`: crvena ivica.' },
    disabled: { control: 'boolean' },
    icon: { control: { type: 'select', labels: { none: 'bez ikonice' } }, options: Object.keys(FIELD_ICONS), if: { arg: 'kind', eq: 'text' } },
    suffix: { control: 'text', description: 'Jedinica iza teksta, npr. € / h.', if: { arg: 'kind', eq: 'text' } },
    rows: { control: { type: 'range', min: 2, max: 8, step: 1 }, description: 'Koliko redova ima na početku.', if: { arg: 'kind', eq: 'multiline' } },
  },
  render: function Story({ kind, label, hint, required, invalid, icon, suffix, rows, ...rest }) {
    const [value, setValue] = useText('');
    const control = { value, onChange: setValue, 'aria-invalid': invalid || undefined, ...rest };
    return (
      <Field label={label} hint={hint} required={required}>
        {kind === 'password' ? (
          <Password {...control} />
        ) : kind === 'multiline' ? (
          <TextArea {...control} rows={rows} />
        ) : (
          <Input {...control} icon={FIELD_ICONS[icon]} suffix={suffix || undefined} />
        )}
      </Field>
    );
  },
};

export const TekstualnoPolje = {
  name: 'Polje za tekst',
  render: function Story() {
    const [text, setText] = useText('');
    return (
      <Field label="Poruka negovateljici" hint="Polje se razvlači samo na dole.">
        <TextArea value={text} onChange={setText} rows={4} placeholder="Recite joj ukratko šta vam treba i kada." />
      </Field>
    );
  },
};

export const Izbor = {
  render: function Story() {
    const [value, setValue] = useState('fi');
    const [empty, setEmpty] = useState(null);
    const options = [
      { value: 'fi', label: 'Finska' },
      { value: 'rs', label: 'Srbija' },
      { value: 'se', label: 'Švedska' },
    ];
    return (
      <div className="flex flex-col gap-4">
        <Field label="Država">
          <Select value={value} onChange={setValue} options={options} />
        </Field>
        <Field label="Kako ste čuli za nas">
          <Select value={empty} onChange={setEmpty} options={options} placeholder="Izaberite" />
        </Field>
      </div>
    );
  },
};

export const PrekidacIKvacica = {
  name: 'Prekidač i kvačica',
  render: function Story() {
    const [on, setOn] = useState(true);
    const [off, setOff] = useState(false);
    const [agree, setAgree] = useState(false);
    return (
      <div className="flex flex-col gap-4">
        <label className="flex items-center justify-between gap-3 text-xs text-foreground">
          Obaveštenja e-mailom
          <Switch checked={on} onCheckedChange={setOn} />
        </label>
        <label className="flex items-center justify-between gap-3 text-xs text-foreground">
          SMS podsetnici
          <Switch checked={off} onCheckedChange={setOff} />
        </label>
        <label className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
          Neophodni kolačići (ne mogu da se isključe)
          <Switch checked disabled />
        </label>
        <label className="flex cursor-pointer items-start gap-2 text-xs text-foreground">
          <Checkbox checked={agree} onCheckedChange={(v) => setAgree(v === true)} />
          <span>
            Prihvatam uslove korišćenja<span className="text-primary-600"> *</span>
          </span>
        </label>
      </div>
    );
  },
};

// filters and choices: chips, r8, filled when chosen
export const Cipovi = {
  name: 'Čipovi',
  render: function Story() {
    const [tab, setTab] = useState('all');
    const counts = { all: 8, pending: 2, accepted: 5, declined: 1 };
    const label = { all: 'Svi', pending: 'Čeka odgovor', accepted: 'Prihvaćeno', declined: 'Odbijeno' };
    return (
      <ToggleGroup type="single" size="sm" value={tab} onValueChange={(t) => t && setTab(t)} aria-label="Upiti po odgovoru">
        {Object.keys(counts).map((t) => (
          <ToggleGroupItem key={t} value={t}>
            {label[t]}
            <span className="text-small text-disabled in-data-[state=on]:text-inherit in-data-[state=on]:opacity-80">{counts[t]}</span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    );
  },
};

// two or more views of the same thing, one at a time (the plan and its
// overview); chips stay for what is chosen or filtered
export const Tabovi = {
  args: { tabs: 'Plan nege, Pregled i odgovori', disabledLast: false },
  argTypes: {
    tabs: { control: 'text', description: 'Nazivi tabova, odvojeni zarezom (2 do 4).' },
    disabledLast: { control: 'boolean', description: 'Poslednji tab isključen.' },
  },
  render: function Story({ tabs, disabledLast }) {
    const names = tabs.split(',').map((t) => t.trim()).filter(Boolean).slice(0, 4);
    return (
      <Tabs defaultValue={names[0]} key={names.join('|')}>
        <TabsList aria-label="Prikaz">
          {names.map((n, i) => (
            <TabsTrigger key={n} value={n} disabled={disabledLast && i === names.length - 1}>
              {n}
            </TabsTrigger>
          ))}
        </TabsList>
        {names.map((n) => (
          <TabsContent key={n} value={n}>
            <Card>
              <CardDescription>Sadržaj taba „{n}".</CardDescription>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    );
  },
};

export const Kod = {
  name: 'Kod (2FA)',
  render: function Story() {
    const [code, setCode] = useState('');
    return (
      <Field label="Kod iz aplikacije">
        <InputOTP maxLength={6} pattern={REGEXP_ONLY_DIGITS} value={code} onChange={setCode}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      </Field>
    );
  },
};
