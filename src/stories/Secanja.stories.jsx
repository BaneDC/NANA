import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import GradientBackground from '@/components/immersive/GradientBackground';
import MemoryLane from '@/components/immersive/MemoryLane';
import { StepPage, StepPanel } from '@/components/StepCards';
import { Field, Input, Password } from '@/components/TextField';

export default { title: 'Sećanja', parameters: { layout: 'fullscreen' } };

// The family's sign-in as it comes: the sky, the memories around the form
// (docs/patterns.md §10, decided 23. 11.)
export const Prijava = {
  name: 'Prijava sa sećanjima',
  render: () => (
    <StepPage title="Prijavite se" sub="Email adresom i lozinkom kojima ste napravili nalog" memories>
      <StepPanel>
        <Field label="Email" required>
          <Input value="" onChange={() => {}} type="email" placeholder="anna@mail.com" />
        </Field>
        <Field label="Lozinka" required>
          <Password value="" onChange={() => {}} placeholder="Vaša lozinka" />
        </Field>
        <Button size="lg" className="w-full">
          Prijavi se
        </Button>
      </StepPanel>
    </StepPage>
  ),
};

// With reduced motion: the road stands still, the photos only appear
function Still() {
  const column = useRef(null);
  return (
    <div className="fixed inset-0">
      <GradientBackground />
      <MemoryLane clear={[column]} still />
      <div className="absolute inset-0 flex items-center justify-center">
        <div ref={column} className="flex w-[560px] max-w-full flex-col gap-2 text-center">
          <h1 className="imm-title">Prijavite se</h1>
          <p className="imm-subtitle my-0">Bez kretanja: ista sećanja, mirna</p>
        </div>
      </div>
    </div>
  );
}

export const Mirno = { name: 'Mirno (reduced motion)', render: () => <Still /> };
