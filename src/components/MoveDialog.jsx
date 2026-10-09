import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Item, ItemContent, ItemGroup } from '@/components/ui/item';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { PaneHint, PaneLabel } from '@/components/pane';
import Dialog from './Dialog';
import { Field, Input } from './TextField';
import { chargedFor, firstName, money } from '../data/familyCare';
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
  const [kind, setKind] = useState(null); // correction | move | stay
  const [when, setWhen] = useState('');
  const served = Boolean(cityOf(to));
  const working = (care?.arrangements || []).filter((a) => !a.endedOn);
  const pendingTo = (care?.requests || []).filter((r) => r.status === 'pending');

  return (
    <Dialog eyebrow="Profil · O kome brinemo" title="Gde sada živi?" wide open={open} onClose={onClose}>
      <DialogDescription>
        Menjate „{from || '-'}" u „{to}". Od mesta zavisi koje negovateljice mogu da dolaze, pa nam recite šta je u
        pitanju.
      </DialogDescription>

      <ToggleGroup type="single" size="sm" value={kind ?? ''} onValueChange={(v) => v && setKind(v)} aria-label="Šta se menja">
        <ToggleGroupItem value="correction">Ispravka</ToggleGroupItem>
        <ToggleGroupItem value="move">Seli se</ToggleGroupItem>
        <ToggleGroupItem value="stay">Privremeno je negde drugde</ToggleGroupItem>
      </ToggleGroup>

      {kind === 'correction' && (
        <PaneHint>Samo ispravljamo zapis, na primer grešku u kucanju. Negovateljice i posete ostaju kako jesu.</PaneHint>
      )}

      {kind === 'stay' && (
        <>
          <PaneHint>
            Bolnica, rehabilitacija ili neko vreme kod porodice. Adresa ostaje ista, a posete se pauziraju do datuma koji
            upišete. Rezervisani novac za te posete se vraća.
          </PaneHint>
          <Field label="Do kada">
            <Input value={when} onChange={setWhen} placeholder="npr. 15. novembra" autoFocus />
          </Field>
        </>
      )}

      {kind === 'move' && (
        <>
          <Field label="Od kada">
            <Input value={when} onChange={setWhen} placeholder="npr. 1. novembra" autoFocus />
          </Field>

          {!served ? (
            <PaneHint>
              U mestu „{to}" još ne radimo, pa selidbu ne možemo da potvrdimo ovde. Koordinatorka će vas pozvati i
              dogovoriti šta dalje.
            </PaneHint>
          ) : (
            <>
              <PaneLabel>Šta se menja</PaneLabel>
              <ItemGroup>
                {working.map((a) => {
                  const ok = reaches(a.caregiver, to);
                  const booked = a.visits.filter((v) => v.status === 'planned');
                  const held = booked.reduce((n, v) => n + chargedFor(v.hours, v.rate), 0);
                  return (
                    <Item key={a.caregiver.id} className="items-start">
                      <ItemContent>
                        <p className="mb-1 flex flex-wrap items-center gap-2 text-xs font-medium text-foreground">
                          {a.caregiver.name}
                          <Badge variant={ok ? 'success' : 'destructive'} className="my-[calc((var(--text-xs-leading)-20px)/2)]">
                            {ok ? 'Dolazi i dalje' : `Ne dolazi u ${to}`}
                          </Badge>
                        </p>
                        <p className="text-xs leading-body text-muted-foreground">
                          {ok
                            ? `${firstName(a.caregiver.name)} radi u krugu od ${a.caregiver.radius} km od mesta ${a.caregiver.area}, pa nova adresa ulazi u njega. Dobiće obaveštenje i novu adresu.`
                            : `Saradnja se završava ${when.trim() || 'na dan selidbe'}.${
                                booked.length
                                  ? ` ${booked.length === 1 ? 'Zakazana poseta posle toga se otkazuje' : `Zakazane posete posle toga (${booked.length}) se otkazuju`}, a ${money(held)} rezervisanog se vraća.`
                                  : ''
                              } Koordinatorka će vam pomoći da nađete negovateljicu u novom mestu.`}
                        </p>
                      </ItemContent>
                    </Item>
                  );
                })}
              </ItemGroup>
              {pendingTo.length > 0 && (
                <PaneHint>Upiti koji još čekaju odgovor, a negovateljica ne dolazi u novo mesto, se povlače.</PaneHint>
              )}
              <PaneHint>
                Plan nege ostaje isti, jer ono što joj treba ne zavisi od adrese. Osvežavaju se negovateljice na „Pronađi"
                i preporuke koje zavise od mesta, a plan dobija oznaku „Izmenjeno".
              </PaneHint>
            </>
          )}
        </>
      )}

      <DialogFooter>
        <Button variant="secondary" onClick={onClose}>
          Otkaži
        </Button>
        {kind === 'correction' && <Button onClick={onCorrect}>Sačuvaj ispravku</Button>}
        {kind === 'stay' && (
          <Button disabled={!when.trim()} onClick={() => onPause(when.trim())}>
            Pauziraj posete
          </Button>
        )}
        {kind === 'move' &&
          (served ? (
            <Button disabled={!when.trim()} onClick={() => onMove(when.trim())}>
              Potvrdi selidbu
            </Button>
          ) : (
            <Button onClick={() => onMove(null)}>Neka me koordinatorka pozove</Button>
          ))}
      </DialogFooter>
    </Dialog>
  );
}
