import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, User } from 'lucide-react';
import Logo from '../components/Logo';
import PhotoCarousel from '../components/PhotoCarousel';
import TextField from '../components/TextField';
import SelectCard from '../components/SelectCard';
import Button from '../components/Button';

// The two sides of the product are two different applications that happen to
// share a database, so which one you get is settled here rather than by a
// toggle inside one of them.
const ROLES = [
  {
    id: 'family',
    letter: 'a',
    title: 'Treba mi nega za roditelja',
    description: 'Odgovorite na nekoliko pitanja i naći ćemo nekoga blizu vas',
  },
  {
    id: 'caregiver',
    letter: 'b',
    title: 'Ja sam negovateljica',
    description: 'Primajte upite porodica, dogovorite uslove, budite plaćeni',
  },
];

export default function Register({ onContinue }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('family');
  const valid = name.trim() && /\S+@\S+\.\S+/.test(email);

  const submit = () => valid && onContinue({ name: name.trim(), email: email.trim(), role });

  return (
    <motion.div
      className="register"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } }}
      exit={{ opacity: 0, y: -16, transition: { duration: 0.2, ease: 'easeIn' } }}
    >
      <Logo width={150} />
      <PhotoCarousel />
      <div className="welcome">
        <h1>Dobro došli u NANA Prime</h1>
        <p>Da biste nastavili, popunite obavezna polja</p>
      </div>
      <div className="form-card">
        <div className="role-choice">
          <p className="tf-label">Ovde sam kao</p>
          {ROLES.map((r) => (
            <SelectCard
              key={r.id}
              letter={r.letter}
              title={r.title}
              description={r.description}
              selected={role === r.id}
              onClick={() => setRole(r.id)}
            />
          ))}
        </div>

        <TextField
          label="Ime i prezime"
          icon={User}
          placeholder="Petar Mirić"
          value={name}
          onChange={setName}
          onEnter={submit}
        />
        <TextField
          label="Imejl"
          icon={Mail}
          placeholder="petar@mail.com"
          type="email"
          value={email}
          onChange={setEmail}
          onEnter={submit}
        />
      </div>
      <div className="actions">
        <Button variant="primary" size="lg" full disabled={!valid} onClick={submit}>
          Nastavi
        </Button>
        <Button variant="ghost" size="lg">
          Već imate nalog?
        </Button>
      </div>
    </motion.div>
  );
}
