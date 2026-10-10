import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { PaneHint, Part, PartText as Text } from '@/components/pane';
import AutoHeight from './AutoHeight';
import Dialog from './Dialog';
import { DateInput, Field } from './TextField';
import { chargedFor, dateOfToday, firstName, longDate, money } from '../data/familyCare';
import { cityOf } from '../data/places';

// Where she lives changed in the profile. That is not a field like the others:
// which caregivers can come depends on it. So before anything is saved this
// asks what it is (docs/patterns.md §10):
//
// - a correction (a typo, the same place): saved, nothing else changes;
// - a move: from when, and what it does to every caregiver she has, said before
//   it is agreed: one whose radius takes in the new place carries on, one whose
//   does not ends on the day of the move, her booked visits after it called
//   off and the money held for them returned; requests to those out of reach
//   are withdrawn. The plan stays: what she needs does not change with the
//   address, only the caregivers to look for and the local recommendations.
//   Somewhere we do not work yet is not confirmed here: the coordinator calls;
// - a stay elsewhere for a while (hospital, rehabilitation, with family): the
//   address stays and the visits pause until the date.
//
// Laid out as a head, a body and a footer, grouped by space alone, no lines:
// the head says what is changing; the body is parts 24 apart, each its name
// and, 8 under it, what it holds (what this is, from when, the caregivers, the
// plan). A move is chosen to begin with, being what a new address most often
// is; another choice changes the parts under the choice in place, the dialog
// growing or shrinking to them (AutoHeight) rather than opening anew.
//
// Prototype: the radius is read from the place names (the same city, or a
// neighbouring one within 15 km), and confirming saves the address and says
// what happens; ending the cooperations is the coordinator's step for now.


// does her radius take in the new place
function reaches(caregiver, place) {
  const to = cityOf(place);
  const from = cityOf(caregiver.area);
  if (!to || !from) return false;
  return to === from || caregiver.radius >= 15;
}

export default function MoveDialog({ open = true, care, from, to, onCorrect, onMove, onPause, onClose }) {
  const [kind, setKind] = useState('move'); // correction | move | stay
  const [when, setWhen] = useState(null); // a Date, picked
  const today = dateOfToday(care);
  const whenText = when ? longDate(when) : '';
  const served = Boolean(cityOf(to));
  const working = (care?.arrangements || []).filter((a) => !a.endedOn);
  const pendingTo = (care?.requests || []).filter((r) => r.status === 'pending');

  return (
    <Dialog
      eyebrow="Profil · O kome brinemo"
      title="Gde sada živi?"
      description={`Menjate „${from || '-'}" u „${to}". Od mesta zavisi koje negovateljice mogu da dolaze.`}
      wide
      open={open}
      onClose={onClose}
    >
      <AutoHeight className="flex flex-col gap-6 pt-3">
        <Part label="Šta je u pitanju">
          <ToggleGroup type="single" size="sm" value={kind} onValueChange={(v) => v && (setKind(v), setWhen(null))} aria-label="Šta je u pitanju">
            <ToggleGroupItem value="move">Seli se</ToggleGroupItem>
            <ToggleGroupItem value="stay">Privremeno je negde drugde</ToggleGroupItem>
            <ToggleGroupItem value="correction">Ispravka</ToggleGroupItem>
          </ToggleGroup>
          <PaneHint key={kind} className="animate-in fade-in-0 duration-200">
            {kind === 'move' && 'Nova adresa važi od dana selidbe, a sa njom se menja i ko može da dolazi.'}
            {kind === 'stay' &&
              'Bolnica, rehabilitacija ili neko vreme kod porodice. Adresa ostaje ista, a posete se pauziraju do datuma koji izaberete. Rezervisani novac za te posete se vraća.'}
            {kind === 'correction' && 'Samo ispravljamo zapis, na primer grešku u kucanju. Negovateljice i posete ostaju kako jesu.'}
          </PaneHint>
        </Part>

        {/* what the choice brings, swapped in place */}
        {kind !== 'correction' && (
          <div key={kind} className="flex animate-in flex-col gap-6 fade-in-0 duration-200">
            <Part label={kind === 'move' ? 'Od kada' : 'Do kada'}>
              <Field>
                <DateInput value={when} onChange={setWhen} from={today} ariaLabel={kind === 'move' ? 'Od kada' : 'Do kada'} />
              </Field>
            </Part>

            {kind === 'move' && !served && (
              <Part label="Šta dalje">
                <Text>
                  U mestu „{to}" još ne radimo, pa selidbu ne možemo da potvrdimo ovde. Koordinatorka će vas pozvati i
                  dogovoriti šta dalje.
                </Text>
              </Part>
            )}

            {kind === 'move' && served && (
              <>
                <Part label="Negovateljice">
                  {working.length === 0 && <Text>Sada niko ne dolazi, pa se nijedna poseta ne otkazuje.</Text>}
                  <div className="flex flex-col gap-4">
                    {working.map((a) => {
                      const ok = reaches(a.caregiver, to);
                      const booked = a.visits.filter((v) => v.status === 'planned');
                      const held = booked.reduce((n, v) => n + chargedFor(v.hours, v.rate), 0);
                      return (
                        <div key={a.caregiver.id}>
                          <p className="mb-2 flex flex-wrap items-center gap-2 text-xs font-medium text-foreground">
                            {a.caregiver.name}
                            <Badge variant={ok ? 'success' : 'destructive'} className="my-[calc((var(--text-xs-leading)-20px)/2)]">
                              {ok ? 'Dolazi i dalje' : `Ne dolazi u ${to}`}
                            </Badge>
                          </p>
                          <Text>
                            {ok
                              ? `${firstName(a.caregiver.name)} radi u krugu od ${a.caregiver.radius} km od mesta ${a.caregiver.area}, pa nova adresa ulazi u njega. Dobiće obaveštenje i novu adresu.`
                              : `Saradnja se završava ${whenText || 'na dan selidbe'}.${
                                  booked.length
                                    ? ` ${booked.length === 1 ? 'Zakazana poseta posle toga se otkazuje' : `Zakazane posete posle toga (${booked.length}) se otkazuju`}, a ${money(held)} rezervisanog se vraća.`
                                    : ''
                                } Koordinatorka će vam pomoći da nađete negovateljicu u novom mestu.`}
                          </Text>
                        </div>
                      );
                    })}
                  </div>
                  {pendingTo.length > 0 && (
                    <PaneHint>Upiti koji još čekaju odgovor, a negovateljica ne dolazi u novo mesto, se povlače.</PaneHint>
                  )}
                </Part>

                <Part label="Plan nege">
                  <Text>
                    Ostaje isti, jer ono što joj treba ne zavisi od adrese. Osvežavaju se negovateljice na „Pronađi" i
                    preporuke koje zavise od mesta, a plan dobija oznaku „Izmenjeno".
                  </Text>
                </Part>
              </>
            )}
          </div>
        )}
      </AutoHeight>

      <DialogFooter className="mt-0">
        <Button variant="secondary" onClick={onClose}>
          Otkaži
        </Button>
        {kind === 'correction' && <Button onClick={onCorrect}>Sačuvaj ispravku</Button>}
        {kind === 'stay' && (
          <Button disabled={!when} onClick={() => onPause(whenText)}>
            Pauziraj posete
          </Button>
        )}
        {kind === 'move' &&
          (served ? (
            <Button disabled={!when} onClick={() => onMove(whenText)}>
              Potvrdi selidbu
            </Button>
          ) : (
            <Button onClick={() => onMove(null)}>Neka me koordinatorka pozove</Button>
          ))}
      </DialogFooter>
    </Dialog>
  );
}
