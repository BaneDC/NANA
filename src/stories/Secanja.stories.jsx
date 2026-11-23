import { Button } from '@/components/ui/button';
import GradientBackground from '@/components/immersive/GradientBackground';
import MemoryStrip from '@/components/immersive/MemoryStrip';
import { StepFields, StepPage } from '@/components/StepCards';
import { Field, Input, Password } from '@/components/TextField';

export default { title: 'Sećanja', parameters: { layout: 'fullscreen' } };

// The family's sign-in as it comes: the sky, the fields on their own, and the
// memories as a strip at the foot with the line of years under it
// (docs/patterns.md §10, decided 23. 11.)
export const Prijava = {
  name: 'Prijava sa sećanjima',
  render: () => (
    <StepPage title="Prijavite se" sub="Email adresom i lozinkom kojima ste napravili nalog" memories>
      <StepFields>
        <Field label="Email" required>
          <Input value="" onChange={() => {}} type="email" placeholder="anna@mail.com" />
        </Field>
        <Field label="Lozinka" required>
          <Password value="" onChange={() => {}} placeholder="Vaša lozinka" />
        </Field>
        <Button size="lg" className="w-full">
          Prijavi se
        </Button>
      </StepFields>
    </StepPage>
  ),
};

// With reduced motion: the strip does not go by itself, a change is instant
export const Mirno = {
  name: 'Mirno (reduced motion)',
  render: () => (
    <div className="fixed inset-0">
      <GradientBackground />
      <div className="absolute inset-x-0 bottom-0">
        <MemoryStrip still />
      </div>
    </div>
  ),
};
